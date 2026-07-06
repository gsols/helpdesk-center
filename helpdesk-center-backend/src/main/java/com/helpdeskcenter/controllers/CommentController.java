package com.helpdeskcenter.controllers;

import com.helpdeskcenter.entities.TicketMessage;
import com.helpdeskcenter.security.AuthenticatedUser;
import com.helpdeskcenter.services.CommentService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<List<TicketMessage>> getComments(@PathVariable Long ticketId) {
        return ResponseEntity.ok(commentService.getComments(ticketId));
    }

    @PostMapping
    public ResponseEntity<TicketMessage> addComment(
        @PathVariable Long ticketId,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        TicketMessage comment = commentService.addComment(ticketId, body.get("message"), principal);
        return ResponseEntity.status(201).body(comment);
    }
}
