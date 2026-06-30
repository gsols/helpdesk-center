package com.helpdeskcenter.controllers;

import com.helpdeskcenter.entities.Attachment;
import com.helpdeskcenter.services.AttachmentService;
import com.helpdeskcenter.util.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final FileStorageUtil fileStorageUtil;

    // Upload
    @PostMapping("/api/tickets/{ticketId}/attachments")
    public ResponseEntity<?> upload(@PathVariable Long ticketId,
                                    @RequestParam("file") MultipartFile file) {
        try {
            Attachment saved = attachmentService.upload(ticketId, file);
            return ResponseEntity.status(201).body(Map.of(
                    "id",          saved.getId(),
                    "fileName",    saved.getFileName(),
                    "fileSize",    saved.getFileSize(),
                    "contentType", saved.getContentType()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "File upload failed"));
        }
    }

    // List attachments for a ticket
    @GetMapping("/api/tickets/{ticketId}/attachments")
    public ResponseEntity<List<Attachment>> list(@PathVariable Long ticketId) {
        return ResponseEntity.ok(attachmentService.getByTicket(ticketId));
    }

    // Download
    @GetMapping("/api/attachments/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        try {
            Attachment attachment = attachmentService.getById(id);
            Path path = fileStorageUtil.load(attachment.getFilePath());
            Resource resource = new PathResource(path);

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(attachment.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + attachment.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // Delete
    @DeleteMapping("/api/attachments/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            attachmentService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Deleted"));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Delete failed"));
        }
    }
}
