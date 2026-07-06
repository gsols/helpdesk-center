package com.helpdeskcenter.dto;

import java.math.BigDecimal;

public record MttrEntry(Long departmentId, String departmentName, BigDecimal meanTimeToResolutionHours) {}
