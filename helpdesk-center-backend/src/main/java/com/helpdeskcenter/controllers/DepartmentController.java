package com.helpdeskcenter.controllers;

import com.helpdeskcenter.dto.AddAgentRequest;
import com.helpdeskcenter.dto.ChangeManagerRequest;
import com.helpdeskcenter.dto.CreateDepartmentRequest;
import com.helpdeskcenter.dto.DepartmentDetailResponse;
import com.helpdeskcenter.dto.EligibleUserResponse;
import com.helpdeskcenter.dto.TeamMemberResponse;
import com.helpdeskcenter.entities.Company;
import com.helpdeskcenter.entities.Department;
import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.enums.UserRole;
import com.helpdeskcenter.repositories.CompanyRepository;
import com.helpdeskcenter.repositories.DepartmentRepository;
import com.helpdeskcenter.repositories.TicketRepository;
import com.helpdeskcenter.repositories.UserRepository;
import com.helpdeskcenter.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;
    private final UserRepository        userRepository;
    private final CompanyRepository     companyRepository;
    private final TicketRepository      ticketRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/departments — all departments for the caller's company
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Department>> getDepartments(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(
            departmentRepository.findByCompanyIdOrderByNameAsc(principal.companyId())
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/departments/{id} — full detail: manager + agent roster
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<DepartmentDetailResponse> getDepartmentDetail(
        @PathVariable Long id,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        Department dept = requireDept(id, principal.companyId());

        // Current DEPT_MANAGER of this department (may be null if none assigned yet)
        EligibleUserResponse manager = userRepository
            .findByCompanyIdAndDepartmentIdAndRoleOrderByIdAsc(
                principal.companyId(), id, UserRole.DEPT_MANAGER)
            .stream().findFirst()
            .map(u -> toEligibleUser(u, ticketRepository))
            .orElse(null);

        List<TeamMemberResponse> agents = userRepository
            .findByCompanyIdAndDepartmentIdAndRoleOrderByIdAsc(
                principal.companyId(), id, UserRole.AGENT)
            .stream()
            .map(u -> new TeamMemberResponse(
                u.getId(), u.getName(), u.getEmail(), u.getRole().name(),
                dept.getName(), ticketRepository.countActiveTicketsByAgent(u.getId())))
            .toList();

        return ResponseEntity.ok(new DepartmentDetailResponse(dept.getId(), dept.getName(), manager, agents));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/departments — create a new department (SYS_ADMIN only)
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('SYS_ADMIN')")
    @Transactional
    public ResponseEntity<DepartmentDetailResponse> createDepartment(
        @Valid @RequestBody CreateDepartmentRequest req,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        Company company = companyRepository.findById(principal.companyId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));

        // Create the department row
        Department dept = new Department();
        dept.setCompany(company);
        dept.setName(req.name().trim());
        dept = departmentRepository.save(dept);

        // Assign the required manager
        User manager = requireUser(req.managerId(), principal.companyId());
        manager.setRole(UserRole.DEPT_MANAGER);
        manager.setDepartment(dept);
        userRepository.save(manager);

        // Assign optional initial agents
        if (req.agentIds() != null) {
            for (Long agentId : req.agentIds()) {
                User agent = requireUser(agentId, principal.companyId());
                agent.setRole(UserRole.AGENT);
                agent.setDepartment(dept);
                userRepository.save(agent);
            }
        }

        return getDepartmentDetail(dept.getId(), principal);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/departments/{id} — cascade delete (SYS_ADMIN only)
    // ─────────────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYS_ADMIN')")
    @Transactional
    public ResponseEntity<Void> deleteDepartment(
        @PathVariable Long id,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        requireDept(id, principal.companyId());

        // Strip roles: all AGENT and DEPT_MANAGER users in this dept become EMPLOYEE
        List<User> members = userRepository
            .findByCompanyIdAndDepartmentIdOrderByNameAsc(principal.companyId(), id);
        for (User u : members) {
            if (u.getRole() == UserRole.AGENT || u.getRole() == UserRole.DEPT_MANAGER) {
                u.setRole(UserRole.EMPLOYEE);
                u.setDepartment(null);
                userRepository.save(u);
            }
        }

        // PostgreSQL ON DELETE CASCADE handles ticket purge automatically
        departmentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/departments/{id}/eligible-agents — users not in this dept
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/eligible-agents")
    @PreAuthorize("hasRole('SYS_ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<EligibleUserResponse>> getEligibleAgents(
        @PathVariable Long id,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        requireDept(id, principal.companyId());
        List<EligibleUserResponse> eligible = userRepository
            .findEligibleForDepartment(principal.companyId(), id)
            .stream()
            .map(u -> toEligibleUser(u, ticketRepository))
            .toList();
        return ResponseEntity.ok(eligible);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/departments/{id}/agents — add or transfer an agent
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/agents")
    @PreAuthorize("hasRole('SYS_ADMIN')")
    @Transactional
    public ResponseEntity<Void> addAgent(
        @PathVariable Long id,
        @Valid @RequestBody AddAgentRequest req,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        requireDept(id, principal.companyId());
        User user = requireUser(req.userId(), principal.companyId());

        boolean isTransfer = user.getRole() == UserRole.AGENT
            && user.getDepartment() != null
            && !user.getDepartment().getId().equals(id);

        if (isTransfer && !req.confirmTransfer()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "User is an active agent in another department. Set confirmTransfer=true to proceed.");
        }

        Department dept = departmentRepository.findById(id).orElseThrow();
        user.setRole(UserRole.AGENT);
        user.setDepartment(dept);
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATCH /api/departments/{id}/manager — handover manager role
    // ─────────────────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/manager")
    @PreAuthorize("hasRole('SYS_ADMIN')")
    @Transactional
    public ResponseEntity<Void> changeManager(
        @PathVariable Long id,
        @Valid @RequestBody ChangeManagerRequest req,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        Department dept = requireDept(id, principal.companyId());

        // Downgrade previous manager(s) in this department
        userRepository
            .findByCompanyIdAndDepartmentIdAndRoleOrderByIdAsc(
                principal.companyId(), id, UserRole.DEPT_MANAGER)
            .forEach(prev -> {
                prev.setRole(UserRole.EMPLOYEE);
                userRepository.save(prev);
            });

        // Promote the new manager
        User newManager = requireUser(req.newManagerId(), principal.companyId());
        newManager.setRole(UserRole.DEPT_MANAGER);
        newManager.setDepartment(dept);
        userRepository.save(newManager);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Department requireDept(Long id, Long companyId) {
        return departmentRepository.findById(id)
            .filter(d -> d.getCompany().getId().equals(companyId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
    }

    private User requireUser(Long userId, Long companyId) {
        return userRepository.findById(userId)
            .filter(u -> u.getCompany().getId().equals(companyId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private static EligibleUserResponse toEligibleUser(User u, TicketRepository ticketRepository) {
        return new EligibleUserResponse(
            u.getId(),
            u.getName(),
            u.getEmail(),
            u.getRole().name(),
            u.getDepartment() != null ? u.getDepartment().getName() : null,
            u.getRole() == UserRole.AGENT
        );
    }
}
