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
