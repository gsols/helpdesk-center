package com.helpdeskcenter.controllers;

import com.helpdeskcenter.entities.Attachment;
import com.helpdeskcenter.services.AttachmentService;
import com.helpdeskcenter.util.FileStorageUtil;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final FileStorageUtil fileStorageUtil;

    @PostMapping("/api/tickets/{ticketId}/attachments")
    public ResponseEntity<?> upload(@PathVariable Long ticketId, @RequestParam("file") MultipartFile file) {
        try {
            Attachment saved = attachmentService.upload(ticketId, file);
            return ResponseEntity.status(201).body(Map.of(
                "id", saved.getId(),
                "fileName", saved.getFileName(),
                "fileSize", saved.getFileSize(),
                "fileType", saved.getFileType()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "File upload failed"));
        }
    }

    @GetMapping("/api/tickets/{ticketId}/attachments")
    public ResponseEntity<List<Attachment>> list(@PathVariable Long ticketId) {
        return ResponseEntity.ok(attachmentService.getByTicket(ticketId));
    }

    @GetMapping("/api/attachments/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        try {
            Attachment attachment = attachmentService.getById(id);
            Path path = fileStorageUtil.load(attachment.getSecureUrl());
            Resource resource = new PathResource(path);

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/api/attachments/{id}/view")
    public ResponseEntity<Resource> view(@PathVariable Long id) {
        try {
            Attachment attachment = attachmentService.getById(id);
            Path path = fileStorageUtil.load(attachment.getSecureUrl());
            Resource resource = new PathResource(path);

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

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
