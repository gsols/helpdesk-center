# Plan: Dynamic AI Classification Panel — EmployeeDashboard

## Top-Level Overview

**Goal:** Replace the hardcoded `AI_BREAKDOWN` array in `EmployeeDashboard.jsx` with a live call
to the existing `POST /api/tickets/preview` backend endpoint. The right-column "AI Confidence
Breakdown" panel becomes reactive: it shows an idle empty state when the form is blank, a loading
spinner while the API is in-flight, and a single-row result (top predicted department + confidence)
once Watson responds. A 500ms debounce prevents hammering the API on every keystroke.

**Scope:** Frontend-only change. The backend endpoint `POST /api/tickets/preview` already exists
and returns the correct shape. No backend work required.

**Out of scope:** Multi-row breakdown display, confidence bar charts, Watson keyword drill-down.

---

## Architecture Diagram (text)

```
[title input]  ──┐
                 ├─► useDebouncedPreview(500ms) ──► POST /api/tickets/preview
[desc textarea]──┘                                         │
                                                           ▼
                                              { category, confidence, allowed, source }
                                                           │
                                                           ▼
                                              AiBreakdownPanel
                                              ├── idle state  (no text yet)
                                              ├── loading     (debounce active / fetch in-flight)
                                              ├── result      (category + confidence)
                                              └── low-conf    (category found but < 60%)
```

---

## Sub-Tasks

---

### Sub-Task 1 — Add `usePreviewTicket` hook

**Status:** `[ ] pending`

**Intent:**
Expose the existing `previewTicket()` API call as a React Query mutation hook so the component can
call it imperatively when debounced input changes.

**Expected Outcomes:**
- A new exported function `usePreviewTicket` exists in `src/hooks/useTickets.js`.
- It wraps `previewTicket(data)` from `ticketsApi.js` using `useMutation`.
- No breaking changes to existing exports.

**Todo List:**
1. Open `helpdesk-center-frontend/src/hooks/useTickets.js`.
2. Import `previewTicket` from `../api/ticketsApi`.
3. Add and export `usePreviewTicket` using `useMutation` — `mutationFn: (data) => previewTicket(data).then(r => r.data)`.
4. No `onSuccess` invalidation needed (preview has no side effects).

**Relevant Context:**
- `helpdesk-center-frontend/src/hooks/useTickets.js` — add alongside existing hooks
- `helpdesk-center-frontend/src/api/ticketsApi.js` line 12: `previewTicket` already defined

---

### Sub-Task 2 — Build `AiBreakdownPanel` component

**Status:** `[ ] pending`

**Intent:**
Extract the AI confidence breakdown panel into a focused sub-component that accepts the preview
result (or null/loading state) and renders the correct UI state. Keeping it separate from
`EmployeeDashboard` makes the states easy to test and reason about.

**Expected Outcomes:**
- A new component `AiBreakdownPanel` exists, either as a named function inside
  `EmployeeDashboard.jsx` (preferred — no new file) or extracted to its own file.
- Renders **4 distinct states**:

  | State | Trigger condition | Visual |
  |-------|-------------------|--------|
  | **idle** | title and description both empty/whitespace | Cpu icon + italic text "Describe your issue and our AI will classify it for you." Muted slate color. |
  | **loading** | debounce timer active OR mutation `isPending` | Animated pulse dot + "Analysing…" label in the same panel box |
  | **result** | mutation succeeded, `category` is non-null, `confidence >= 60` | Single row chip: department label (mapped from category key → display name) on left, confidence % bold blue on right, highlighted style matching existing wireframe primary row |
  | **low-confidence** | mutation succeeded but `allowed === false` | Single muted row: "Routing to triage (low confidence)" + confidence % in amber |

- No changes to any other component's rendered output.

**Todo List:**
1. Define a `CATEGORY_DISPLAY` map: `{ hardware: 'IT Hardware', software: 'IT Software', hr: 'HR' }`.
   These must match the seeder department names exactly.
2. Write `AiBreakdownPanel({ previewData, isLoading, hasInput })` function.
3. Implement the four states described above using only existing inline style patterns (no new CSS
   classes — keep consistent with the rest of `EmployeeDashboard.jsx`).
4. The idle state message must read exactly:
   **"Describe your issue and our AI will classify it for you."**
5. For the result row, reuse the existing chip/row style from the current hardcoded breakdown UI
   (the `primary: true` row pattern already in the file).

**Relevant Context:**
- `helpdesk-center-frontend/src/pages/EmployeeDashboard.jsx` lines 181–202 — current hardcoded breakdown (this block is replaced)
- `helpdesk-center-frontend/src/pages/EmployeeDashboard.jsx` lines 21–25 — `AI_BREAKDOWN` const to remove
- Backend preview response shape (from `AIService.java` lines 152–156):
  ```json
  { "source": "watson|fallback", "category": "hardware|software|hr|null",
    "confidence": 75.5, "allowed": true, "watsonKeywords": [...] }
  ```

---

### Sub-Task 3 — Wire debounce + preview call in `EmployeeDashboard`

**Status:** `[ ] pending`

**Intent:**
Add 500ms debounced state derived from `title + description`, call `usePreviewTicket.mutate()`
whenever the debounced value changes (and is non-empty), and pass the result + loading state into
`AiBreakdownPanel`.

**Expected Outcomes:**
- Typing in either the title or description field triggers the preview call 500ms after the user
  stops typing.
- Clearing both fields resets the panel to the idle state immediately (no pending call).
- The preview call does NOT block ticket submission — `handleSubmit` is unchanged.
- No new npm dependencies added (`useEffect` + `setTimeout`/`clearTimeout` is sufficient for
  debounce; no external library needed).

**Todo List:**
1. Remove the `AI_BREAKDOWN` const and its import-equivalent at the top of `EmployeeDashboard.jsx`.
2. Import `usePreviewTicket` from `../hooks/useTickets`.
3. Add a `useEffect` that fires when `title` or `desc` changes:
   - If both are empty/whitespace: call `previewMutation.reset()` immediately and clear any pending timer.
   - Otherwise: set a 500ms timer that calls `previewMutation.mutate({ title, description: desc })`.
   - Return a cleanup function that clears the timer.
4. Derive `hasInput` = `title.trim().length > 0 || desc.trim().length > 0`.
5. Replace the hardcoded breakdown JSX block (lines 181–202) with:
   ```jsx
   <AiBreakdownPanel
     previewData={previewMutation.data ?? null}
     isLoading={previewMutation.isPending}
     hasInput={hasInput}
   />
   ```

**Relevant Context:**
- `helpdesk-center-frontend/src/pages/EmployeeDashboard.jsx` — all changes are in this file
- `useMutation` from `@tanstack/react-query` exposes `.isPending`, `.data`, `.reset()` — all already
  available in the project

---

### Sub-Task 4 — Cleanup and validation

**Status:** `[ ] pending`

**Intent:**
Remove dead code, verify the feature works end-to-end in the browser, and update the session
handoff doc.

**Expected Outcomes:**
- `AI_BREAKDOWN` const and its usage are fully removed.
- No TypeScript/ESLint errors (project uses plain JS, so just ensure no console errors).
- Panel transitions correctly through all four states when tested manually:
  1. Load page → idle state visible.
  2. Type a title → loading → result appears.
  3. Clear fields → idle state returns.
  4. Type something ambiguous (e.g. "hello") → low-confidence or idle (fallback returns no category).
- `docs/context/current-session-handoff.md` updated to mark AI classification as complete.

**Todo List:**
1. Verify no remaining references to `AI_BREAKDOWN` in the codebase.
2. Confirm the `CATEGORY_DISPLAY` labels match exactly the department names seeded by `DataSeeder.java`
   (`IT Hardware`, `IT Software`, `HR`).
3. Run `npm run dev` and test all four panel states manually.
4. Update `docs/context/current-session-handoff.md`:
   - Move "AI Classification for department" from Next Up to What Has Been Done.

---

## Key Constraints

- **No new npm packages.** Debounce via native `useEffect` + `setTimeout`.
- **No backend changes.** `POST /api/tickets/preview` is already correct.
- **Single-row display** (Option A). Do not show secondary categories.
- **Exact idle copy:** "Describe your issue and our AI will classify it for you."
- **Debounce: 500ms.**
- **Category → display name mapping must match seeder departments exactly.**
