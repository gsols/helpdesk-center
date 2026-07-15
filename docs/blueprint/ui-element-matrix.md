# UI Element Matrix & Role-Based Visibility Rules

This document specifies the exact UI elements, form inputs, navigation tabs, and conditional access constraints for all screens. No AI agent may hallucinate, add, or delete elements outside this matrix.

---

## 1. The Gateway Hub (`LoginPage.jsx`)
A centralized, hard-edged card centered on a neutral background.

### UI Elements & Inputs:
- **Title Block**: Heading text reading "Log in to Helpdesk Center".
- **Subtitle Block**: Secondary text reading "Enter your corporate credentials below".
- **Input Field 1**: Label: "Company email", Placeholder: "name@company.com", Type: email, Required: true.
- **Input Field 2**: Label: "Password", Placeholder: "••••••••", Type: password, Required: true.
- **Action Target (Button)**: Text: "Sign In", Layout: Full width, Style: Dark slate, zero border radius (`rounded-none`).

---

## 2. Left Navigation Sidebar Rail (`AppShell.jsx`)
Visible to all authenticated users, but the navigation anchors adapt dynamically to the user's role.

### Universal Navigation Items (Visible to All Roles):
- **Workspace Link**: Clicking this takes the user to their respective primary dashboard area.
- **Account Settings Link**: Clicking this opens the personal profile password configuration panel.
- **Logout Action**: Located at the absolute bottom of the rail. Wipes JWT tokens from the context state.

### Conditional Navigation Items (Role-Based Locking):
- **Analytics Panel Link**: Visible ONLY to `DEPT_MANAGER` and `SYS_ADMIN`. Hidden entirely for `EMPLOYEE` and `AGENT`.
- **SLA Policy Config Link**: Visible ONLY to `SYS_ADMIN`. Hidden for all other roles.

---

## 3. Dynamic Workspace Content Views (Per Role)

### View A: Standard Employee Workspace (`EmployeeDashboard.jsx`)
- **When is it loaded?**: Active when `currentUser.role == 'EMPLOYEE'`.
- **Primary Layout**: Clean split canvas. Top form area for creating issues, bottom grid table for tracking them.
- **UI Elements (The Ticket Dropper Form)**:
  - Input: Title field (`Type: Text`, `Required: true`).
  - Input: Description text area field (`Type: Markdown Text`, `Required: true`).
  - Widget: File Dropzone block (`AttachmentDropzone.jsx`) for uploading logs/images.
  - Action Target (Button): Text: "Submit Issue" (`Style: bg-slate-900 text-white rounded-none`).
- **UI Elements (My Tickets Grid Table)**:
  - Header Title: "My Submitted Tickets".
  - Columns: Ticket ID (`font-mono`), Subject, Assigned Department, Status Badge.
  - *Hidden Elements*: Employees cannot see agents' names, SLA bars, or other people's tickets.

### View B: Customer Support Agent Workspace (`AgentDashboard.jsx`)
- **When is it loaded?**: Active when `currentUser.role == 'AGENT'`.
- **Primary Layout**: 3-Pane split panel architecture (`SplitPane.jsx`). Left nav rail, center interactive ticket stream, right fluid communication review workspace.
- **UI Elements (The Core Tab Bar - `TabBar.jsx`)**:
  - **Tab 1: My Queue**: Displays tickets where `assignee_id == currentUser.id AND status != 'CLOSED'`. Fully clickable with complete Read/Write conversation privileges.
  - **Tab 2: Department Pool**: Displays tickets where `department_id == currentUser.department_id AND assignee_id == NULL`. Adds a prominent, rounded action button cell target: **"Claim Ticket"**.
  - **Tab 3: Team Archive**: Displays tickets where `department_id == currentUser.department_id AND assignee_id != currentUser.id`. Renders dataset in Read-Only view form. Emestamps a fixed top error banner text: `[Viewing teammate's ticket (Read-Only)]`.
- **UI Elements (The Right Detail Focus Workspace - `TicketDetailPanel.jsx`)**:
  - **SLA Progress Bar**: Thin visual countdown gauge tracking breach limits. If status is `PENDING_EMPLOYEE`, displays an amber pause text warning.
  - **Action Target (Button)**: Text: "Re-Route Ticket". Clicking this loads the rounded overlay modal (`RerouteModal.jsx`) to fix an AI classification error.
  - **Message Box Input**: Textarea for text entry, clip icon button for multi-file storage appending, and a "Send Reply" action button target.

### View C: Department Manager Workspace (`ManagerDashboard.jsx`)
- **When is it loaded?**: Active when `currentUser.role == 'DEPT_MANAGER'`.
- **Primary Layout**: Uniform AppShell tracking, restricted entirely to `ticket.department_id == currentUser.department_id`.
- **UI Elements (Screen 1: Operations Overview)**: StatCards tracking Department Active Backlog, Team MTTR, and SLA Breach Rates alongside an Agent Workload horizontal bar graph.
- **UI Elements (Screen 2: Master Queue Matrix)**: High-density Jira table showing all department rows. Includes an interactive dropdown selector cell inside the "Assigned Agent" column allowing managers to manually execute workload overrides.
- **UI Elements (Screen 3: SLA Breach Risk Queue)**: Risk priority table sorted by due_at ascending, showing precise time-remaining metrics and an explicit "Escalate & Reassign" action button.


### View D: System Administrator Dashboard (`AdminDashboard.jsx` Part 2 / Settings)
- **When is it loaded?**: Active when `currentUser.role == 'SYS_ADMIN'`.
- **Primary Layout**: Operational control panels and systemic rules.
- **UI Elements (Global Triage Grid - `TriageQueue.jsx`)**:
  - Displays all tickets where `department_id == NULL` due to low watsonx AI classification scores (< 60.00%).
  - Action Target: A manual routing dropdown cell forcing assignment to a specific corporate department.
- **UI Elements (SLA Rules Table - `SlaConfigPanel.jsx`)**:
  - Explicit database entry configuration lines for LOW, MEDIUM, HIGH, and CRITICAL workflows.
  - Numeric input parameters modifying the `target_resolution_hours` property directly on the backend database table.
- **UI Elements (Tenant Integrations Panel)**:
  - Secure textual input box storing corporate target strings like Slack webhook endpoints.

### D. Same-Department Teammate Directory Sub-Panel (`AppShell.jsx` Sidebar)
- **Visibility**: Visible ONLY when `currentUser.role == 'AGENT'` or `DEPT_MANAGER`.
- **Structure**: A sharp-edged, collapsible section header at the bottom of the navigation rail labeled "My Department Team".
- **Dynamic Elements**: Loops through and displays rows of users where `user.department_id == currentUser.department_id AND user.role == 'AGENT'`.
- **Action Target (Click Event)**: Clicking a teammate's name instantly re-routes the central data pane route to render the designated **Teammate Workspace panel view**, passing the target colleague's `user_id` as a filter parameter.

### E. Gated Teammate Ticket Takeover Pipeline (`TeammateWorkspaceView.jsx`)
- **When is it loaded?**: Active when an agent clicks a peer from the "My Department Team" sub-panel. Route pattern: `/agent/team/:teammateId`.
- **Data Scope**: Executes a scoped backend lookup fetching all tickets where `department_id == currentAgent.department_id AND assignee_id == target_teammate.id`.
- **Read-Only State Enforcement**: The detail view panel renders a persistent, non-dismissible overlay banner reading `[Viewing teammate's workspace — Read-Only]`. All reply inputs, status droppers, and re-route controls are disabled and visually muted.

#### Action Target — "Take Over Ticket" Button (Agent-Side Trigger)
- **Label**: "Take Over Ticket"
- **Visibility**: Rendered on every ticket row card and inside the right-side detail panel header area, even while the read-only overlay is active.
- **Behavior on Click (Gated — NOT an instant ownership transfer)**:
  1. Fires a backend `PATCH` request that mutates `ticket.status` to `'PENDING_APPROVAL'` only — **does not** change `assignee_id` yet.
  2. Dispatches a high-priority `TAKEOVER_APPROVAL_REQUEST` notification row directly to the `DEPT_MANAGER` of the current department.
  3. Immediately disables the button in-place and replaces the label with the caption text: **"Awaiting Manager Approval…"** (muted style, non-interactive).

#### Action Behavior — Manager Notification Click (Approval Gate)
- **Alert Row Text**: *"Agent [Name] requests takeover approval for [TCK-XXXX]"*
- **Notification Type**: `TAKEOVER_APPROVAL_REQUEST` — structural alert variant; renders the ⚠️ flag indicator instead of the standard sapphire dot.
- **Interaction Target (Click)**:
  1. Triggers `PATCH /api/notifications/{id}/read` to clear the unread indicator.
  2. The frontend router intercepts the `TAKEOVER_APPROVAL_REQUEST` payload claim and **overrides standard ticket navigation**. Instead of routing to `/tickets/{ticketId}`, it forces the main workspace panel to load the **Administrative/Manager Inspection Drawer Panel** (`TicketInspectionDrawer.jsx`) for the referenced ticket.
  3. The detail drawer dynamically exposes a prominent binary action button control row in the drawer footer:
     - **[ Approve Takeover ]** — Green theme (`bg-green-600 text-white`). On click: executes `PATCH /api/tickets/{id}/approve-takeover`, sets `assignee_id = requestingAgent.id`, sets `status = 'IN_PROGRESS'`, writes a `TICKET_TAKEN_OVER` audit event (recording previous `assignee_id`, new `assignee_id`, and timestamp), and dispatches an `ASSIGNED` notification to the requesting agent.
     - **[ Reject Takeover ]** — Red theme (`bg-red-600 text-white`). On click: executes `PATCH /api/tickets/{id}/reject-takeover`, reverts `status` back to `'IN_PROGRESS'` (original assignee retains ownership), and dispatches a rejection notification to the requesting agent.
  4. After either action, both buttons are disabled and replaced with a confirmation caption ("Takeover Approved" or "Takeover Rejected") and the drawer closes after a short delay.

---

## 4. Global Notifications Center (`NotificationPanel.jsx`)
An interactive dropdown panel triggered by a bell icon in the `TopHeader` of `AppShell.jsx`. Visible to **all authenticated roles**.

### Trigger
- **Bell Icon**: Located in the top-right header bar. Displays a sapphire-blue circular badge (`bg-[#3b82d4]`) showing the live unread count (polled every 30 seconds via `GET /api/notifications/unread-count`). Badge is hidden when count is zero. Clicking opens/closes the dropdown.

### UI Elements & Interactive Targets:
- **Header Section**: Displays title text reading "Activity Feed" paired with an unread count badge. Includes a text button target reading "Mark all as read" (triggers `PATCH /api/notifications/mark-all-read`).
- **The Filter Tabs Toolbar**: Low-contrast, rounded pill tabs:
  - **"All Feed"**: Shows every notification. Visible to **all roles**.
  - **"Unread Only"**: Shows only unread notifications. Visible to **all roles**.
  - **"System Flags"**: Shows `SLA_BREACH` and `SYSTEM` type notifications only. Visible **ONLY** to `DEPT_MANAGER` and `SYS_ADMIN`.
- **The Alert Rows List**: Borderless horizontal layout blocks separated by faint bottom lines (`border-b #f3f4f6`).
  - **Unread Status Indicator**: A vibrant, rounded sapphire-blue dot (`8×8px, bg-[#3b82d4], rounded-full`) anchoring the left margin. Hidden (transparent placeholder) for read notifications.
  - **System Flag Indicator**: A ⚠️ emoji icon replaces the dot for `SLA_BREACH` and `SYSTEM` type notifications.
  - **Text Title Block**: Typography showing event intent text with monospace ticket link rendered in blue (e.g., *Manager Alex Rivera assigned ticket* `TCK-1089` *to your queue*).
  - **Timestamp Caption**: Relative chronological string (e.g., *5 mins ago*, *2 hrs ago*).
- **Interaction Target**: Clicking an alert row:
  1. Triggers `PATCH /api/notifications/{id}/read` to clear the unread dot.
  2. Navigates the UI router directly to `/tickets/{ticketId}` (the full `TicketDetailPage`).
  3. If the notification has no `ticketId` (e.g. system-only), clicking has no navigation effect.
- **"View full history" Footer Link**: Text button at the bottom of the panel.

### Notification Types & Who Receives Them
| Type         | Trigger                              | Recipient           |
|--------------|--------------------------------------|---------------------|
| `COMMENT`    | New comment posted on a ticket       | The other party (creator ↔ assignee) |
| `ASSIGNED`   | Ticket claimed or reassigned         | The new assignee (agent) or ticket creator |
| `SLA_BREACH` | SLA breach risk event                | DEPT_MANAGER, SYS_ADMIN |
| `SYSTEM`     | System-level event (e.g. integration) | SYS_ADMIN only     |
| `TAKEOVER_APPROVAL_REQUEST` | Agent requests ticket takeover approval | `DEPT_MANAGER` of the ticket's department only |

### Backend API
- `GET  /api/notifications` — fetch all for current user
- `GET  /api/notifications/unread-count` — lightweight badge poll
- `PATCH /api/notifications/{id}/read` — mark one read
- `PATCH /api/notifications/mark-all-read` — mark all read
- `PATCH /api/tickets/{id}/approve-takeover` — approve a pending takeover; sets `assignee_id`, sets `status = 'IN_PROGRESS'`, fires `ASSIGNED` notification to requesting agent
- `PATCH /api/tickets/{id}/reject-takeover` — reject a pending takeover; reverts `status = 'IN_PROGRESS'` for original assignee, fires rejection notification to requesting agent

---

## 5. System Admin Department & Team Manager Hub (`DepartmentManager.jsx`)
A specialized structural view allowing global configuration of tenant corporate divisions.

### Screen A: Master Department List View
- **Layout Vibe**: High-density grid table array mapping custom cards with zero border radius (`rounded-none`).
- **Interactive Targets**:
  - **Button**: "Create New Department" → Pops a sharp-edged modal form with three fields:
    1. **Department Name** (text input, required).
    2. **Manager** (live-search user picker, required) — searches all company users; the selected user will be assigned `role = 'DEPT_MANAGER'` on creation.
    3. **Initial Agents** (multi-select user picker, optional) — searches all company users except the already-selected manager; zero or more agents may be added at creation time.
    On confirm: `POST /api/departments` with `{ name, managerId, agentIds[] }`.
  - **Card Rows**: Clicking any department card layout block expands the interactive right inspector drawer panel.
  - **Button**: "Delete Department" → Triggers a prominent red action cell button. Pops an absolute data warning confirmation modal tracking the cascade rule: all department tickets are permanently purged (`ON DELETE CASCADE`) and all bound agents/managers are downgraded to `EMPLOYEE` with `department_id` set to `NULL`.

### Screen B: Extended Department Detailed Inspector Panel
- **Content Metrics**: Displays active Department Name string, current Department Manager profile name, and an inline pencil edit icon target next to it.
  - **Manager Handover Interlock**: Clicking the pencil icon converts the field into a live search input returning all corporate users except the currently assigned manager. Selecting a new user surfaces a confirmation modal: *"Are you sure you want to change the manager of this department? The previous manager will be downgraded to a standard employee, and the new user will gain full administrative operational clearance over this department's teams and analytics metrics."* On confirmation: new user row updates to `role = 'DEPT_MANAGER'` and `department_id = target_department.id`; previous manager row downgrades to `role = 'EMPLOYEE'`.
- **Teammate Data Grid**: Displays a high-density table mapping all active agents (`role == 'AGENT'`) currently bound to this department.
- **Action Target (Button)**: Text: "Add New Agent". Clicking loads an overlay selection panel listing all corporate employee accounts **not** already in this department (combines unassigned employees and agents active in other divisions).
  - **Standard Employee Add**: Selecting an unassigned employee updates their profile row: `department_id = current_department.id`, `role = 'AGENT'`.
  - **Cross-Department Agent Transfer Interlock**: If the selected user is currently an active agent in another department, execution is intercepted and a confirmation modal renders: *"Transfer this agent to this department? This will instantly remove them from their original department queues and wipe their active ticket assignments."* On confirmation: user row updates `department_id` to the target department and retains `role = 'AGENT'`.
