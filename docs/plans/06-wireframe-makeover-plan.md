# Plan 06 — Full Wireframe Visual Makeover

## Overview

**Goal:** Redo the entire frontend UI to exactly match the wireframes in `docs/wireframes/stitch_multi_tenant_support_command_center/`. Every page and shared component must adopt the precise visual language documented in `docs/wireframes/stitch_multi_tenant_support_command_center/technical_support_enterprise/DESIGN.md`.

**Scope:** All React source files in `helpdesk-center-frontend/src/`. No backend changes. No functional logic changes — all API hooks, routing, auth, and state management remain identical.

**Design System to Enforce (from DESIGN.md + wireframes):**
- **Font:** Hanken Grotesk (body, labels, headlines) + JetBrains Mono (ticket IDs, technical metadata). Must be loaded via Google Fonts in `index.html`.
- **Color palette:** Slate-950 nav rail, `#f8f9ff` background (`background`), `#131b2e` primary container (nav), `#000000` primary, white surfaces.
- **Nav Rail:** 64px wide, `bg-primary-container` (`#131b2e`), `border-r border-outline-variant`. Active item: `border-l-4 border-white text-white bg-surface-variant/10`. Icon-only.
- **Top Header:** 48px height, `bg-surface`, `border-b border-outline-variant`. Left: app name + breadcrumb. Right: tenant badge + clock + bell + avatar.
- **Typography scale:** `label-caps` (11px/700/letter-spacing), `body-sm` (13px/400), `body-md` (14px/400), `title-md` (14px/600), `headline-sm` (18px/600), `display-sm` (24px/600/-0.02em tracking).
- **Structural geometry:** All major container/card/table elements → `rounded-none` (0px). Interactive elements (buttons, badges, inputs) → `rounded` (0.25rem) or `rounded-md` (0.375rem).
- **Status/Priority badges:** Low-opacity background + high-opacity text. Emerald=OPEN/LOW, Blue=IN_PROGRESS/MEDIUM, Amber=PENDING/HIGH, Red=CRITICAL.
- **Data tables:** `bg-slate-50/80` sticky headers, `border-b border-slate-100` rows, `hover:bg-slate-50` row hover.
- **SLA bars:** 4px/6px height, slate-100 bg, fill: emerald→amber→red based on urgency.
- **Buttons:** Primary = `bg-slate-900 text-white`. Secondary = `border-slate-200 bg-white`.
- **Inputs:** 32px-36px height, `border-slate-300`, `focus:border-blue-500` (no glow/ring).

**Wireframe → Page Mapping:**
| Wireframe | React Page/Component |
|---|---|
| `login_support_engine` | `LoginPage.jsx` |
| `my_tickets_support_engine` | `EmployeeDashboard.jsx` |
| `employee_ticket_detail_refined_layout` | `TicketDetailPage.jsx` + `TicketDetailPanel.jsx` |
| `agent_workspace_panel_actions_support_engine_1` | `AgentDashboard.jsx` |
| `admin_analytics_ai_tuning_support_engine` | `AnalyticsPanel.jsx` |
| `admin_sla_policy_integrations_support_engine` | `SlaConfigPanel.jsx` + `SettingsPage.jsx` |
| `admin_ticket_inspection_panel_support_engine` | `TriageQueue.jsx` |
| `department_manager_active_queue_table` | `AgentDashboard.jsx` (dept_manager role) |
| All authenticated screens | `AppShell.jsx` (nav rail + top bar) |

**Non-Goals:** No new features, no route changes, no API changes, no dark-mode support (wireframes are all light-mode). Lucide icons remain but Material Symbols icon names inform which Lucide icon to use contextually.

---

## Sub-Tasks

---

### Sub-Task 1 — Global CSS & Design Tokens Foundation

**Intent:** Set up the Google Fonts imports, CSS custom properties, and Tailwind-compatible utility patterns to make the wireframe design system available app-wide. This is the foundation every other sub-task depends on.

**Expected Outcomes:**
- `index.html` loads Hanken Grotesk and JetBrains Mono from Google Fonts.
- `src/index.css` defines wireframe color tokens as CSS variables and sets `body` to use Hanken Grotesk.
- `src/styles/tokens.js` is updated with the wireframe palette (primary-container `#131b2e`, surface `#f8f9ff`, on-surface `#0b1c30`, outline-variant `#c6c6cd`, etc.) replacing the current blue-navy palette.
- Custom scrollbar styles (4–6px, `#c6c6cd` thumb) added globally.

**Todo List:**
1. Add `<link>` tags for Hanken Grotesk and JetBrains Mono to `helpdesk-center-frontend/index.html`.
2. Rewrite `helpdesk-center-frontend/src/index.css` with new body font, CSS custom properties matching wireframe tokens, and scrollbar styles.
3. Update `helpdesk-center-frontend/src/styles/tokens.js` — replace navy palette with `primary-container: '#131b2e'`, `surface: '#f8f9ff'`, `on-surface: '#0b1c30'`, `outline-variant: '#c6c6cd'`, etc. Update `sidebarWidth: 64` (icon-only rail), `topBarHeight: 48`.

**Relevant Context:**
- `docs/wireframes/.../DESIGN.md` — complete token list
- `helpdesk-center-frontend/index.html`
- `helpdesk-center-frontend/src/index.css`
- `helpdesk-center-frontend/src/styles/tokens.js`

**Status:** [ ] pending

---

### Sub-Task 2 — AppShell: Nav Rail + Top Header

**Intent:** Rebuild `AppShell.jsx` to exactly match the wireframe shell — a 64px icon-only nav rail in `#131b2e` with active-state left-border indicators, and a 48px top header with Hanken Grotesk breadcrumbs, live clock chip, and avatar.

**Expected Outcomes:**
- Nav rail is 64px wide (never expands — no toggle button), `bg-[#131b2e]`, `border-r border-[#c6c6cd]`.
- Nav items: `w-full flex justify-center py-3`. Active: `border-l-4 border-white bg-white/10 text-white`. Inactive: `text-white/70 hover:text-white hover:bg-white/5`.
- Brand icon (terminal/headphone) at top of rail.
- User avatar + logout at bottom of rail.
- Top header: 48px, `bg-[#f8f9ff]`, `border-b border-[#c6c6cd]`. Left: `font-semibold text-[18px]` app name + `/` divider + breadcrumb chain. Right: tenant badge (rounded, blue), live clock chip (`bg-slate-100 px-2 py-0.5 rounded border`), bell icon, avatar.
- Remove `collapsed`/`onToggle` state entirely — always icon-only.
- Nav items use role-aware routing (same as current).

**Todo List:**
1. Remove all `collapsed` state and expansion logic from `AppShell.jsx`.
2. Rebuild `Sidebar` to match `agent_workspace_panel_actions_support_engine_1` aside panel exactly.
3. Rebuild `TopBar` to match wireframe header (48px, breadcrumb + right-side controls).
4. Update `AppShell` wrapper: `ml-[64px]`, `pt-[48px]` for content area.
5. Update `NAV` definitions to use Material-style icon names (mapped to Lucide equivalents).

**Relevant Context:**
- `docs/wireframes/.../agent_workspace_panel_actions_support_engine_1/code.html` — `<aside>` + `<header>` structure
- `helpdesk-center-frontend/src/components/AppShell.jsx`

**Status:** [ ] pending

---

### Sub-Task 3 — LoginPage

**Intent:** Rebuild `LoginPage.jsx` to exactly match the `login_support_engine` wireframe — a centered auth card with left accent bar, Hanken Grotesk display headline, 32px inputs, `bg-slate-900` submit button, and atmospheric dot-grid background.

**Expected Outcomes:**
- Full-screen `bg-slate-50` with dot-grid radial gradient background element.
- Centered card `max-w-[440px] bg-white border border-slate-200` with `rounded-none` and no border-radius.
- Vertical 4px left accent stripe: `absolute left-0 top-0 w-1 h-full bg-slate-900`.
- Brand header above card: icon in black square + `text-headline-sm font-bold uppercase` app name.
- Form fields: `h-8`, `border-slate-300`, `focus:border-blue-500` (no ring), `rounded-none`, `font-technical-md` for workspace ID field.
- Labels: `font-label-caps text-label-caps text-secondary uppercase`.
- Submit button: `w-full h-10 bg-slate-900 text-white uppercase tracking-wider` + arrow icon, loading spinner state.
- Existing `handleSubmit` / auth logic unchanged.

**Todo List:**
1. Rewrite `LoginPage.jsx` JSX to match wireframe structure exactly.
2. Preserve all existing state variables (`email`, `password`, `error`, `loading`).
3. Keep `useAuth()` + `useNavigate()` logic identical.

**Relevant Context:**
- `docs/wireframes/.../login_support_engine/code.html`
- `helpdesk-center-frontend/src/pages/LoginPage.jsx`

**Status:** [ ] pending

---

### Sub-Task 4 — Badge & Status Components

**Intent:** Rebuild `StatusBadge`, `PriorityBadge`, and `CategoryBadge` to use the wireframe's badge style — `rounded-md`, all-caps, `text-[10px] font-bold`, low-opacity background + high-opacity text, with `border`.

**Expected Outcomes:**
- `StatusBadge`: OPEN=emerald, IN_PROGRESS=blue, PENDING_EMPLOYEE=amber, RESOLVED=slate-outlined, CLOSED=neutral-outlined. All `rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border`.
- `PriorityBadge`: CRITICAL=red, HIGH=emerald (green), MEDIUM=amber, LOW=slate. Same class structure.
- `CategoryBadge`: department name styled as a slate/gray `rounded-md` tag.
- `SlaProgressBar`: 4px height (`h-1`), `bg-slate-100`, fill color emerald→amber→red. Inline percentage remaining label.

**Todo List:**
1. Rewrite `StatusBadge.jsx` with new color/style mapping.
2. Rewrite `PriorityBadge.jsx` with new color/style mapping.
3. Update `CategoryBadge.jsx` to match wireframe tag style.
4. Update `SlaProgressBar.jsx` to 4px height with correct color transitions.

**Relevant Context:**
- `docs/wireframes/.../agent_workspace_panel_actions_support_engine_1/code.html` — badge examples in ticket list
- `helpdesk-center-frontend/src/components/StatusBadge.jsx`
- `helpdesk-center-frontend/src/components/PriorityBadge.jsx`
- `helpdesk-center-frontend/src/components/SlaProgressBar.jsx`

**Status:** [ ] pending

---

### Sub-Task 5 — TicketCard Component

**Intent:** Rebuild `TicketCard.jsx` to match the wireframe's ticket list items — ticket ID in JetBrains Mono badge, title in `title-md`, priority badge top-right, submitter + relative time bottom row, and 4px left-border active indicator.

**Expected Outcomes:**
- Each card: `p-4 border-b border-slate-100` with `border-l-4` active indicator.
- Active: `bg-slate-50 border-l-blue-500`. Inactive: `hover:bg-slate-50 border-l-transparent`.
- Top row: `font-technical-md text-[13px]` ticket ID in slate-200/50 bg pill + priority badge (right-aligned).
- Middle: `font-title-md text-title-md` title, `truncate`.
- Bottom: avatar circle + submitter name + relative timestamp.
- SLA bar below bottom row when `dueAt` is present (4px, like wireframe).

**Todo List:**
1. Rewrite `TicketCard.jsx` JSX to match `agent_workspace_panel_actions_support_engine_1` card structure.
2. Keep all existing click/select logic unchanged.
3. Keep `showClaim`, `onClaim`, `showSubmitter` props working.

**Relevant Context:**
- `docs/wireframes/.../agent_workspace_panel_actions_support_engine_1/code.html` — ticket card section (Pane 1)
- `helpdesk-center-frontend/src/components/TicketCard.jsx`

**Status:** [ ] pending

---

### Sub-Task 6 — EmployeeDashboard

**Intent:** Rebuild `EmployeeDashboard.jsx` to match the `my_tickets_support_engine` wireframe — a wide sidebar navigation (replaced by AppShell rail), ticket submission form at top, personal grid table below.

**Expected Outcomes:**
- Ticket submission form section: `bg-white border border-slate-200/80 p-6` card, watsonx AI badge, request title input + markdown description textarea + department select + attachment dropzone in 2/3 + 1/3 grid.
- "The Employee Personal Grid" section: `bg-white border border-slate-200/80` table with columns: ID, TITLE, DEPARTMENT, DATE CREATED, STATUS. No stat cards above when a ticket is selected.
- Status badges in table: `rounded-md` inline-flex with uppercase text.
- `open_in_new` action button appears on row hover.
- Pagination footer: "Showing X of Y tickets" + prev/next chevron buttons.
- `NewTicketDrawer` styling updated to match the form layout in the wireframe (labels as `font-label-caps uppercase`, inputs `rounded-none h-9`, submit as `bg-slate-950 text-white`).
- AI classification preview panel uses dark-on-light scheme with watsonx badge.
- Stat cards remain but styled with wireframe metric cells (borderless, flex-divide layout) instead of current colored icon cards.

**Todo List:**
1. Rebuild the stat card row to use wireframe metric cell style.
2. Rebuild the welcome banner to remove blue-900 background; use wireframe breadcrumb-style header.
3. Rebuild the ticket list section as a `<table>` matching wireframe columns.
4. Update `NewTicketDrawer` inputs, labels, and buttons to wireframe style.
5. Keep all filter state, AI preview, and submit logic unchanged.

**Relevant Context:**
- `docs/wireframes/.../my_tickets_support_engine/code.html`
- `helpdesk-center-frontend/src/pages/EmployeeDashboard.jsx`

**Status:** [ ] pending

---

### Sub-Task 7 — AgentDashboard (Three-Pane Layout)

**Intent:** Rebuild `AgentDashboard.jsx` to match the `agent_workspace_panel_actions_support_engine_1` wireframe — three panes: a 380px ticket list pane with search + tab switcher, and a fluid detail pane, with a 280px right context pane inside the detail view.

**Expected Outcomes:**
- Left pane (ticket list): `w-[380px] border-r border-[#c6c6cd] bg-white flex flex-col`. Search bar at top. Tab row (My Queue / Dept Pool / Archive) in `bg-slate-50/80`. Ticket count label + filter icon.
- Right pane wraps `TicketDetailPanel` with the three-pane structure.
- Stat cards above only when no ticket is selected, styled as wireframe metric cells.
- Tab bar rebuilt to wireframe tab style (small rounded tabs inside a row).

**Todo List:**
1. Rebuild `AgentDashboard.jsx` layout to three-pane structure using `SplitPane`.
2. Update the ticket list pane width and styling to wireframe spec.
3. Rebuild the tab switcher to match wireframe.
4. Keep all queue hooks (`useMyQueue`, `usePool`, `useArchive`) and state logic unchanged.

**Relevant Context:**
- `docs/wireframes/.../agent_workspace_panel_actions_support_engine_1/code.html` — Pane 1 (section.w-[380px])
- `helpdesk-center-frontend/src/pages/AgentDashboard.jsx`
- `helpdesk-center-frontend/src/components/SplitPane.jsx`
- `helpdesk-center-frontend/src/components/TabBar.jsx`

**Status:** [ ] pending

---

### Sub-Task 8 — TicketDetailPanel

**Intent:** Rebuild `TicketDetailPanel.jsx` to match the `employee_ticket_detail_refined_layout` wireframe — three columns: ticket header with SLA bar at top, threaded conversation in the middle, and metadata/attachment/activity right sidebar.

**Expected Outcomes:**
- Header section: ticket ID + `/` + title in `text-3xl font-black`, status + priority badges row, SLA timeline bar (`h-1.5 w-full bg-surface-container`).
- Main conversation: initial report in white collapsible card, agent messages (right-aligned, `bg-slate-950 text-white`), employee messages (left-aligned, `bg-slate-50 border`), status-change system pills.
- Rich text reply input: `bg-slate-50/50 border-t` footer with toolbar (bold/italic/link/attach) + `textarea` + send button `bg-slate-950`.
- Right sidebar (280px): PRIMARY ACTIONS (`Re-Route` + `Mark Resolved`), CUSTOMER INSIGHTS, TICKET METADATA (assigned agent select, department, tags), RECENT ACTIVITY timeline.
- Agent status update control: `select` (rounded-none) + `Save` button (rounded).
- Attachment section: file cards with type icon, filename, size.

**Todo List:**
1. Rebuild `TicketDetailPanel.jsx` layout to match wireframe three-column structure.
2. Update header, SLA bar, action buttons to wireframe style.
3. Update `CommentSection` to use wireframe chat bubble styles.
4. Update right metadata sidebar panels to wireframe label-caps + body-sm style.
5. Keep all existing API hooks, `updateStatus`, `getAttachments`, `onReroute` logic unchanged.

**Relevant Context:**
- `docs/wireframes/.../employee_ticket_detail_refined_layout/code.html`
- `docs/wireframes/.../agent_workspace_panel_actions_support_engine_2/code.html`
- `helpdesk-center-frontend/src/components/TicketDetailPanel.jsx`
- `helpdesk-center-frontend/src/components/CommentSection.jsx`

**Status:** [ ] pending

---

### Sub-Task 9 — AdminDashboard, AnalyticsPanel, SlaConfigPanel, TriageQueue

**Intent:** Rebuild the admin views to match the `admin_analytics_ai_tuning_support_engine`, `admin_sla_policy_integrations_support_engine`, and `admin_ticket_inspection_panel_support_engine` wireframes.

**Expected Outcomes:**
- `AdminDashboard.jsx`: Tab bar updated to wireframe style. Overview tab shows wireframe stat metric row + ticket table.
- `AnalyticsPanel.jsx`: Executive metric matrix (flex/divide sections) with FRT, MTTR, AI Accuracy gauge. Retrospective analysis table with success-rate mini progress bars. System Integrity dark card. Recent Critical Events feed. IBM watsonx Model Optimization panel with `PIPELINE_STABLE_V2` tag.
- `SlaConfigPanel.jsx`: Table rows for LOW/MEDIUM/HIGH/CRITICAL with colored dot + description + number input + Update button. Messaging rails section (Slack webhook, company name). Summary stat widgets at bottom.
- `TriageQueue.jsx`: Full-width table (TICKET ID, SUBJECT, CLIENT, STATUS, URGENCY), side-drawer detail panel with AI Triage Analytics Log, confidence warning card, Administrative Overrides (dept + assignee selects + APPLY OVERRIDE button).
- `SettingsPage.jsx`: Updated form inputs, labels, and buttons to wireframe style.

**Todo List:**
1. Rebuild `AnalyticsPanel.jsx` to match the analytics wireframe metric layout and table.
2. Rebuild `SlaConfigPanel.jsx` to match the SLA config wireframe table + messaging section.
3. Rebuild `TriageQueue.jsx` to match admin ticket inspection wireframe (table + drawer).
4. Update `AdminDashboard.jsx` tab bar + stat cards styling.
5. Update `SettingsPage.jsx` inputs, buttons, labels to wireframe style.

**Relevant Context:**
- `docs/wireframes/.../admin_analytics_ai_tuning_support_engine/code.html`
- `docs/wireframes/.../admin_sla_policy_integrations_support_engine/code.html`
- `docs/wireframes/.../admin_ticket_inspection_panel_support_engine/code.html`
- `helpdesk-center-frontend/src/components/AnalyticsPanel.jsx`
- `helpdesk-center-frontend/src/components/SlaConfigPanel.jsx`
- `helpdesk-center-frontend/src/components/TriageQueue.jsx`
- `helpdesk-center-frontend/src/pages/AdminDashboard.jsx`
- `helpdesk-center-frontend/src/pages/SettingsPage.jsx`

**Status:** [ ] pending

---

## Implementation Notes

- All sub-tasks are independent style rewrites. Each should be completed in sequence since later tasks depend on Sub-Task 1 tokens and Sub-Task 2 AppShell being in place.
- Functional behavior (API calls, routing, auth, state management) must NOT change during any sub-task.
- The Tailwind v4 setup does NOT have a `tailwind.config.js` — custom colors must be declared using CSS variables in `index.css` and used via inline styles or Tailwind arbitrary value syntax (`bg-[#131b2e]`) where needed. Alternatively, use a `@theme` block.
- Lucide React is the icon library; Material Symbols icon names in wireframes should be mapped to semantically equivalent Lucide icons.
- After all sub-tasks are complete, run `npm run build` in `helpdesk-center-frontend/` to confirm no compilation errors.
