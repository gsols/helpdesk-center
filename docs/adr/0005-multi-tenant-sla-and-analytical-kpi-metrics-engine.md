# 5. Multi-Tenant SLA Calculation and Analytical KPI Metrics Engine

## Status
Accepted

## Context
Our help desk platform must enforce Service Level Agreements (SLAs) and expose operational analytics (First Response Time, Mean Time to Resolution, and AI Routing Accuracy) to department managers. 

Because the platform is multi-tenant, SLA targets cannot be hardcoded in application loops; they must be dynamic. Furthermore, computing SLA timelines and KPI calculations inside memory arrays wastes application server resources and scales poorly. These calculations must be offloaded directly to database-level relational transformations.

## Decision
We will handle SLA milestones and metrics processing using the following specific engine strategies:

1. **Dynamic Due Dates**: The moment a ticket is saved or its priority mutates, the backend will fetch target configurations from `sla_rules` matching the `department_id` and compute `due_at = created_at + target_resolution_hours`.
2. **State-Machine Clock Suspension**: When a ticket transitions to `PENDING_EMPLOYEE`, the SLA countdown pauses. Upon an employee's message submission, the backend updates the ticket's `due_at` timestamp by appending the exact time delta elapsed during the pause.
3. **Database-Level KPI Compilations**: All dashboard metrics will be calculated using optimized PostgreSQL aggregation routines rather than loading active record loops into Java application memory:
   - **First Response Time (FRT)**: Derived by calculating the interval delta between `ticket.created_at` and the minimum `created_at` timestamp of the first message sent by an account with an `AGENT` or `DEPT_MANAGER` structural role.
   - **Mean Time to Resolution (MTTR)**: Extracted by averaging the delta between `updated_at` and `created_at` for items possessing a status of `RESOLVED` or `CLOSED`.
   - **AI Accuracy**: Calculated as a precise statistical percentage derived directly from the boolean parameters inside the `ai_classification_logs` telemetry structure.

## Alternatives Considered
*   *In-Memory Java Processing*: Rejected because extracting thousands of historical row items into Java memory collections to calculate dashboard metrics would trigger application out-of-memory errors as tenants scale.
*   *Historical Status Snapshot Tables*: Tracking every single micro-state change in an isolated history table was rejected for initial MVP development due to structural write complexity, though it remains a consideration for enterprise audits down the line.

## Consequences
*   **Positive**: Near-zero server memory overhead when rendering tenant performance analytics.
*   **Positive**: Flawless, automated multi-tenant tracking customization.
*   **Negative**: Puts heavy compute dependencies on database transactional query optimization, requiring strict execution indices on search matching columns (`company_id`, `department_id`, `status`).
