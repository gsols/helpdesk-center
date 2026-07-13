package com.helpdeskcenter.dto;

/**
 * Projection returned by GET /api/users/team.
 * Carries the agent's basic info plus their current active ticket load.
 */
public record TeamMemberResponse(
    Long   id,
    String name,
    String email,
    String role,
    String departmentName,
    int    activeTicketCount
) {}
