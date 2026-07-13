package com.helpdeskcenter.services;

import com.helpdeskcenter.entities.Notification;
import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.enums.NotificationType;
import com.helpdeskcenter.repositories.NotificationRepository;
import com.helpdeskcenter.repositories.UserRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public List<Notification> getForRecipient(Long recipientId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
    }

    public long countUnread(Long recipientId) {
        return notificationRepository.countByRecipientIdAndReadFalse(recipientId);
    }

    @Transactional
    public Notification markRead(Long notificationId, Long requestingUserId) {
        Notification n = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.getRecipient().getId().equals(requestingUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        n.setRead(true);
        return notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(Long recipientId) {
        notificationRepository.markAllReadForRecipient(recipientId);
    }

    /**
     * Factory helper — called from other services (CommentService, TicketService, etc.)
     * to persist a new notification for a given recipient.
     */
    public Notification create(User recipient, Ticket ticket, NotificationType type, String message) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setTicket(ticket);
        n.setType(type);
        n.setMessage(message);
        return notificationRepository.save(n);
    }
}
