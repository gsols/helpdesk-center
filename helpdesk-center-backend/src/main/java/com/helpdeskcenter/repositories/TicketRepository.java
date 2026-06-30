package com.helpdeskcenter.repositories;

import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByCreatedByOrderByCreatedAtDesc(User createdBy);
    List<Ticket> findByCategoryOrderByCreatedAtDesc(String category);
    List<Ticket> findAllByOrderByCreatedAtDesc();
}
