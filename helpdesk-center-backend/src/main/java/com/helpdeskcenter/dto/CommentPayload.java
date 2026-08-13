package com.helpdeskcenter.dto;

import com.helpdeskcenter.entities.TicketMessage;
import lombok.Data;

import java.time.ZonedDateTime;

/**
 * Lightweight shape broadcast over WebSocket to all subscribers of
 * /topic/tickets/{ticketId}/comments — avoids sending lazy Hibernate proxies
 * over the wire and keeps the payload small.
 */
@Data
public class CommentPayload {

    private Long id;
    private Long ticketId;
    private SenderInfo sender;
    private String body;
    private ZonedDateTime createdAt;

    @Data
    public static class SenderInfo {
        private Long id;
        private String name;
        private String role;
    }

    /** Factory — converts a persisted TicketMessage into the WS payload. */
    public static CommentPayload from(TicketMessage msg) {
        CommentPayload p = new CommentPayload();
        p.setId(msg.getId());
        p.setTicketId(msg.getTicket().getId());
        p.setBody(msg.getBody());
        p.setCreatedAt(msg.getCreatedAt());

        if (msg.getSender() != null) {
            SenderInfo si = new SenderInfo();
            si.setId(msg.getSender().getId());
            si.setName(msg.getSender().getName());
            si.setRole(msg.getSender().getRole() != null ? msg.getSender().getRole().name() : null);
            p.setSender(si);
        }
        return p;
    }
}
