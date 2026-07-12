package com.helpdeskcenter.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * One-shot migration that runs on every startup.
 *
 * Hibernate's ddl-auto=update cannot modify existing CHECK constraints —
 * it only adds columns/tables. When PENDING_APPROVAL was added to the
 * TicketStatus Java enum, Hibernate tried to UPDATE a row with that value
 * and PostgreSQL rejected it with "violates check constraint tickets_status_check".
 *
 * This runner drops the old constraint and re-creates it with the full
 * set of valid values. It is idempotent — safe to run on every startup.
 */
@Configuration
@RequiredArgsConstructor
public class StatusConstraintMigration {

    private static final Logger log = LoggerFactory.getLogger(StatusConstraintMigration.class);
    private final JdbcTemplate jdbc;

    @EventListener(ApplicationReadyEvent.class)
    public void migrate() {
        try {
            // Drop the old constraint if it exists (IF EXISTS is safe)
            jdbc.execute(
                "ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check"
            );

            // Re-add with the full set of valid values including PENDING_APPROVAL
            jdbc.execute(
                "ALTER TABLE tickets ADD CONSTRAINT tickets_status_check " +
                "CHECK (status IN ('OPEN','IN_PROGRESS','PENDING_EMPLOYEE','PENDING_APPROVAL','RESOLVED','CLOSED'))"
            );

            log.info("[Migration] tickets_status_check constraint updated — PENDING_APPROVAL is now valid");
        } catch (Exception e) {
            log.error("[Migration] Failed to update tickets_status_check: {}", e.getMessage());
        }
    }
}
