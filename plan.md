# System Blueprint: Multi-Tenant AI Help Desk Platform

This document serves as the absolute source of truth and comprehensive master plan for the implementation of the Multi-Tenant Support Help Desk application. All AI coding assistants, agents, and developers must strictly adhere to the architecture, business logic, constraints, and development phases outlined below.

---

## 1. Project High-Level Overview & Core Value
The system is a multi-tenant help desk application designed for organizations where employees can submit work-related issues impacting various departments (e.g., IT, HR, Finance, Facilities). 

The platform's core differentiator is automated ticket triage using **IBM watsonx.ai** to extract intent, classify issues, and intelligently assign them to the correct department queue, eliminating human routing delay.

---

## 2. Global Business Rules & Logic Constraints

### A. AI Taxonomy, Routing, & Fallback (Triage) Logic
1. **Confidence Threshold**: When an issue text is dispatched to the IBM watsonx.ai classification endpoint, it must return a predicted department tag and a numerical confidence score (0.00 to 100.00).
2. **The Triage Queue**: If the AI confidence score drops **below 60.00%**, or if the classification returns an error, the system must set `department_id = NULL`. This implicitly drops the ticket into the global **"Uncategorized/Triage"** queue.
3. **Manual Clarification Loop**: System Administrators or specific Triage Managers supervise the Uncategorized queue. They review vague tickets (e.g., *"My thing is broken"*) and use a dedicated tool interface to message the employee for clarification or manually force-assign a department tag.
4. **Multi-Department Tickets (Parent-Child Splitting)**: If an employee's ticket contains text signaling problems across multiple departments (e.g., *"The new office laptop arrived but my payroll portal login fails"*, involving both IT and Finance):
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
   - **Department Archive View (Peer Collaboration - Read Only)**: Can search and view tickets assigned to *other agents* within their same department (`department_id == agent.department_id AND assignee_id != current_user.id`). This allows team members to review peer historical fixes or take over work if a colleague is absent. However, they *cannot* edit descriptions, change statuses, or re-route these tickets unless they explicitly re-assign the ticket to themselves first.
   - **Cross-Department Block (Absolute Restriction)**: Agents are completely blocked from viewing, searching, or interacting with tickets belonging to other departments entirely (`ticket.department_id != agent.department_id`) to safeguard sensitive organizational data.

3. **Department Manager**:
   - Can view all tickets inside their assigned department.
   - Has permission to manually override workloads, reassign tickets to specific agents, and view team resolution performance metrics.
4. **System Admin**:
   - Global multi-tenant clearance. Configures systemic parameters, creates/deletes company spaces, manages global settings, and configures third-party integrations.

### C. Handling Misclassifications & AI Feedback Loops
1. **The Re-Route Mechanism**: If the AI misclassifies a ticket (e.g., routes a confidential payroll ticket to the IT department queue), the IT agent must click a **"Re-Route Ticket"** action.
2. **Instant Isolation**: Upon re-routing, the agent selects the correct target department from a restricted dropdown. The system updates the `department_id` field immediately, making the ticket instantly vanish from the IT dashboard view and securely populating the target department's queue.
3. **AI Training Payload Logging**: Every time an agent triggers a manual re-route action, the backend transaction must write an event log payload into the `ai_classification_logs` table:
   ```json
   {
     "ticket_id": 1234,
     "raw_text": "Original text input from employee",
     "predicted_department_id": 2, // The bad AI guess (IT)
     "actual_department_id": 5,    // The human correction (HR)
     "confidence_score": 72.50,
     "is_misclassified": true
   }
   ```
   This dataset acts as an isolated, high-value training log that system admins export periodically to retrain or fine-tune the company's custom IBM watsonx.ai underlying classification model.

### D. Ticket Lifecycle (ITIL Standard Compliance)
Every ticket must transition through these precise, state-controlled enums:
[ OPEN ] ──> [ IN_PROGRESS ] ──> [ PENDING_EMPLOYEE ] ──> [ RESOLVED ] ──> [ CLOSED ]

*   **OPEN**: Freshly submitted by an employee, or newly dropped into a queue via a human re-routing or triage loop. No agent has officially claimed ownership yet.
*   **IN_PROGRESS**: An agent has actively assigned the ticket to themselves or a manager has delegated it. The agent is working on a fix.
*   **PENDING_EMPLOYEE**: The agent has posted a clarifying question or requested data from the employee. The SLA clock pauses, and the system waits for the user's input/comment.
*   **RESOLVED**: The technical or operational fix has been applied. The employee receives a notification.
*   **CLOSED**: Read-only archival state. The system automatically locks the ticket 3 calendar days after moving to `RESOLVED` if the employee does not explicitly trigger a re-open action.

### E. Fair-Share Assignment Workflows
To support arbitrary operational models for different companies, the system panel provides an administrative toggle supporting two distinct distribution modes:
1. **Manual Pull Mode (Jira/GitHub Style)**: Agents browse their department pool view and manually click an "Assign to Me" button to claim tickets.
2. **Round-Robin Mode (Fair-Share)**: The backend runs an event-driven scheduler. When a new ticket lands in a department, the system evaluates all active agents in that department and automatically assigns the incoming ticket to whoever holds the lowest active workload count (`status IN ('OPEN', 'IN_PROGRESS')`).

### F. Multi-Tenant SLAs & Performance Metrics
1. **Dynamic SLA Rule Configuration**: Because this is a multi-tenant platform built to support different companies, target resolution windows must never be hardcoded. The application provides an administrative table (`sla_rules`) mapping `priority` levels (LOW, MEDIUM, HIGH, CRITICAL) to a target duration value (`target_resolution_hours`). Each tenant company configures their unique SLA limits.
2. **Core Tracked KPIs**: The analytical dashboard tracks:
   - **First Response Time (FRT)**: Duration from ticket creation (`created_at`) to the precise timestamp when status shifts from `OPEN` to `IN_PROGRESS`.
   - **Mean Time to Resolution (MTTR)**: Elapsed duration from ticket creation to `RESOLVED` status.
   - **AI Classification Accuracy**: A calculated statistical percentage representing:
     $$\text{Accuracy} = \frac{\text{Logs where is\_misclassified is FALSE}}{\text{Total AI Logs}} \times 100$$

---

## 3. Approved Modernized Tech Stack

### 🖥️ Frontend Architecture
*   **Framework**: React 19 (Strict functional components with Hooks)
*   **Build Tooling**: Vite 8+
*   **Routing Engines**: React Router DOM v7 (Data API routing structures)
*   **Data Fetching & State Caching**: TanStack Query v5 (React Query) — *Replaces vanilla Axios operations to manage background data syncing, caching, mutation state transitions, and loading skeletons out-of-the-box.*
*   **UI/Styling Utility**: Tailwind CSS v4+ — *Mandatory for fast layout structures and responsive component design.*
*   **Icon Library**: Lucide React
*   **Code Linting Quality**: ESLint

### ⚙️ Backend Engineering
*   **Language Runtime**: Java 21 LTS
*   **Framework Layer**: Spring Boot 3.4+ (Production-ready stable stream)
*   **Data Access Abstraction**: Spring Data JPA
*   **Security Protocol**: Spring Security configured with **JWT (JSON Web Tokens) or OAuth2 Resource Server Patterns** — *Replaces older stateful session cookies to ensure frictionless API authentication, easy scalability across multi-tenancies, and future-proof integrations with third-party messaging systems like Slack/Teams.*
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
- [ ] Initialize PostgreSQL schema schemas based on the structural DBML/SQL specification.
- [ ] Establish indexes on key optimization paths (`company_id`, `department_id`, `assignee_id`, `status`).
- [ ] Generate the corresponding Spring Boot JPA Entities (`Company`, `Department`, `User`, `Ticket`, `SlaRule`, `AiClassificationLog`).
- [ ] Implement explicit mapping logic for Parent-Child relationships on the `Ticket` entity using standard self-referencing properties (`@ManyToOne` and `@OneToMany`).

### Phase 2: Security & Multi-Tenant Authentication (JWT)
- [ ] Configure Spring Security filter chains to reject unauthenticated actions.
- [ ] Build a robust Custom UserDetails service handling user roles (`EMPLOYEE`, `AGENT`, etc.).
- [ ] Write the security utility classes for JWT generation, validation, and claim parsing.
- [ ] Implement a custom global tenant extraction filter that bounds incoming API calls to the authenticated user's specific `company_id`.

### Phase 3: IBM watsonx.ai Service Integration
- [ ] Implement the IBM watsonx Service bean utilizing the latest unified SDK.
- [ ] Build an extraction mapping service parsing raw incoming ticket descriptions and dispatching payloads to the AI model.
- [ ] Write logic determining whether the returned confidence score beats the 60.00% requirement boundary.
- [ ] Setup the asynchronous event listeners that write logging events to the `ai_classification_logs` table upon human re-routing actions.

### Phase 4: Core Ticket Lifecycle REST API & Distribution Engine
- [ ] Build transactional endpoints for ticket creation, state modification, and comment tracking.
- [ ] Write the transactional layer for Parent-Child splitting logic.
- [ ] Program the fair-share assignment routing mechanisms (Manual Pull vs. Round-Robin Workload Calculation).
- [ ] Write internal validation controls protecting against cross-department data leakage.

### Phase 5: Frontend Dashboard & TanStack Syncing
- [ ] Scaffolding layout folders with Vite, Tailwind CSS v4, and React Router DOM v7.
- [ ] Construct the core views: Employee Submission form, Agent Ticket Pool, Agent "My Queue" Workspace, and Administrative SLA panels.
- [ ] Bind frontend state changes to the backend REST resources using TanStack Query hooks (`useQuery` for views, `useMutation` for actions like re-routing or changing statuses).
- [ ] Verify that an agent's workspace view automatically updates, enforces cross-department blocks, and defaults elegantly to their personal work queue.