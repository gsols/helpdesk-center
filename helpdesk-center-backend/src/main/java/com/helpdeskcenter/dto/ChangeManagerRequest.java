package com.helpdeskcenter.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request body for PATCH /api/departments/{id}/manager.
 * The new manager must be a different user from the current one.
 */
public record ChangeManagerRequest(

    @NotNull
    Long newManagerId
) {}
