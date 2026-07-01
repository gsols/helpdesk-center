package com.helpdeskcenter.controllers;

import com.helpdeskcenter.services.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketPreviewController {

    private final AIService aiService;

    /**
     * POST /api/tickets/preview
     * Body: { "title": "...", "description": "..." }
     * Returns Watson NLU keywords + detected category WITHOUT saving the ticket.
     * Used by the frontend to show explainability and block off-topic submissions.
     */
    @PostMapping("/preview")
    public ResponseEntity<Map<String, Object>> preview(@RequestBody Map<String, String> body) {
        String text = body.getOrDefault("title", "") + " " + body.getOrDefault("description", "");
        if (text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "allowed", false,
                    "category", null,
                    "source", "none",
                    "watsonKeywords", java.util.List.of(),
                    "error", "Title and description cannot be empty"
            ));
        }
        Map<String, Object> result = aiService.preview(text.trim());
        return ResponseEntity.ok(result);
    }
}
