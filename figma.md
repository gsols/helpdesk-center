# Figma Design Prompt — Helpdesk Center

## Design Brief

Create a high-fidelity UI design for **Helpdesk Center**, an internal IT and HR support ticketing web application. The design should feel clean, professional, and enterprise-grade — inspired by the visual language of modern SaaS admin tools: light backgrounds, generous white space, subtle card elevation, crisp typography, and color used sparingly to communicate meaning (status, priority, category).

The reference images provided illustrate the **tone and feel** only — not the layout. Think soft shadows, clean grid alignment, neutral base palette with a single confident accent color, and dense-but-readable data tables.

---

## Visual Theme & Style Direction

### Aesthetic
- **Style:** Clean enterprise SaaS / internal admin dashboard
- **Mood:** Professional, calm, functional — not flashy
- **Density:** Medium — enough breathing room to feel modern, but dense enough to show data efficiently
- **Elevation model:** Subtle card shadows (1–2px y-offset, 8–16px blur, 5–8% opacity black). No heavy drop shadows.
- **Corner radius:** 8px for cards and modals; 6px for inputs and buttons; 4px for badges

### Color Palette

| Token | Color | Usage |
|-------|-------|-------|
| `--bg-page` | `#f7f8fa` | Page background |
| `--bg-card` | `#ffffff` | Card, panel, modal backgrounds |
| `--bg-sidebar` | `#ffffff` | Sidebar background (white with subtle border) |
| `--border` | `#e5e7eb` | Card borders, dividers |
| `--border-input` | `#d1d5db` | Input borders |
| `--text-primary` | `#1f2328` | Headings, body text |
| `--text-secondary` | `#57606a` | Metadata, labels, captions |
| `--text-muted` | `#9ca3af` | Placeholder text, disabled state |
| `--accent` | `#3b82d4` | Primary buttons, active nav item, links |
| `--accent-hover` | `#2c6fbd` | Hover state on primary elements |
| `--accent-light` | `#eff6ff` | Selected row highlight, info badge background |

### Status Badge Colors

| Status | Text | Background | Border |
|--------|------|-----------|--------|
| Open | `#1d4ed8` | `#eff6ff` | `#bfdbfe` |
| In Progress | `#7c3aed` | `#f5f3ff` | `#ddd6fe` |
| Resolved | `#15803d` | `#f0fdf4` | `#bbf7d0` |

### Priority Badge Colors

| Priority | Text | Background | Border |
|----------|------|-----------|--------|
| Critical | `#b91c1c` | `#fef2f2` | `#fecaca` |
| High | `#c2410c` | `#fff7ed` | `#fed7aa` |
| Medium | `#b45309` | `#fffbeb` | `#fde68a` |
| Low | `#15803d` | `#f0fdf4` | `#bbf7d0` |

### Category Badge Colors

| Category | Text | Background | Border |
|----------|------|-----------|--------|
| Hardware | `#1d4ed8` | `#eff6ff` | `#bfdbfe` |
| Software | `#7c3aed` | `#f5f3ff` | `#ddd6fe` |
| HR | `#065f46` | `#ecfdf5` | `#a7f3d0` |

### Typography

| Role | Size | Weight | Color |
|------|------|--------|-------|
| Page Title | 20px | 700 | `#1f2328` |
| Section Heading | 16px | 700 | `#1f2328` |
| Card Title | 15px | 600 | `#1f2328` |
| Body / Table Row | 14px | 400 | `#1f2328` |
| Label / Sub-heading | 13px | 600 | `#1f2328` |
| Metadata / Caption | 12px | 400 | `#57606a` |
| Badge Text | 11px | 600 | (per badge palette) |
| Font Family | `"Inter"` or `"Segoe UI"` | — | — |

---

## Application Structure

The app has **two user roles** — Employee and Support Agent — each with their own dashboard. Design screens for both. There is no persistent sidebar; navigation is handled through the top header bar and role-based routing.

---

## Screens to Design

### 1. Login Page
- Centered card on a light gray page background (`#f7f8fa`)
- App logo/wordmark: "Helpdesk Center" with a small support/headset icon in `#3b82d4`
- Tagline: "Submit and track your support requests"
- Form fields: Username, Password
- Primary CTA button: "Sign In" (full width, `#3b82d4`)
- Minimal error state inline (red text under field on failed login)
- No "Register" or "Forgot Password" links — internal tool

---

### 2. Employee Dashboard
The employee's home view: a list of their support tickets and a way to submit new ones.

**Header Bar (top, sticky)**
- Left: App wordmark / logo
- Right: User avatar pill (initials circle + username + role badge), Logout button

**Toolbar Row (below header)**
- Left: Page title "My Tickets" + ticket count badge (e.g. "12 tickets")
- Right: "+ New Ticket" primary button

**Filter Bar (below toolbar)**
- Row of compact filter dropdowns: Category, Status, Priority, Date From, Date To
- "Clear Filters" ghost button (text link style)
- Sort dropdown (Newest / Oldest)

**Ticket List (main content)**
- Each ticket rendered as a horizontal card row:
  - Left: Ticket ID (small, muted) + Title (medium, bold) stacked vertically
  - Middle columns: Category badge, Status badge, Priority badge
  - Right: Created date (muted), chevron arrow →
- Hover state: light `#f0f6ff` background, slight left border accent in `#3b82d4`
- Empty state: centered illustration placeholder + "No tickets found. Submit your first request." text
- Cards separated by 1px borders, no gap; feels like a table

**AI Preview Panel (appears when "+ New Ticket" form is open)**
- Right-side panel or drawer that shows the AI-predicted Category and Priority as the user types
- Shows confidence with subtle animated pill badges
- Label: "AI Classification Preview"

---

### 3. New Ticket Form (Modal or Slide-over Drawer)
Triggered by "+ New Ticket" button on Employee Dashboard.

**Form Fields:**
- Title (text input, full width)
- Description (textarea, 4 rows)
- File Attachment (drag-and-drop zone with "or click to browse"; shows uploaded file name with remove icon)
- Category (read-only display — "Auto-detected by AI" with badge, or "Detecting…" shimmer state)
- Priority (read-only display — same as above)

**Footer Actions:**
- "Cancel" (ghost/secondary button)
- "Submit Ticket" (primary button, `#3b82d4`)

**Validation States:**
- Empty required field: red border on input + inline error text below

---

### 4. Agent Dashboard
The support agent's queue of tickets assigned to their category.

**Header Bar** — same structure as Employee Dashboard

**Toolbar Row**
- Left: "Support Queue" page title + ticket count
- Right: no "+ New Ticket" button (agents don't submit)

**Filter Bar** — same layout as Employee Dashboard (Status, Priority, Date From, Date To; no Category since they only see their own)

**Ticket List** — same card row style as Employee Dashboard, but includes:
- Submitter name in the row (small, muted)
- No chevron needed on hover; entire row is clickable

---

### 5. Ticket Detail Page
Full view of a single ticket, accessible by both roles.

**Header Bar** — app logo + user info + logout (same as dashboards)

**Breadcrumb:** `← Back to Dashboard`

**Ticket Header Section (top card)**
- Large ticket title (20px, bold)
- Row below: Ticket ID (muted) + Created date + Category badge + Status badge + Priority badge
- If agent: "Update Status" dropdown + "Save" button aligned to the right of header card

**Details Card (below header card)**
- Two-column layout (60/40 split):
  - Left column: "Description" section heading + full description text
  - Right column: "Submitted By" (name + email), "Assigned Agent" (name or "Unassigned"), "Created", "Last Updated"

**Attachments Card**
- Section heading "Attachments" + count badge
- Each attachment as a row: file icon (colored by type: PDF red, image blue, text gray) + filename + file size (muted) + "Download" button (text link style, `#3b82d4`)
- Empty state: "No attachments."

**Comments Card (bottom)**
- Section heading "Comments"
- Comment thread: each comment has avatar circle (initials, `#3b82d4` background) + author name (bold) + timestamp (muted) + message body
- "Add a comment" textarea at the bottom with "Post Comment" primary button
- Comments separated by thin horizontal dividers

---

### 6. Component Library / Design Tokens Sheet
A separate Figma page documenting:
- Color swatches for all tokens
- Typography scale examples
- Button states: default, hover, disabled, loading
- Badge variants: all status, priority, and category badges
- Input states: default, focus, error, disabled
- Card shadow styles
- Empty state illustration placeholder (box with icon)
- Loading / shimmer skeleton bars

---

## Layout Specs

| Element | Value |
|---------|-------|
| Page max-width | 1280px, centered |
| Content area padding | 24px horizontal |
| Card padding | 20px |
| Card border-radius | 8px |
| Card box-shadow | `0 1px 3px rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.04)` |
| Gap between cards | 16px |
| Header height | 56px |
| Filter bar height | 48px |
| Input height | 36px |
| Button height (primary) | 36px |
| Border (dividers) | `1px solid #e5e7eb` |

---

## Figma Organizational Notes

- Use **Auto Layout** for all cards, rows, and forms
- Use **Components** for: TicketCard row, StatusBadge, PriorityBadge, CategoryBadge, Button (variants: primary / secondary / ghost), Input field, Avatar pill
- Use **Variants** on badge components (status/priority/category in one component set)
- Use **Frames** for each page: `Login`, `Employee Dashboard`, `Agent Dashboard`, `Ticket Detail`, `New Ticket Modal`, `Component Library`
- Use **Local Styles** for all colors and text styles listed above
- Desktop frame size: **1440 × 900**

---

## Do Not Include

- Dark mode variant (not in scope)
- Mobile / responsive layout (desktop-only internal tool)
- Onboarding or marketing screens
- Settings, profile, or admin management screens
- Any sidebar navigation (the app uses header-based routing only)
