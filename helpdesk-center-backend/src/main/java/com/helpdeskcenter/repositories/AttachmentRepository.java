package com.helpdeskcenter.repositories;

import com.helpdeskcenter.entities.Attachment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByTicketId(Long ticketId);

    List<Attachment> findByMessageId(Long messageId);
}
