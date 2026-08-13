package com.helpdeskcenter.controllers;

import com.helpdeskcenter.dto.TeamMemberResponse;
import com.helpdeskcenter.enums.UserRole;
import com.helpdeskcenter.repositories.TicketRepository;
import com.helpdeskcenter.repositories.UserRepository;
import com.helpdeskcenter.security.AuthenticatedUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.helpdeskcenter.dto.EligibleUserResponse;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UsersController {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;

    /**
     * GET /api/users/agents — existing endpoint (kept for backward compat).
     * Returns all agents in the caller's company.
     */
    @GetMapping("/agents")
    public ResponseEntity<List<?>> getAgents(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(
            userRepository.findByCompanyIdAndDepartmentIdAndRoleOrderByIdAsc(
                principal.companyId(), principal.departmentId(), UserRole.AGENT)
        );
    }

    /**
     * GET /api/users/all-agents — SYS_ADMIN only.
     * Returns all agents across every department in the company as TeamMemberResponse,
     * used by the Admin Analytics drawer agent assignment dropdown.
     */
    @GetMapping("/all-agents")
    @Transactional(readOnly = true)
    public ResponseEntity<List<TeamMemberResponse>> getAllAgents(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        List<TeamMemberResponse> agents = userRepository
            .findByCompanyIdAndRoleOrderByNameAsc(principal.companyId(), UserRole.AGENT)
            .stream()
            .map(u -> new TeamMemberResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getRole().name(),
                u.getDepartment() != null ? u.getDepartment().getName() : null,
                ticketRepository.countActiveTicketsByAgent(u.getId())
            ))
            .toList();
        return ResponseEntity.ok(agents);
    }

    /**
     * GET /api/users/team — returns all agents in the caller's own department
     * with their current active ticket count (OPEN + IN_PROGRESS).
     * Only accessible by agents.
     */
    @GetMapping("/team")
    @Transactional(readOnly = true)
    public ResponseEntity<List<TeamMemberResponse>> getTeam(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        if (principal.departmentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User has no department");
        }
        List<TeamMemberResponse> team = userRepository
            .findByCompanyIdAndDepartmentIdAndRoleOrderByIdAsc(
                principal.companyId(), principal.departmentId(), UserRole.AGENT)
            .stream()
            .map(u -> new TeamMemberResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getRole().name(),
                u.getDepartment() != null ? u.getDepartment().getName() : null,
                ticketRepository.countActiveTicketsByAgent(u.getId())
            ))
            .toList();
        return ResponseEntity.ok(team);
    }

    /**
     * GET /api/users/all-users — SYS_ADMIN only.
     * Returns every user in the company (any role), used by the manager picker
     * and initial-agents picker inside the "Create Department" modal.
     */
    @GetMapping("/all-users")
    @PreAuthorize("hasRole('SYS_ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<EligibleUserResponse>> getAllUsers(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        List<EligibleUserResponse> users = userRepository
            .findByCompanyIdOrderByNameAsc(principal.companyId())
            .stream()
            .map(u -> new EligibleUserResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getRole().name(),
                u.getDepartment() != null ? u.getDepartment().getName() : null,
                u.getRole() == UserRole.AGENT
            ))
            .toList();
        return ResponseEntity.ok(users);
    }
}
