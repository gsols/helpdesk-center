package com.helpdeskcenter.dto;

/**
 * Snapshot metrics for the Manager Analytics dashboard:
 *  - backlogCount   : OPEN + IN_PROGRESS tickets in the caller's department
 *  - breachedCount  : active tickets whose due_at is in the past
 *  - totalActive    : total active (non-resolved) tickets in the department
 *  - mttrHours      : mean time to resolution for the department (resolved tickets)
 */
public record DeptSummaryResponse(
    long           backlogCount,
    long           breachedCount,
    long           totalActive,
    java.math.BigDecimal mttrHours
) {}
