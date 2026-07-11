package com.helpdeskcenter.controllers;

import com.helpdeskcenter.entities.AiClassificationLog;
import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.security.AuthenticatedUser;
import com.helpdeskcenter.services.TicketAuthorizationService;
import com.helpdeskcenter.services.TicketService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final TicketAuthorizationService authorizationService;

    @PostMapping
    public ResponseEntity<Ticket> createTicket(
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.status(201).body(ticketService.createTicket(body, principal));
    }

    /** Default ticket list — role-aware (employees see own, agents see my queue) */
    @GetMapping
    public ResponseEntity<List<Ticket>> getTickets(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(ticketService.getTicketsForUser(principal));
    }

    /** My Queue: tickets explicitly assigned to the calling agent */
    @GetMapping("/my-queue")
    public ResponseEntity<List<Ticket>> getMyQueue(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(ticketService.getMyQueue(principal));
    }

    /** Department Pool: unassigned tickets in the agent's department */
    @GetMapping("/pool")
    public ResponseEntity<List<Ticket>> getDepartmentPool(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(ticketService.getDepartmentPool(principal));
    }

    /** Department Archive: peer-assigned read-only tickets in the agent's department */
    @GetMapping("/archive")
    public ResponseEntity<List<Ticket>> getDepartmentArchive(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(ticketService.getDepartmentArchive(principal));
    }

    /** Triage Queue: tickets with no department (low-confidence AI) — managers/admins only */
    @GetMapping("/triage")
    public ResponseEntity<List<Ticket>> getTriageQueue(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(ticketService.getTriageQueue(principal));
    }

    /**
     * Dept Queue: all active (non-resolved, non-closed) tickets in the manager's department.
     * Includes both assigned and unassigned tickets.
     */
    @GetMapping("/dept-queue")
    @PreAuthorize("hasRole('DEPT_MANAGER')")
    public ResponseEntity<List<Ticket>> getDeptQueue(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(ticketService.getDeptQueue(principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicket(
        @PathVariable Long id,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        Ticket ticket = ticketService.getTicketById(id);
        authorizationService.assertCanRead(principal, ticket);
        return ResponseEntity.ok(ticket);
    }

    /** Returns the AI classification log entry for a ticket, if it exists. */
    @GetMapping("/{id}/ai-log")
    public ResponseEntity<AiClassificationLog> getAiLog(
        @PathVariable Long id,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        Ticket ticket = ticketService.getTicketById(id);
        authorizationService.assertCanRead(principal, ticket);
        Optional<AiClassificationLog> log = ticketService.getAiLog(id);
        return log.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(
        @PathVariable Long id,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        Ticket ticket = ticketService.getTicketById(id);
        authorizationService.assertCanWrite(principal, ticket);
        Ticket updated = ticketService.updateStatus(id, body.get("status"));
        // If this ticket has a parent, check whether the parent should auto-close
        if (updated.getParent() != null) {
            ticketService.checkAndCloseParentIfComplete(updated.getParent().getId());
        }
        return ResponseEntity.ok(updated);
    }

    /** Split a ticket into child tickets for multiple departments */
    @PostMapping("/{id}/split")
    public ResponseEntity<List<Ticket>> splitTicket(
        @PathVariable Long id,
        @RequestBody java.util.List<Map<String, Object>> splits,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.status(201).body(ticketService.splitTicket(id, splits, principal));
    }

    /** Agent claims an unassigned pool ticket for themselves */
    @PostMapping("/{id}/assign-me")
    public ResponseEntity<Ticket> assignToMe(
        @PathVariable Long id,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(ticketService.assignToMe(id, principal));
    }

    /**
     * Reassign a ticket to any agent in the manager's department.
     * Body: { "agentId": <Long> }
     */
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('DEPT_MANAGER','SYS_ADMIN')")
    public ResponseEntity<Ticket> reassignTicket(
        @PathVariable Long id,
        @RequestBody Map<String, Long> body,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(ticketService.reassignTicket(id, body.get("agentId"), principal));
    }

    /** Re-route a misclassified ticket to the correct department (ADR-0002). */
    @PostMapping("/{id}/reroute")
    public ResponseEntity<Ticket> rerouteTicket(
        @PathVariable Long id,
        @RequestBody Map<String, Long> body,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(ticketService.rerouteTicket(id, body.get("targetDepartmentId"), principal));
    }

    /**
     * Risk Queue: active tickets in the manager's department that are breached or within
     * 60 minutes of their SLA deadline, ordered soonest-first.
     */
    @GetMapping("/risk-queue")
    @PreAuthorize("hasRole('DEPT_MANAGER')")
    public ResponseEntity<List<Ticket>> getRiskQueue(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(ticketService.getRiskQueue(principal));
    }
}
