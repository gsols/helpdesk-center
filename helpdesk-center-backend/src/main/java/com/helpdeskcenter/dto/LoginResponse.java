package com.helpdeskcenter.dto;

import com.helpdeskcenter.enums.UserRole;

public record LoginResponse(
    String token,
    Long userId,
    String name,
    String email,
    UserRole role,
    Long companyId,
    Long departmentId,
    String departmentName
) {}
