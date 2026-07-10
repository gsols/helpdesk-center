# Ticket Detail UI Remake — Plan

## Overview

Remake the ticket detail view to match the provided design reference. The design shows a dark left sidebar ("My Tickets") with a searchable ticket list, a wide center content panel with ticket header + SLA bar + threaded conversation + reply editor, and a right metadata sidebar.

The key behavioral requirements are:

1. **Clicking a ticket anywhere** (dashboard, sidebar) navigates to `/tickets/:id` — this already works.
2. **Clicking the "Tickets" nav item** in AppShell routes to a dedicated `/tickets` page that auto-selects the first ticket for **all roles**.
3. **The `/tickets/:id` route** remains the canonical ticket detail URL with the dark "My Tickets" left sidebar + center content + right metadata sidebar.

### Confirmed Implementation Details

- **Ticket ID format**: The backend returns plain `Long id` (e.g., `42`). The `TK-` prefix does NOT come from the API. All UI display must format as `TK-${ticket.id}` — the `#` symbol is only a visual prefix in headings (e.g. `#TK-42`). Sidebar list uses `#TK-{id}`.
- **Ticket reporter field**: The backend entity uses `creator` (not `reporter`). In the JSON response the field is `creator`. The current `TicketDetailPanel` references `ticket.reporter` and `ticket.reporterId` which may be wrong — use `ticket.creator?.name` and `ticket.creator?.id` instead.
- **Ticket description**: Ticket entity has a `description` field (type TEXT). The "Initial Report" card in the design is the ticket's `description`, displayed as a special pinned card at the top of the conversation thread — NOT a comment. It is rendered separately from `CommentSection`.
- **CommentSection**: Messages come from `GET /api/comments/{ticketId}` (via `useMessages`). Each message has `sender` (User object with `role`), `body`, `createdAt`. Agent = `sender.role !== 'EMPLOYEE'`; Employee = `sender.role === 'EMPLOYEE'`.
- **SlaProgressBar**: Currently only shows remaining time label on the left with no left-side static label. Needs a two-label layout: "RESOLUTION SLA (STANDARD 4H)" left + colored remaining time right.

---

## Sub-Tasks

---

### Sub-Task 1 — Add `/tickets` index route + update nav for all roles

**Intent**
Currently the "Tickets" nav item in AppShell points to `/dashboard` for employees and `/agent` for agents. The design requires clicking "Tickets" to open the ticket detail view with the first ticket pre-selected, for all roles.

**Expected Outcomes**
- Clicking "Tickets" in the sidebar navigates to `/tickets`.
- `/tickets` fetches the user's tickets, sorts by `createdAt` descending, and redirects to `/tickets/{firstTicketId}`.
- If no tickets exist, renders an empty state using `AppShell` + `MyTicketsSidebar` (sidebar shows "No tickets found").
- `/tickets/:id` continues to work unchanged for direct or dashboard-originated navigation.
- The "Tickets" nav item is highlighted (active) when on `/tickets` or any `/tickets/:id` URL.

**Todo List**
1. Create `helpdesk-center-frontend/src/pages/TicketsIndexPage.jsx`:
   - Import `useTickets`, `useNavigate`, `Navigate` from react-router-dom.
   - Call `useTickets()`. While loading show a loading state inside `AppShell`.
   - Once loaded: if tickets exist, `<Navigate to={"/tickets/" + firstTicket.id} replace />`.
   - If no tickets, render `AppShell` + `MyTicketsSidebar` (collapsed=false) + empty state message.
2. In `App.jsx`, add route `{ path: 'tickets', element: <TicketsIndexPage /> }` as a child of the protected `AuthGuard` route, above the existing `tickets/:id` entry.
3. In `AppShell.jsx` NAV object:
   - Employee `Tickets` entry: change `to` from `/dashboard` to `/tickets`.
   - Agent `Tickets` entry: change `to` from `/agent` to `/tickets`.
   - Manager: add a `Tickets` entry pointing to `/tickets` (currently has no Tickets item).
   - Admin: the `Triage` item already exists — add a `Tickets` entry pointing to `/tickets` if desired, or leave admin as-is (admin uses triage view).

**Relevant Context**
- `helpdesk-center-frontend/src/App.jsx` lines 44–70 — router config
- `helpdesk-center-frontend/src/components/AppShell.jsx` lines 26–52 — NAV object
- `helpdesk-center-frontend/src/hooks/useTickets.js` — `useTickets()` hook
- `helpdesk-center-frontend/src/pages/TicketsIndexPage.jsx` — new file to create

**Status** — `[ ] pending`

---

### Sub-Task 2 — Restyle `MyTicketsSidebar` to match design reference

**Intent**
The sidebar's ticket cards need the `TK-` prefix on the ID and verified status badge colors. Structure is already correct.

**Expected Outcomes**
- Ticket ID displays as `#TK-{id}` in JetBrains Mono font (currently just `#{t.id}`).
- Status badge colors match the reference: IN_PROGRESS → light blue bg (`#d3e4fe`) + dark text (`#0b1c30`); RESOLVED/CLOSED → dark gray (`#5c5f61`) + white; PENDING_EMPLOYEE → amber (`#f59e0b`) + white; OPEN → dark (`#1e293b`) + white.
- Active ticket row has white `4px` left border + `rgba(255,255,255,0.10)` background (already correct, just verify).
- Sidebar header shows "MY TICKETS" label with the collapse chevron on the right.

**Todo List**
1. In `MyTicketsSidebar.jsx` ticket row, change `#{t.id}` to `#TK-{t.id}` in the ID span.
2. Verify `TicketStatusBadge` status color mapping handles `IN_PROGRESS` (API returns `IN_PROGRESS` enum string), `RESOLVED`, `PENDING_EMPLOYEE` (API enum), `OPEN`, `CLOSED`.
3. Update `TicketStatusBadge` label for `PENDING_EMPLOYEE` to display `PENDING` (already done), confirm `IN_PROGRESS` → `IN PROGRESS`.
4. No structural changes needed — the 300px/0px collapse and header layout are already correct.

**Relevant Context**
- `helpdesk-center-frontend/src/components/MyTicketsSidebar.jsx` — full file, 171 lines
- Backend enum values: `OPEN`, `IN_PROGRESS`, `PENDING_EMPLOYEE`, `RESOLVED`, `CLOSED` (from `TicketStatus.java`)

**Status** — `[ ] pending`

---

### Sub-Task 3 — Restyle `TicketDetailPanel` header + SLA bar

**Intent**
The center column header must show `#TK-{id}` in large monospace bold, then `/` divider, then the ticket title. The SLA bar must show the static label on the left and colored remaining time on the right. Fix the `reporter` → `creator` field mapping in the metadata section.

**Expected Outcomes**
- Header: `#TK-{id}` in JetBrains Mono 28px 900-weight, `/` divider (light color), then ticket title 22px 900-weight.
- Status + Priority badges right-aligned in the header row.
- SLA bar row: "RESOLUTION SLA (STANDARD 4H)" label left-aligned in uppercase tiny text; colored remaining time (red if < 1h, amber if < 2h) right-aligned.
- Metadata section: "Reporter" row uses `ticket.creator?.name` and `ticket.creator?.id` (not `ticket.reporter`).

**Todo List**
1. In `TicketDetailPanel.jsx` header section, update ID display from `#{ticket.id}` to `#TK-{ticket.id}`.
2. Wrap the SLA bar in a 2-label row: left label "Resolution SLA (Standard 4h)" + right label showing remaining time (extract the remaining time computation from `SlaProgressBar` or add a helper). Keep using the existing `SlaProgressBar` component below the label row.
3. Fix the metadata `Reporter` row: change `ticket.reporter?.name` → `ticket.creator?.name` and `ticket.reporterId` → `ticket.creator?.id`.
4. Update `PriorityBadge` for HIGH: change from emerald to a red/pink style to match the design reference (HIGH = red-tinted, `bg-red-50 text-red-700 border-red-200` with a `⚑ HIGH PRIORITY` label). The design shows HIGH PRIORITY as a red badge with a priority icon.

**Relevant Context**
- `helpdesk-center-frontend/src/components/TicketDetailPanel.jsx` — lines 70–115 (header), lines 157–175 (metadata)
- `helpdesk-center-frontend/src/components/SlaProgressBar.jsx` — currently only shows remaining time on the left, no static label
- `helpdesk-center-frontend/src/components/PriorityBadge.jsx` — HIGH currently shows emerald (green), design shows red

**Status** — `[ ] pending`

---

### Sub-Task 4 — Restyle `CommentSection` with Initial Report card + conversation bubbles

**Intent**
The design shows a distinct "INITIAL REPORT" pinned card at the top of the conversation thread containing the ticket's `description`. Below it are system event pills (e.g., "AGENT ASSIGNED TO TICKET"), then left-aligned agent message bubbles, then right-aligned employee message bubbles. The reply editor has a toolbar with Bold, Italic, Link, Attachment, List, Code buttons and a "SEND REPLY" all-caps button.

The "Initial Report" card is NOT a comment — it is the ticket's `description` field, pinned at the top.

**Expected Outcomes**
- Top of conversation: a bordered white card with "INITIAL REPORT" label (small, uppercase, gray) and timestamp (`ticket.createdAt`), then the `ticket.description` text.
- System event pills: centered rounded-full pills in light gray bg with uppercase tiny text for status/assignment events (currently mocked; can remain mocked).
- Agent messages: left-aligned, light blue-gray bg (`#dce9ff` / `surface-container-highest`), with agent name + verified icon + timestamp above the bubble.
- Employee/reporter messages: right-aligned, dark bg (`#0b1c30` / `primary`), white text, with timestamp + name above.
- Reply toolbar: Bold (B), Italic (I), Link (🔗), Attachment (📎), List (≡), Code (`<>`) buttons with a divider.
- "SEND REPLY" button: all-caps, dark bg (`#0b1c30`), white text, right-aligned.
- Remove the "Internal Note" checkbox (not in the design reference).

**Todo List**
1. `CommentSection.jsx` now needs the `ticket` prop passed in — it already receives `ticket` from `TicketDetailPanel` (line 118: `<CommentSection ticketId={ticketId} ticket={ticket} />`). Confirm the prop is being passed.
2. Add the "Initial Report" card at the top of the messages area using `ticket.description` and `ticket.createdAt`. Style it as shown in the design: white bordered card, "INITIAL REPORT" header label, timestamp, body text.
3. Add a separator line + "CONVERSATION" sub-label between the initial report and the comment messages.
4. Restyle agent messages: left-aligned (not right-aligned as they are today — **NOTE: the current code has agent=right, employee=left which is backwards from the design**). Design has: agent messages on the LEFT with light bg, employee/reporter messages on the RIGHT with dark bg.
5. Restyle employee messages: right-aligned, dark background (`#0b1c30`), white text.
6. Update reply toolbar to add List (`AlignLeft` or `List`) and Code icons. Remove "Internal Note" checkbox. Change button label to "SEND REPLY" (all caps, already says "Send Reply" — make it uppercase styled).
7. Add a mocked "AGENT ALPHA ASSIGNED TO TICKET" system event pill between the initial report and first message as a centered pill (can remain hardcoded/mocked for now since there's no API for audit events).

**Relevant Context**
- `helpdesk-center-frontend/src/components/CommentSection.jsx` — full file, 167 lines
- `helpdesk-center-frontend/src/components/TicketDetailPanel.jsx` line 118 — `<CommentSection ticketId={ticketId} ticket={ticket} />` (ticket prop already passed)
- `helpdesk-center-frontend/src/hooks/useMessages.js` — `useMessages(ticketId)` returns `{ sender: { name, role }, body, createdAt }`
- The design shows agent messages LEFT + employee messages RIGHT (current code is reversed — must be swapped)

**Status** — `[ ] pending`

---

### Sub-Task 5 — Verify AppShell active-state detection for `/tickets` routes

**Intent**
After Sub-Task 1, the "Tickets" nav item must highlight correctly on `/tickets` and `/tickets/:id`. The current active detection at [`AppShell.jsx` line 158](helpdesk-center-frontend/src/components/AppShell.jsx:158) is: `pathname === item.to || pathname.startsWith(item.to + '/')`. With `item.to = '/tickets'`, this will match `/tickets` and `/tickets/42` correctly.

**Expected Outcomes**
- "Tickets" nav item shows green left border + white text when on any `/tickets` or `/tickets/:id` path.
- "Dashboard" is NOT active when on a tickets route.
- No code changes required if the logic at line 158 already works correctly.

**Todo List**
1. After Sub-Task 1 is complete, verify in the browser.
2. If false positives occur (e.g., dashboard also highlighting), check if any other nav item's `to` path is a prefix of `/tickets` — it won't be, so no fix should be needed.

**Relevant Context**
- `helpdesk-center-frontend/src/components/AppShell.jsx` line 158

**Status** — `[ ] pending`

---

## Implementation Notes

- The `TK-` prefix is UI-only. Never send `TK-{id}` to the API; always use the raw numeric `id` in API calls.
- Agent messages go LEFT (light bg), employee/reporter messages go RIGHT (dark bg) — this is the **opposite** of the current `CommentSection` implementation. This is a critical fix in Sub-Task 4.
- The "Initial Report" card uses `ticket.description` (not from the comments API) — it must be rendered inside `CommentSection` using the `ticket` prop that is already being passed from `TicketDetailPanel`.
- `SlaProgressBar` currently shows the remaining time label on one side only. The design needs a two-label header row above the bar — implement the dual-label row directly in `TicketDetailPanel` and let `SlaProgressBar` stay as just the bar track.
- Sub-Tasks 1 and 5 should be done together.
- Sub-Tasks 2, 3, and 4 are independent and can be done in any order.
