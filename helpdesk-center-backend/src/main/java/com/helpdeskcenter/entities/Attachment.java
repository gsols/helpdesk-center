package com.helpdeskcenter.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.ZonedDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "attachments", indexes = {
    @Index(name = "idx_attachments_ticket", columnList = "ticket_id")
})
@Data
@NoArgsConstructor
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id")
    private TicketMessage message;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;

    @Column(name = "file_size", nullable = false)
    private Integer fileSize;

    @Column(name = "secure_url", nullable = false, columnDefinition = "TEXT")
    private String secureUrl;

    @Column(name = "uploaded_at", insertable = false, updatable = false)
    private ZonedDateTime uploadedAt;
}
