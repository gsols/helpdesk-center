package com.helpdeskcenter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Request body for POST /api/departments.
 * A manager is required; agents are optional (may be an empty list or null).
 */
public record CreateDepartmentRequest(

    @NotBlank
    @Size(max = 100)
    String name,

    @NotNull
    Long managerId,

    List<Long> agentIds
) {}
