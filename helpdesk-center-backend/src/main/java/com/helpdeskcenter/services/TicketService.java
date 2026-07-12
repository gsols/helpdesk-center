package com.helpdeskcenter.services;

import com.helpdeskcenter.dto.AiClassificationResult;
import com.helpdeskcenter.entities.AiClassificationLog;
import com.helpdeskcenter.entities.Department;
import com.helpdeskcenter.entities.SlaRule;
import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.enums.NotificationType;
import com.helpdeskcenter.enums.Priority;
import com.helpdeskcenter.enums.TicketStatus;
import com.helpdeskcenter.enums.UserRole;
import com.helpdeskcenter.repositories.AiClassificationLogRepository;
import com.helpdeskcenter.repositories.DepartmentRepository;
import com.helpdeskcenter.repositories.SlaRuleRepository;
import com.helpdeskcenter.repositories.TicketRepository;
import com.helpdeskcenter.repositories.UserRepository;
import com.helpdeskcenter.security.AuthenticatedUser;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final SlaRuleRepository slaRuleRepository;
    private final AiClassificationLogRepository aiLogRepository;
    private final AIService aiService;
    private final PriorityService priorityService;
    private final RoundRobinAssignmentService roundRobin;
    private final NotificationService notificationService;

    @Transactional
    public Ticket createTicket(Map<String, String> body, AuthenticatedUser principal) {
        User creator = userRepository.findById(principal.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String title = body.get("title");
        String description = body.getOrDefault("description", "");
        if (description == null) description = "";
        String text = title + " " + description;

        // Detect priority
        String detectedPriority = priorityService.detectPriority(text).toUpperCase();
        Priority priority;
        try {
            priority = Priority.valueOf(detectedPriority);
        } catch (IllegalArgumentException e) {
            priority = Priority.MEDIUM;
        }

        Ticket ticket = new Ticket();
        ticket.setCompany(creator.getCompany());
        ticket.setCreator(creator);
        ticket.setTitle(title);
        ticket.setDescription(description);
        ticket.setPriority(priority);
        ticket.setStatus(TicketStatus.OPEN);

        // AI classification with 60% confidence gate (ADR-0002)
        Optional<AiClassificationResult> aiResult = aiService.classify(text);
        Department assignedDept = null;

        if (aiResult.isPresent()) {
            String categoryName = aiResult.get().departmentName();
            // Map category name to a Department entity in the creator's company
            Optional<Department> dept = departmentRepository
                .findByNameIgnoreCaseAndCompanyId(categoryName, creator.getCompany().getId());
            if (dept.isEmpty()) {
                // Try matching partial names (e.g. "hardware" → "IT Hardware", "hr" → "HR")
                dept = departmentRepository
                    .findByCompanyIdOrderByNameAsc(creator.getCompany().getId())
                    .stream()
                    .filter(d -> d.getName().toLowerCase().contains(categoryName.toLowerCase())
                              || categoryName.toLowerCase().contains(d.getName().toLowerCase()))
                    .findFirst();
            }
            if (dept.isPresent()) {
                ticket.setDepartment(dept.get());
                assignedDept = dept.get();
            }
        }
        // If no dept set → department_id = NULL → triage queue (ADR-0002)

        // Assign SLA due date if a department and SLA rule are available (ADR-0005)
        if (assignedDept != null) {
            slaRuleRepository.findByDepartmentIdAndPriority(assignedDept.getId(), priority)
                .ifPresent(rule -> ticket.setDueAt(
                    ZonedDateTime.now().plusHours(rule.getTargetResolutionHours())
                ));
        }

        // Round-robin assign to the next available agent in the department
        if (assignedDept != null) {
            roundRobin.nextAgent(assignedDept).ifPresent(agent -> {
                ticket.setAssignee(agent);
                ticket.setStatus(TicketStatus.IN_PROGRESS);
            });
        }

        Ticket saved = ticketRepository.save(ticket);

        // Write AI classification log
        AiClassificationLog logEntry = new AiClassificationLog();
        logEntry.setTicket(saved);
        logEntry.setRawText(text);
        logEntry.setPredictedDepartment(assignedDept);
        logEntry.setActualDepartment(assignedDept);
        logEntry.setConfidenceScore(aiResult.map(AiClassificationResult::confidenceScore).orElse(null));
        logEntry.setIsMisclassified(false);
        aiLogRepository.save(logEntry);

        return saved;
    }

    /**
     * Splits a parent ticket into child tickets for each target department (plan section 2A).
     * Each child is independently classified and routed.
     * The parent stays OPEN until all children reach RESOLVED or CLOSED.
     */
    @Transactional
    public List<Ticket> splitTicket(Long parentId, List<Map<String, Object>> splits, AuthenticatedUser principal) {
        Ticket parent = getTicketById(parentId);

        List<Ticket> children = new ArrayList<>();
        for (Map<String, Object> split : splits) {
            Long deptId = ((Number) split.get("departmentId")).longValue();
            String childTitle = (String) split.get("title");
            String childDescription = (String) split.get("description");

            Department dept = departmentRepository.findById(deptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found: " + deptId));

            Ticket child = new Ticket();
            child.setCompany(parent.getCompany());
            child.setCreator(parent.getCreator());
            child.setParent(parent);
            child.setDepartment(dept);
            child.setTitle(childTitle);
            child.setDescription(childDescription);
            child.setStatus(TicketStatus.OPEN);
            child.setPriority(parent.getPriority());

            slaRuleRepository.findByDepartmentIdAndPriority(deptId, parent.getPriority())
                .ifPresent(rule -> child.setDueAt(
                    ZonedDateTime.now().plusHours(rule.getTargetResolutionHours())
                ));

            // Round-robin assign each child to the next agent in its department
            roundRobin.nextAgent(dept).ifPresent(agent -> {
                child.setAssignee(agent);
                child.setStatus(TicketStatus.IN_PROGRESS);
            });

            children.add(ticketRepository.save(child));
        }

        return children;
    }

    /**
     * Checks whether all child tickets are resolved/closed and closes the parent if so.
     */
    @Transactional
    public void checkAndCloseParentIfComplete(Long parentId) {
        Ticket parent = getTicketById(parentId);
        List<Ticket> children = ticketRepository.findByParentIdOrderByCreatedAtAsc(parentId);
        if (children.isEmpty()) return;

        boolean allDone = children.stream().allMatch(c ->
            c.getStatus() == TicketStatus.RESOLVED || c.getStatus() == TicketStatus.CLOSED);
        if (allDone) {
            parent.setStatus(TicketStatus.CLOSED);
            ticketRepository.save(parent);
        }
    }

    public List<Ticket> getTicketsForUser(AuthenticatedUser principal) {
        Long userId = principal.userId();
        Long companyId = principal.companyId();
        Long departmentId = principal.departmentId();
        UserRole role = principal.role();

        return switch (role) {
            case AGENT -> departmentId != null
                ? ticketRepository.findMyQueue(companyId, userId, departmentId)
                : List.of();
            case DEPT_MANAGER -> departmentId != null
                ? ticketRepository.findUnassignedPool(companyId, departmentId)
                : List.of();
            case SYS_ADMIN -> ticketRepository.findAll();
            default -> ticketRepository.findByCreatorIdOrderByCreatedAtDesc(userId);
        };
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
    }

    public Optional<AiClassificationLog> getAiLog(Long ticketId) {
        return aiLogRepository.findByTicketId(ticketId);
    }

    public List<Ticket> getMyQueue(AuthenticatedUser principal) {
        if (principal.departmentId() == null) return List.of();
        return ticketRepository.findMyQueue(
            principal.companyId(), principal.userId(), principal.departmentId());
    }

    public List<Ticket> getDepartmentPool(AuthenticatedUser principal) {
        if (principal.departmentId() == null) return List.of();
        return ticketRepository.findUnassignedPool(principal.companyId(), principal.departmentId());
    }

    public List<Ticket> getDepartmentArchive(AuthenticatedUser principal) {
        if (principal.departmentId() == null) return List.of();
        return ticketRepository.findTeamReadOnlyArchive(
            principal.companyId(), principal.departmentId(), principal.userId());
    }

    /**
     * Full active queue for the manager's department: all non-resolved, non-closed tickets
     * regardless of assignment state. Only accessible by DEPT_MANAGER.
     */
    public List<Ticket> getDeptQueue(AuthenticatedUser principal) {
        if (principal.departmentId() == null) return List.of();
        return ticketRepository.findActiveDeptQueue(
            principal.companyId(), principal.departmentId());
    }

    /**
     * Risk queue: active tickets in the manager's department that are breached or within
     * 60 minutes of breach, ordered soonest-first.
     */
    public List<Ticket> getRiskQueue(AuthenticatedUser principal) {
        if (principal.departmentId() == null) return List.of();
        return ticketRepository.findRiskQueue(
            principal.companyId(), principal.departmentId());
    }

    public List<Ticket> getTriageQueue(AuthenticatedUser principal) {
        // Triage is only for managers and admins
        if (principal.role() != UserRole.DEPT_MANAGER && principal.role() != UserRole.SYS_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return ticketRepository.findByCompanyIdAndDepartmentIsNullOrderByCreatedAtDesc(principal.companyId());
    }

    @Transactional
    public Ticket assignToMe(Long ticketId, AuthenticatedUser principal) {
        Ticket ticket = getTicketById(ticketId);
        if (ticket.getAssignee() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket is already assigned");
        }
        User agent = userRepository.findById(principal.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        ticket.setAssignee(agent);
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        Ticket saved = ticketRepository.save(ticket);

        // Notify the ticket creator that their ticket has been claimed
        User creator = ticket.getCreator();
        if (creator != null && !creator.getId().equals(agent.getId())) {
            notificationService.create(
                creator, saved, NotificationType.ASSIGNED,
                agent.getName() + " assigned ticket TCK-" + saved.getId() + " to your queue"
            );
        }
        return saved;
    }

    /**
     * Reassign a ticket to a specific agent. Manager-only.
     * Accepts null agentId to unassign (sets status back to OPEN).
     */
    @Transactional
    public Ticket reassignTicket(Long ticketId, Long agentId, AuthenticatedUser principal) {
        Ticket ticket = getTicketById(ticketId);
        authorizationHelper(principal, ticket);

        User manager = userRepository.findById(principal.userId()).orElse(null);

        if (agentId == null) {
            ticket.setAssignee(null);
            ticket.setStatus(TicketStatus.OPEN);
        } else {
            User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agent not found"));
            // Ensure the new agent belongs to the same company
            if (!agent.getCompany().getId().equals(principal.companyId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Agent belongs to a different company");
            }
            ticket.setAssignee(agent);
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        Ticket saved = ticketRepository.save(ticket);

        // Notify new assignee of the reassignment
        if (agentId != null && saved.getAssignee() != null) {
            String managerName = manager != null ? manager.getName() : "A manager";
            notificationService.create(
                saved.getAssignee(), saved, NotificationType.ASSIGNED,
                managerName + " assigned ticket TCK-" + saved.getId() + " to your queue"
            );
        }
        return saved;
    }

    /** Shared dept/company check used by reassignTicket. */
    private void authorizationHelper(AuthenticatedUser principal, Ticket ticket) {
        if (!ticket.getCompany().getId().equals(principal.companyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        if (principal.role() == UserRole.DEPT_MANAGER
                && ticket.getDepartment() != null
                && !ticket.getDepartment().getId().equals(principal.departmentId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ticket is outside your department");
        }
    }

    @Transactional
    public Ticket updateStatus(Long id, String newStatus) {
        Ticket ticket = getTicketById(id);
        ticket.setStatus(TicketStatus.valueOf(newStatus.toUpperCase()));
        return ticketRepository.save(ticket);
    }

    // ── Gated Takeover Pipeline ──────────────────────────────────────────────

    /**
     * Step 1 — Agent requests a takeover.
     * Sets status → PENDING_APPROVAL, records the requesting agent, dispatches a
     * TAKEOVER_APPROVAL_REQUEST notification to the department manager.
     */
    @Transactional
    public Ticket requestTakeover(Long ticketId, AuthenticatedUser principal) {
        Ticket ticket = getTicketById(ticketId);

        if (ticket.getStatus() == TicketStatus.PENDING_APPROVAL) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A takeover request is already pending for this ticket");
        }

        User requestingAgent = userRepository.findById(principal.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        ticket.setStatus(TicketStatus.PENDING_APPROVAL);
        ticket.setTakeoverRequestedBy(requestingAgent);
        Ticket saved = ticketRepository.save(ticket);

        // Dispatch notification to the department manager
        if (saved.getDepartment() != null) {
            userRepository
                .findByCompanyIdAndDepartmentIdAndRoleOrderByIdAsc(
                    principal.companyId(), saved.getDepartment().getId(), UserRole.DEPT_MANAGER)
                .forEach(manager -> notificationService.create(
                    manager, saved, NotificationType.TAKEOVER_APPROVAL_REQUEST,
                    requestingAgent.getName() + " requests takeover approval for TCK-" + saved.getId()
                ));
        }

        return saved;
    }

    /**
     * Step 2a — Manager approves the takeover.
     * Sets assignee_id to the requesting agent, status → IN_PROGRESS, clears the pending field,
     * and notifies the requesting agent.
     */
    @Transactional
    public Ticket approveTakeover(Long ticketId, AuthenticatedUser principal) {
        Ticket ticket = getTicketById(ticketId);

        if (ticket.getStatus() != TicketStatus.PENDING_APPROVAL || ticket.getTakeoverRequestedBy() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No pending takeover request on this ticket");
        }

        User requestingAgent = ticket.getTakeoverRequestedBy();
        ticket.setAssignee(requestingAgent);
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setTakeoverRequestedBy(null);
        Ticket saved = ticketRepository.save(ticket);

        String managerName = userRepository.findById(principal.userId())
            .map(User::getName).orElse("Your manager");

        notificationService.create(
            requestingAgent, saved, NotificationType.ASSIGNED,
            managerName + " approved your takeover request for TCK-" + saved.getId()
        );

        return saved;
    }

    /**
     * Step 2b — Manager rejects the takeover.
     * Reverts status → IN_PROGRESS (original assignee keeps the ticket), clears the pending field,
     * and notifies the requesting agent.
     */
    @Transactional
    public Ticket rejectTakeover(Long ticketId, AuthenticatedUser principal) {
        Ticket ticket = getTicketById(ticketId);

        if (ticket.getStatus() != TicketStatus.PENDING_APPROVAL || ticket.getTakeoverRequestedBy() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No pending takeover request on this ticket");
        }

        User requestingAgent = ticket.getTakeoverRequestedBy();
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setTakeoverRequestedBy(null);
        Ticket saved = ticketRepository.save(ticket);

        String managerName = userRepository.findById(principal.userId())
            .map(User::getName).orElse("Your manager");

        notificationService.create(
            requestingAgent, saved, NotificationType.ASSIGNED,
            managerName + " rejected your takeover request for TCK-" + saved.getId()
        );

        return saved;
    }

    /**
     * Re-routes a misclassified ticket to the correct department (plan section 2C).
     * Updates the ai_classification_logs entry to mark as misclassified and set actual_department_id.
     */
    @Transactional
    public Ticket rerouteTicket(Long ticketId, Long targetDepartmentId, AuthenticatedUser principal) {
        Ticket ticket = getTicketById(ticketId);

        Department targetDept = departmentRepository.findById(targetDepartmentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));

        // Ensure target dept belongs to the same company
        if (!targetDept.getCompany().getId().equals(principal.companyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Target department belongs to a different company");
        }

        ticket.setDepartment(targetDept);
        ticket.setAssignee(null);

        // Re-assign to the next round-robin agent in the new department
        roundRobin.nextAgent(targetDept).ifPresentOrElse(
            agent -> {
                ticket.setAssignee(agent);
                ticket.setStatus(TicketStatus.IN_PROGRESS);
            },
            () -> ticket.setStatus(TicketStatus.OPEN)
        );

        Ticket saved = ticketRepository.save(ticket);

        // Update the AI classification log — mark as misclassified, record corrected dept
        aiLogRepository.findByTicketId(ticketId).ifPresent(log -> {
            log.setIsMisclassified(true);
            log.setActualDepartment(targetDept);
            aiLogRepository.save(log);
        });

        return saved;
    }
}
