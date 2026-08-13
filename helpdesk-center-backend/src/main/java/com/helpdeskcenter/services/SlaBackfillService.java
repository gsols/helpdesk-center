package com.helpdeskcenter.services;

import com.helpdeskcenter.entities.SlaRule;
import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.repositories.TicketRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Backfills due_at on active tickets that were created before an SLA rule existed.
 *
 * Formula: due_at = ticket.createdAt + rule.targetResolutionHours
 *
 * Only tickets with due_at IS NULL are touched — existing deadlines are preserved.
 */
@Service
@RequiredArgsConstructor
public class SlaBackfillService {

    private final TicketRepository ticketRepository;

    @Transactional
    public void backfill(SlaRule rule) {
        List<Ticket> tickets = ticketRepository.findActiveWithoutDueAt(
            rule.getDepartment().getId(), rule.getPriority());

        tickets.forEach(ticket -> ticket.setDueAt(
            ticket.getCreatedAt().plusHours(rule.getTargetResolutionHours())
        ));

        ticketRepository.saveAll(tickets);
    }

    /**
     * Convenience overload used by DataSeeder which has rules but no SlaRule objects in scope.
     */
    @Transactional
    public void backfillAll(List<SlaRule> rules) {
        rules.forEach(this::backfill);
    }
}
