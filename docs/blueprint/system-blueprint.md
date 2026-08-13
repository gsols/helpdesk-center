# ClassifAi — System Blueprint: Multi-Tenant AI Help Desk Platform

This document serves as the absolute source of truth and comprehensive master plan for the implementation of the Multi-Tenant Support Help Desk application. All AI coding assistants, agents, and developers must strictly adhere to the architecture, business logic, constraints, and development phases outlined below.

---

## 1. Project High-Level Overview & Core Value
The system is a multi-tenant help desk application designed for organizations where employees can submit work-related issues impacting various departments (e.g., IT, HR, Finance, Facilities). 

The platform's core differentiator is automated ticket triage using **IBM watsonx.ai** to extract intent, classify issues, and intelligently assign them to the correct department queue, eliminating human routing delay.

---

## 2. Global Business Rules & Logic Constraints

### A. AI Taxonomy, Routing, & Fallback (Triage) Logic
1. **Confidence Threshold**: When an issue text is dispatched to the IBM watsonx.ai classification endpoint, it must return a predicted department tag and a numerical confidence score (0.00 to 100.00).
2. **The Triage Queue**: If the AI confidence score drops **below 60.00%**, or if the classification engine encounters an unexpected network/service failure, the system must set `department_id = NULL`. This drops the ticket into the global **"Uncategorized/Triage"** queue.
3. **Manual Clarification Loop**: System Administrators or specific Triage Managers supervise the Uncategorized queue. They review vague tickets (e.g., *"My thing is broken"*) and use a dedicated UI channel to message the employee for clarification or manually force-assign a department tag.
4. **Multi-Department Tickets (Parent-Child Splitting)**: If an employee's ticket contains text signaling problems across multiple departments (e.g., *"The new office laptop arrived but my payroll portal login fails"*):
   - The initial ticket becomes a **Parent Ticket**.
   - The system or an agent generates isolated **Child Tickets** linked via `parent_id`.
   - Each Child Ticket gets routed to its respective department (`department_id` assigned to IT for one, Finance for the other).
   - Independent agents work their separate Child Tickets. The Parent Ticket remains open and aggregates updates, closing automatically *only* when all Child Tickets are marked `RESOLVED` or `CLOSED`.

### B. User Roles & Permission Boundaries
The system enforces strict data-privacy isolation across four explicit roles:
1. **Employee**: 
   - Can create tickets.
   - Can *only* view, read, or comment on tickets where they are the explicit creator (`creator_id = current_user.id`).
2. **Agent**:
   - Belongs to a dedicated department (e.g., HR Agent).
   - **My Queue View (Primary Workspace - Read/Write)**: Full control over tickets specifically assigned to their individual account (`assignee_id == current_user.id`). This is their main daily focus.
   - **Department Pool View (Unassigned - Read/Write)**: Can view and claim any ticket matching their department that has no assignee (`department_id == agent.department_id AND assignee_id == NULL`).
   - **Department Archive View (Peer Collaboration - Read Only)**: Can search and view tickets assigned to *other agents* within their same department (`department_id == agent.department_id AND assignee_id != current_user.id`). This allows team members to review peer historical fixes or take over work if a colleague is absent. However, they *cannot* edit descriptions, change statuses, or re-route these tickets unless they explicitly claim ownership via the **Takeover Override** action (see below).
   - **Teammate Workspace View**: A dedicated scoped view (`/agent/team/:teammateId`) showing all tickets assigned to a specific peer in the same department. The view is read-only by default but exposes a **"Take Over Ticket"** action button on every ticket.
   - **Ticket Takeover Transaction**: Clicking "Take Over Ticket" executes a single atomic backend transaction: `SET assignee_id = currentUser.id, status = 'IN_PROGRESS'`. The system must also write an audit event (`TICKET_TAKEN_OVER`) recording the previous `assignee_id`, the new `assignee_id`, and the timestamp. Upon completion, the ticket immediately migrates from the teammate's queue to the claiming agent's **My Queue**, and the claiming agent is granted full Read/Write communication privileges.
   - **Cross-Department Block (Absolute Restriction)**: Agents are completely blocked from viewing, searching, or interacting with tickets belonging to other departments entirely (`ticket.department_id != agent.department_id`) to safeguard sensitive organizational data.
3. **Department Manager**:
   - Can view all tickets inside their assigned department.
   - Has permission to manually override workloads, reassign tickets to specific agents, and view team resolution performance metrics.
4. **System Admin**:
    - Global multi-tenant clearance. Configures systemic parameters, creates/deletes company spaces, manages global settings, and configures third-party integrations.
    - **Department Lifecycle Authority**: Creates and destroys department records. Destruction is an atomic cascade — see **§ I** below.
    - **Agent Allocation Control**: Assigns unassigned employees or transfers active agents from other departments directly from the Department Inspector Panel.
    - **Manager Handover Control**: Replaces the active `DEPT_MANAGER` of any department. The outgoing manager is immediately downgraded to `EMPLOYEE`.

### C. Handling Misclassifications & AI Feedback Loops
1. **The Re-Route Mechanism**: If the AI misclassifies a ticket (e.g., routes a confidential payroll ticket to the IT department queue), the IT agent must click a **"Re-Route Ticket"** action.
2. **Instant Isolation**: Upon re-routing, the agent selects the correct target department from a restricted dropdown. The system updates the `department_id` field immediately, making the ticket instantly vanish from the IT dashboard view and securely populating the target department's queue.
3. **AI Training Payload Logging**: Every time an agent triggers a manual re-route action, the backend transaction must write an event log payload into the `ai_classification_logs` table. This dataset acts as an isolated, high-value training log that system admins export periodically to retrain or fine-tune the company's custom IBM watsonx.ai underlying classification model.

### D. Ticket Lifecycle & Conversation State Flows
Every ticket must transition through these precise, state-controlled enums:
[ OPEN ] ──> [ IN_PROGRESS ] ──> [ PENDING_EMPLOYEE ] ──> [ RESOLVED ] ──> [ CLOSED ]
*   **OPEN**: Freshly submitted by an employee, or newly dropped into a queue via a human re-routing or triage loop. No agent has officially claimed ownership yet.
*   **IN_PROGRESS**: An agent has actively assigned the ticket to themselves or a manager has delegated it. The agent is working on a fix.
*   **PENDING_EMPLOYEE**: Triggered automatically whenever an Agent submits a new message reply to the Employee. The SLA clock countdown pauses, and the system waits for the user's input/comment. When the employee submits a response message, the state reverts instantly to **IN_PROGRESS** and resumes the SLA clock.
*   **RESOLVED**: The technical or operational fix has been applied. The employee receives a notification.
*   **CLOSED**: Read-only archival state. The system automatically locks the ticket 3 calendar days after moving to `RESOLVED` if the employee does not explicitly trigger a re-open action.

### E. Multi-File Attachments System Architecture
1. **Database Decoupling**: File payloads must never be written into PostgreSQL as binary data blocks. 
2. **Object Storage Engine**: Binary assets must be uploaded to an Object Storage Service (AWS S3, Google Cloud Storage, or MinIO). PostgreSQL stores only metadata and a secure web retrieval locator string (`secure_url`).
3. **Association Scope**: Attachments are valid on initial ticket generation (associated to `ticket_id`) or dynamically appended inside conversation text blocks (associated to `message_id`).

### I. System Admin Department Management Rules

#### I.0 — Department Creation
`POST /api/departments` accepts `{ name, managerId, agentIds[] }`. In a single transaction:
1. A new `departments` row is inserted.
2. The selected manager's row is updated: `role = 'DEPT_MANAGER'`, `department_id = new_department.id`.
3. Each selected agent's row is updated: `role = 'AGENT'`, `department_id = new_department.id` (cross-department transfers are treated the same as the Add Agent pipeline in § I.2).

#### I.1 — Cascading Department Deletion (Tear-Down Rule)
When a System Admin confirms the "Delete Department" action, the backend executes a single atomic transaction:
1. **Ticket Purge**: Every `tickets` row with `department_id == deleted_department.id` is hard-deleted via `ON DELETE CASCADE`. All child tickets (`parent_id` cascade), `ticket_messages`, `attachments`, `ai_classification_logs`, and `notifications` referencing those tickets are purged with them.
2. **Agent Status Strip**: Every `users` row inside the deleted department where `role IN ('AGENT', 'DEPT_MANAGER')` is updated: `department_id = NULL`, `role = 'EMPLOYEE'`. These users lose all agent queue access instantly.

#### I.2 — Dynamic Agent Allocation Pipeline (Add / Transfer)
When an admin opens the Department Inspector Panel and clicks **"Add New Agent"**:
1. **Eligibility Filter**: The backend returns all users in the same company *except* those already in the current department. This combined list includes unassigned employees and agents active in other departments.
2. **Standard Employee Promotion**: Selecting an employee with no department sets `department_id = current_department.id`, `role = 'AGENT'`.
3. **Cross-Department Agent Transfer Interlock**: If the selected user is currently `role = 'AGENT'` in another department, the frontend intercepts the action and forces a confirmation modal before proceeding. On confirmation: `department_id` is updated to the target department; `role` remains `'AGENT'`. The user's active ticket assignments in the original department are implicitly wiped by the change.

#### I.3 — Department Manager Handover Interlock
The System Admin may replace the active `DEPT_MANAGER` of any department at any time:
1. The admin clicks the inline pencil icon next to the manager's name in the Inspector Panel.
2. A live search input appears, returning all company users **except** the currently assigned manager.
3. Selecting a new user triggers a confirmation modal: *"Are you sure you want to change the manager of this department? The previous manager will be downgraded to a standard employee, and the new user will gain full administrative operational clearance over this department's teams and analytics metrics."*
4. On confirmation, the backend executes two updates atomically:
   - Previous manager row: `role = 'EMPLOYEE'` (department_id remains unchanged unless admin explicitly removes them).
   - New manager row: `role = 'DEPT_MANAGER'`, `department_id = target_department.id`.

### F. Asynchronous Non-Blocking Email Layer ✅ Implemented
1. **Asynchronous Execution Constraint**: Email transmission commands must never run directly within the HTTP Request-Response lifecycle threads. Doing so creates artificial execution latency for the client.
2. **Event Workers**: Critical notification mutations (Ticket Created, Message Appended, State Shifted) dispatch events captured by Spring Boot's background `@Async` worker threads. The user gets a near-instant clean HTTP JSON reply while workers process external SMTP or SES integrations.

**Implementation detail (completed):**
- `EmailService` uses `@Async` + `JavaMailSender` + Thymeleaf HTML templates (`email/new-comment.html`, `email/ticket-assigned.html`).
- Triggered from `CommentService.addComment()` (comment posted → email recipient) and `TicketService.assignToMe()` / `TicketService.reassignTicket()` (assignment → email assignee).
- SMTP is configured via environment variables `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `APP_BASE_URL` (see `.env.example`).
- `@EnableAsync` is declared on `HelpdeskCenterApplication`.

### J. Real-Time WebSocket Comment Streaming ✅ Implemented
1. **STOMP over native browser WebSocket**: The backend runs a Spring WebSocket STOMP message broker (`spring-boot-starter-websocket`). All connected clients subscribed to `/topic/tickets/{ticketId}/comments` receive new `CommentPayload` frames instantly when any participant posts a comment — no polling required. `sockjs-client` is **not used** (it references Node.js `global` and crashes under Vite); instead `@stomp/stompjs` v7 connects directly via `brokerURL: "ws://host/ws/websocket?token=<JWT>"`.
2. **JWT Handshake Authentication**: WebSocket connections authenticate via a `?token=<JWT>` query parameter on the HTTP upgrade request. `WebSocketHandshakeInterceptor` validates the token and populates the WS session with an `AuthenticatedUser` principal; unauthenticated handshakes are rejected before the STOMP session is established.
3. **Broadcast Shape**: `CommentPayload` (id, ticketId, sender{id, name, role}, body, createdAt) is serialised as JSON and broadcast over `/topic/tickets/{id}/comments`.
4. **Frontend Integration**: `useTicketSocket` hook (`@stomp/stompjs` Client) injects arriving frames directly into the React Query cache via `setQueryData`, producing sub-second live updates. HTTP polling is retained at 30 s as a safety-net gap-filler. `CommentSection` shows a **Live / Connecting…** status strip derived from the STOMP connection state.
5. **Broker Endpoints**:
   - Connect (WS upgrade): `ws://host/ws/websocket?token=<JWT>`
   - Subscribe: `/topic/tickets/{ticketId}/comments` — real-time comment feed
   - User queue: `/user/queue/notifications` — reserved for future per-user pushes
   - App prefix: `/app` — for future `@MessageMapping` handlers (e.g. typing indicators)

### G. Fair-Share Assignment Workflows
To support arbitrary operational models for different companies, the system panel provides an administrative toggle supporting two distinct distribution modes:
1. **Manual Pull Mode (Jira/GitHub Style)**: Agents browse their department pool view and manually click an "Assign to Me" button to claim tickets.
2. **Round-Robin Mode (Fair-Share)**: The backend runs an event-driven scheduler. When a new ticket lands in a department, the system evaluates all active agents in that department and automatically assigns the incoming ticket to whoever holds the lowest active workload count (`status IN ('OPEN', 'IN_PROGRESS')`).

### H. Multi-Tenant SLAs & Performance Metrics
1. **Dynamic SLA Rule Configuration**: Because this is a multi-tenant platform built to support different companies, target resolution windows must never be hardcoded. The application provides an administrative table (`sla_rules`) mapping `priority` levels (LOW, MEDIUM, HIGH, CRITICAL) to a target duration value (`target_resolution_hours`). Each tenant company configures their unique SLA limits.
2. **Core Tracked KPIs**: The analytical dashboard tracks:
   - **First Response Time (FRT)**: Duration from ticket creation (`created_at`) to the precise timestamp when status shifts from `OPEN` to `IN_PROGRESS`.
   - **Mean Time to Resolution (MTTR)**: Elapsed duration from ticket creation to `RESOLVED` status.
   - **AI Classification Accuracy**: A calculated statistical percentage representing:
     $$\text{Accuracy} = \frac{\text{Logs where is\_misclassified is FALSE}}{\text{Total AI Logs}} \times 100$$
3. **KPI SQL Reference Implementations**:
   - **First Response Time (FRT)**: Bob must implement this metric by pulling the earliest message timestamp created by an elevated user role:
     ```sql
     SELECT AVG(EXTRACT(EPOCH FROM (m.created_at - t.created_at)) / 3600) FROM tickets t 
     JOIN ticket_messages m ON t.id = m.ticket_id JOIN users u ON m.sender_id = u.id 
     WHERE t.company_id = :companyId AND u.role IN ('AGENT', 'DEPT_MANAGER')
     AND m.created_at = (SELECT MIN(inner_m.created_at) FROM ticket_messages inner_m WHERE inner_m.ticket_id = t.id);
     ```
   - **Mean Time to Resolution (MTTR)**:
     ```sql
     SELECT t.department_id, d.name, AVG(EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600) 
     FROM tickets t LEFT JOIN departments d ON t.department_id = d.id 
     WHERE t.company_id = :companyId AND t.status IN ('RESOLVED', 'CLOSED') GROUP BY t.department_id, d.name;
     ```
   - **AI Classification Accuracy**:
     ```sql
     SELECT COUNT(CASE WHEN is_misclassified = FALSE THEN 1 END) * 100.0 / COUNT(*) 
     FROM ai_classification_logs cl JOIN tickets t ON cl.ticket_id = t.id WHERE t.company_id = :companyId;
     ```

---

## 3. Approved Modernized Tech Stack

### 🖥️ Frontend Architecture
*   **Framework**: React 19 (Strict functional components with Hooks)
*   **Build Tooling**: Vite 8+
*   **Routing Engines**: React Router DOM v7 (Data API routing structures)
*   **Data Fetching & State Caching**: TanStack Query v5 (React Query) — *Replaces vanilla Axios operations to manage background data syncing, caching, mutation state transitions, and loading skeletons out-of-the-box.*
*   **Real-Time Transport**: `@stomp/stompjs` v7 — STOMP over native browser WebSocket (`ws://`/`wss://`). `sockjs-client` was removed as it references Node.js `global` and crashes under Vite.
*   **UI/Styling Utility**: Tailwind CSS v4+ — *Mandatory for fast layout structures and responsive component design.*
*   **Icon Library**: Lucide React
*   **Code Linting Quality**: ESLint

### ⚙️ Backend Engineering
*   **Language Runtime**: Java 21 LTS
*   **Framework Layer**: Spring Boot 3.4+ (Production-ready stable stream)
*   **Data Access Abstraction**: Spring Data JPA
*   **Security Protocol**: Spring Security configured with **JWT (JSON Web Tokens) or OAuth2 Resource Server Patterns** — *Replaces older stateful session cookies to ensure frictionless API authentication, easy scalability across multi-tenancies, and future-proof integrations with third-party messaging systems like Slack/Teams.*
*   **Real-Time Messaging**: Spring WebSocket (`spring-boot-starter-websocket`) with STOMP broker — enables sub-second comment broadcasting.
*   **Email Transport**: Spring Mail (`spring-boot-starter-mail`) + Thymeleaf HTML templates — async SMTP notifications for comments and ticket assignments.
*   **Data Validation Engine**: Spring Validation (`jakarta.validation-api`)
*   **Code Boilerplate Reduction**: Lombok
*   **Automation Build Tool**: Maven
*   **AI Integration System**: Unified IBM Cloud Core SDK / watsonx.ai integration frameworks.

### 🗄️ Database Tier
*   **Engine**: PostgreSQL (Production-grade relational server)
*   **Persistence Mapping**: Managed Hibernate schemas matching the structural entity rules.

---

## 4. Phase-by-Phase Development Implementation Roadmap

### Phase 1: Database Setup & Core JPA Foundations
- [ ] Initialize PostgreSQL schema based on the master SQL script layout.
- [ ] Establish indexes on key optimization paths (`company_id`, `department_id`, `assignee_id`, `status`, `ticket_id`).
- [ ] Generate the corresponding Spring Boot JPA Entities (`Company`, `Department`, `User`, `Ticket`, `TicketMessage`, `Attachment`, `SlaRule`, `AiClassificationLog`).
- [ ] Implement explicit mapping logic for Parent-Child relationships on the `Ticket` entity using standard self-referencing properties (`@ManyToOne` and `@OneToMany`).

### Phase 2: Security & Multi-Tenant Authentication (JWT)
- [ ] Configure Spring Security filter chains to reject unauthenticated actions.
- [ ] Build a robust Custom UserDetails service handling user roles (`EMPLOYEE`, `AGENT`, etc.).
- [ ] Write security utility classes for JWT generation, validation, and claim parsing.
- [ ] Implement a custom global tenant extraction filter that bounds incoming API calls to the authenticated user's specific `company_id`.

### Phase 3: IBM watsonx.ai Service Integration
- [ ] Implement the IBM watsonx Service bean utilizing the latest unified SDK.
- [ ] Build an extraction mapping service parsing raw incoming ticket descriptions and dispatching payloads to the AI model.
- [ ] Write logic determining whether the returned confidence score beats the 60.00% requirement boundary.
- [ ] Setup the asynchronous event listeners that write logging events to the `ai_classification_logs` table upon human re-routing actions.

### Phase 4: Storage, Messaging, & Asynchronous Notifications ✅ Implemented
- [x] Write integration adapter service connecting files to Object Storage bucket endpoints.
- [x] Build out the `TicketMessage` discussion service layer handling employee-agent threads.
- [x] Write automatic status update logic: Transition ticket to `PENDING_EMPLOYEE` upon Agent reply; revert to `IN_PROGRESS` on Employee reply.
- [x] Build Spring background asynchronous event execution pipeline (`@Async`) configuring non-blocking transactional mail alerts. *(EmailService + @EnableAsync)*
- [x] WebSocket STOMP broker for real-time comment delivery to all ticket participants. *(WebSocketConfig + WebSocketHandshakeInterceptor + CommentPayload)*
- [x] Frontend STOMP client (`useTicketSocket`) injecting WS frames into React Query cache instantly.

### Phase 5: Core Ticket Lifecycle REST API & Distribution Engine
- [ ] Build transactional endpoints for ticket creation, state modification, and comment tracking.
- [ ] Write the transactional layer for Parent-Child splitting logic.
- [ ] Program the fair-share assignment routing mechanisms (Manual Pull vs. Round-Robin Workload Calculation).
- [ ] Write internal validation controls protecting against cross-department data leakage.
- [ ] Implement `DELETE /api/departments/{id}` — atomic cascade: PostgreSQL `ON DELETE CASCADE` purges tickets; backend bulk-updates all former agents/managers to `role = 'EMPLOYEE'`, `department_id = NULL`.
- [ ] Implement `GET /api/departments/{id}/eligible-agents` — returns all company users excluding current department members (for the Add Agent overlay).
- [ ] Implement `POST /api/departments/{id}/agents` — promotes an employee or transfers an agent; cross-department transfer requires confirmation flag in request body.
- [ ] Implement `PATCH /api/departments/{id}/manager` — atomically downgrades previous manager to `EMPLOYEE` and promotes new user to `DEPT_MANAGER`.

### Phase 6: Frontend Dashboard & TanStack Syncing
- [ ] Scaffolding layout folders with Vite, Tailwind CSS v4, and React Router DOM v7.
- [ ] Construct the core views: Employee Submission form (with file dropzone configurations), Agent Ticket Workspace tabs (My Queue, Pool, Archive), and Administrative SLA panels.
- [ ] Bind frontend state changes to backend REST resources using TanStack Query hooks (`useQuery` and `useMutation`).
- [ ] Verify that an agent's workspace view automatically updates, enforces cross-department blocks, and defaults elegantly to their personal work queue.
