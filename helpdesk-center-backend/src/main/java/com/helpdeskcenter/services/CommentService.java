package com.helpdeskcenter.services;

import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.entities.TicketMessage;
import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.enums.TicketStatus;
import com.helpdeskcenter.enums.UserRole;
import com.helpdeskcenter.repositories.TicketMessageRepository;
import com.helpdeskcenter.repositories.TicketRepository;
import com.helpdeskcenter.repositories.UserRepository;
import com.helpdeskcenter.security.AuthenticatedUser;
import java.time.ZonedDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final TicketMessageRepository ticketMessageRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Transactional
    public TicketMessage addComment(Long ticketId, String message, AuthenticatedUser principal) {
        User user = userRepository.findById(principal.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

        TicketMessage ticketMessage = new TicketMessage();
        ticketMessage.setTicket(ticket);
        ticketMessage.setSender(user);
        ticketMessage.setBody(message);

        // Auto-transition ticket status based on sender role (plan section 2D)
        applyStatusTransition(ticket, user.getRole());

        return ticketMessageRepository.save(ticketMessage);
    }

    public List<TicketMessage> getComments(Long ticketId) {
        return ticketMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    /**
     * Agent/Manager replying → PENDING_EMPLOYEE (SLA clock pauses).
     * Employee replying on PENDING_EMPLOYEE → IN_PROGRESS (SLA clock resumes).
     */
    private void applyStatusTransition(Ticket ticket, UserRole senderRole) {
        if (senderRole == UserRole.AGENT || senderRole == UserRole.DEPT_MANAGER) {
            if (ticket.getStatus() == TicketStatus.OPEN
                || ticket.getStatus() == TicketStatus.IN_PROGRESS) {
                ticket.setStatus(TicketStatus.PENDING_EMPLOYEE);
                ticketRepository.save(ticket);
            }
        } else if (senderRole == UserRole.EMPLOYEE) {
            if (ticket.getStatus() == TicketStatus.PENDING_EMPLOYEE) {
                ticket.setStatus(TicketStatus.IN_PROGRESS);
                // Extend due_at by the pause duration to preserve remaining SLA time
                if (ticket.getDueAt() != null) {
                    // Pause duration is approximated by time since last update
                    ZonedDateTime now = ZonedDateTime.now();
                    ZonedDateTime lastUpdated = ticket.getUpdatedAt() != null
                        ? ticket.getUpdatedAt()
                        : ticket.getCreatedAt();
                    long pausedMinutes = java.time.Duration.between(lastUpdated, now).toMinutes();
                    ticket.setDueAt(ticket.getDueAt().plusMinutes(pausedMinutes));
                }
                ticketRepository.save(ticket);
            }
        }
    }
}
