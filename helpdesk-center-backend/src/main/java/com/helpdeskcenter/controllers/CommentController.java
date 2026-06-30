package com.helpdeskcenter.controllers;

import com.helpdeskcenter.entities.Comment;
import com.helpdeskcenter.services.CommentService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long ticketId) {
        return ResponseEntity.ok(commentService.getComments(ticketId));
    }

    @PostMapping
    public ResponseEntity<Comment> addComment(@PathVariable Long ticketId,
                                              @RequestBody Map<String, String> body,
                                              HttpSession session) {
        Comment comment = commentService.addComment(ticketId, body.get("message"), session);
        return ResponseEntity.status(201).body(comment);
    }
}
