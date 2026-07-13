package com.helpdeskcenter.enums;

/**
 * Drives which filter tab a notification appears under in the front-end panel.
 *
 * COMMENT / ASSIGNED → "All Feed"
 * SLA_BREACH / SYSTEM → "System Flags" (DEPT_MANAGER + SYS_ADMIN only)
 * TAKEOVER_APPROVAL_REQUEST → structural alert; routed to DEPT_MANAGER only
 */
public enum NotificationType {
    COMMENT,
    ASSIGNED,
    SLA_BREACH,
    SYSTEM,
    TAKEOVER_APPROVAL_REQUEST
}
