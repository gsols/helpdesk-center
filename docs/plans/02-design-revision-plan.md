# ClassifAi — Full Design Revision Plan

## Overview

A complete visual and structural redesign of the frontend to a modern, professional
helpdesk application. Primary color: **Navy Blue (`#1e3a5f`) / Deep Blue (`#1d4ed8`)**
with a light neutral canvas. The layout moves from a top-bar-only shell to a
**persistent left sidebar + content area** pattern (as shown in the reference
screenshots). New user role **Administrator** is introduced.

> **Scope:** frontend-only. Backend API additions are noted where new endpoints
> will be required (marked **[API NEEDED]**) — backend changes are out of scope
> for the frontend implementation sub-tasks but must be coordinated.

---

## Design Tokens (Color System)

| Token | Value | Usage |
|---|---|---|
| `--navy` | `#1e3a5f` | Sidebar background, primary CTA |
| `--navy-dark` | `#152d4a` | Sidebar hover / active |
| `--navy-text` | `#ffffff` | Sidebar text |
| `--accent` | `#2563eb` | Active state, links, focus rings |
| `--accent-light` | `#dbeafe` | Badge backgrounds, highlights |
| `--surface` | `#f8fafc` | Page canvas |
| `--card` | `#ffffff` | Cards, panels |
| `--border` | `#e2e8f0` | Borders, dividers |
| `--text-primary` | `#0f172a` | Headings, body text |
| `--text-secondary` | `#64748b` | Labels, meta |
| `--text-muted` | `#94a3b8` | Placeholders, disabled |

---

## Assessed Improvements from improvements.md

| # | Suggestion | Assessment | Included? |
|---|---|---|---|
| 1 | Administrator role that sees all tickets | Practical — adds oversight without complexity | ✅ Yes |
| 1.1 | Admin can assign tickets to agents | Practical — core helpdesk workflow | ✅ Yes |
| 2 | Multiple agent types (hr, software, hardware, extensible) | Already partially exists; make extensible via role display | ✅ Yes (display layer) |
| 3 | Dashboard redesign with stats cards | High value, directly improves usability | ✅ Yes |
| 4 | Agent dashboard stats (open/pending/closed counts) | Practical, computed client-side from existing data | ✅ Yes |
| 5 | Agent self-assignment of tickets, shown to user | Practical — needs one API endpoint | ✅ Yes **[API NEEDED]** |

---

## Architecture Changes

### New Route & Role Structure

```
/login              → LoginPage (all roles)
/dashboard          → EmployeeDashboard  (role: employee)
/agent              → AgentDashboard     (role: it_hardware | it_software | hr)
/admin              → AdminDashboard     (role: administrator) [NEW]
/tickets/:id        → TicketDetailPage   (all authenticated)
```

### New Shell: Sidebar Layout

Every authenticated page gains a **persistent left sidebar** (240px wide,
navy background) replacing the current top-bar-only `AppHeader`. The sidebar
contains: logo, nav links for the current role, and a user info / logout section
at the bottom. A top bar is kept for page title + search + notification bell.

---

## Sub-Tasks

---

### Sub-Task 1 — Design tokens & global shell

**Intent**
Establish the shared color tokens, typography baseline, and the new sidebar +
top-bar shell that every page will use. This is the foundation all other sub-tasks
build on.

**Expected Outcomes**
- New file `src/styles/tokens.js` — exports a single `T` object with all design
  token values as JS constants so inline styles stay consistent.
- New component `src/components/AppShell.jsx` — renders:
  - Left sidebar (navy, 240px, sticky full-height) with logo at top, nav links
    in the middle, user info + logout at the bottom.
  - Top bar (white, 56px, sticky) with page title slot, search bar (placeholder
    for now), notification bell icon.
  - `{children}` content area to the right of the sidebar.
- `AppHeader.jsx` is retired — all pages import `AppShell` instead.
- Existing pages (`LoginPage`, `EmployeeDashboard`, `AgentDashboard`,
  `TicketDetailPage`) are updated to wrap their content in `<AppShell>`.

**Todo List**
1. Create `src/styles/tokens.js` with all design token constants.
2. Create `src/components/AppShell.jsx`:
   - Sidebar: navy bg `#1e3a5f`, 240px, full-height fixed. Logo + wordmark at
     top. Nav items as `<NavItem>` with icon, label, active state (brighter
     bg + white text), hover state. Bottom section: avatar + name + role +
     logout button.
   - Top bar: white bg, 56px, border-bottom, flex with title on left and
     user actions on right.
   - Content: `margin-left: 240px`, top padding for top-bar, background
     `#f8fafc`.
3. Define nav items per role:
   - Employee: Dashboard, My Tickets, Submit Ticket
   - Agent: Dashboard (Queue), Settings (placeholder)
   - Admin: Dashboard, All Tickets, Agents (placeholder)
4. Replace `AppHeader` usage in all existing pages with `AppShell`.
5. Add `@media (max-width: 768px)` — sidebar collapses to icons-only (48px),
   overlay on a hamburger toggle.

**Relevant Context**
- `src/components/AppHeader.jsx` — to be replaced
- `src/App.jsx` — routing (add `/admin` route)
- `src/context/AuthContext.jsx` — `user.role` used for nav switching

**Status** `[ ] pending`

---

### Sub-Task 2 — Stat cards component + Employee Dashboard redesign

**Intent**
Replace the plain "My Tickets" list with a modern dashboard: a welcome banner,
three stat cards (Open / In Progress / Resolved counts), and the ticket list
below. Matches the reference screenshot layout.

**Expected Outcomes**
- New component `src/components/StatCard.jsx` — reusable card showing a label,
  large number, colored status icon, and optional trend indicator.
- `EmployeeDashboard` renders:
  - Welcome banner: "Welcome back, {name}" with a submit button.
  - Three stat cards in a row (Open, In Progress, Resolved) — counts computed
    from the already-fetched `tickets` array.
  - Filter bar (existing, restyled).
  - Ticket list (existing).
- Split-pane behavior unchanged; stat cards collapse to a single column on mobile.

**Todo List**
1. Create `src/components/StatCard.jsx` — props: `label`, `count`, `color`,
   `icon`. Renders a white card with navy-accented count and icon.
2. In `EmployeeDashboard`:
   a. Add welcome banner div with greeting and "Submit New Ticket" button.
   b. Compute `openCount`, `inProgressCount`, `resolvedCount` from `tickets`.
   c. Render three `<StatCard>` components above the filter bar.
   d. Restyle filter bar to use the new tokens (border color, label sizes).
3. Remove the old "+ New Ticket" toolbar button (replaced by banner CTA).
   Keep `NewTicketDrawer` logic intact — the banner button opens it.

**Relevant Context**
- `src/pages/EmployeeDashboard.jsx` — main file
- `src/components/StatCard.jsx` — new file
- Reference screenshot 3 (employee dashboard with stat cards)

**Status** `[ ] pending`

---

### Sub-Task 3 — Agent Dashboard redesign with stat cards + self-assignment

**Intent**
Give the agent dashboard stat cards (Open / In Progress / Resolved for their
queue) and an "Assign to Me" button on each unassigned ticket card. When clicked,
it calls the assignment endpoint and reflects the assignee on both the ticket list
and in the employee's ticket detail view.

**Expected Outcomes**
- `AgentDashboard` renders stat cards above the filter bar (same `StatCard`
  component as Sub-Task 2).
- Each `TicketCard` in agent view shows an "Assign to me" pill button if
  `ticket.assignedTo` is null. Clicking it calls the assignment API and
  re-fetches tickets.
- After assignment, the ticket card shows the agent's name badge instead of
  "Unassigned".
- `TicketDetailPanel` shows the updated assignee immediately (re-fetches on
  `ticketId` change).

**Todo List**
1. Add `assignTicket(ticketId, agentId)` to `src/api/ticketsApi.js` →
   `PUT /api/tickets/{id}/assign` **[API NEEDED]**.
2. Add `onAssign` optional prop to `TicketCard`. When provided and
   `ticket.assignedTo` is null, render a small "Assign to me" button.
3. In `AgentDashboard`:
   a. Compute stat counts from `tickets`.
   b. Render three `<StatCard>` components.
   c. Pass `onAssign` to each `<TicketCard>` — handler calls `assignTicket`
      then refreshes the ticket list.
4. Test that the updated assignee appears in `TicketDetailPanel` metadata.

**Relevant Context**
- `src/pages/AgentDashboard.jsx`
- `src/components/TicketCard.jsx`
- `src/api/ticketsApi.js`
- `improvements.md` item 5

**Status** `[ ] pending`

---

### Sub-Task 4 — Administrator role + Admin Dashboard

**Intent**
Introduce the `administrator` role. The Admin Dashboard shows all tickets across
all queues, stat cards for the whole system, and allows assigning any ticket to
any agent via a dropdown.

**Expected Outcomes**
- New page `src/pages/AdminDashboard.jsx`.
- New API function `getAgents()` → `GET /api/users/agents` **[API NEEDED]**
  returns list of all agent users.
- Admin sees all tickets (same `GET /api/tickets` but backend must return all,
  not filtered by role — **[API NEEDED]**).
- Each ticket row has an "Assign to" dropdown listing all agents. Selecting one
  calls `assignTicket`.
- Stat cards show system-wide Open / In Progress / Resolved counts.
- `App.jsx` adds `/admin` route, `RoleRoute` redirects `administrator` role to
  `/admin`.

**Todo List**
1. Add `getAgents()` to a new `src/api/usersApi.js` file.
2. Create `src/pages/AdminDashboard.jsx`:
   a. Fetch all tickets + all agents on mount.
   b. Render stat cards (system-wide counts).
   c. Ticket list with `showSubmitter` and an agent assignment dropdown per row.
   d. Use `SplitPane` for ticket detail same as other dashboards.
3. Update `App.jsx`:
   a. Import `AdminDashboard`.
   b. Add `/admin` route.
   c. Update `RoleRoute` to handle `administrator` → `/admin`.
4. Update `AppShell` nav to show Admin nav items for `administrator` role.

**Relevant Context**
- `src/App.jsx` — routing
- `src/pages/AgentDashboard.jsx` — reference for same pattern
- `src/components/SplitPane.jsx` — reuse
- `improvements.md` items 1, 1.1

**Status** `[ ] pending`

---

### Sub-Task 5 — Restyle core components to navy-blue design

**Intent**
Apply the new design tokens to all shared components: badges, `TicketCard`,
`TicketDetailPanel`, `CommentSection`, `LoginPage`, and the filter bars. This
makes the whole app feel cohesive with the new navy palette.

**Expected Outcomes**
- `LoginPage`: navy logo icon background, navy "Sign In" button, card with
  slightly stronger shadow.
- `TicketCard`: selected state uses navy-light `#dbeafe` background and
  `#1e3a5f` left border; hover uses `#f0f6ff`.
- `TicketDetailPanel`: header area uses navy-tinted background `#f0f6ff`
  for the title bar section; action buttons use navy primary color.
- `CommentSection`: agent avatar uses navy `#1e3a5f`; "Post Comment" button
  uses navy.
- All badge components: keep semantic colors (green for resolved, red for
  critical, etc.) — these are already good.
- Filter bars: section labels and borders updated to match token colors.
- `SplitPane` divider color updated to match `--border` token.
- All primary CTA buttons across every page: background `#1e3a5f`, hover
  `#152d4a`.

**Todo List**
1. Update `LoginPage.jsx` — logo bg, button color.
2. Update `TicketCard.jsx` — selected/hover colors.
3. Update `TicketDetailPanel.jsx` — header tint, button colors, icon button
   colors.
4. Update `CommentSection.jsx` — agent avatar, submit button.
5. Update `AgentDashboard.jsx` + `EmployeeDashboard.jsx` filter bars —
   token colors for labels and borders.
6. Update `SplitPane.jsx` — divider color.
7. Update all `cardSt` / inline card styles to use `--border` token values.

**Relevant Context**
- All component files listed above
- `src/styles/tokens.js` (from Sub-Task 1)
- Reference screenshots for color feel

**Status** `[ ] pending`

---

### Sub-Task 6 — Submit Ticket page (extract from drawer)

**Intent**
The current "New Ticket" experience is a right-side drawer that blocks the
dashboard. For a more professional feel, create a dedicated `/submit` page that
uses the same form and AI classification panel but as a full page within the
shell — matching reference screenshot 4.

**Expected Outcomes**
- New page `src/pages/SubmitTicketPage.jsx` — same form fields as
  `NewTicketDrawer` (title, description, email, file upload) with the AI
  classification panel on the right side.
- Route `/submit` added to `App.jsx` (employee + admin role only).
- Employee sidebar "Submit Ticket" nav link goes to `/submit`.
- On successful submission, user is redirected to `/dashboard` with a success
  toast/banner.
- `NewTicketDrawer` in `EmployeeDashboard` is kept as-is for the quick-create
  button (users may prefer either flow).

**Todo List**
1. Create `src/pages/SubmitTicketPage.jsx` — extract form logic from
   `NewTicketDrawer`, wrap in `AppShell`, lay out form (left 2/3) +
   AI panel (right 1/3) side by side.
2. Add `/submit` route in `App.jsx` (ProtectedRoute, employee role).
3. Update `AppShell` employee nav to include "Submit Ticket" → `/submit`.
4. On submit success, navigate to `/dashboard` and pass a success flag via
   query param (`?submitted=1`) which `EmployeeDashboard` reads to show
   a success banner.

**Relevant Context**
- `src/pages/EmployeeDashboard.jsx` — `NewTicketDrawer` to extract from
- Reference screenshot 4 (Submit Ticket page layout)

**Status** `[ ] pending`

---

## Files Affected Summary

| File | Change Type |
|---|---|
| `src/styles/tokens.js` | **New** |
| `src/components/AppShell.jsx` | **New** |
| `src/components/StatCard.jsx` | **New** |
| `src/pages/AdminDashboard.jsx` | **New** |
| `src/pages/SubmitTicketPage.jsx` | **New** |
| `src/api/usersApi.js` | **New** |
| `src/api/ticketsApi.js` | Modified (add `assignTicket`) |
| `src/App.jsx` | Modified (new routes, admin role) |
| `src/components/AppHeader.jsx` | Retired (replaced by AppShell) |
| `src/components/TicketCard.jsx` | Modified (colors, assign button) |
| `src/components/TicketDetailPanel.jsx` | Modified (colors) |
| `src/components/CommentSection.jsx` | Modified (colors) |
| `src/components/SplitPane.jsx` | Modified (divider color) |
| `src/pages/LoginPage.jsx` | Modified (colors) |
| `src/pages/AgentDashboard.jsx` | Modified (stat cards, assign) |
| `src/pages/EmployeeDashboard.jsx` | Modified (welcome banner, stat cards) |
| `src/pages/TicketDetailPage.jsx` | Modified (AppShell swap) |

---

## Backend API Changes Required

These endpoints do not exist yet and must be added to the backend before
Sub-Tasks 3 and 4 can be fully tested:

| Endpoint | Purpose |
|---|---|
| `PUT /api/tickets/{id}/assign` | Assign ticket to a specific agent |
| `GET /api/users/agents` | Return list of all agent-role users |
| `GET /api/tickets` (admin variant) | Return ALL tickets regardless of agent role |

---

## Figma Prompt

Use the following prompt in Figma AI, Galileo AI, or any AI design tool to
generate the reference frames for this redesign:

---

> **Design a modern internal helpdesk web application called "ClassifAi".**
>
> **Brand & Color**
> - Primary: Navy blue `#1e3a5f` for sidebar, headers, and primary buttons
> - Accent: Deep blue `#2563eb` for active states, links, highlights
> - Canvas: Off-white `#f8fafc` page background
> - Cards: Pure white `#ffffff` with `#e2e8f0` borders and soft shadow
> - Typography: Inter or system-sans, 13-14px body, 600 weight for labels
>
> **Layout (Desktop 1280px)**
> - Persistent left sidebar, 240px wide, navy background
>   - Top: app logo (white headphones icon + "ClassifAi" wordmark)
>   - Middle: vertical nav list with icon + label per item, active item has
>     brighter navy bg and white text
>   - Bottom: user avatar circle (initials), full name, role badge, logout button
> - Top bar: white, 56px, sticky — page title left, search bar center,
>   notification bell + user avatar right
> - Content area: right of sidebar, padded 24px, off-white canvas
>
> **Screens to generate:**
>
> 1. **Employee Dashboard** — Welcome banner ("Welcome back, [Name]") with
>    "Submit New Ticket" CTA button. Below: 3 stat cards in a row (Open Tickets,
>    In Progress, Resolved) each showing a large number, label, and small icon.
>    Below: filter bar with Category / Status / Priority dropdowns and date range.
>    Below: ticket list rows each with ID, title, category badge, status badge,
>    priority badge, and date.
>
> 2. **Agent Queue Dashboard** — Same layout but with queue title (e.g.
>    "IT Hardware Queue"). Stat cards: Open / In Progress / Resolved. Ticket list
>    shows submitter name. Unassigned tickets show "Assign to me" pill button.
>    Right panel opens on ticket click (split-pane).
>
> 3. **Admin Dashboard** — All-tickets view. Stat cards for system-wide counts.
>    Ticket list with submitter + assignee columns. Each row has an "Assign to"
>    agent dropdown.
>
> 4. **Submit Ticket Page** — Full-page form (not a drawer). Left 2/3: Title
>    field, Description textarea, Email field, File upload drop zone. Right 1/3:
>    "AI Classification" panel showing auto-detected Category and Priority badges,
>    Watson/keyword source tag, detected keywords as chips.
>
> 5. **Ticket Detail (split-pane)** — Left column: scrollable ticket list.
>    Right column: detail panel with title + badges at top, Maximize/Close
>    buttons, description section, metadata sidebar (submitter, agent, dates),
>    attachments list with file type icons, comments thread with agent/user
>    avatars and timestamps, comment input box.
>
> 6. **Login Page** — Centered card on off-white bg. Navy headphones logo icon.
>    "ClassifAi" title. Username + Password fields. Navy "Sign In" button.
>
> **Component styles:**
> - Buttons: 6px border radius, 36px height, 600 weight
> - Inputs: 6px border radius, 36px height, focus ring in `#2563eb`
> - Cards: 8px border radius, `1px solid #e2e8f0`, `box-shadow: 0 1px 4px rgba(0,0,0,0.06)`
> - Badges: pill shape (border-radius 999px), 11px 600-weight text
>   - Open: blue | In Progress: purple | Resolved: green
>   - Critical: red | High: orange | Medium: amber | Low: green
>   - Hardware: blue | Software: violet | HR: emerald
> - Sidebar nav item active: `#152d4a` bg, white text, 3px left accent line in `#2563eb`
> - Stat card: white card, large number in navy, small icon top-right, label below

---

## Implementation Order

Sub-tasks are designed to be done sequentially — each one is independently
reviewable before the next starts:

```
1 → Shell & tokens (foundation for everything)
2 → Employee Dashboard (quickest visible win)
3 → Agent Dashboard (builds on stat cards from #2)
4 → Admin Dashboard (new role, new page)
5 → Component restyling (final polish pass)
6 → Submit Ticket page (UX improvement)
```
