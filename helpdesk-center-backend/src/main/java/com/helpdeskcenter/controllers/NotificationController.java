package com.helpdeskcenter.controllers;

import com.helpdeskcenter.dto.NotificationResponse;
import com.helpdeskcenter.security.AuthenticatedUser;
import com.helpdeskcenter.services.NotificationService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** GET /api/notifications — fetch all notifications for the authenticated user. */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAll(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        List<NotificationResponse> list = notificationService
            .getForRecipient(principal.userId())
            .stream()
            .map(NotificationResponse::from)
            .toList();
        return ResponseEntity.ok(list);
    }

    /** GET /api/notifications/unread-count — lightweight badge count poll. */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        long count = notificationService.countUnread(principal.userId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /** PATCH /api/notifications/{id}/read — mark a single notification as read. */
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(
        @PathVariable Long id,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(
            NotificationResponse.from(
                notificationService.markRead(id, principal.userId())
            )
        );
    }

    /** PATCH /api/notifications/mark-all-read — mark every notification as read for the caller. */
    @PatchMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        notificationService.markAllRead(principal.userId());
        return ResponseEntity.noContent().build();
    }
}
