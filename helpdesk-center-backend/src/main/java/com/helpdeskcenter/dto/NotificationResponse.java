package com.helpdeskcenter.dto;

import com.helpdeskcenter.entities.Notification;
import com.helpdeskcenter.enums.NotificationType;
import java.time.ZonedDateTime;

public record NotificationResponse(
    Long id,
    Long ticketId,
    /** Populated only for TAKEOVER_APPROVAL_REQUEST — the agent who made the request. */
    Long requestingAgentId,
    NotificationType type,
    String message,
    boolean read,
    ZonedDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        Long reqAgentId = null;
        if (n.getTicket() != null && n.getTicket().getTakeoverRequestedBy() != null) {
            reqAgentId = n.getTicket().getTakeoverRequestedBy().getId();
        }
        return new NotificationResponse(
            n.getId(),
            n.getTicket() != null ? n.getTicket().getId() : null,
            reqAgentId,
            n.getType(),
            n.getMessage(),
            n.isRead(),
            n.getCreatedAt()
        );
    }
}
