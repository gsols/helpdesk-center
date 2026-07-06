package com.helpdeskcenter.services;

import com.helpdeskcenter.entities.Attachment;
import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.repositories.AttachmentRepository;
import com.helpdeskcenter.repositories.TicketRepository;
import com.helpdeskcenter.util.FileStorageUtil;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TicketRepository ticketRepository;
    private final FileStorageUtil fileStorageUtil;

    public Attachment upload(Long ticketId, MultipartFile file) throws IOException {
        fileStorageUtil.validate(file);

        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

        String secureUrl = fileStorageUtil.save(ticketId, file);

        Attachment attachment = new Attachment();
        attachment.setTicket(ticket);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileType(file.getContentType());
        attachment.setFileSize(Math.toIntExact(file.getSize()));
        attachment.setSecureUrl(secureUrl);

        return attachmentRepository.save(attachment);
    }

    public List<Attachment> getByTicket(Long ticketId) {
        return attachmentRepository.findByTicketId(ticketId);
    }

    public Attachment getById(Long id) {
        return attachmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Attachment not found"));
    }

    public void delete(Long id) throws IOException {
        Attachment attachment = getById(id);
        fileStorageUtil.delete(attachment.getSecureUrl());
        attachmentRepository.deleteById(id);
    }
}
