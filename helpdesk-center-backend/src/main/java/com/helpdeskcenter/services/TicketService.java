package com.helpdeskcenter.services;

import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.repositories.TicketRepository;
import com.helpdeskcenter.repositories.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final AIService aiService;
    private final PriorityService priorityService;

    public Ticket createTicket(Map<String, String> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String title       = body.get("title");
        String description = body.get("description");
        String email       = body.get("email");

        String category = aiService.categorize(title + " " + description);
        String priority = priorityService.detectPriority(title + " " + description);

        Ticket ticket = Ticket.builder()
                .title(title)
                .description(description)
                .email(email)
                .category(category)
                .priority(priority)
                .status("open")
                .createdBy(user)
                .build();

        return ticketRepository.save(ticket);
    }

    public List<Ticket> getTicketsForUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        String role = (String) session.getAttribute("userRole");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return switch (role) {
            case "it_hardware" -> ticketRepository.findByCategoryOrderByCreatedAtDesc("hardware");
            case "it_software" -> ticketRepository.findByCategoryOrderByCreatedAtDesc("software");
            case "hr"          -> ticketRepository.findByCategoryOrderByCreatedAtDesc("hr");
            default            -> ticketRepository.findByCreatedByOrderByCreatedAtDesc(user);
        };
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    public Ticket updateStatus(Long id, String newStatus) {
        Ticket ticket = getTicketById(id);
        ticket.setStatus(newStatus);
        return ticketRepository.save(ticket);
    }
}
