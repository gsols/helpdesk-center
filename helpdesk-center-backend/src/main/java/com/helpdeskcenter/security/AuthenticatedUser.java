package com.helpdeskcenter.security;

import com.helpdeskcenter.enums.UserRole;

/**
 * Immutable value object populated from JWT claims and placed into
 * the Spring SecurityContext. Accessible in controllers via
 * {@code @AuthenticationPrincipal AuthenticatedUser principal}.
 */
public record AuthenticatedUser(
    Long userId,
    String email,
    UserRole role,
    Long companyId,
    Long departmentId
) {}
