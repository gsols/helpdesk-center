package com.helpdeskcenter.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Component
public class FileStorageUtil {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final java.util.Set<String> ALLOWED_TYPES = java.util.Set.of(
            "image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"
    );

    private static final long MAX_SIZE = 10L * 1024 * 1024; // 10 MB

    public void validate(MultipartFile file) {
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("File exceeds 10 MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("File type not allowed: " + contentType);
        }
    }

    public String save(Long ticketId, MultipartFile file) throws IOException {
        // Sanitize file name — strip directory separators
        String originalName = Paths.get(file.getOriginalFilename()).getFileName().toString();
        String storedName   = UUID.randomUUID().toString().replace("-", "") + "_" + originalName;

        Path dir = Paths.get(uploadDir, ticketId.toString());
        Files.createDirectories(dir);

        Path target = dir.resolve(storedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // Return relative path stored in DB
        return uploadDir + "/" + ticketId + "/" + storedName;
    }

    public Path load(String filePath) {
        return Paths.get(filePath);
    }

    public void delete(String filePath) throws IOException {
        Files.deleteIfExists(Paths.get(filePath));
    }
}
