# Session Handoff — UI Improvements Branch

## Branch
`ui-improvements`

## What Has Been Done

### 1. Employee View Rework (complete)
- **AppShell** (`src/components/AppShell.jsx`)
  - Employee nav trimmed to: Dashboard, Tickets, Settings only
  - "Main Menu" label removed
  - Brand subtitle now shows logged-in user's name dynamically
  - Standalone Settings shortcut button removed from bottom
  - `noPadding` prop added for full-height layouts
- **MyTicketsSidebar** (`src/components/MyTicketsSidebar.jsx`) — NEW
  - 300px dark collapsible panel on TicketDetailPage
  - Search, status badges, active card highlight
  - Collapse state persisted to `localStorage` key `hd_ticket_list_collapsed`
- **TicketDetailPage** (`src/pages/TicketDetailPage.jsx`)
  - Replaced AppShell-padded layout with noPadding + MyTicketsSidebar + TicketDetailPanel flex row
- **TicketDetailPanel** (`src/components/TicketDetailPanel.jsx`)
  - Wireframe-aligned: large mono #ID / Title header, badges right, SLA bar
  - Right sidebar: jira-card style, AI Classification, Metadata, Attachments, Timeline, Tags
- **SettingsPage** (`src/pages/SettingsPage.jsx`)
  - Employee role sees Profile only; admin/manager sees all 3 categories
  - Slack webhook placeholder is `https://hooks.slack.com/services/YOUR/WEBHOOK/URL` (safe dummy)

### 2. Employee Ticket Dropper Form Redesign (complete)
- **EmployeeDashboard** (`src/pages/EmployeeDashboard.jsx`)
  - **Department selector removed** — routing determined by watsonx.ai NLU
  - New 2-column layout: left (3fr) = title + markdown editor; right (1fr) = dropzone + AI breakdown
  - **AI breakdown is now dynamic** — live call to `POST /api/tickets/preview` (Watson NLU) with 500ms debounce
  - 4 panel states: idle (empty form), loading (analysing…), result (dept + confidence %), low-confidence (amber triage notice)
  - Category keys mapped to display names: `hardware → IT Hardware`, `software → IT Software`, `hr → HR`
  - **Ticket submission is functional** — `POST /api/tickets` then sequential `POST /api/tickets/{id}/attachments` per file
  - **Attachment dropzone is functional** — drag+drop + browse, client-side validation (PNG/JPG/GIF/PDF/TXT, 10 MB max), file list with remove, badge count
  - **Employee Personal Grid** — filter fixed to `t.creator?.id === user.id`, rows click to `/tickets/:id`, refresh button wired
- **useAttachments.js** (`src/hooks/useAttachments.js`) — NEW: `useUploadAttachment` mutation hook

### 3. Login Page Demo Accounts (complete)
- **LoginPage** (`src/pages/LoginPage.jsx`)
  - One-tap demo accounts panel below login card
  - 6 accounts: Employee, HR Agent, Software Agent, Hardware Agent, HR Manager, Admin

### 4. Data Seeder (complete)
- **DataSeeder.java** (`helpdesk-center-backend/src/main/java/com/helpdeskcenter/config/DataSeeder.java`)
  - Company: **IBM**
  - Departments: IT Hardware, IT Software, HR
  - Accounts (all password: `password123`):
    - `employee@ibm.com` — Alex Rivera (EMPLOYEE)
    - `hr.agent@ibm.com` — Jordan Lee (AGENT, HR)
    - `software.agent@ibm.com` — Morgan Chen (AGENT, IT Software)
    - `hardware.agent@ibm.com` — Casey Park (AGENT, IT Hardware)
    - `hr.manager@ibm.com` — Sam Torres (DEPT_MANAGER, HR)
    - `admin@ibm.com` — System Admin (SYS_ADMIN)

## Known Issues / Pending
- GitHub push blocked by secret scanning on old commit `0b197134` (Slack webhook URL)
  - Fix: visit https://github.com/gsols/helpdesk-center/security/secret-scanning/unblock-secret/3GGv1llWmR6NxcvDoiEEWosSTsa to allow/bypass, then push
  - OR: `git rebase -i 0b197134^` and drop that commit, then force push
- DB needs to be wiped and backend restarted for new seeder to run (seeder skips if users exist)

## Tech Stack
- Frontend: React + Vite, Tailwind CSS, lucide-react, @tanstack/react-query
- Backend: Spring Boot 3.3.5, PostgreSQL (`helpdesk_db`, user `helpdesk_user`, pass `helpdesk_pass`, port 5432)
- Backend port: 8080
- Frontend dev: `npm run dev` in `helpdesk-center-frontend/`
- Backend dev: `mvn spring-boot:run` in `helpdesk-center-backend/`

## Wireframe References
All wireframes in `docs/wireframes/stitch_multi_tenant_support_command_center/`
- `employee_ticket_detail_refined_layout/` — ticket detail page design
- `my_tickets_ai_triage_breakdown_support_engine/` — employee dashboard design

## Next Up (not started)
- Agent dashboard view rework
- Manager dashboard view rework
- Admin dashboard view rework
