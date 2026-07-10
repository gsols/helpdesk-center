# Helpdesk Center — Documentation Index

This directory is the single source of truth for all project documentation.

---

## 📐 Blueprint (always-active constraints)

These files govern **every** implementation decision. Read them before starting any task.

| File | Purpose |
|---|---|
| [`blueprint/system-blueprint.md`](blueprint/system-blueprint.md) | Master product spec — business rules, tech stack, phase roadmap, role permissions, AI routing logic, SLA rules |
| [`blueprint/frontend-design-system.md`](blueprint/frontend-design-system.md) | UI/UX design system — hybrid radius rule, layout tokens, Jira-table typography, badge specs, color palette |

---

## 📋 Implementation Plans (execution history)

Each plan records a discrete body of work with sub-tasks, expected outcomes, and completion status.

| # | File | Scope | Status |
|---|---|---|---|
| 00 | [`plans/00-implementation-plan.md`](plans/00-implementation-plan.md) | Original full-stack build from scratch (backend entities → auth → AI → frontend) | Superseded by Plan 01 |
| 01 | [`plans/01-makeover-plan.md`](plans/01-makeover-plan.md) | Full backend + frontend makeover — JWT, TanStack Query, Tailwind, agent tabs, admin SLA/analytics | ✅ All sub-tasks done |
| 02 | [`plans/02-design-revision-plan.md`](plans/02-design-revision-plan.md) | Navy-blue sidebar shell redesign, StatCard, AdminDashboard, role routing | ✅ Superseded and fully implemented via Plans 01 + 03 |
| 03 | [`plans/03-split-panel-plan.md`](plans/03-split-panel-plan.md) | Split-pane ticket detail view, maximize/minimize, URL query-param state | ✅ All sub-tasks done |
| 04 | [`plans/04-filter-plan.md`](plans/04-filter-plan.md) | Client-side ticket list filtering (category / status / priority) for both dashboards | ✅ All sub-tasks done |
| 05 | [`plans/05-frontend-makeover-plan.md`](plans/05-frontend-makeover-plan.md) | Frontend UI makeover — hybrid radius rule, Jira-style tables, viewport lock, CRITICAL badge | ✅ All 7 sub-tasks done |

---

## 🏛️ Architecture Decision Records (ADRs)

Ratified decisions that lock down specific technical choices.

| ADR | Title |
|---|---|
| [`adr/0001-multi-tenant-relational-isolation-schema.md`](adr/0001-multi-tenant-relational-isolation-schema.md) | Multi-tenant relational schema isolation |
| [`adr/0002-ibm-watsonx-routing-and-fallback-confidence-gates.md`](adr/0002-ibm-watsonx-routing-and-fallback-confidence-gates.md) | IBM watsonx routing and 60% confidence fallback gate |
| [`adr/0003-departmental-data-isolation-and-team-collaboration-boundaries.md`](adr/0003-departmental-data-isolation-and-team-collaboration-boundaries.md) | Departmental data isolation and HTTP 403 enforcement |
| [`adr/0004-decoupled-file-attachments-via-object-storage.md`](adr/0004-decoupled-file-attachments-via-object-storage.md) | Decoupled file attachments via object storage |
| [`adr/0005-multi-tenant-sla-and-analytical-kpi-metrics-engine.md`](adr/0005-multi-tenant-sla-and-analytical-kpi-metrics-engine.md) | Multi-tenant SLA and KPI analytics engine |
| [`adr/0006-enforce-zero-radius-high-density-ui.md`](adr/0006-enforce-zero-radius-high-density-ui.md) | Hybrid geometric zero-radius / high-density UI system |

---

## Quick Hybrid Radius Rule Reference

Enforced on all `helpdesk-center-frontend/` components per ADR 0006 and the design system:

| Element type | Rule | Example |
|---|---|---|
| Layout panes, card containers, modals | `rounded-none` | `AppShell`, `TicketDetailPanel` cards |
| `<input>`, `<select>`, `<textarea>` | `rounded-none` | All form fields |
| Status/priority badges, count pills | `rounded` or `rounded-full` | `StatusBadge`, `PriorityBadge`, tab counts |
| CTA buttons (Save, Claim, Submit…) | `rounded` | All interactive action controls |
| User avatar circles | `rounded-full` | `CommentSection`, `AppShell` user section |
| Floating dropdown panels | `rounded` | Priority filter dropdown |
