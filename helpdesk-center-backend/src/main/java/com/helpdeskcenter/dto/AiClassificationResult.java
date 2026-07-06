package com.helpdeskcenter.dto;

import java.math.BigDecimal;

/**
 * Result from AIService.classify() — present only when confidence >= 60%.
 * departmentName is the raw string category returned (e.g. "hardware", "hr").
 */
public record AiClassificationResult(
    String departmentName,
    BigDecimal confidenceScore
) {}
