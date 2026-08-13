package com.helpdeskcenter.dto;

import java.util.List;

/**
 * Full department detail returned by GET /api/departments/{id}.
 * Includes the current manager (if any) and all bound agents.
 */
public record DepartmentDetailResponse(
    Long                   id,
    String                 name,
    EligibleUserResponse   manager,
    List<TeamMemberResponse> agents
) {}
