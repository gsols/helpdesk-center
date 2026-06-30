package com.helpdeskcenter.services;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PriorityService {

    private static final Map<String, String[]> KEYWORDS = Map.of(
        "critical", new String[]{"system down", "server down", "production down", "outage"},
        "high",     new String[]{"urgent", "cannot work", "blocked", "asap", "critical"},
        "medium",   new String[]{"slow", "error", "not working", "issue", "problem"}
    );

    public String detectPriority(String text) {
        String lower = text.toLowerCase();
        for (String keyword : KEYWORDS.get("critical")) {
            if (lower.contains(keyword)) return "critical";
        }
        for (String keyword : KEYWORDS.get("high")) {
            if (lower.contains(keyword)) return "high";
        }
        for (String keyword : KEYWORDS.get("medium")) {
            if (lower.contains(keyword)) return "medium";
        }
        return "low";
    }
}
