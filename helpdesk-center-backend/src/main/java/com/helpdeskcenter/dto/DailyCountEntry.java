package com.helpdeskcenter.dto;

/**
 * A single day's resolved ticket count — used by GET /api/analytics/dept-daily.
 */
public record DailyCountEntry(String dayLabel, long ticketCount) {}
