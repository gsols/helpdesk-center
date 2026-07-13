package com.helpdeskcenter.services;

import com.helpdeskcenter.entities.Department;
import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.enums.TicketStatus;
import com.helpdeskcenter.enums.UserRole;
import com.helpdeskcenter.repositories.TicketRepository;
import com.helpdeskcenter.repositories.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Round-robin agent assignment scoped per department.
 *
 * State: an in-memory ConcurrentHashMap keyed by department ID holds an
 * AtomicInteger counter per department.  On each call the counter is
 * incremented and the modulo of the eligible-agent list size is used to
 * select the next agent.
 *
 * Guarantees:
 *  - Thread-safe (ConcurrentHashMap + AtomicInteger).
 *  - Fair distribution across agents in the same department.
 *  - Returns Optional.empty() when no AGENT-role users are in the department
 *    (ticket stays unassigned → falls into the pool as before).
 */
@Service
@RequiredArgsConstructor
public class RoundRobinAssignmentService {

    private final UserRepository  userRepository;
    private final TicketRepository ticketRepository;

    /** Per-department counter. Key = department ID. */
    private final ConcurrentHashMap<Long, AtomicInteger> counters = new ConcurrentHashMap<>();

    /**
     * Pick the next agent for the given department using round-robin.
     *
     * @param department the target department (must not be null)
     * @return the assigned agent, or empty if no agents exist in the department
     */
    public Optional<User> nextAgent(Department department) {
        if (department == null) return Optional.empty();

        List<User> agents = userRepository.findByCompanyIdAndDepartmentIdAndRoleOrderByIdAsc(
            department.getCompany().getId(),
            department.getId(),
            UserRole.AGENT
        );

        if (agents.isEmpty()) return Optional.empty();

        // getAndIncrement is atomic; the modulo wraps the index back to 0
        AtomicInteger counter = counters.computeIfAbsent(department.getId(), id -> new AtomicInteger(0));
        int index = Math.abs(counter.getAndIncrement() % agents.size());
        return Optional.of(agents.get(index));
    }

    /**
     * Sweeps every unassigned (but routed) ticket in the company and assigns
     * each one to the next round-robin agent for its department.
     *
     * Called after every new ticket creation so that any previously unassigned
     * tickets (e.g. from before agents existed, or from triage reroutes) are
     * caught up in the same pass.
     *
     * Tickets already assigned or still in triage (no department) are skipped.
     */
    @Transactional
    public void backfillUnassigned(Long companyId) {
        List<Ticket> unassigned = ticketRepository.findUnassignedWithDepartment(companyId);
        for (Ticket ticket : unassigned) {
            nextAgent(ticket.getDepartment()).ifPresent(agent -> {
                ticket.setAssignee(agent);
                ticket.setStatus(TicketStatus.IN_PROGRESS);
                ticketRepository.save(ticket);
            });
        }
    }
}
