package com.helpdeskcenter.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Full overview payload for GET /api/analytics/admin-overview.
 * Scoped to the SYS_ADMIN's company.
 */
public record AdminOverviewResponse(
    long openCount,
    long inProgressCount,
    long resolvedCount,
    long closedCount,
    long triageCount,
    long breachedCount,
    BigDecimal slaComplianceRate,
    BigDecimal avgFrtHours,
    BigDecimal aiAccuracyPct,
    List<DeptBreakdownEntry> deptBreakdown,
    List<AgentSummaryEntry> agentSummary,
    List<RecentActivityEntry> recentActivity
) {
    public record DeptBreakdownEntry(
        Long departmentId,
        String departmentName,
        long openCount,
        long inProgressCount,
        long resolvedCount,
        BigDecimal mttrHours
    ) {}

    public record AgentSummaryEntry(
        Long agentId,
        String agentName,
        String departmentName,
        int activeCount,
        int resolvedCount
    ) {}

    public record RecentActivityEntry(
        Long ticketId,
        String title,
        String status,
        String priority,
        String departmentName,
        String updatedAt
    ) {}
}
