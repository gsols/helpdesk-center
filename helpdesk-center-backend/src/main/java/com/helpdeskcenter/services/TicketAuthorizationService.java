package com.helpdeskcenter.services;

import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.enums.UserRole;
import com.helpdeskcenter.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Enforces the department-based authorization matrix from plan section 2B and ADR-0003.
 *
 * <pre>
 * EMPLOYEE     — can only read/write their own tickets (creator_id = me)
 * AGENT        — read/write own assigned tickets; read/write dept unassigned pool;
 *                read-only dept archive; 403 on cross-dept access
 * DEPT_MANAGER — read/write all tickets within own department
 * SYS_ADMIN    — unrestricted within company scope
 * </pre>
 */
@Service
public class TicketAuthorizationService {

    /**
     * Asserts the principal may read the given ticket.
     * Throws 403 Forbidden if not allowed.
     */
    public void assertCanRead(AuthenticatedUser principal, Ticket ticket) {
        checkCompany(principal, ticket);

        switch (principal.role()) {
            case EMPLOYEE -> {
                if (!ticket.getCreator().getId().equals(principal.userId())) {
                    throw forbidden();
                }
            }
            case AGENT -> assertAgentDeptMatch(principal, ticket);
            case DEPT_MANAGER -> assertManagerDeptMatch(principal, ticket);
            case SYS_ADMIN -> { /* unrestricted */ }
        }
    }

    /**
     * Asserts the principal may write (update/delete) the given ticket.
     * Archive tickets (assigned to a peer in the same dept) are read-only unless re-assigned.
     */
    public void assertCanWrite(AuthenticatedUser principal, Ticket ticket) {
        checkCompany(principal, ticket);

        switch (principal.role()) {
            case EMPLOYEE -> {
                if (!ticket.getCreator().getId().equals(principal.userId())) {
                    throw forbidden();
                }
            }
            case AGENT -> {
                assertAgentDeptMatch(principal, ticket);
                // Peer-assigned tickets are read-only (ADR-0003)
                if (ticket.getAssignee() != null
                    && !ticket.getAssignee().getId().equals(principal.userId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Ticket is assigned to another agent — re-assign before editing");
                }
            }
            case DEPT_MANAGER -> assertManagerDeptMatch(principal, ticket);
            case SYS_ADMIN -> { /* unrestricted */ }
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void checkCompany(AuthenticatedUser principal, Ticket ticket) {
        if (!ticket.getCompany().getId().equals(principal.companyId())) {
            throw forbidden();
        }
    }

    private void assertAgentDeptMatch(AuthenticatedUser principal, Ticket ticket) {
        if (ticket.getDepartment() == null) {
            // Triage tickets are not visible to regular agents
            throw forbidden();
        }
        if (!ticket.getDepartment().getId().equals(principal.departmentId())) {
            throw forbidden();
        }
    }

    private void assertManagerDeptMatch(AuthenticatedUser principal, Ticket ticket) {
        if (ticket.getDepartment() == null) {
            return; // Managers can see triage queue
        }
        if (!ticket.getDepartment().getId().equals(principal.departmentId())) {
            throw forbidden();
        }
    }

    private ResponseStatusException forbidden() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN,
            "Access denied — cross-department data isolation (ADR-0003)");
    }
}
