package com.helpdeskcenter.dto;

/**
 * Lightweight user projection returned by:
 *   GET /api/departments/{id}/eligible-agents
 *   GET /api/users/all-users  (used by manager / agent pickers in Create Department modal)
 *
 * isActiveAgent — true when the user currently holds role AGENT in another department.
 * departmentName — the user's current department name, or null if unassigned.
 */
public record EligibleUserResponse(
    Long   id,
    String name,
    String email,
    String role,
    String departmentName,
    boolean isActiveAgent
) {}
