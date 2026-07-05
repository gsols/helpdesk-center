# ADR 0003: Departmental Data Isolation and Team Collaboration Boundaries

## Status
Accepted

## Context

The platform handles operational issues that may contain sensitive internal data across departments such as HR, Finance, IT, and Facilities. The blueprint therefore defines strict permission boundaries for agents and managers.

Agents are allowed three views within their own department:

- a personal assigned queue with read/write access,
- an unassigned departmental pool with read/write claiming behavior,
- and a department archive of peer-assigned tickets with read-only visibility.

The blueprint also establishes an absolute cross-department restriction: agents must not be able to view, search, or interact with tickets belonging to other departments. This is a hard privacy wall, not a soft filtering preference.

At the same time, the system must support complex incidents that span multiple departments. The blueprint handles this using a parent-child ticket model. The schema implements that through the self-referencing foreign key [`tickets.parent_id`](schema.sql:51), allowing one originating ticket to act as a parent while separate child tickets are routed to different departments.

These two needs—strict departmental isolation and controlled collaboration—must coexist. Collaboration is allowed inside a department through read-only visibility of peer-assigned tickets, but not across department boundaries.

The schema supports these rules through the combination of:

- [`tickets.department_id`](schema.sql:48) for routing and authorization scope,
- [`tickets.assignee_id`](schema.sql:50) for personal ownership,
- and [`tickets.parent_id`](schema.sql:51) for hierarchical decomposition of multi-department work.

## Decision

We will enforce a strict department-based authorization model in which agents are blocked from accessing tickets outside their assigned department. Any attempted access to a ticket whose [`tickets.department_id`](schema.sql:48) does not match the agent’s department context will be treated as unauthorized and must return HTTP 403 Forbidden.

This is a deliberate authorization boundary, not merely a UI omission. Cross-department tickets must not appear in search results, queue lists, direct detail endpoints, or edit operations for agents outside the owning department.

Within the same department, we will allow controlled team collaboration through scoped visibility rules:

- If [`tickets.assignee_id`](schema.sql:50) equals the current agent, the ticket is read/write in the agent’s primary queue.
- If [`tickets.department_id`](schema.sql:48) matches the current agent’s department and [`tickets.assignee_id`](schema.sql:50) is null, the ticket is visible and claimable from the department pool.
- If [`tickets.department_id`](schema.sql:48) matches the current agent’s department and [`tickets.assignee_id`](schema.sql:50) belongs to another agent, the ticket is visible read-only until explicitly reassigned.

We will represent multi-department incidents using the self-referencing hierarchy in [`tickets.parent_id`](schema.sql:51). A broad user issue may originate as a parent ticket, but operational work that belongs to different departments will be split into child tickets, each carrying its own department assignment and therefore its own security boundary. This prevents a single ticket from becoming a shared cross-department data container.

The parent-child design preserves coordination without weakening isolation. Parent tickets aggregate the lifecycle of the incident, while child tickets enforce department-specific ownership and handling.

## Alternatives Considered

### 1. Allow cross-department visibility to all agents for transparency
This was rejected because it directly conflicts with the blueprint’s privacy requirement and increases the risk of exposing sensitive HR, payroll, or facilities information to unrelated teams.

### 2. Return HTTP 404 instead of 403 for unauthorized cross-department access
This was considered as a resource-hiding pattern, but the blueprint explicitly frames the boundary as a hard forbidden wall. Returning 403 makes the authorization policy explicit and easier to reason about operationally.

### 3. Use a many-to-many department sharing model on a single ticket
This would allow one ticket to belong to multiple departments simultaneously, but it would blur ownership, permissions, SLAs, and accountability. The parent-child model is clearer and more consistent with departmental autonomy.

### 4. Allow same-department agents to fully edit peer-assigned tickets
This was rejected because the blueprint explicitly defines peer-assigned visibility as read-only unless the ticket is reassigned. Preserving assignment ownership reduces accidental interference and improves accountability.

### 5. Duplicate ticket data manually instead of using a parent-child hierarchy
Manual duplication would create synchronization problems and break traceability. The self-referencing [`tickets.parent_id`](schema.sql:51) model is simpler and preserves explicit lineage.

## Consequences

### Positive
- Sensitive departmental data remains strongly partitioned.
- The system aligns directly with the blueprint’s absolute cross-department restriction.
- Team collaboration is still possible within a department through read-only peer visibility.
- Parent-child ticketing supports complex multi-department scenarios without weakening authorization boundaries.
- Assignment ownership remains clear and auditable.

### Negative
- Agents may need formal rerouting or splitting workflows rather than informal collaboration across departments.
- Authorization logic becomes central and must be consistently enforced in every query and endpoint.
- Parent-child ticket handling adds lifecycle complexity, especially for status aggregation and closure.

### Operational Implications
- Backend services must treat department matching as a mandatory authorization predicate before returning ticket data.
- Any cross-department access attempt by an agent must produce 403 Forbidden.
- Search, dashboard, export, and reporting endpoints must all honor the same department isolation rules.
- Parent-child workflows must ensure each child ticket receives its own [`department_id`](schema.sql:48) and lifecycle tracking.
- Same-department peer visibility must remain read-only unless reassignment changes effective ownership through [`tickets.assignee_id`](schema.sql:50).
