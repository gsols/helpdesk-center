# Frontend Enhancement Plan

## Overview

Enhance `helpdesk-center-frontend` to match the high-fidelity design spec found in `front-end-design/src/app/App.tsx` and `front-end-design/src/imports/pasted_text/helpdesk-design-brief.md`. The current frontend already has correct routing, API integration, and business logic — this plan focuses purely on visual/UX improvements, not rewiring the data layer.

Additionally, add `front-end-design/` to the root `.gitignore`.

**Approach:** Apply design improvements incrementally to each file. `lucide-react` will be installed to match the icon language in the design reference exactly. All styling stays as inline styles (the existing pattern). The app will be responsive — mobile-friendly with a collapsing header and stacked layouts on small screens.

**Confirmed decisions:**
- `lucide-react` installed as a dependency for icons (headset, plus, chevron, logout, etc.)
- App is responsive (mobile + desktop) — 1280px max-width on desktop, fluid on smaller viewports
- No additional scope beyond what is listed

---

## Sub-Tasks

---

### Sub-Task 0 — Install `lucide-react` dependency

**Intent:** The design reference uses `lucide-react` for all icons. Installing it in the frontend ensures icons match the spec exactly and avoids Unicode/emoji substitutes.

**Expected Outcomes:**
- `lucide-react` appears in `helpdesk-center-frontend/package.json` dependencies.
- `node_modules/lucide-react` is present and importable.

**Todo List:**
1. Run `npm install lucide-react` inside `helpdesk-center-frontend/`.

**Relevant Context:**
- [`package.json`](helpdesk-center-frontend/package.json) — current dependencies.

**Status:** [ ] pending

---

### Sub-Task 1 — Gitignore: add `front-end-design/` to root `.gitignore`

**Intent:** The user asked to gitignore the `front-end-design` folder from the root `.gitignore`. The backend `.gitignore` already contains `front-end-design/*` but the root `.gitignore` does not.

**Expected Outcomes:**
- `front-end-design/` is listed under a new comment block in the root `.gitignore`.

**Todo List:**
1. Open `.gitignore` at the workspace root.
2. Append `front-end-design/` under a `# Design reference` comment.

**Relevant Context:**
- File: [`.gitignore`](.gitignore)
- The backend `.gitignore` already has `front-end-design/*` at line 37 — we don't touch that.

**Status:** [ ] pending

---

### Sub-Task 2 — Global CSS: apply design tokens and base typography

**Intent:** The current [`index.css`](helpdesk-center-frontend/src/index.css) is minimal. We need to add CSS custom properties matching the design brief tokens, set Inter/Segoe UI font, add focus ring and input/button base resets, and add responsive utility classes (mobile breakpoints via media queries) that align with the design system.

**Expected Outcomes:**
- CSS variables for all design tokens (colors, shadows, radii) available globally.
- Base font stack is `"Inter", "Segoe UI", system-ui, sans-serif`.
- Focus ring style matches the `#3b82d4` accent.

**Todo List:**
1. Expand `helpdesk-center-frontend/src/index.css` to include:
   - CSS custom properties from the design brief (--bg-page, --bg-card, --border, --accent, status/priority/category badge colors, etc.).
   - Body font, background, text color.
   - `*` box-sizing reset.
   - `input`, `textarea`, `select` focus outlines matching design.
   - `button` cursor pointer default.
   - Media query helpers (e.g. hide/show columns on mobile, stack filter bar, collapse header to hamburger or simplified pill).

**Relevant Context:**
- Design token source: [`helpdesk-design-brief.md`](front-end-design/src/imports/pasted_text/helpdesk-design-brief.md) — Color Palette section.
- Design token CSS already defined in [`theme.css`](front-end-design/src/styles/theme.css) — use as reference only.

**Status:** [ ] pending

---

### Sub-Task 3 — AppHeader: add sticky header component

**Intent:** No persistent header exists in the current app. The design spec calls for a sticky 56px header with the Helpdesk Center logo/wordmark on the left and a user avatar pill + logout button on the right. This header must be shared across all authenticated pages. On mobile the header compresses the user pill to just the initials circle and keeps the logout icon-only.

**Expected Outcomes:**
- New file `helpdesk-center-frontend/src/components/AppHeader.jsx`.
- Displays: headset icon + "Helpdesk **Center**" wordmark, user initials circle + full name + role badge, Logout button.
- Sticky at top, 56px tall, white background with bottom border.

**Todo List:**
1. Create `helpdesk-center-frontend/src/components/AppHeader.jsx` with inline styles matching the design.
2. Export `AppHeader` with props `{ user, onLogout }`.
3. On mobile (≤640px): hide the username/role text, show only initials circle + logout icon.
4. Update `EmployeeDashboard.jsx` to import and render `<AppHeader>` instead of the custom header div.
5. Update `AgentDashboard.jsx` the same way.
6. Update `TicketDetailPage.jsx` the same way.

**Relevant Context:**
- Design reference: [`App.tsx` lines 324–357](front-end-design/src/app/App.tsx:324).
- User object from `AuthContext` has `fullName`, `role`, `username`.
- Initials need to be derived from `fullName` (e.g., first letter of each word, max 2 chars).

**Status:** [ ] pending

---

### Sub-Task 4 — Badge components: update StatusBadge and add PriorityBadge + CategoryBadge

**Intent:** The current `StatusBadge` uses computed alpha hex colors (`color + '20'`). The design spec defines exact per-badge background/border/text triplets. We also need separate `PriorityBadge` and `CategoryBadge` components (currently they're all routed through the same generic component).

**Expected Outcomes:**
- `StatusBadge.jsx` renders status-specific exact bg/border/text colors.
- New `PriorityBadge.jsx` renders priority-specific colors.
- New `CategoryBadge.jsx` renders category-specific colors with human-readable labels.
- All three use consistent 11px, font-weight 600, rounded-full badge style with border.

**Todo List:**
1. Rewrite `helpdesk-center-frontend/src/components/StatusBadge.jsx` to split into separate exports or keep just the `StatusBadge` for status values using the spec palette.
2. Create `helpdesk-center-frontend/src/components/PriorityBadge.jsx`.
3. Create `helpdesk-center-frontend/src/components/CategoryBadge.jsx` (mapping lowercase API values `hardware/software/hr` → human labels `Hardware/IT Software/HR`).
4. Update all consumers (`TicketCard.jsx`, `TicketDetailPage.jsx`) to import the new components.

**Relevant Context:**
- Design reference: [`App.tsx` lines 276–320](front-end-design/src/app/App.tsx:276).
- API values are lowercase (`open`, `in_progress`, `resolved`, `hardware`, `software`, `hr`, `critical`, `high`, `medium`, `low`).
- Current backend values for status: `open`, `in_progress`, `resolved`.

**Status:** [ ] pending

---

### Sub-Task 5 — TicketCard: upgrade to TicketRow design

**Intent:** The current `TicketCard` is a card with rounded corners and margin between cards. The design spec uses a table-like layout where rows are separated only by bottom borders (no gaps, no individual card shadows), with a left-border accent on hover and a chevron icon. On mobile, the badge columns collapse to a second line below the title.

**Expected Outcomes:**
- `TicketCard.jsx` renders as a horizontal row with no card shadow.
- Left: ticket ID (muted monospace) + title (bold) stacked.
- Right: CategoryBadge, StatusBadge, PriorityBadge, created date (muted), chevron icon.
- Hover state: `#f0f6ff` background + `#3b82d4` 3px left border.
- The parent container (`EmployeeDashboard`, `AgentDashboard`) wraps all rows in a single white card with shared shadow.
- Agent rows also show submitter name below the ticket ID.

**Todo List:**
1. Rewrite `helpdesk-center-frontend/src/components/TicketCard.jsx` with the row-style layout.
2. Add `showSubmitter` prop for agent view.
3. Use `onMouseEnter`/`onMouseLeave` for the left border hover effect.
4. On mobile, badges wrap to second line and the date/chevron stay visible.
5. Update `EmployeeDashboard.jsx` to wrap `filteredTickets.map()` in a container div with `bg-white`, `border`, `borderRadius: 8`, `overflow: hidden`, and `boxShadow`.
6. Update `AgentDashboard.jsx` the same way, passing `showSubmitter` to each `TicketCard`.

**Relevant Context:**
- Design reference: [`App.tsx` lines 464–502](front-end-design/src/app/App.tsx:464).
- Agent ticket data includes `createdBy.username`; the submitter display should use that.

**Status:** [ ] pending

---

### Sub-Task 6 — LoginPage: polish to match design spec

**Intent:** The current login page is functional but plain. The design spec calls for a centered card with a headset icon, app wordmark, tagline, clean focus ring inputs, and a full-width primary button.

**Expected Outcomes:**
- Headset icon (SVG or emoji/Unicode substitute since no icon library installed) in a `#eff6ff` rounded square above the title.
- Title: "Helpdesk Center" at 20px/700.
- Tagline: "Submit and track your support requests" in `#57606a`.
- Inputs with focus ring (`outline: none; box-shadow: 0 0 0 3px rgba(59,130,212,0.15)`).
- Error message shows inline below form with an icon.
- Card shadow: `0 1px 3px rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.04)`.

**Todo List:**
1. Update `helpdesk-center-frontend/src/pages/LoginPage.jsx` inline styles to match design spec.
2. Add a simple headset icon using a Unicode character (🎧) or inline SVG in the logo area.
3. Update input styles to include focus ring via `onFocus`/`onBlur` state.

**Relevant Context:**
- Design reference: [`App.tsx` lines 800–882](front-end-design/src/app/App.tsx:800).
- No icon library installed — use Unicode or inline SVG.

**Status:** [ ] pending

---

### Sub-Task 7 — EmployeeDashboard: toolbar, filter bar, and new ticket form polish

**Intent:** The dashboard toolbar, filter bar, and new ticket form need to match the design: page max-width 1280px, filter bar in a white card, "My Tickets" title with a count badge, "+ New Ticket" button with a plus icon, and the new ticket form upgraded to a slide-over drawer with the AI panel. On mobile the drawer goes full-width and the AI panel moves below the form fields.

**Expected Outcomes:**
- Page max-width changes from 760px to 1280px.
- Toolbar: "My Tickets" h1 + count badge on left, "+ New Ticket" button on right.
- Filter bar sits inside its own white rounded card with shadow.
- The new ticket form becomes a slide-over drawer (`position: fixed, right: 0, top: 0, height: 100%`) with the AI preview as a right-side panel inside the drawer.
- Success banner uses the design's green palette.

**Todo List:**
1. Update the `pageStyle` max-width to `1280px` in `EmployeeDashboard.jsx`.
2. Redesign the toolbar row with the count badge.
3. Wrap the filter selects in a white card container; on mobile, the filter bar scrolls horizontally.
4. Convert the inline form to a slide-over drawer overlay (fixed position, right-aligned, 720px wide on desktop; 100% wide on mobile).
5. On mobile the AI preview panel stacks below the form fields instead of side-by-side.
6. Polish the AI classification preview panel inside the drawer.

**Relevant Context:**
- Design reference: [`App.tsx` lines 886–992](front-end-design/src/app/App.tsx:886) for dashboard, [`App.tsx` lines 621–796](front-end-design/src/app/App.tsx:621) for modal.
- The existing AI preview logic (Watson NLU call) must be preserved — only the visual presentation changes.
- The existing `canSubmit` guard and `preview.allowed` flag must remain in place.

**Status:** [ ] pending

---

### Sub-Task 8 — AgentDashboard: match design layout

**Intent:** Same structural changes as the employee dashboard — 1280px max-width, filter bar in white card, "Support Queue" title with count badge. No "+ New Ticket" button (agents don't submit). Show submitter name in ticket rows.

**Expected Outcomes:**
- 1280px max-width.
- "Support Queue" title + count badge.
- Filter bar in white card.
- Ticket list in shared white card container.

**Todo List:**
1. Update `AgentDashboard.jsx` styles and layout to match the design — same structural changes as Employee Dashboard.
2. Pass `showSubmitter={true}` to each `TicketCard`.

**Relevant Context:**
- Design reference: [`App.tsx` lines 997–1068](front-end-design/src/app/App.tsx:997).

**Status:** [ ] pending

---

### Sub-Task 9 — TicketDetailPage: full redesign to match spec

**Intent:** The ticket detail page needs the two-column description/metadata layout, styled attachment rows with file-type icons, and improved comment thread with avatar initials bubbles. On mobile the two-column layout stacks to single column.

**Expected Outcomes:**
- `← Back to Dashboard` breadcrumb link.
- Header card: large title, ID + date + badges row, agent status update dropdown + Save button aligned right.
- Details card: 60/40 split — description on left, metadata on right (Submitted By, Assigned Agent, Created, Last Updated).
- Attachments card: file icon colored by type + filename + size + Download link.
- Comments card: avatar circle per comment + author bold + agent badge + timestamp + body. Add comment textarea + Post Comment button at bottom.
- 1280px max-width.

**Todo List:**
1. Update `helpdesk-center-frontend/src/pages/TicketDetailPage.jsx` layout to match the design.
2. Add inline `FileTypeIcon` helper function (no new file needed).
3. On mobile, the description/metadata two-column grid stacks to single column.
4. Update `helpdesk-center-frontend/src/components/CommentSection.jsx` to show avatar initials circle, agent badge, and timestamp formatting.
5. Derive initials from `c.user?.fullName` in comments (first letters of first/last name).

**Relevant Context:**
- Design reference: [`App.tsx` lines 1081–1303](front-end-design/src/app/App.tsx:1081).
- `ticket.createdBy.username` is available for display; `ticket.email` for submitter email.
- `c.user?.fullName` and `c.user?.role` available in comment objects from the API.

**Status:** [ ] pending

---

### Sub-Task 10 — EmptyState: add empty state component

**Intent:** Both dashboards need a proper empty state when there are no tickets — centered icon + message as per the design spec.

**Expected Outcomes:**
- New `helpdesk-center-frontend/src/components/EmptyState.jsx` component.
- Shows a rounded square icon container + descriptive text.
- Used in both `EmployeeDashboard` and `AgentDashboard`.

**Todo List:**
1. Create `helpdesk-center-frontend/src/components/EmptyState.jsx`.
2. Replace plain `<p>` empty state text in both dashboard pages with `<EmptyState>`.

**Relevant Context:**
- Design reference: [`App.tsx` lines 507–516](front-end-design/src/app/App.tsx:507).

**Status:** [ ] pending
