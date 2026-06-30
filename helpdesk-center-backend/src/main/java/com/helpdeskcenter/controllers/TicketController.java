package com.helpdeskcenter.controllers;

import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.services.TicketService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody Map<String, String> body,
                                               HttpSession session) {
        Ticket ticket = ticketService.createTicket(body, session);
        return ResponseEntity.status(201).body(ticket);
    }

    @GetMapping
    public ResponseEntity<List<Ticket>> getTickets(HttpSession session) {
        return ResponseEntity.ok(ticketService.getTicketsForUser(session));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(@PathVariable Long id,
                                               @RequestBody Map<String, String> body,
                                               HttpSession session) {
        String role = (String) session.getAttribute("userRole");
        if (role == null || role.equals("employee")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(ticketService.updateStatus(id, body.get("status")));
    }
}
