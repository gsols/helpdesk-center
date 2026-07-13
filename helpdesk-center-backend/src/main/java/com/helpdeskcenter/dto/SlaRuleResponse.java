package com.helpdeskcenter.dto;

import com.helpdeskcenter.entities.SlaRule;

public record SlaRuleResponse(
    Long id,
    Long departmentId,
    String departmentName,
    String priority,
    Integer targetResolutionHours
) {
    public static SlaRuleResponse from(SlaRule rule) {
        return new SlaRuleResponse(
            rule.getId(),
            rule.getDepartment().getId(),
            rule.getDepartment().getName(),
            rule.getPriority().name(),
            rule.getTargetResolutionHours()
        );
    }
}
