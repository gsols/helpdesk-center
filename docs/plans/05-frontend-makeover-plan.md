# Frontend UI Makeover Plan

## Overview

Migrate the `helpdesk-center-frontend/` from its current mixed inline-style / Tailwind gray-palette codebase into the **Hybrid Geometric High-Density Jira-style** design system defined in `frontend-design-plan.md` and ratified in ADR 0006.

The work is divided into **seven** focused sub-tasks, each targeting a specific layer of the component tree. Each sub-task is independently reviewable before moving to the next.

---

## Sub-Task 1 — Design Token Alignment (`tokens.js` + `AppShell.jsx`)

**Status:** `[x] done`

### Intent
The current `tokens.js` uses `radiusLg: 8`, `radiusMd: 6`, etc. — these drive inline-style `borderRadius` values used throughout `StatCard`, `AppShell` (sidebar logo icon, nav item active highlight, user avatar, notification bell button, TopBar avatar). These must be zeroed-out for structural containers while preserving the avatar/interactive-widget rules.

`AppShell.jsx` also uses `minHeight: '100vh'` on `<main>` without `overflow: hidden` — this allows the page to scroll globally, violating the `h-screen overflow-hidden` constraint.

### Expected Outcomes
- `tokens.js` structural radius tokens (`radiusSm`, `radiusMd`, `radiusLg`, `radiusXl`) are set to `0`. `radiusPill` stays `999` (for circular avatars).
- `cardStyle` and `btnPrimary` / `btnSecondary` / `inputStyle` exported style objects use `borderRadius: 0`.
- `AppShell` root `<div>` uses `h-screen overflow-hidden` (via Tailwind or inline style).
- `<main>` content area uses `overflow-y-auto` with `h-[calc(100vh-${T.topBarHeight}px)]` instead of `minHeight: 100vh`.
- Sidebar nav item `borderRadius: 6` → `0`.
- Sidebar logo icon container `borderRadius: 8` → `0`.
- TopBar notification bell button `borderRadius: 6` → `0`.

### Todo List
1. In `tokens.js`: set `radiusSm`, `radiusMd`, `radiusLg`, `radiusXl` to `0`. Update `cardStyle`, `btnPrimary`, `btnSecondary`, `inputStyle` exported objects to `borderRadius: 0`.
2. In `AppShell.jsx`: change root wrapper `style` to lock viewport (`height: '100vh', overflow: 'hidden'`).
3. In `AppShell.jsx`: change `<main>` to `overflowY: 'auto'` and `height: calc(100vh - T.topBarHeight px)`, remove `minHeight: '100vh'`.
4. In `AppShell.jsx` `NavItem`: change `borderRadius: 6` → `0`.
5. In `AppShell.jsx` `Sidebar` logo icon container: `borderRadius: 8` → `0`.
6. In `AppShell.jsx` `TopBar` bell button: `borderRadius: 6` → `0`.
7. In `AppShell.jsx` collapse/toggle button: `borderRadius: 4` → `0`.

### Relevant Context
- `helpdesk-center-frontend/src/styles/tokens.js`
- `helpdesk-center-frontend/src/components/AppShell.jsx`
- ADR 0006 § Decision point 1: structural blocks use `rounded-none`.
- ADR 0006 § Decision point 2: avatars (circular) are interactive elements — keep `radiusPill: 999`.

---

## Sub-Task 2 — Badge & Indicator Components (`StatusBadge`, `PriorityBadge`, `CategoryBadge`, `StatCard`)

**Status:** `[x] done`

### Intent
These components are already partially compliant. `StatusBadge` and `PriorityBadge` already use `rounded` (correct per hybrid rule — they are interactive micro-widgets). The goal of this sub-task is to:
- Add the missing `CRITICAL` tier to `PriorityBadge` with uppercase tracking and high-visibility warning styling.
- Confirm `CategoryBadge` uses `rounded` or `rounded-md` (interactive widget rule).
- Rebuild `StatCard` from inline-style approach to Tailwind classes using `rounded-none` on the outer container card (structural) and `rounded` only on the inner icon container (interactive widget).

### Expected Outcomes
- `PriorityBadge` handles `CRITICAL` with `text-red-700 bg-red-100 border-red-300 uppercase tracking-wider font-bold` styling and a pulsing/bright dot.
- `StatCard` outer card uses `rounded-none border border-neutral-200` (Tailwind classes, no inline `borderRadius`).
- `StatCard` inner icon box uses `rounded` (interactive widget rule).
- `CategoryBadge` uses `rounded` or `rounded-md`.

### Todo List
1. In `PriorityBadge.jsx`: add `CRITICAL` style entry with uppercase tracking and bold warning background.
2. In `StatCard.jsx`: replace `borderRadius: T.radiusLg` with `0` (or switch to `rounded-none` Tailwind class on the card wrapper). Set the icon box `borderRadius` to `T.radiusMd` (6 → this will remain as interactive widget — but per token update in ST1, this will now be 0 too. Use an explicit `8` px or switch to Tailwind `rounded` for the icon container).
3. In `CategoryBadge.jsx`: verify/enforce `rounded` or `rounded-md`.

### Relevant Context
- `helpdesk-center-frontend/src/components/PriorityBadge.jsx`
- `helpdesk-center-frontend/src/components/StatCard.jsx`
- `helpdesk-center-frontend/src/components/CategoryBadge.jsx`
- `frontend-design-plan.md` § 2C: CRITICAL triggers uppercase + high-visibility background.
- ADR 0006 § 2: status capsules/badges use `rounded` or `rounded-md`.

---

## Sub-Task 3 — Ticket List & Master Pane (`TicketCard.jsx`, `TabBar.jsx`)

**Status:** `[x] done`

### Intent
`TicketCard` currently uses `bg-white` with `rounded-lg` implied by its parent list container in `AgentDashboard`/`AdminDashboard` (those wrappers use `rounded-lg`). The card itself needs to be a sharp-edge row item. The Claim/Assign buttons currently use `rounded-full` — they are interactive action buttons and should use `rounded` or `rounded-md` per the hybrid rule.

`TabBar` count badges use `rounded-full` which is correct for an interactive micro-widget pill, but the tab underline buttons themselves are plain elements — no radius issue.

The dashboard page wrappers in `AgentDashboard` and `AdminDashboard` use `rounded-lg` on their list container `<div>` — these are structural containers and must become `rounded-none`.

### Expected Outcomes
- `TicketCard` row wrapper: no `borderRadius`, uses the Jira-style hover `hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors`.
- Ticket ID renders as `font-mono text-xs font-semibold text-blue-600` (matching blueprint).
- Claim/Assign action buttons in `TicketCard` use `rounded` (not `rounded-full`).
- `TabBar` count badges remain `rounded-full` (interactive widget — correct).
- In `AgentDashboard.jsx`: list wrapper `rounded-lg` → `rounded-none`.
- In `AdminDashboard.jsx`: list wrapper `rounded-lg` → `rounded-none`.

### Todo List
1. In `TicketCard.jsx`: remove any `rounded` from the card wrapper div (currently none, but confirm). Update hover classes to blueprint spec.
2. In `TicketCard.jsx`: update ticket ID `text-xs text-gray-400 font-mono` → `font-mono text-xs font-semibold text-blue-600 dark:text-blue-400`.
3. In `TicketCard.jsx`: change Claim button `rounded-full` → `rounded`.
4. In `TicketCard.jsx`: change Assign button `rounded-full` → `rounded`.
5. In `AgentDashboard.jsx`: change list container `rounded-lg` → `rounded-none`.
6. In `AdminDashboard.jsx`: change list container `rounded-lg` → `rounded-none`.

### Relevant Context
- `helpdesk-center-frontend/src/components/TicketCard.jsx`
- `helpdesk-center-frontend/src/components/TabBar.jsx`
- `helpdesk-center-frontend/src/pages/AgentDashboard.jsx` (list container wrapper)
- `helpdesk-center-frontend/src/pages/AdminDashboard.jsx` (list container wrapper)
- `frontend-design-plan.md` § 2B: Ticket IDs use `font-mono text-xs font-semibold text-blue-600`.

---

## Sub-Task 4 — `TriageQueue.jsx` Redesign

**Status:** `[x] done`

### Intent
`TriageQueue` is the most visually non-compliant component. It uses `rounded-lg shadow-sm` on its outer container, `rounded-lg` on the department header section, `rounded` on the department select dropdown and the Assign button. Per the hybrid rule: the outer container and inner select are structural/form elements → `rounded-none`. The Assign button is an interactive action control → `rounded`.

Additionally the typography should be upgraded to Jira-style: ticket IDs rendered in `font-mono text-xs font-semibold text-blue-600`, header section uses `text-[11px] font-semibold tracking-wider text-neutral-500`.

### Expected Outcomes
- Outer `TriageQueue` wrapper: `rounded-none`, no `shadow-sm`, `border border-neutral-200`.
- Header section: `rounded-none bg-neutral-50`, header text uses Jira table header typography.
- Per-row layout: sharp dividers `divide-y divide-neutral-100`.
- Ticket IDs: `font-mono text-xs font-semibold text-blue-600`.
- Department `<select>`: `rounded-none` (structural form element).
- Assign `<button>`: keep `rounded` (interactive action widget per hybrid rule).
- Hover on rows: `hover:bg-neutral-50/80 transition-colors`.

### Todo List
1. Replace outer container classes: remove `rounded-lg shadow-sm`, add `rounded-none border border-neutral-200 dark:border-neutral-800`.
2. Replace header `div` classes: remove `rounded-*`, use `rounded-none bg-neutral-50/50`, update heading typography to `text-[11px] font-semibold tracking-wider text-neutral-500 uppercase`.
3. Update ticket ID span: `text-xs text-gray-400 font-mono` → `font-mono text-xs font-semibold text-blue-600 dark:text-blue-400`.
4. Update row wrapper hover: add `hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors`.
5. Change `<select>` class: remove `rounded`, add `rounded-none`.
6. Leave Assign `<button>` with `rounded` (hybrid rule: interactive action control).

### Relevant Context
- `helpdesk-center-frontend/src/components/TriageQueue.jsx`
- `frontend-design-plan.md` § 2B: Jira table header and row typography.
- ADR 0006 § 2: action buttons retain `rounded`.

---

## Sub-Task 5 — `SlaConfigPanel.jsx` Redesign

**Status:** `[x] done`

### Intent
`SlaConfigPanel` uses `rounded-lg shadow-sm` on its group containers, `rounded` on the priority badge span, and `rounded` on the number input and Save button. Per the hybrid rule: the outer group container is structural → `rounded-none`. The priority badge, Save button, and number input are interactive widgets → keep `rounded` on badge and button; the input is a form field and is borderline — per blueprint, inputs use `rounded-none` with `focus:border-blue-500 focus:ring-1 focus:ring-blue-500`.

### Expected Outcomes
- Group container wrapper: `rounded-none border border-neutral-200`.
- Group header section: `rounded-none bg-neutral-50`.
- Table header row: Jira-style `text-[11px] font-semibold tracking-wider text-neutral-500 uppercase`.
- Priority badge span: keep `rounded` (interactive micro-widget per hybrid rule).
- Number input: `rounded-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`.
- Save button: keep `rounded` (interactive action control).

### Todo List
1. Replace group container `rounded-lg shadow-sm` → `rounded-none border border-neutral-200 dark:border-neutral-800`.
2. Replace group header `bg-gray-50 rounded-*` → `rounded-none bg-neutral-50 dark:bg-neutral-800/40`.
3. Update `<th>` table header cells to Jira typography.
4. Leave priority badge `rounded` (correct).
5. In number input: replace `rounded` → `rounded-none`, add `focus:ring-1 focus:ring-blue-500`.
6. Leave Save button `rounded` (correct).

### Relevant Context
- `helpdesk-center-frontend/src/components/SlaConfigPanel.jsx`
- `frontend-design-plan.md` § 3: Input focus states use `rounded-none` with `focus:border-blue-500 focus:ring-1`.
- ADR 0006 § 2: buttons/badges are interactive → `rounded`.

---

## Sub-Task 6 — `TicketDetailPanel.jsx`, `CommentSection.jsx`, `RerouteModal.jsx`

**Status:** `[x] done`

### Intent
These three components all share the same non-compliant pattern: structural container `<div>` cards use `rounded-lg shadow-sm`, and action buttons/modals use `rounded-xl` or `rounded-md`. Specifically:

- **`TicketDetailPanel`**: Header card, Description card, Attachments card all use `rounded-lg shadow-sm` → must become `rounded-none` (structural containers). The `FileViewer` modal wrapper uses `rounded-xl` → `rounded-none`. Action buttons (`Re-Route`, `Maximize`, `Minimize`, `Close`, `Download`) use `rounded-md` → keep `rounded` (interactive widgets). The `<select>` status dropdown uses `rounded-md` → `rounded-none` (form field). The Save button keeps `rounded-md` → keep `rounded`.
- **`CommentSection`**: Outer wrapper `rounded-lg` → `rounded-none`. Avatar circles (`rounded-full`) stay (circular user avatars = interactive element). Comment count badge `rounded-full` stays. Agent label badge uses `rounded` → stays. Submit button `rounded-md` → keep `rounded`. Textarea `rounded-md` → `rounded-none`.
- **`RerouteModal`**: Modal container `rounded-xl` → `rounded-none`. Department `<select>` `rounded-md` → `rounded-none`. Cancel button `rounded-md` → keep `rounded`. Confirm button `rounded-md` → keep `rounded`.

### Expected Outcomes
- All structural card containers in `TicketDetailPanel` use `rounded-none border border-neutral-200`.
- Attachment row items use `rounded-none` hover (was `rounded-md`).
- `FileViewer` modal outer container: `rounded-none`.
- `RerouteModal` outer container: `rounded-none`.
- All `<select>` and `<textarea>` form fields use `rounded-none` with `focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`.
- All CTA buttons retain `rounded` (hybrid interactive widget rule).
- Avatar circles in `CommentSection` retain `rounded-full`.

### Todo List
1. In `TicketDetailPanel.jsx`: change all three card wrappers `rounded-lg shadow-sm` → `rounded-none` (keep `border border-gray-200`).
2. In `TicketDetailPanel.jsx` `FileViewer`: `rounded-xl` → `rounded-none` on the modal container.
3. In `TicketDetailPanel.jsx` status `<select>`: `rounded-md` → `rounded-none`, update focus classes to `focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`.
4. In `TicketDetailPanel.jsx` action buttons (Re-Route, Maximize, Minimize, Close, Download): keep `rounded-md` → change to `rounded` (consistent interactive widget).
5. In `TicketDetailPanel.jsx` `FileTypeIcon` containers: `rounded` → `rounded-none` (these are structural icon containers inside the file list).
6. In `CommentSection.jsx`: outer wrapper `rounded-lg` → `rounded-none`.
7. In `CommentSection.jsx` textarea: `rounded-md` → `rounded-none`, update focus ring to `focus:ring-1 focus:ring-blue-500` (remove `focus:ring-2 focus:ring-blue-100`).
8. In `RerouteModal.jsx`: outer `rounded-xl` → `rounded-none`.
9. In `RerouteModal.jsx` `<select>`: `rounded-md` → `rounded-none`.

### Relevant Context
- `helpdesk-center-frontend/src/components/TicketDetailPanel.jsx`
- `helpdesk-center-frontend/src/components/CommentSection.jsx`
- `helpdesk-center-frontend/src/components/RerouteModal.jsx`
- `frontend-design-plan.md` § 3: Inputs use `rounded-none` + `focus:ring-1 focus:ring-blue-500`.
- `frontend-design-plan.md` § 3: Modals use `transition-all duration-150 ease-in-out` (no complex bounce).
- ADR 0006 § 2: action buttons are interactive → `rounded`.

---

## Sub-Task 7 — `LoginPage.jsx`

**Status:** `[x] done`

### Intent
`LoginPage` is the user's first visual impression. It currently uses `rounded-2xl` on the login card container (structural), `rounded-2xl` on the logo icon box, and `rounded-md` on the input fields and submit button. Per the hybrid rule: the card container and logo box are structural → `rounded-none`. The input fields are form fields → `rounded-none`. The submit button is an interactive action control → keep `rounded`.

The focus state currently uses `ring-2 ring-blue-100` (heavy ring) — must be narrowed to `ring-1 ring-blue-500` per the blueprint spec.

### Expected Outcomes
- Login card outer container: `rounded-none border border-neutral-200` (no `rounded-2xl`).
- Logo icon box: `rounded-none` (no `rounded-2xl`).
- Email and password inputs: `rounded-none` (remove `rounded-md`), focus state → `focus:border-blue-500 focus:ring-1 focus:ring-blue-500`.
- Submit button: keep `rounded-md` → change to `rounded` (interactive control).

### Todo List
1. In `LoginPage.jsx`: change login card container `rounded-2xl` → `rounded-none`.
2. In `LoginPage.jsx`: change logo icon box `rounded-2xl` → `rounded-none`.
3. In `LoginPage.jsx` `inputCls`: remove `rounded-md`, change focus ring from `ring-2 ring-blue-100` → `ring-1 ring-blue-500`.
4. In `LoginPage.jsx`: change submit button `rounded-md` → `rounded`.

### Relevant Context
- `helpdesk-center-frontend/src/pages/LoginPage.jsx`
- `frontend-design-plan.md` § 1A: structural containers use `rounded-none`.
- `frontend-design-plan.md` § 3: focus states use `focus:ring-1 focus:ring-blue-500`.
- ADR 0006 § 2: action buttons retain `rounded`.
