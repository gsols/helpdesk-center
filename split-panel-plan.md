# Split-Panel Ticket Detail View

## Overview

When a user clicks a ticket card on the Agent or Employee Dashboard, the detail
panel opens on the **right side** of the page while the scrollable ticket list
remains visible on the **left**. A **Maximize** button in the panel expands it to
full-screen; a **Minimize** button returns to the split view. Navigating away or
closing the panel restores the single-column list view.

**Confirmed decisions:**
- The URL updates to `?ticket=<id>` when a panel is opened (bookmarkable/shareable).
- Creating a new ticket does **not** auto-open it in the panel.
- On mobile (< 768 px), clicking a ticket navigates to the full-page `/tickets/:id`
  route (current behaviour) instead of a panel — no overlay needed.

The existing `/tickets/:id` full-page route is untouched and continues to work for
direct URL access and mobile navigation.

---

## Sub-Tasks

---

### Sub-Task 1 — Extract `TicketDetailPanel` component

**Intent**  
The detail content currently lives entirely in `TicketDetailPage`. To reuse it
inside both dashboards, we need to pull the inner content into a separate
`TicketDetailPanel` component that accepts `ticketId` as a prop instead of reading
from the URL, and accepts an `onClose` / `onMaximize` / `onMinimize` callback prop
for the panel header buttons.

**Expected Outcomes**
- New file: `helpdesk-center-frontend/src/components/TicketDetailPanel.jsx`
- The component renders all current detail content: header card, description +
  metadata, attachments (with file viewer), comments, and the agent status-change
  control.
- `TicketDetailPage` is updated to render `<TicketDetailPanel ticketId={id} />` so
  the full-page route still works identically.

**Todo List**
1. Create `TicketDetailPanel.jsx` — copy the inner JSX and state from
   `TicketDetailPage` (everything inside `<main>`), replacing `useParams` with a
   `ticketId` prop.
2. Add optional props: `onClose` (renders a close ✕ button in the panel header
   when provided), `onMaximize` (renders a ⛶ button), `onMinimize` (renders a ⤢
   button) — only render the button when the prop is provided.
3. Refactor `TicketDetailPage` to import and render `<TicketDetailPanel
   ticketId={id} />` without changing any existing route or navigation behavior.

**Relevant Context**
- Source: `helpdesk-center-frontend/src/pages/TicketDetailPage.jsx` — lines 26–328
- `FileViewer` modal is also in that file; keep it co-located with `TicketDetailPanel`.
- Imports needed: same as current `TicketDetailPage` minus `useParams` / `useNavigate`.

**Status** `[x] done`

---

### Sub-Task 2 — Update `TicketCard` to support an `onSelect` callback

**Intent**  
`TicketCard` currently always calls `navigate('/tickets/:id')` on click. When used
inside a split-panel dashboard, clicking should call an `onSelect(ticket)` callback
instead. The card should also visually indicate the "active/selected" state.

**Expected Outcomes**
- `TicketCard` accepts an optional `onSelect` prop and an optional `isSelected`
  prop.
- When `onSelect` is provided, clicking calls `onSelect(ticket)` instead of
  navigating.
- When `isSelected` is true, the card shows a persistent left-border highlight
  (same blue `#3b82d4` as the hover state) so the user knows which ticket is open.
- When neither prop is provided, behavior is unchanged (backward compatible).

**Relevant Context**
- Source: `helpdesk-center-frontend/src/components/TicketCard.jsx`
- Current hover: `borderLeft: 3px solid #3b82d4`, `background: #f0f6ff`

**Status** `[x] done`

---

### Sub-Task 3 — Add split-panel layout to `AgentDashboard`

**Intent**  
Convert `AgentDashboard` from a single-column list page to a two-column split view
when a ticket is selected: left side = ticket list, right side = `TicketDetailPanel`
with maximize/minimize support.

**Expected Outcomes**
- No ticket selected → layout is identical to today (single column).
- Ticket selected → layout switches to side-by-side: left panel (toolbar + filters
  + scrollable list, ~40% width), right panel (TicketDetailPanel, ~60% width,
  independently scrollable).
- Selected ticket card is highlighted in the list (via `isSelected` prop).
- Panel header shows: ticket title/ID, a **⛶ Maximize** button, and a **✕ Close**
  button.
- Clicking Maximize expands the right panel to cover the full content area (hides
  the list); a **⤢ Minimize** button appears to restore the split.
- Clicking Close collapses the panel back to single-column view.
- The URL updates to `/agent?ticket=<id>` when a ticket is selected so the state
  is bookmarkable (restores panel on load if the query param is present).

**Todo List**
1. Add `selectedTicketId` state (default `null`).
2. On mount, read `?ticket=<id>` from the URL query string and pre-populate
   `selectedTicketId` if present.
3. Add `maximized` boolean state (default `false`).
4. Change the `<main>` wrapper to use a CSS flex-row layout when `selectedTicketId`
   is set.
5. Wrap the existing toolbar + filter bar + ticket list in a left-column `<div>`.
   When not maximized and a ticket is selected, give it `flex: 0 0 40%` with
   `overflow-y: auto`.
6. When `selectedTicketId` is set and not maximized, render `<TicketDetailPanel>`
   in a right-column `<div>` (`flex: 1`, `overflow-y: auto`) with the panel
   borders/card styling.
7. When maximized, hide the left column and give the panel `flex: 1 1 100%`.
8. Pass `onSelect` to each `<TicketCard>` and `isSelected` based on the current
   `selectedTicketId`.
9. Update the URL query string via `useSearchParams` when a ticket is selected /
   closed.

**Relevant Context**
- Source: `helpdesk-center-frontend/src/pages/AgentDashboard.jsx`
- Panel maximize/minimize icons: use `Maximize2` / `Minimize2` from lucide-react.
- The left column height should be `calc(100vh - <header height>)` so both
  columns scroll independently.

**Status** `[x] done`

---

### Sub-Task 4 — Add split-panel layout to `EmployeeDashboard`

**Intent**  
Apply the same split-panel behavior to `EmployeeDashboard`, with the same URL
query-param approach (`/dashboard?ticket=<id>`).

**Expected Outcomes**
- Identical behavior to Sub-Task 3 but for the employee dashboard.
- The "New Ticket" drawer still works and renders on top of the split layout as
  before (no change to the drawer).
- URL uses `/dashboard?ticket=<id>`.

**Todo List**
1. Follow the same steps as Sub-Task 3, adapted for `EmployeeDashboard`.
2. Ensure `showForm` (drawer) still toggles independently of `selectedTicketId`.
3. When a new ticket is created (`handleCreated`), auto-select the new ticket in
   the panel and close the drawer.

**Relevant Context**
- Source: `helpdesk-center-frontend/src/pages/EmployeeDashboard.jsx`
- The "New Ticket" button and `NewTicketDrawer` must remain intact.

**Status** `[x] done`

---

### Sub-Task 5 — Responsive behavior

**Intent**
On narrow viewports (< 768 px) the split layout cannot render two columns. On
mobile, clicking a ticket card navigates to the existing full-page `/tickets/:id`
route (the current behaviour). No panel or overlay is shown on mobile.

**Expected Outcomes**
- On screens narrower than 768 px, `onSelect` is NOT passed to `TicketCard` — the
  card falls back to its default `navigate('/tickets/:id')` behaviour.
- The split-panel layout divs are hidden via a media query so no layout remnants
  appear on small screens.
- No new mobile-specific UI to build; the existing `TicketDetailPage` covers mobile.

**Todo List**
1. In both dashboards, detect viewport width (via a CSS media query or a simple
   `window.innerWidth` check on render) and conditionally pass `onSelect` to
   `TicketCard` only when width ≥ 768 px.
2. Add a media query `@media (max-width: 767px)` that hides the right detail panel
   div and restores the left column to full width.

**Relevant Context**
- `TicketCard` falls back to `navigate` when `onSelect` is not provided — no extra
  logic needed there (handled in Sub-Task 2).
- Existing responsive style tag in `TicketDetailPage` for reference.

**Status** `[x] done`

---

## Files Affected

| File | Change |
|---|---|
| `src/components/TicketDetailPanel.jsx` | **New** — extracted detail content |
| `src/pages/TicketDetailPage.jsx` | Refactored to wrap `TicketDetailPanel` |
| `src/components/TicketCard.jsx` | Add `onSelect` + `isSelected` props |
| `src/pages/AgentDashboard.jsx` | Split-panel layout + state |
| `src/pages/EmployeeDashboard.jsx` | Split-panel layout + state |
