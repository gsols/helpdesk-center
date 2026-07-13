# UI/UX Blueprint: Global User Flows & Interaction Architecture

This document maps out the comprehensive user experience, layout topology, and screen-to-screen user flows for the Multi-Tenant Support Help Desk. All generated code blocks and prototyping screens must conform to the states and technical actions mapped here.

---

## 1. Global Navigation Frame & Shell Layout (`AppShell.jsx`)
The universal app shell acts as the boundary container wrapping all screens post-authentication. It enforces the global viewport lock constraint (`h-screen overflow-hidden`).

### A. The Structural Layout Split
1. **Left Primary Navigation Rail (Fixed: 64px Width, `rounded-none`, Dark Slate Fill)**:
   - Dedicated Company Branding Icon (Multi-tenant dynamic placeholder).
   - Core Navigation Icon Anchors: Workspace/Queue, Analytics Panel, SLA Config (Admin/Manager Only), Settings.
   - Bottom Profile Avatar widget (Triggers Quick Logout / Theme Shift Overlay).
2. **Top Application Header (Fixed: 4rem Height, `border-b`, Slate White/Ink Panels)**:
   - Left section: Breadcrumb string navigation (e.g., `Helpdesk / Agent Workspace / Open Queue`).
   - Right section: Global Tenant Context Indicator Badge + System Clock (Live SLA tracking synchronization).

---

## 2. Comprehensive User Flows & Screen States

### Flow 1: Gateway Authentication Hub (`LoginPage.jsx`)
- **Visual Design**: Hard-edged, centered panel card layout (`rounded-none`, elevated drop shadow).
- **Core Interactive Fields**: 
  - Dynamic Multi-Tenant Workspace ID Text Field (e.g., `company-subdomain`).
  - Corporate Email Address text input, Secured Password text field.
- **State Logic & Validations**:
  - Unauthenticated fallback interceptors block any deep-linking past this view.
  - Submitting input fires an API mutation against `/api/v1/auth/login`. On success, JWT claims are injected into local `AuthContext`, and the user is redirected via the role-based router gateway.

### Flow 2: Employee Intake & Status Dashboard (`EmployeeDashboard.jsx`)
- **Layout Topology**: Minimalist split grid layout. Top banner manages creation controls; bottom table tracks active personal tickets.
- **Functional Requirements**:
  - **The Ticket Dropper Form**: Form containing Title and a detailed markdown text area description.
  - **Attachment Dropzone (`AttachmentDropzone.jsx`)**: A dashed-border container supporting drag-and-drop file attachments. Uses local file validation rules before firing async pre-signed S3 upload links.
- **The Employee Personal Grid**: A compact, borderless rows table displaying ONLY tickets where `creator_id == current_user.id`. 
  - Columns: ID (`font-mono`), Title, Department Target (Auto-assigned or marked Triage), Date Created, Status Badge.
  - **Interaction**: Clicking an index row flips the pane view into the dedicated `TicketDetailPage.jsx` layout.

### Flow 3: Three-Pane Agent Command Center (`AgentDashboard.jsx`)
- **Layout Topology**: Multi-Tab Master-Detail view mapped explicitly to your `SplitPane.jsx` container.
- **Functional Tab Bar Enforce Actions (`TabBar.jsx`)**:
  - **Tab A: My Queue (Primary Focus)**: Feeds dataset tracking `assignee_id == current_user.id AND status != 'CLOSED'`. Agents hold full Read/Write transactional capacity here.
  - **Tab B: Department Pool (Unassigned)**: Feeds items matching `department_id == agent.department_id AND assignee_id == NULL`. Renders a highly visible, rounded interactive button option: **"Claim and Takeover Ticket"**.
  - **Tab C: Department Archive (Teammate View)**: Pulls tickets matching `department_id == agent.department_id AND assignee_id != current_user.id`. Enforces a persistent overlay banner alert: `[Read-Only Mode: Teammate Assigned Workspace]`.
- **The Interactive Right Detail View (`TicketDetailPanel.jsx`)**:
  - Displays the active conversation thread (`CommentSection.jsx`).
  - Integrates the live **SLA Timeline Tracking Bar**. If a ticket status flips to `PENDING_EMPLOYEE`, the bar displays an animated amber pause state indicator.
  - **Reroute Trigger Overlay (`RerouteModal.jsx`)**: A rounded click modal window that lets agents override classification mistakes. Choosing a target department instantly clears the ticket from the agent's view.

### Flow 3B: Teammate Workspace View (`/agent/team/:teammateId`)
- **Entry Point**: Triggered when the agent clicks a peer's name in the "My Department Team" collapsible sub-panel in the navigation rail.
- **Layout Topology**: Identical three-pane layout as the main Agent Command Center. The left pane lists tickets scoped to the selected teammate (`assignee_id == teammateId AND department_id == currentAgent.department_id`).
- **Read-Only Overlay State**:
  - A non-dismissible top banner persists across all ticket views in this route: `[Viewing teammate's workspace — Read-Only]`.
  - All text inputs, send buttons, status droppers, re-route controls, and attachment uploaders are visually disabled (reduced opacity, `pointer-events: none`).
- **Takeover Interaction Flow**:
  1. A **"Take Over Ticket"** button is visible on each ticket card in the left pane list and in the right detail panel's primary action area — displayed even under the read-only overlay.
  2. Agent clicks **"Take Over Ticket"**.
  3. A brief confirmation modal appears: *"You are about to take over this ticket from [teammate name]. This will move it to your My Queue and grant you full access."* — with **Confirm** and **Cancel** targets.
  4. On **Confirm**: fires `PATCH /api/tickets/:id/takeover`, which atomically sets `assignee_id = currentUser.id` and `status = 'IN_PROGRESS'`, and writes a `TICKET_TAKEN_OVER` audit event.
  5. On success: the read-only overlay is lifted, the ticket is removed from the teammate view list, and the router navigates the claiming agent to `/agent/:ticketId` (their normal full-access workspace).

### Flow 4: Core Conversation & Collaborative Thread (`CommentSection.jsx`)
- **Visual Structure**: Threaded discussion logs. Employee comments align to the left margins; internal Agent entries use subtle slate callout shading backgrounds and align to the right margins.
- **State Machine Trigger Mechanics**:
  - **Action A: Agent Posts Comment**: Backend saves message payload, fires async background update email notification threads, and auto-mutates `ticket.status` state to `PENDING_EMPLOYEE`.
  - **Action B: Employee Posts Comment**: Reverts state instantly back to `IN_PROGRESS`, restarting the SLA tracking timer math routines in the database.

### Flow 5: Operational Governance & Management Hub (`AdminDashboard.jsx`)
- **Analytics Management Engine (`AnalyticsPanel.jsx`)**:
  - High-density, borderless tabular views tracking complete tenant metrics.
  - Renders top KPI modules calculating First Response Time (FRT), Mean Time to Resolution (MTTR), and overall IBM Watsonx AI Router accuracy levels based on SQL aggregation math.
- **SLA Policy Panel (`SlaConfigPanel.jsx`)**:
  - A settings interface where managers manipulate priority parameters.
  - Features high-density row sliders or form metrics allowing admins to update `target_resolution_hours` variables matching specific priorities, directly editing records inside the `sla_rules` table.

### Flow 6: Account System Settings (`SettingsPage.jsx`)
- **Visual Structure**: Twin-panel split framework. Left sidebar selects setting target domains; right panel surfaces editable inputs.
- **Functional Configuration Fields**:
  - Profile Configuration (Password modifications, user role view details).
  - Multi-Tenant Preferences (Company parameter adjustments, dark-mode/light-mode toggles).
  - Integrations Panel: A secured input area for entry fields like corporate Slack incoming webhook parameters.

---

## 3. Global Front-End Error Boundaries & Network Fallbacks
- **403 Forbidden State Overlay**: If an agent attempts to open a ticket route that violates cross-department boundaries, the router catches the exception and forces a full-screen, sharp-edged `rounded-none` Access Denied panel blocker state.
- **Network Offline Warning Banner**: A thin, high-visibility banner drops from the top application shell header if network drops occur, signaling to agents that background SLA state syncing is temporarily disconnected.
