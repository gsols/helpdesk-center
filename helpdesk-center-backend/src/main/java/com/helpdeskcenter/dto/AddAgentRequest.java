package com.helpdeskcenter.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request body for POST /api/departments/{id}/agents.
 * confirmTransfer must be true when the selected user is already an AGENT in another department.
 */
public record AddAgentRequest(

    @NotNull
    Long userId,

    boolean confirmTransfer
) {}
