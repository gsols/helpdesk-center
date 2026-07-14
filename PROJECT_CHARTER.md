# Helpdesk Center — Project Charter

**Student:** Glenn Solis  

---

## Executive Summary

Helpdesk Center is an AI-assisted internal helpdesk ticketing system designed to automate issue categorisation and streamline multi-department support workflows. The system allows employees to submit support tickets — with optional file attachments — while agents and managers handle resolution through role-based dashboards.

IBM Watson Natural Language Understanding (NLU) classifies incoming tickets against department queues (Hardware, Software, HR, and extensible custom departments). A 60 % confidence gate routes low-confidence tickets to a human **Triage Queue** to prevent miscategorisation. Priority is assigned automatically through keyword analysis on ticket text. The application is built using **Spring Boot 3.3.5 / Java 21** on the backend, **React 19 + Vite** on the frontend, containerised with **Docker**, and backed by **PostgreSQL**.

---

## Project Background

### 1. Problem Statement

Organisations manage internal support requests through fragmented channels (email, chat, phone), resulting in:

- Manual ticket routing and categorisation
- Delayed response times and lost requests
- Lack of visibility and accountability
- Inefficient resource allocation

### 2. Proposed Solution

An automated ticketing system that centralises request intake, leverages AI for categorisation, and provides role-based access for support teams — reducing manual overhead and improving resolution efficiency.

---

## Project Objectives

1. Develop a web-based ticketing system with JWT-stateless authentication and role-based access control
2. Implement AI-powered automatic ticket categorisation using IBM Watson NLU with a 60 % confidence gate
3. Enable keyword-based automatic priority detection (Low → Medium → High → Critical)
4. Provide role-specific dashboards for Employee, Agent, Department Manager, and System Admin
5. Integrate file attachment functionality (up to 3 files, 10 MB each)
6. Implement SLA tracking with per-department, per-priority resolution targets and breach detection
7. Containerise the application using Docker for portability and deployment readiness

---

## Project Scope

### In-Scope Features

- User authentication with role-based access — Employee, Agent, Department Manager, System Admin
- Ticket submission with title, description, and optional file attachments (max 3 files, 10 MB each)
- AI-powered ticket categorisation via Watson NLU with 60 % confidence gate
- Local keyword fallback classification when Watson confidence is insufficient
- AI classification audit log for accuracy tracking and misclassification correction
- Automated priority assignment via keyword analysis (Low, Medium, High, Critical)
- Extended ticket status workflow: Open → In Progress → Pending Employee → Pending Approval → Resolved → Closed
- Role-filtered dashboards per user type
- Ticket comment and message thread system for agent collaboration
- File upload with local storage, enforced file size limits
- Filtering and sorting by category, status, priority, and date
- Round-robin automatic agent assignment per department
- Agent self-assignment from unassigned pool
- Manager reassignment of tickets to any agent in the department
- Gated takeover pipeline — agent requests takeover, manager approves or rejects
- Triage queue for tickets the AI cannot confidently classify
- Ticket rerouting to correct department (misclassification correction)
- Ticket splitting — one parent ticket forked into child tickets for multiple departments
- SLA rules configurable per department and priority
- SLA due-date stamping on ticket creation
- SLA breach detection and risk queue for managers
- Department Manager analytics — backlog, breach count, MTTR, 7-day resolution chart
- System Admin company-wide analytics — FRT, AI accuracy, dept breakdown, agent summary, recent activity
- In-app notification centre (new comment, ticket assigned, SLA breach, takeover approval request)
- Extensible department model (not hardcoded to a fixed set of departments)
- Docker multi-stage build for the backend

### Out-of-Scope Features

- Automated email notifications
- Real-time chat / WebSocket
- Mobile application
- Multi-language support
- External system integrations (Slack, Teams, Jira)
- User self-registration and administrative account management panel
- IBM Cloud Object Storage (local file storage is used instead)
- IBM Cloud Code Engine deployment (local Docker only)

---

## Deliverables

### Technical Deliverables

- Fully functional web application — Spring Boot backend, React frontend
- PostgreSQL database with complete schema
- Docker multi-stage `Dockerfile`
- Source code repository (Git)

### Documentation Deliverables

- Project Charter (this document)
- Database schema (`schema.sql`)
- System Architecture Documentation
- Entity Relationship Diagram (ERD)
- API Documentation
- Deployment Guide
- User Manual
- Capstone Report

---

## Stakeholders

| Role | Responsibility | Interest Level |
|---|---|---|
| Student Developer | System design, implementation, deployment | High |
| Capstone Adviser | Project guidance and evaluation | High |
| Academic Panel | Project assessment | High |
| End Users (Employees) | Ticket submission | Medium |
| Support Agents | Ticket resolution per department | Medium |
| Department Managers | Queue oversight, SLA management, reassignment | Medium |
| System Administrator | Company-wide visibility and analytics | Medium |

---

## Functional Requirements

### 1. Authentication & Authorisation

- Secure login with email and password (BCrypt hashing)
- JWT stateless sessions
- Roles: Employee, Agent, Department Manager, System Admin
- Role-scoped data access enforced on every API endpoint

### 2. Ticket Management

- Create tickets with title and description; optional file attachments
- AI categorisation via Watson NLU with 60 % confidence gate; falls back to local keyword scan; routes to triage if uncertain
- AI classification logged for accuracy reporting and misclassification tracking
- Automatic priority detection: Critical → High → Medium → Low
- Status workflow: Open → In Progress → Pending Employee → Pending Approval → Resolved → Closed
- SLA due-date assigned on creation based on department and priority rule
- Round-robin auto-assignment to available agents in the classified department
- View, filter, and sort ticket lists by status, priority, category, and date

### 3. Agent Operations

- **My Queue** — tickets explicitly assigned to the agent
- **Department Pool** — unassigned tickets the agent can self-claim
- **Archive** — peer-assigned tickets in the same department (read-only)
- Add comments and updates via threaded messages
- Change ticket status
- View and download attachments
- Request gated takeover of a peer's ticket (requires manager approval)

### 4. Manager Operations

- **Dept Queue** — all active tickets in the department (assigned and unassigned)
- **Risk Queue** — tickets breached or within 60 minutes of their SLA deadline
- Reassign tickets to any agent in the department
- Approve or reject agent takeover requests
- Reroute misclassified tickets to the correct department
- Split a single ticket into child tickets routed to multiple departments
- Configure SLA rules per department and priority
- Analytics dashboard — backlog count, breach count, MTTR, 7-day resolution chart

### 5. System Admin Operations

- Company-wide ticket overview — open, in-progress, resolved, closed, triage, breached
- Department breakdown table with MTTR per department
- Agent summary table showing active ticket count and resolved count
- Recent activity feed
- SLA compliance rate and AI accuracy percentage
- Average First Response Time (FRT)

### 6. File Management

- Upload files attached to tickets
- Store files in a configurable local directory
- Per-file 10 MB limit
- Support common file formats — images, PDFs, documents

### 7. Notification Centre

- In-app notifications for new comments, ticket assignment, SLA breach, and takeover approval requests
- Unread badge count
- Mark individual or all notifications as read

---

## Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| Performance | Dashboard load time | < 2 seconds |
| Performance | Ticket submission time | < 3 seconds |
| Performance | Concurrent users | 100 users |
| Security | Password encryption | BCrypt |
| Security | Input validation | SQL injection and XSS prevention |
| Security | Data transmission | HTTPS in production |
| Security | Auth tokens | JWT stateless |
| Reliability | System uptime | 99 % |
| Reliability | AI failure handling | Graceful fallback to triage |
| Scalability | Maximum tickets | 1,000 tickets |
| Scalability | Maximum users | 200 users |
| Usability | User training required | None |
| Compatibility | Browser support | Chrome, Firefox, Safari, Edge |

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React 19 Frontend                │
│        Vite · TailwindCSS · React Query · Axios     │
│  Pages: Employee · Agent · Manager · Admin · Login  │
└──────────────────────┬──────────────────────────────┘
                       │ REST / JSON  (JWT Bearer)
┌──────────────────────▼──────────────────────────────┐
│              Spring Boot 3.3.5 Backend              │
│              Java 21 · Spring Security              │
│                  Spring Data JPA                    │
│                                                     │
│  Controllers: Auth · Ticket · Comment · Attachment  │
│               Analytics · Notification · SlaRule    │
│               Department · Users                    │
│                                                     │
│  Services: TicketService · AIService                │
│            PriorityService · RoundRobinAssignment   │
│            NotificationService · CommentService     │
│            AttachmentService · AuthService          │
└──────────┬──────────────────────────┬───────────────┘
           │ JDBC                      │ IBM Watson NLU SDK
┌──────────▼──────────┐    ┌──────────▼───────────────┐
│    PostgreSQL DB    │    │  IBM Watson NLU (Cloud)   │
│                     │    │  Categories + Keywords    │
└─────────────────────┘    └──────────────────────────┘
                           (fallback: local keyword scan)
```

---

## Technology Stack

| Component | Technology | Version |
|---|---|---|
| Backend Framework | Spring Boot | 3.3.5 |
| Frontend Framework | React | 19.x |
| Frontend Build Tool | Vite | 8.x |
| CSS Framework | TailwindCSS | 4.x |
| Frontend Data Fetching | TanStack React Query | 5.x |
| Programming Language | Java | 21 |
| Database | PostgreSQL | 15.x |
| ORM | Spring Data JPA (Hibernate) | 3.3.x |
| Security | Spring Security + JJWT | — |
| AI Service | IBM Watson NLU SDK | 11.0.0 |
| File Storage | Local filesystem | — |
| Containerisation | Docker (multi-stage) | Latest |
| Build Tool | Maven | 3.9.x |
| HTTP Client | Axios | 1.x |
| Routing | React Router DOM | 7.x |

---

## Data Model

### Core Entities

**companies** — `id`, `name`, `created_at`

**departments** — `id`, `company_id`, `name`, `created_at`

**users** — `id`, `company_id`, `department_id`, `name`, `email`, `password_hash`, `role`, `created_at`

**sla\_rules** — `id`, `department_id`, `priority`, `target_resolution_hours`

**tickets** — `id`, `company_id`, `department_id`, `creator_id`, `assignee_id`, `parent_id`, `title`, `description`, `status`, `priority`, `created_at`, `updated_at`, `due_at`

**ticket\_messages** — `id`, `ticket_id`, `sender_id`, `body`, `created_at`

**attachments** — `id`, `ticket_id`, `message_id`, `file_name`, `file_type`, `file_size`, `secure_url`, `uploaded_at`

**ai\_classification\_logs** — `id`, `ticket_id`, `raw_text`, `predicted_department_id`, `actual_department_id`, `confidence_score`, `is_misclassified`, `logged_at`

**notifications** — `id`, `recipient_id`, `ticket_id`, `type`, `message`, `is_read`, `created_at`

### Relationships

| From | To | Cardinality |
|---|---|---|
| Company | Department | 1 → M |
| Company | User | 1 → M |
| Department | User | 1 → M |
| Department | SlaRule | 1 → M |
| User | Ticket (creator) | 1 → M |
| User | Ticket (assignee) | 1 → M |
| Ticket | TicketMessage | 1 → M |
| Ticket | Attachment | 1 → M |
| Ticket | AiClassificationLog | 1 → 1 |
| Ticket | Notification | 1 → M |
| Ticket | Ticket (splits) | 1 → M (self) |

---

## Project Timeline

| Phase | Key Activities | Deliverable |
|---|---|---|
| Day 1 | Backend scaffolding, DB schema, JWT auth, basic CRUD | Working backend API |
| Day 2 | Watson NLU integration (confidence gate), priority logic, round-robin assignment, SLA rules | Auto-categorisation + SLA tracking |
| Day 3 | React frontend — all four dashboards, role routing, API integration | Complete role-based UI |
| Day 4 | Comment system, notifications, analytics endpoints, triage/reroute/split, takeover pipeline | Fully functional system |
| Day 5 | Docker containerisation, documentation, presentation prep | Deployed system + documentation |

---

## Risk Management

| Risk | Impact | Probability | Mitigation Strategy |
|---|---|---|---|
| Watson NLU API failure | High | Low | 60 % confidence gate + local keyword fallback; uncertain tickets route to triage queue |
| AI misclassification | Medium | Medium | Triage queue for uncertain tickets; manager reroute; accuracy tracked via `ai_classification_logs` |
| Time constraint | High | Medium | Strict scope control; incremental feature delivery |
| SLA breach causing unresolved tickets | Medium | Medium | Risk queue surfaces near-breach tickets to managers |
| Agent overload | Medium | Low | Round-robin auto-assignment distributes load across agents |
| File upload complexity | Medium | Low | Local storage with multipart and 10 MB cap |
| Deployment failures | Medium | Low | Docker multi-stage build tested locally before cloud deployment |

---

## Assumptions

- Watson NLU Lite plan supports the required API call volume
- Users have stable internet connectivity
- English language only for AI classification (Watson NLU and keyword lists)
- Manual communication by agents is acceptable — no automated email notifications
- System operates within MVP scale: 200 users, 1,000 tickets
- IBM Cloud deployment is a future phase; current target is local Docker
- A single company tenant is used for development and demonstration

---

## Success Criteria

The project will be considered successful upon meeting all of the following:

- Functional ticket submission, routing, and retrieval system
- AI categorisation with 60 % confidence gate and triage fallback
- Automated priority assignment based on keyword analysis
- Role-based dashboards operational for all four roles
- File upload and download functionality working
- SLA rules, due-date tracking, and breach detection operational
- In-app notification centre functional
- Analytics dashboards (Manager + Admin) returning live data
- Gated takeover pipeline (request → approve/reject) implemented
- Ticket splitting and rerouting implemented
- Docker container builds and runs successfully
- System deployed and accessible
- Complete documentation delivered
- Successful capstone defence presentation
