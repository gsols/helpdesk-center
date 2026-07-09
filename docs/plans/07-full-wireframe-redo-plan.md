# Plan 07 — Full Wireframe Redo (Complete UI Replacement)

## Top-Level Overview

**Goal:** Replace the entire frontend UI implementation with pixel-accurate reproductions of all 13 wireframes in `docs/wireframes/stitch_multi_tenant_support_command_center/`. Every page must adopt the exact layout, color tokens, typography, component patterns, and visual language shown in the `screen.png` references alongside each `code.html`.

**Scope:**
- All existing pages and shared components are rewritten to match their wireframe counterparts exactly
- Three net-new pages are created for the Department Manager role (`dept_manager`)
- No changes to API hooks, routing logic, auth context, or backend integration
- No dark mode — wireframes are light-mode only
- **The sidebar is collapsible** — expanded (260px, labeled) ↔ collapsed (64px, icons-only), persisted to localStorage, toggled by a chevron/hamburger button
- Build must pass `npm run build` with zero errors after every sub-task

**Wireframe → Page Mapping:**

| Wireframe | React File |
|---|---|
| `login_support_engine` | `LoginPage.jsx` |
| `my_tickets_support_engine` + `my_tickets_ai_triage_breakdown` | `EmployeeDashboard.jsx` |
| `employee_ticket_detail_refined_layout` | `TicketDetailPage.jsx` + `TicketDetailPanel.jsx` |
| `agent_workspace_panel_actions_1` + `_2` | `AgentDashboard.jsx` |
| `admin_analytics_ai_tuning` | `AnalyticsPanel.jsx` |
| `admin_sla_policy_integrations` | `SlaConfigPanel.jsx` |
| `admin_ticket_inspection_panel` | `TriageQueue.jsx` (queue list + side-drawer) |
| `global_triage_triagequeue.jsx` | `TriageQueue.jsx` (standalone full-page) |
| `department_manager_active_queue_table` | NEW `ManagerQueuePage.jsx` |
| `department_manager_analytics_workload` | NEW `ManagerAnalyticsPage.jsx` |
| `department_manager_risk_breach_mitigation` | NEW `ManagerRiskPage.jsx` |

**Design tokens (from updated DESIGN.md + wireframes):**
- Nav rail: `bg-slate-950` (updated — DESIGN.md specifies `slate-950`, not `#131b2e`)
- Active nav item: `border-l-[3px] border-emerald-400` (updated — DESIGN.md specifies emerald, not white)
- Background: `#f8f9ff`
- Text: `#0b1c30` (on-surface)
- Secondary text: `#45464d` (on-surface-variant)
- Border: `#c6c6cd` (outline-variant), structural dividers: `border-slate-200/80`
- Surface containers: `#e5eeff`, `#eff4ff`, `#dce9ff`
- Fonts: Hanken Grotesk (UI) + JetBrains Mono (ticket IDs, error codes, API keys only)
- Top header: 48px tall, `bg-white`, `border-b border-slate-200/80`
- All structural containers: `border-radius: 0` (sharp corners)
- Interactive widgets (buttons, badges, inputs, tabs): `rounded-md` (6px)
- Primary buttons: `bg-slate-900` white text; Secondary: `bg-white border-slate-200`
- SLA bars: 4px height, `bg-slate-100` fill, urgency color fill

---

## Sub-Tasks

---

### Sub-Task 1 — Design Tokens, CSS Foundation & Collapsible AppShell
**Status:** `[ ] pending`

**Intent:** Establish the exact wireframe design system tokens in CSS and rebuild AppShell with a collapsible sidebar — expanded (260px, labeled) on desktop, collapsed (64px, icons-only) on tablet/manual toggle, with smooth CSS transition and localStorage persistence.

**Expected Outcomes:**
- `index.css` has wireframe CSS custom properties and Hanken Grotesk + JetBrains Mono loaded
- `tokens.js` exports the full updated wireframe palette (`navRail: 'slate-950'`, emerald active indicator, etc.)
- `AppShell.jsx` renders a collapsible sidebar with two states:
  - **Expanded (260px):** `bg-slate-950`, logo + "Support Engine" text + "TENANT ALPHA" subtitle, labeled nav items with active `border-l-[3px] border-emerald-400 bg-white/5`, user avatar + name + logout at bottom, collapse toggle chevron
  - **Collapsed (64px):** icon-only mode, same `bg-slate-950`, icons centered, tooltip on hover for each nav item, expand chevron on the right edge
- Collapse state toggles with smooth `transition-[width] duration-200` CSS animation
- Collapse state saved to `localStorage` key `hd_sidebar_collapsed`
- Top header: 48px, `bg-white`, `border-b border-slate-200/80`, breadcrumb + clock chip + tenant badge + bell + avatar
- Main content area left margin animates with sidebar: `ml-[260px]` or `ml-[64px]` depending on state

**Todo List:**
1. Update `helpdesk-center-frontend/index.html` — Google Fonts: Hanken Grotesk + JetBrains Mono
2. Rewrite `src/index.css` with wireframe CSS variables and custom scrollbar styles
3. Rewrite `src/styles/tokens.js` with updated palette (navRail: slate-950, activeIndicator: emerald-400)
4. Rewrite `src/components/AppShell.jsx`:
   - State: `const [collapsed, setCollapsed] = useState(() => localStorage.getItem('hd_sidebar_collapsed') === 'true')`
   - Sidebar width: `collapsed ? 'w-[64px]' : 'w-[260px]'` with `transition-[width] duration-200 ease-in-out`
   - Expanded state: logo icon + "Support Engine" h1 + "TENANT ALPHA" caption, then labeled nav links
   - Collapsed state: icon only, no text, centered — identical visual to the 64px rail in all wireframe screens
   - Collapse toggle: `<button>` at the top of the sidebar showing `«` when expanded, `»` when collapsed
   - User profile footer: only show avatar + name + logout icon when expanded; show just avatar when collapsed
   - Active nav item: `border-l-[3px] border-emerald-400 bg-white/5 text-white`; inactive: `text-slate-400 hover:text-white hover:bg-white/5`

**Relevant Context:**
- DESIGN.md (updated): "On tablet, the local sidebar collapses into an icon-only view" + `bg-slate-950` nav rail + `border-l-[3px] border-emerald` active state
- All wireframe `screen.png` files show the 64px collapsed state — this IS the default collapsed state
- Current file: `helpdesk-center-frontend/src/components/AppShell.jsx`

---

### Sub-Task 2 — LoginPage
**Status:** `[ ] pending`

**Intent:** Match `login_support_engine/screen.png` exactly — centered white card on `#f8f9ff` background, OMNISUPPORT shield logo above, left blue accent bar on card, 3-field form (Workspace ID with subdomain suffix, Corporate Email, Password with eye toggle), dark `AUTHENTICATE & ENTER →` button.

**Expected Outcomes:**
- LoginPage visually matches the wireframe screenshot pixel-for-pixel
- Workspace ID field has `.omnisupport.io` inline suffix
- Password field has show/hide eye button
- Submit button is `bg-slate-950` with arrow `→`
- `FORGOT SECURITY KEY?` link above password

**Todo List:**
1. Rewrite `src/pages/LoginPage.jsx` to match the exact card layout from wireframe
2. Add OMNISUPPORT shield SVG icon above the card
3. Implement Workspace ID input with inline `.omnisupport.io` suffix (the field maps to `username` for API)
4. Password visibility toggle
5. Keep `login()` API call and navigation logic unchanged

**Relevant Context:**
- Wireframe: `login_support_engine/screen.png` — white card, left blue-left accent, clean center layout
- Current file: `src/pages/LoginPage.jsx`

---

### Sub-Task 3 — EmployeeDashboard (my_tickets screens)
**Status:** `[ ] pending`

**Intent:** Match `my_tickets_support_engine/screen.png` and `my_tickets_ai_triage_breakdown/screen.png` — the layout uses the full-width sidebar (`260px`) with user profile at bottom, not the 64px icon-only rail. The main area has: "The Ticket Dropper Form" section with 4-column grid (title, description, department, AI confidence breakdown), then "The Employee Personal Grid" table (ID, Title, Department, Date Created, Status, open-in-new button).

**Expected Outcomes:**
- EmployeeDashboard uses full `260px` sidebar (not AppShell's 64px rail) — matches wireframe exactly
- Ticket Dropper Form has watsonx.ai badge, markdown toolbar, attachment dropzone, AI Confidence Breakdown panel (right column showing 88%, 7%, 5% for departments)
- Personal Grid is a proper table with 6 columns, `hover:bg-slate-50` rows, `open_in_new` icon on hover
- Status badges match wireframe style: IN PROGRESS=amber, RESOLVED=emerald, OPEN=slate-900, CLOSED=outlined

**Todo List:**
1. Rewrite `src/pages/EmployeeDashboard.jsx` — implement the full 260px sidebar pattern (user avatar at bottom, nav items with active border-l-4)
2. Build "Ticket Dropper Form" with 3-column grid: left=title+description editor, middle=department+dropzone, right=AI confidence breakdown panel
3. Build "Employee Personal Grid" table using `useMyTickets` or `useTickets` hook filtered by current user
4. Implement submit using `useCreateTicket` hook
5. Keep all existing API hooks; only change the visual layer

**Relevant Context:**
- Wireframes: `my_tickets_support_engine/screen.png` (3-col form) and `my_tickets_ai_triage_breakdown/screen.png` (4-col with AI panel)
- The sidebar in these wireframes is 260px with logo, nav links, user profile footer — distinct from the 64px rail in admin/agent screens
- Current file: `src/pages/EmployeeDashboard.jsx`

---

### Sub-Task 4 — Employee TicketDetailPanel (refined layout)
**Status:** `[ ] pending`

**Intent:** Match `employee_ticket_detail_refined_layout/screen.png` — two-panel layout: left=chat thread + reply editor, right=AI Classification panel + Ticket Metadata + Attachments + Recent Activity + Tags. The ticket ID and title appear prominently at top-left, SLA bar below header.

**Expected Outcomes:**
- TicketDetailPanel two-column layout: fluid left pane (description card + comment thread + reply box) + 280px right sidebar
- Right sidebar sections: AI CLASSIFICATION (confidence bars), TICKET METADATA (dept, agent, date, reporter), ATTACHMENTS list, RECENT ACTIVITY timeline, TAGS
- AI Classification shows department confidence percentages with progress bars (matches wireframe exactly)
- Comment thread: initial report card (gray), agent replies (blue bubbles), employee replies (white bubbles), system events as center pills
- Reply box has B/I/link/attachment/list/code toolbar + SEND REPLY button

**Todo List:**
1. Rewrite `src/components/TicketDetailPanel.jsx` to the exact two-column layout
2. Add AI CLASSIFICATION section to right sidebar using `useAiClassification` or mock data
3. Update `src/components/CommentSection.jsx` to match wireframe chat bubble style exactly (agent=dark, employee=light, system=pill center)
4. Update `src/pages/TicketDetailPage.jsx` to use 260px sidebar (same pattern as EmployeeDashboard)

**Relevant Context:**
- Wireframe: `employee_ticket_detail_refined_layout/screen.png` — shows narrow left panel list + main content + right metadata sidebar
- Current file: `src/components/TicketDetailPanel.jsx`, `src/components/CommentSection.jsx`

---

### Sub-Task 5 — AgentDashboard (3-pane workspace)
**Status:** `[ ] pending`

**Intent:** Match `agent_workspace_panel_actions_support_engine_1/screen.png` and `_2/screen.png` — three-pane layout: left=ticket list panel (380px, search + My Queue/Dept Pool/Archive tabs, ticket cards), center=ticket detail (description card + comment thread), right=270px action sidebar (PRIMARY ACTIONS: Re-Route + Mark Resolved, CUSTOMER INSIGHTS, TICKET METADATA with agent dropdown + department + tags, RECENT ACTIVITY timeline).

**Expected Outcomes:**
- Three-pane horizontal layout at full viewport height
- Left pane: search bar, 3 tabs (My Queue / Dept Pool / Archive), ticket list cards showing ticket ID in JetBrains Mono, priority badge top-right, submitter avatar + name + relative time
- Center pane: ticket header (ID/department breadcrumb, title, reporter+date, SLA bar), ticket description card with MINIMIZE button, comment thread
- Right pane: PRIMARY ACTIONS section (Re-Route white button + Mark Resolved black button), CUSTOMER INSIGHTS card, TICKET METADATA (assigned agent dropdown, department, tags row), RECENT ACTIVITY timeline

**Todo List:**
1. Rewrite `src/pages/AgentDashboard.jsx` with exact 3-pane layout (no SplitPane dependency)
2. Update left pane to use My Queue / Dept Pool / Archive tabs
3. Right action pane: Re-Route button opens `RerouteModal`, Mark Resolved calls status mutation
4. Ensure all hooks (`useTickets`, `useRerouteTicket`, `useUpdateTicketStatus`) remain unchanged

**Relevant Context:**
- Wireframes: `agent_workspace_panel_actions_support_engine_1/screen.png` and `_2/screen.png` (identical layout, different scroll position)
- Current file: `src/pages/AgentDashboard.jsx`

---

### Sub-Task 6 — AdminDashboard + TriageQueue with Side Drawer
**Status:** `[ ] pending`

**Intent:** Match `admin_ticket_inspection_panel_support_engine/screen.png` for the Admin Triage Queue view — it uses the 260px full sidebar (not 64px rail), shows queue list on left with UNASSIGNED(12) / CRITICAL(3) filter chips, and a 480px right side-drawer showing ticket detail with AI TRIAGE ANALYTICS LOG + ADMINISTRATIVE OVERRIDES (forced dept + agent selects + APPLY OVERRIDE & RE-ROUTE button).

**Expected Outcomes:**
- Admin triage queue shows ticket list (TICKET ID / SUBJECT / CLIENT / STATUS / URGENCY columns)
- Clicking a ticket opens the 480px side-drawer with AI Triage Analytics Log and Administrative Overrides
- AI Triage Log shows PREDICTED TARGET, CONFIDENCE, warning banner for low confidence, LATENCY/MODEL/STATUS footer
- Administrative Overrides: FORCED DEPARTMENT ASSIGNMENT select + FORCED ASSIGNEE OVERRIDE select + APPLY OVERRIDE & RE-ROUTE dark button
- AdminDashboard tab bar and stat cards remain consistent with previous work

**Todo List:**
1. Update `src/components/TriageQueue.jsx` to add click-to-open side drawer with AI analytics + override controls
2. Side drawer uses `useRerouteTicket` mutation for the override action
3. Add UNASSIGNED / CRITICAL filter chips above the table
4. Keep AdminDashboard tab structure; only the Triage tab view changes

**Relevant Context:**
- Wireframe: `admin_ticket_inspection_panel_support_engine/screen.png`
- Current file: `src/components/TriageQueue.jsx`

---

### Sub-Task 7 — AnalyticsPanel & SlaConfigPanel Final Polish
**Status:** `[ ] pending`

**Intent:** Verify `AnalyticsPanel.jsx` and `SlaConfigPanel.jsx` match their wireframe screenshots exactly using the pixel references. Make any corrections needed from the screenshots vs current implementation.

**Expected Outcomes:**
- `AnalyticsPanel` matches `admin_analytics_ai_tuning/screen.png` exactly — FRT/MTTR/AI gauge row, heatmap, retrospective table, System Integrity dark card, Recent Critical Events, watsonx.ai dock
- `SlaConfigPanel` matches `admin_sla_policy_integrations/screen.png` exactly — colored dots + description + number input + Update button per priority row, Messaging Rails section with rounded inputs, 3 summary stat cards

**Todo List:**
1. Read `AnalyticsPanel.jsx` and compare against screenshot — fix any discrepancies
2. Read `SlaConfigPanel.jsx` and compare against screenshot — fix any discrepancies (the screenshot shows `rounded-lg` inputs with the icon prefix)
3. Run build check

**Relevant Context:**
- Wireframe screenshots: `admin_analytics_ai_tuning/screen.png`, `admin_sla_policy_integrations/screen.png`
- Current files: `src/components/AnalyticsPanel.jsx`, `src/components/SlaConfigPanel.jsx`

---

### Sub-Task 8 — Department Manager Dashboard (3 new pages)
**Status:** `[ ] pending`

**Intent:** Create the complete Department Manager role with three tabbed views in a single `ManagerDashboard.jsx` page: (1) Active Queue Table, (2) Analytics/Workload Matrix, (3) Risk/Breach Mitigation Queue. Add `dept_manager` role routing in `App.jsx`.

**Expected Outcomes:**
- New file: `src/pages/ManagerDashboard.jsx` with internal tab navigation for 3 views
- New components: `src/components/ManagerQueueTable.jsx`, `src/components/ManagerAnalyticsPanel.jsx`, `src/components/ManagerRiskQueue.jsx`
- Queue Table (`department_manager_active_queue_table/screen.png`): filter bar + table (TICKET ID, SUBJECT, STATUS, ASSIGNED AGENT dropdown, SLA TRACKING progress bar) + footer status legend
- Analytics Panel (`department_manager_analytics_workload/screen.png`): 3-metric cards (Active Backlog, MTTR, SLA Breach Rate) + Agent Workload Distribution Matrix (initials avatar + name + horizontal load bar)
- Risk Queue (`department_manager_risk_breach_mitigation/screen.png`): amber warning banner, grid table (TICKET ID, PRIORITY TIER badge, ASSIGNED AGENT avatar+name, RE-ROUTING DEADLINE with SLA progress bar or red BREACHED flash, ESCALATE & REASSIGN button)
- Auth routing: `role === 'dept_manager'` → `/manager` in `App.jsx`

**Todo List:**
1. Create `src/pages/ManagerDashboard.jsx` with AppShell + 3-tab navigation
2. Create `src/components/ManagerQueueTable.jsx` — uses `useTickets` filtered by `user.departmentId`
3. Create `src/components/ManagerAnalyticsPanel.jsx` — uses mock agent workload data (real hook can be added later)
4. Create `src/components/ManagerRiskQueue.jsx` — uses mock SLA breach data showing near-breach and breached rows
5. Update `src/App.jsx`: add `/manager` route + add `dept_manager` case to `RoleRedirect`

**Relevant Context:**
- Wireframes: `department_manager_active_queue_table/screen.png`, `department_manager_analytics_workload/screen.png`, `department_manager_risk_breach_mitigation/screen.png`
- Auth pattern: `user.role` is already lowercased in `AuthContext.jsx` — add `if (role === 'dept_manager') return <Navigate to="/manager" />`
- No backend API changes needed — use existing `useTickets` hook with client-side departmentId filtering for the queue, mock data for analytics/risk

---

### Sub-Task 9 — Final Build Validation & Polish
**Status:** `[ ] pending`

**Intent:** Run the production build, fix any compilation errors, and do a final visual diff pass against all wireframe screenshots.

**Expected Outcomes:**
- `npm run build` passes with zero errors and zero new warnings
- All 13 wireframe screens have corresponding React implementations
- No unused imports or dead code from previous implementations

**Todo List:**
1. Run `npm run build` in `helpdesk-center-frontend/`
2. Fix any TypeScript/JSX errors
3. Verify `App.jsx` routes cover all roles: `employee` → `/dashboard`, `sys_admin` → `/admin`, `agent` → `/agent`, `dept_manager` → `/manager`
4. Remove any leftover dead code (unused `SplitPane` imports, old `TabBar` references if unused)

**Relevant Context:**
- Build command: `npm run build` in `helpdesk-center-frontend/`
- Previous build was clean at 193 modules; new build should be ~200+ modules

---

## Notes for Implementation

### Key visual patterns from screenshots (not to miss):

1. **EmployeeDashboard sidebar** — The `my_tickets` wireframes use a **260px wide labeled sidebar** (not the 64px icon-only rail). It has: logo + "TENANT ALPHA" text header, labeled nav items (Dashboard, Tickets, Customers, Knowledge Base, Reports), user profile card at the bottom with logout button.

2. **AgentDashboard** — Three panes, full-height. The left ticket list cards show `#SR-9421` IDs with JetBrains Mono, priority badge top-right corner, submitter avatar, name, and relative time at bottom-right.

3. **Admin Triage side-drawer** — The `admin_ticket_inspection_panel` wireframe shows a 260px full text sidebar (not 64px), with the main content area split: left=queue list, right=480px sliding drawer. The drawer shows AI confidence badge + amber warning banner + LATENCY/MODEL/STATUS footer row in JetBrains Mono.

4. **Department Manager Risk Queue** — Breached rows have `bg-red-50/20` background, and a full-width red animated `EXPIRED / BREACHED BY Xh Ym` banner replacing the SLA bar. Near-breach rows show amber countdown text + amber progress bar.

5. **Manager Analytics** — Uses a **260px labeled sidebar** with `bg-primary-container` dark background, active item has `border-l-[3px] border-tertiary-fixed`. The sidebar has "Admin Panel / Support HQ" header with terminal icon.
