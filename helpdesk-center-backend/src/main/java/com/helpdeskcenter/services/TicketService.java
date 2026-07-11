package com.helpdeskcenter.services;

import com.helpdeskcenter.dto.AiClassificationResult;
import com.helpdeskcenter.entities.AiClassificationLog;
import com.helpdeskcenter.entities.Department;
import com.helpdeskcenter.entities.SlaRule;
import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.entities.User;
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
        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket updateStatus(Long id, String newStatus) {
        Ticket ticket = getTicketById(id);
        ticket.setStatus(TicketStatus.valueOf(newStatus.toUpperCase()));
        return ticketRepository.save(ticket);
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
