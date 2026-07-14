# Front-End Design & UI Blueprint: High-Density Jira Style

This document outlines the strict UI/UX design tokens, layouts, and component structures for the Help Desk front-end application. IBM Bob and all sub-agents must parse and strictly enforce these constraints across all React 19 components, preventing any deviation from our design language.

---

## 1. Core Visual Tokens & Global Constraints

### A. Hybrid Geometric Curvature (The Structural Containment Rule)
We enforce a split rule for border radiuses based on the element's purpose:
1.  **Structural Grid Containers (Sharp Edges)**: The main layout panes, dashboard statistical data cards, outer filter control bars, and the core ticket rows MUST use zero border curvature (`rounded-none`).
2.  **Interactive UI Widgets & Controls (Rounded Edges)**: Individual click targets, status badges, priority pill metrics, indicator numbers (e.g., `+12%`), checkbox boxes, user profile avatar nodes, and drop-down floating panel selectors MUST use standard subtle rounding (`rounded` or `rounded-md`).


### B. High-Contrast Border & Divider System
*   **Constraint**: Avoid heavy, claustrophobic box frames. Rely on clean, faint separators.
*   **Tailwind Enforcement**: 
    *   Use `border-neutral-200/80` (light mode) and `border-neutral-800` (dark mode).
    *   Tables must use borderless outer frames, relying entirely on horizontal separating rows via `border-b divide-y divide-neutral-100 dark:divide-neutral-800/60`.

### C. Layout Hierarchy & Scroll Cages
*   **Constraint**: The screen layout must never scroll globally. The main page framework must lock exactly to the viewport boundary (`h-screen overflow-hidden`).
*   **Tailwind Enforcement**: Individual inner columns (like the master ticket list or chat thread pane) must govern their own scroll vectors via `h-[calc(100vh-4rem)] overflow-y-auto`.

---

## 2. Component Blueprint Layouts

### A. Three-Pane Master-Detail Workspace (`SplitPane.jsx`)
The agent workspace is structured into a fluid, side-by-side layout:
1.  **Sidebar (Fixed Left - Width: 64 / 16rem)**: Global app controls.
2.  **Master List (Fixed Middle - Width: 96 / 24rem)**: Scrollable list of active ticket card components.
3.  **Detail Workspace (Fluid Right - Flex-1)**: Main focus panel showing active communications, client meta-logs, and re-routing action modules.

### B. High-Density Jira-Style Grid Table (`AnalyticsPanel.jsx` / `TriageQueue.jsx`)
*   **Typography**: Row text parameters must prioritize data scan speed over artistic flair. Header tags use uppercase tracking adjustments (`text-[11px] font-semibold tracking-wider text-neutral-500 bg-neutral-50`).
*   **Hover states**: Row wrappers must shift cleanly on active interaction loops via `hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors`.
*   **Identifiers**: Technical tracking strings (like Ticket IDs: `TCK-1001`) must render in clean monospace layout formatting using `font-mono text-xs font-semibold text-blue-600 dark:text-blue-400`.

### C. State Indicator Elements (Badges & Progress Trackers)
1.  **StatusBadge**: Renders status types (`OPEN`, `IN_PROGRESS`, `PENDING_EMPLOYEE`, `RESOLVED`, `CLOSED`) using small, high-density pill wrappers carrying custom background tones with a leading internal tracking dot selector.
2.  **PriorityBadge**: Expresses impact tiers (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). `CRITICAL` warnings trigger uppercase tracking configurations with high-visibility background warning alerts.
3.  **SlaProgressBar**: Renders a thin tracker bar (`h-1.5`) directly within data cards. Transitions dynamically from blue to amber, and turns flashing red if remaining time parameters fall below 25%. Displays an italic caption warning when an SLA timer pauses during the `PENDING_EMPLOYEE` state cycle.

---

## 2B. SLA Progress Bar UI State Engine

All rendering loops inside `SlaProgressBar.jsx`, `TicketCard.jsx`, and `TicketDetailPanel.jsx` **must** evaluate the `due_at` timestamp and the ticket `status` field to derive one of the following five mutually exclusive states. States are evaluated in priority order — **BREACHED** and **PAUSED** are checked before percentage thresholds.

### State Evaluation Order & Rendering Contract

| Priority | State | Condition | Bar Fill | Text / Animation |
|----------|-------|-----------|----------|-----------------|
| 1 | **BREACHED** | `CURRENT_TIMESTAMP > due_at` **AND** `status NOT IN ('RESOLVED', 'CLOSED')` | Drain bar width to `0%` | Header flag renders as **"⚠️ SLA BREACHED / EXPIRED"** in `text-red-600 font-semibold` |
| 2 | **PAUSED** | `status == 'PENDING_EMPLOYEE'` | Freeze bar at its current width | Apply `opacity-50` muted tint; display italicized caption below bar: *"SLA Clock Paused (Awaiting Employee response)"* |
| 3 | **ALERT** | `remaining_time < 25%` of total window | Bar fills to current `remaining_time%` | `bg-red-500` with `animate-pulse` applied to both the bar and the remaining-time text label |
| 4 | **WARNING** | `remaining_time` is between `25%` and `50%` of total window | Bar fills to current `remaining_time%` | Steady `bg-amber-500`, no animation |
| 5 | **SAFE** | `remaining_time > 50%` of total window | Bar fills to current `remaining_time%` | Steady `bg-blue-500`, no animation |

### Calculation Reference

```
remaining_time_pct = ((due_at - CURRENT_TIMESTAMP) / (due_at - created_at)) * 100
```

- `due_at` and `created_at` are ISO 8601 timestamps sourced from the ticket payload.
- The percentage must be clamped: `max(0, min(100, remaining_time_pct))`.
- When `due_at` is `null` or missing (e.g. SLA rule not yet applied), the bar must render in a neutral `bg-slate-300` state with no state label.

### Per-Component Rendering Rules

- **`SlaProgressBar.jsx`**: The canonical state-evaluation component. All five states are implemented here. Other components must delegate to this component rather than re-implementing the logic.
- **`TicketCard.jsx`**: Renders `<SlaProgressBar />` inline below the ticket subject. In **BREACHED** state, the card's left accent border must switch to `border-l-4 border-red-500`.
- **`TicketDetailPanel.jsx`**: Renders `<SlaProgressBar />` in the metadata header block. In **BREACHED** state, the panel's section title block must display the **"⚠️ SLA BREACHED / EXPIRED"** flag text in place of the normal time-remaining string.

---

## 3. UI/UX Interaction Behaviors
*   **Input Focus States**: All active search engines and textual form fields must highlight clean border changes without shifting layout boundaries: `focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`.
*   **Modal & Panel Animations**: Transitions, panel slips, and dropzone entries must avoid complex bouncy dynamics. Use standard swift step adjustments: `transition-all duration-150 ease-in-out`.


## 4. Master Color Scheme & Palette Token Contracts

All component code generation must strictly map background, text, and boundary layer fills to this slate palette configuration.

### A. Layout Foundations
- **Global Canvas Backing**: Light: `bg-white` (#FFFFFF) | Dark: `bg-slate-950` (#0B0F19)
- **Structural Control Bars & Panels**: Light: `bg-slate-50/50` (#F8FAFC) | Dark: `bg-slate-900` (#111827)
- **Faint Micro-Dividers**: Light: `border-slate-200/80` (#E2E8F0) | Dark: `border-slate-800` (#1F2937)

### B. Typography Hierarchies
- **Primary Headers & Body Content**: Light: `text-slate-900` (#0F172A) | Dark: `text-slate-50` (#F8FAFC)
- **Secondary Metadata Descriptions**: Light: `text-slate-500` (#64748B) | Dark: `text-slate-400` (#94A3B8)

### C. State Jewel-Tones (Badges & Priority Indicators)
- **Low Priority / Open Status (Emerald Pass)**: Light: `bg-emerald-50 text-emerald-700 border-emerald-200` | Dark: `bg-emerald-950/30 text-emerald-400 border-emerald-900/50`
- **Medium Priority / In Progress (Blue State)**: Light: `bg-blue-50 text-blue-700 border-blue-200` | Dark: `bg-blue-950/20 text-blue-400 border-blue-900/50`
- **High Priority / Attention Need (Amber State)**: Light: `bg-amber-50 text-amber-700 border-amber-200` | Dark: `bg-amber-950/20 text-amber-400 border-amber-900/50`
- **Critical Breaches / Blocker Alerts (Red Alarm)**: Light: `bg-red-50 text-red-700 border-red-200` | Dark: `bg-red-950/30 text-red-400 border-red-900/50`

