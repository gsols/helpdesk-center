# Filter Plan — Ticket List Filtering

## Overview

Add client-side filter controls to both dashboards. All data is already fetched in full on page load,
so filtering is pure array `.filter()` in React state — no new API endpoints needed.

The backend already scopes tickets by role (agents only see their category queue, employees only see
their own tickets), so the frontend just needs to narrow within that already-scoped list.

---

## Sub-Task 1 — Employee Dashboard Filters

**Intent**
Employees see their own tickets. Let them narrow the list by category, status, and priority.

**Filters**
- Category: All | Hardware | Software | HR
- Status: All | Open | In Progress | Resolved
- Priority: All | Critical | High | Medium | Low

**Expected Outcomes**
- A filter bar appears above the ticket list on the Employee Dashboard
- Selecting any combination of filters immediately narrows the displayed tickets
- A "Clear filters" link resets all to "All"
- The count of visible tickets is shown (e.g. "Showing 3 of 7 tickets")

**Todo List**
1. Add `filters` state `{ category: 'all', status: 'all', priority: 'all' }` in `EmployeeDashboard`
2. Derive `filteredTickets` from `tickets` using the active filters
3. Render a `FilterBar` inline (no separate component needed) above the ticket list
4. Replace `tickets.map(...)` with `filteredTickets.map(...)`
5. Add ticket count display

**Relevant Context**
- `helpdesk-center-frontend/src/pages/EmployeeDashboard.jsx` — main file to edit
- `helpdesk-center-frontend/src/components/TicketCard.jsx` — unchanged, receives `ticket` prop
- Ticket fields: `category` (hardware|software|hr), `status` (open|in_progress|resolved), `priority` (critical|high|medium|low)

**Status** [x] done

---

## Sub-Task 2 — Agent Dashboard Filters

**Intent**
Agents already only see tickets in their department category (scoped by backend).
Let them narrow further by status and priority only — category filter is not needed since they
only ever see one category.

**Filters**
- Status: All | Open | In Progress | Resolved
- Priority: All | Critical | High | Medium | Low

**Expected Outcomes**
- A filter bar appears above the ticket list on the Agent Dashboard
- Selecting any filter combination narrows the displayed tickets
- A "Clear filters" link resets to "All"
- Ticket count shown (e.g. "Showing 2 of 5 tickets")

**Todo List**
1. Add `filters` state `{ status: 'all', priority: 'all' }` in `AgentDashboard`
2. Derive `filteredTickets` from `tickets` using the active filters
3. Render a filter bar above the ticket list (match the same style as Employee Dashboard)
4. Replace `tickets.map(...)` with `filteredTickets.map(...)`
5. Add ticket count display

**Relevant Context**
- `helpdesk-center-frontend/src/pages/AgentDashboard.jsx` — main file to edit
- Same `TicketCard` component, same ticket field values as above
- Agent role is one of: `it_hardware`, `it_software`, `hr`

**Status** [x] done

---

## Shared Design Notes

- Filter bar style: a single horizontal row of labelled `<select>` dropdowns, consistent with the existing inline-style approach used across both dashboards
- No new component files — keep filters inline in each dashboard file to match existing code style
- All filtering is client-side — no API changes required
- The filter bar only renders when `tickets.length > 0`
