# ADR 0001: Multi-Tenant Relational Isolation Schema

## Status
Accepted

## Context

The platform is designed as a multi-tenant help desk system where multiple companies operate within the same application while maintaining strict organizational isolation. The blueprint requires company-scoped users, departments, tickets, SLA configuration, and administrative controls. It also requires a relational model that supports:

- explicit tenant ownership boundaries,
- cross-entity referential integrity,
- department-scoped routing and assignment,
- parent-child ticket splitting for multi-department incidents,
- configurable SLA rules per tenant context,
- and future operational reporting.

The approved database engine in the system blueprint is PostgreSQL, and the master schema defines tenant and operational structure through [`companies`](schema.sql:5), [`departments`](schema.sql:11), [`users`](schema.sql:22), [`tickets`](schema.sql:45), and [`sla_rules`](schema.sql:33).

The schema establishes company tenancy at the root. [`departments.company_id`](schema.sql:13), [`users.company_id`](schema.sql:24), and [`tickets.company_id`](schema.sql:47) all anchor operational records back to [`companies`](schema.sql:5). This reflects the requirement from the blueprint that system admins manage “company spaces” while application logic constrains authenticated users to their own tenant.

The user model must also support multiple role types with different scope boundaries. The blueprint defines `EMPLOYEE`, `AGENT`, `DEPT_MANAGER`, and `SYS_ADMIN`, and the schema captures this through [`users.role`](schema.sql:29). At the same time, the platform needs a flexible user structure where standard employees may have no department, while agents and managers do. The schema expresses that by making [`users.department_id`](schema.sql:25) nullable and documenting that null is valid for standard employees.

SLA handling is explicitly dynamic and must never be hardcoded. The blueprint says each tenant configures its own target resolution windows by priority. The schema models this through [`sla_rules`](schema.sql:33), keyed to [`departments.id`](schema.sql:35) and constrained by [`UNIQUE(department_id, priority)`](schema.sql:38). This creates a single unambiguous SLA rule per department-priority pair.

Because the system manages operational workflows, privacy boundaries, and reporting metrics, a relational database with strong integrity guarantees is required rather than a schemaless or loosely constrained store.

## Decision

We will use PostgreSQL as the primary system of record and implement a shared-database, shared-schema multi-tenant architecture rooted in the [`companies`](schema.sql:5) table.

Tenant isolation will be enforced logically through company-owned foreign keys across core entities:

- [`departments.company_id`](schema.sql:13)
- [`users.company_id`](schema.sql:24)
- [`tickets.company_id`](schema.sql:47)

This means every operational record belongs to a company, and application services will scope reads and writes to the authenticated tenant context. PostgreSQL was chosen because it provides:

- strong relational integrity through foreign keys,
- transactional guarantees for ticketing and rerouting workflows,
- mature indexing and query performance,
- support for nullable foreign keys where the business model requires them,
- and a stable foundation for analytics, auditing, and reporting.

We will model users in a single dynamic identity table, [`users`](schema.sql:22), instead of splitting employees, agents, managers, and admins into separate tables. Role behavior will be expressed through [`users.role`](schema.sql:29), while organizational alignment is expressed through [`users.company_id`](schema.sql:24) and optional [`users.department_id`](schema.sql:25). This supports the blueprint requirement that employees can exist without departmental assignment while agents and managers are department-scoped.

We will treat [`companies`](schema.sql:5) as the tenant boundary root and not create separate schemas or separate databases per tenant at this stage. This keeps provisioning, migrations, and application logic simpler while still preserving hard ownership structure in the data model.

We will model SLA rules through [`sla_rules`](schema.sql:33) with one rule per department and priority combination, enforced by [`UNIQUE(department_id, priority)`](schema.sql:38). This means SLA policy is not inferred or duplicated. Each priority boundary inside a department maps to exactly one target resolution duration. This supports tenant-configurable SLA behavior while avoiding ambiguous resolution targets.

## Alternatives Considered

### 1. Separate database per company
This would provide stronger physical isolation, but it would also significantly increase operational complexity for provisioning, migrations, backups, monitoring, and analytics aggregation. The current product scope does not require that level of isolation, and the blueprint favors centralized administration across tenant company spaces.

### 2. Separate schema per tenant within PostgreSQL
This would isolate tenants more strongly than a shared schema, but it would complicate migrations, code paths, and reporting queries. The current schema already expresses tenant ownership explicitly through foreign keys, which is sufficient for the intended application model.

### 3. Non-relational/document database
A document store would be a poor fit for the platform’s heavy use of foreign keys, hierarchical ticket relationships, assignment rules, SLA uniqueness, and audit reporting. The problem space is relational by nature.

### 4. Separate tables for each user type
Creating independent employee, agent, manager, and admin tables would duplicate identity structure and complicate authentication and authorization. A unified [`users`](schema.sql:22) table is simpler and better aligned with role-based access controls in the blueprint.

### 5. Company-level SLA rules only
An alternative would be to store a single SLA matrix per company. We rejected that because the schema and business model support departmental operating differences. The chosen [`sla_rules`](schema.sql:33) structure allows each department to maintain its own response expectations per priority.

## Consequences

### Positive
- The schema cleanly reflects the tenant model required by the blueprint.
- PostgreSQL provides strong integrity and transactional behavior for routing, reassignment, and audit workflows.
- A unified user table simplifies authentication, role handling, and future extensions.
- Company ownership is explicit across departments, users, and tickets.
- Unique SLA mapping via [`UNIQUE(department_id, priority)`](schema.sql:38) prevents conflicting rules and supports deterministic due-date calculations.
- Shared-schema tenancy keeps deployment and migration complexity manageable for the current phase.

### Negative
- Isolation is enforced primarily by application logic and disciplined query scoping rather than physical database separation.
- The schema does not itself guarantee every cross-reference belongs to the same company; some tenant consistency checks must be enforced in application services.
- Department-based SLA modeling means tenants with highly customized workflows may eventually require broader configuration models.

### Operational Implications
- Every authenticated request must carry tenant context and constrain queries by company ownership.
- Service-layer validation must ensure that referenced users, departments, and tickets belong to the same tenant.
- Future reporting and indexing strategies should continue to prioritize company-scoped access paths, as already anticipated by indexes such as [`idx_tickets_company_dept`](schema.sql:98).
