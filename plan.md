# HELPDESK CENTER — PROJECT PLAN
### Complete Development & Deployment Guide

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Design Decisions](#3-architecture--design-decisions)
4. [User Roles & Workflows](#4-user-roles--workflows)
5. [Database Design](#5-database-design)
6. [API Endpoints](#6-api-endpoints)
7. [File Attachment Workflow](#7-file-attachment-workflow)
8. [Development Timeline](#8-development-timeline)
9. [Setup Instructions](#9-setup-instructions)
10. [Testing Strategy](#10-testing-strategy)
11. [Risk Management](#11-risk-management)
12. [Key Decisions & Rationale](#12-key-decisions--rationale)

---

## 1. PROJECT OVERVIEW

### 1.1 Project Summary

Helpdesk Center is an AI-powered internal helpdesk ticketing system that automates ticket categorization and streamlines support workflows for IT and HR teams.

### 1.2 Core Problem

Organizations waste time manually sorting support requests from shared email inboxes, leading to:

- Slow response times
- Lost tickets
- Poor accountability
- Employee frustration

### 1.3 Solution

A centralized web application where:

- Employees submit tickets with file attachments
- AI automatically categorizes tickets (Hardware, Software, HR)
- Priority is auto-assigned based on keywords
- Support agents see role-filtered dashboards
- Status tracking provides transparency

### 1.4 Project Constraints

| Constraint | Value |
|---|---|
| Timeline | 3–5 days |
| Team | 1 developer (solo project) |
| Budget | $0 |
| Scope | MVP only (no email automation, no mobile app) |

---

## 2. TECHNOLOGY STACK

### 2.1 Stack Breakdown

#### Backend
| Component | Technology |
|---|---|
| Framework | Spring Boot 3.3.5 |
| Language | Java 21 |
| Build Tool | Maven 3.9.x |
| Database | PostgreSQL 18.x (local) |
| ORM | Spring Data JPA |
| Security | Spring Security — session-based (BCrypt passwords) |
| File Storage | Local disk (`uploads/` folder inside the backend) |

#### Frontend
| Component | Technology |
|---|---|
| Framework | React 19.x |
| Bundler | Vite 8.x |
| Language | JavaScript (ES6+) |
| HTTP Client | Axios 1.18.x |
| Routing | React Router 7.x |
| Linting | ESLint |

#### AI Service
| Service | Provider |
|---|---|
| AI Classification | IBM Watson Natural Language Understanding (NLU) |

#### Authentication
Session-based — no JWT. Spring Security manages the `JSESSIONID` cookie. Frontend stores the user object in `localStorage` for display only. Axios sends cookies automatically with `withCredentials: true`.

#### DevOps
| Tool | Purpose |
|---|---|
| Docker | Containerization (Day 5 optional) |
| Git / GitHub | Version Control |

---

### 2.2 What is Maven?

Maven is a build automation tool for Java projects.

**What it does:**

- **Manages dependencies** — automatically downloads libraries (Spring Boot, PostgreSQL driver, Watson SDK)
- **Builds the project** — compiles Java code into an executable `.jar` file
- **Runs tests** — executes unit and integration tests
- **Packages the application** — creates deployable artifacts

**Common Maven commands:**

```bash
mvn clean           # Delete previous builds
mvn compile         # Compile Java code
mvn test            # Run tests
mvn package         # Create .jar file
mvn spring-boot:run # Run the application
```

---

## 3. ARCHITECTURE & DESIGN DECISIONS

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   USER LAYER                        │
│  Employee, IT Hardware Agent, IT Software Agent,    │
│  HR Agent (Web Browser)                             │
└────────────────────┬────────────────────────────────┘
                     │ HTTP
┌────────────────────▼────────────────────────────────┐
│            PRESENTATION LAYER                       │
│              React Frontend (SPA)                   │
│  ┌────────────────────────────────────────────┐    │
│  │ - Login Page                               │    │
│  │ - Submit Ticket Form                       │    │
│  │ - Employee Dashboard (My Tickets)          │    │
│  │ - Agent Dashboard (Role-Filtered)          │    │
│  │ - Ticket Details Page                      │    │
│  └────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────┘
                     │ REST API (JSON + multipart)
┌────────────────────▼────────────────────────────────┐
│           APPLICATION LAYER                         │
│          Spring Boot Backend                        │
│  ┌────────────────────────────────────────────┐    │
│  │ REST Controllers                           │    │
│  │  - AuthController  (/api/auth/*)           │    │
│  │  - TicketController (/api/tickets)         │    │
│  │  - CommentController                       │    │
│  │  - AttachmentController                    │    │
│  └──────────────────┬─────────────────────────┘    │
│  ┌──────────────────▼─────────────────────────┐    │
│  │ Business Services                          │    │
│  │  - TicketService (CRUD logic)              │    │
│  │  - AIService (Watson NLU integration)      │    │
│  │  - PriorityService (keyword detection)     │    │
│  │  - AttachmentService (local disk I/O)      │    │
│  │  - AuthService (login validation)          │    │
│  └──────────────────┬─────────────────────────┘    │
│  ┌──────────────────▼─────────────────────────┐    │
│  │ Data Access Layer                          │    │
│  │  - UserRepository (JPA)                    │    │
│  │  - TicketRepository (JPA)                  │    │
│  │  - CommentRepository (JPA)                 │    │
│  │  - AttachmentRepository (JPA)              │    │
│  └────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
┌───────▼──────────┐      ┌─────────▼──────────┐
│   DATA LAYER     │      │  EXTERNAL SERVICES  │
│                  │      │                     │
│  PostgreSQL DB   │      │ - Watson NLU API    │
│  - users         │      └─────────────────────┘
│  - tickets       │
│  - comments      │      ┌─────────────────────┐
│  - attachments   │      │  LOCAL FILE SYSTEM  │
└──────────────────┘      │  uploads/ folder    │
                          └─────────────────────┘
```

---

### 3.2 Design Patterns Used

| Pattern | Where Used | Purpose |
|---|---|---|
| MVC (Model-View-Controller) | Entire application | Separation of concerns |
| Repository Pattern | Data access layer | Abstract database operations |
| Service Layer Pattern | Business logic | Encapsulate business rules |
| DTO (Data Transfer Object) | API responses | Control data exposure |
| Dependency Injection | Throughout backend | Loose coupling, testability |

---

### 3.3 Security Design

| Threat | Mitigation |
|---|---|
| SQL Injection | JPA parameterized queries |
| XSS (Cross-Site Scripting) | React auto-escapes output, input validation |
| CSRF | CORS configuration, session-based REST API |
| Password theft | BCrypt hashing (never store plaintext) |
| Unauthorized access | Role-based access control |
| File upload abuse | File type validation, size limits (10 MB) |
| Path traversal | Sanitize file names before saving to disk |

---

## 4. USER ROLES & WORKFLOWS

### 4.1 User Roles

| Role | Description | Permissions |
|---|---|---|
| Employee | Regular user who submits tickets | Create tickets, view own tickets, add comments |
| IT Hardware Agent | Handles hardware issues | View all hardware tickets, update status, add comments, resolve |
| IT Software Agent | Handles software issues | View all software tickets, update status, add comments, resolve |
| HR Agent | Handles HR/facilities issues | View all HR tickets, update status, add comments, resolve |

---

### 4.2 Employee Workflow

**Scenario: Employee's laptop keyboard is broken**

```
STEP 1: Login
──────────────────────────────────────────────────────
- Navigate to http://localhost:5173
- Enter username: john.doe
- Enter password: ********
- Click "Login"
- System validates credentials and creates session (JSESSIONID cookie)

STEP 2: Navigate to Submit Ticket
──────────────────────────────────────────────────────
- Click "Submit New Ticket" button
- Redirected to ticket submission form

STEP 3: Fill Ticket Form
──────────────────────────────────────────────────────
Title:       "Laptop keyboard not working"
Description: "Several keys on my laptop keyboard are stuck.
              Cannot type properly. This is urgent as I cannot
              work effectively."
Email:       john.doe@company.com
Attachments: [Upload] keyboard-photo.jpg (2.3 MB)
Click "Submit Ticket"

STEP 4: Backend Processing (Automatic)
──────────────────────────────────────────────────────
1. File Upload:
   - Frontend sends multipart/form-data to POST /api/tickets/{id}/attachments
   - Backend saves file to local uploads/ directory
   - Stores relative file path in database

2. AI Classification:
   - Send description to Watson NLU
   - Watson analyzes: "keyboard", "laptop"
   - Returns category: HARDWARE

3. Priority Detection:
   - Scan for keywords: "urgent", "cannot work"
   - Assign priority: HIGH

4. Create Ticket Record:
   - ticket_id:   1001
   - title:       "Laptop keyboard not working"
   - category:    HARDWARE
   - priority:    HIGH
   - status:      OPEN
   - created_by:  john.doe (user_id: 42)
   - created_at:  2025-01-15 09:30:00

STEP 5: Confirmation
──────────────────────────────────────────────────────
✅ "Ticket submitted successfully!"
   Ticket ID: #1001
   Category:  Hardware
   Priority:  High
   Status:    Open

STEP 6: Track Ticket
──────────────────────────────────────────────────────
- Employee views "My Tickets" dashboard
- Sees ticket #1001 with status: OPEN
- Receives comment from IT agent: "We'll pick this up today"
- Status changes to: IN_PROGRESS → RESOLVED
```

---

### 4.3 Agent Workflow

**Scenario: IT Hardware Agent resolves ticket #1001**

```
STEP 1: Login as Agent
──────────────────────────────────────────────────────
- Enter username: it.hardware.agent
- Enter password: ********
- System detects role: IT_HARDWARE_AGENT
- Redirected to Agent Dashboard

STEP 2: View Filtered Queue
──────────────────────────────────────────────────────
- Dashboard shows only HARDWARE category tickets
- Ticket #1001 visible: "Laptop keyboard not working" | HIGH | OPEN

STEP 3: Work the Ticket
──────────────────────────────────────────────────────
- Click ticket #1001 to open details
- View description, attachments (download via /api/attachments/{id}/download)
- Add comment: "Reviewed your ticket. Scheduling a replacement keyboard."
- Update status: OPEN → IN_PROGRESS

STEP 4: Resolve
──────────────────────────────────────────────────────
- Deliver replacement keyboard to employee
- Add comment: "Replacement keyboard delivered and confirmed working."
- Update status: IN_PROGRESS → RESOLVED
```

---

## 5. DATABASE DESIGN

### 5.1 Entity Relationship Overview

```
users ──< tickets ──< comments
                 └──< attachments
```

### 5.2 Table: `users`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-increment |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Login identifier |
| `password` | VARCHAR(255) | NOT NULL | BCrypt hashed |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | Contact email |
| `role` | VARCHAR(30) | NOT NULL | employee, it_hardware, it_software, hr |
| `full_name` | VARCHAR(100) | NOT NULL | Display name |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation |

**Roles:**
```
employee
it_hardware
it_software
hr
```

---

### 5.3 Table: `tickets`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-increment |
| `title` | VARCHAR(200) | NOT NULL | Short summary |
| `description` | TEXT | NOT NULL | Full description |
| `email` | VARCHAR(100) | NOT NULL | Submitter contact email |
| `category` | VARCHAR(20) | NOT NULL | hardware, software, hr |
| `priority` | VARCHAR(10) | NOT NULL | low, medium, high, critical |
| `status` | VARCHAR(20) | NOT NULL DEFAULT 'open' | open, in_progress, resolved |
| `created_by` | BIGINT | FK → users.id | Ticket submitter |
| `assigned_to` | BIGINT | FK → users.id, NULL | Assigned agent |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Submission time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification |

**Priority Keyword Mapping:**
```
critical → "system down", "server down", "production down", "outage"
high     → "urgent", "cannot work", "blocked", "asap", "critical"
medium   → "slow", "error", "not working", "issue", "problem"
low      → everything else (default)
```

**Status Transitions:**
```
open → in_progress → resolved
```

---

### 5.4 Table: `attachments`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-increment |
| `ticket_id` | BIGINT | FK → tickets.id, NOT NULL | Parent ticket |
| `file_name` | VARCHAR(255) | NOT NULL | Original file name |
| `file_path` | TEXT | NOT NULL | Relative path on local disk (e.g. `uploads/1001/photo.jpg`) |
| `file_size` | BIGINT | NOT NULL | Size in bytes |
| `content_type` | VARCHAR(100) | NOT NULL | MIME type |
| `uploaded_at` | TIMESTAMP | DEFAULT NOW() | Upload time |

**Allowed file types:** `image/jpeg`, `image/png`, `image/gif`, `application/pdf`, `text/plain`
**Max file size:** 10 MB
**Storage location:** `helpdesk-center-backend/uploads/{ticket_id}/`

---

### 5.5 Table: `comments` (optional)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-increment |
| `ticket_id` | BIGINT | FK → tickets.id, NOT NULL | Parent ticket |
| `user_id` | BIGINT | FK → users.id, NOT NULL | Comment author |
| `message` | TEXT | NOT NULL | Comment body |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Posted time |

---

## 6. API ENDPOINTS

### 6.1 Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login — returns user object, sets session cookie |
| POST | `/api/auth/logout` | Session | Invalidate session |
| GET | `/api/auth/me` | Session | Get current user profile |

**Login Request:**
```json
{
  "username": "john.doe",
  "password": "secret123"
}
```

**Login Response:**
```json
{
  "id": 42,
  "username": "john.doe",
  "fullName": "John Doe",
  "role": "employee",
  "email": "john.doe@company.com"
}
```

---

### 6.2 Tickets

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/tickets` | Session | employee | Create new ticket |
| GET | `/api/tickets` | Session | All | List tickets (role-filtered) |
| GET | `/api/tickets/{id}` | Session | All | Get single ticket details |
| PUT | `/api/tickets/{id}/status` | Session | agent | Update ticket status |

**List Tickets Response (Employee):** Returns only tickets where `created_by = current_user.id`
**List Tickets Response (IT Hardware Agent):** Returns only tickets where `category = hardware`

---

### 6.3 Attachments

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/tickets/{id}/attachments` | Session | employee | Upload file (multipart/form-data) — saved to local disk |
| GET | `/api/tickets/{id}/attachments` | Session | All | List attachments for ticket |
| GET | `/api/attachments/{id}/download` | Session | All | Download file from local disk |
| DELETE | `/api/attachments/{id}` | Session | employee | Delete attachment + file from disk |

---

### 6.4 Comments (optional)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/tickets/{id}/comments` | Session | All | Get ticket comments |
| POST | `/api/tickets/{id}/comments` | Session | All | Add comment |

---

## 7. FILE ATTACHMENT WORKFLOW

### Upload Flow (Local Storage)

```
1. User selects file in React form
   ↓
2. Frontend sends multipart/form-data POST request
   POST /api/tickets/{id}/attachments
   Content-Type: multipart/form-data
   Body: file binary
   ↓
3. Backend (AttachmentService):
   - Validates file type and size (max 10 MB)
   - Sanitizes file name (strip path separators)
   - Saves file to: uploads/{ticketId}/{uuid}_{originalName}
   - Creates directory if it doesn't exist
   ↓
4. Backend saves attachment record in database
   file_path = "uploads/1001/a3f2b1_keyboard-photo.jpg"
   ↓
5. Response returned to frontend
   { "id": 5, "fileName": "keyboard-photo.jpg", "fileSize": 2400000 }
```

### Download Flow (Local Storage)

```
1. Agent clicks attachment in Ticket Details page
   ↓
2. Browser calls GET /api/attachments/{id}/download
   ↓
3. Backend reads file_path from database
   Reads file from local disk
   Returns file as byte stream with correct Content-Type header
   ↓
4. Browser downloads the file
```

### Local Storage Configuration

```properties
# application.properties
app.upload.dir=uploads
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

The `uploads/` directory is created automatically on first upload. It sits inside the backend working directory and is **git-ignored**.

---

## 8. DEVELOPMENT TIMELINE

### Day 1 — Backend Foundation
- [x] Install Java 21, Maven, PostgreSQL, Node.js
- [x] Create PostgreSQL database locally (`helpdesk_db`, `helpdesk_user`)
- [x] Generate Spring Boot project (Spring Initializr)
- [x] Fix `pom.xml` (Spring Boot 3.3.5, correct dependencies)
- [x] Configure `application.properties` for local database
- [ ] Create JPA entities: `User`, `Ticket`, `Attachment`, `Comment`
- [ ] Create repositories: `UserRepository`, `TicketRepository`, `AttachmentRepository`
- [ ] Configure `SecurityConfig` (session auth, BCrypt, CORS)
- [ ] Implement `AuthController` + `AuthService` (login/logout endpoints)
- [ ] Seed test users with BCrypt passwords
- [ ] Test login with Postman

### Day 2 — AI Integration + Ticket CRUD
- [ ] Implement `TicketController` + `TicketService` (create, list, get by id)
- [ ] Implement `PriorityService` (keyword detection logic)
- [ ] Sign up for IBM Watson NLU (free tier), get API key
- [ ] Implement `AIService` (Watson NLU categorization)
- [ ] Role-based ticket filtering logic
- [ ] Test all ticket endpoints with Postman

### Day 3 — File Upload + Frontend Start
- [ ] Implement `AttachmentService` (save to local `uploads/` directory)
- [ ] Implement `AttachmentController` (multipart upload, download, delete)
- [x] React + Vite frontend scaffolded
- [x] Install Axios + React Router
- [ ] Build Login page + connect to `/api/auth/login`
- [ ] Build Submit Ticket form with file input
- [ ] Configure Axios with `withCredentials: true`

### Day 4 — Frontend Dashboards
- [ ] Build Employee Dashboard (My Tickets list)
- [ ] Build Agent Dashboard (role-filtered ticket queue)
- [ ] Build Ticket Detail page (comments + attachment download links)
- [ ] Implement React Router navigation
- [ ] Session handling (store user in `localStorage`, protect routes)
- [ ] End-to-end test: submit ticket → upload file → agent views + downloads

### Day 5 — Testing & Documentation (Optional Deployment)
- [ ] Write unit tests (JUnit 5 + Mockito) for `PriorityService`, `AIService`
- [ ] Write integration tests (Spring Boot Test) for ticket endpoints
- [ ] Bug fixes and UI polish
- [ ] Write README with setup instructions
- [ ] Optional: build Docker image and deploy to IBM Cloud Code Engine

---

## 9. SETUP INSTRUCTIONS

### 9.1 Prerequisites

```bash
java --version   # Must be 21
mvn --version    # Must be 3.9+
node --version   # Must be 18+
psql --version   # PostgreSQL 15+
```

### 9.2 Database Setup

```sql
psql -U postgres
CREATE DATABASE helpdesk_db;
CREATE USER helpdesk_user WITH PASSWORD 'helpdesk_pass';
GRANT ALL PRIVILEGES ON DATABASE helpdesk_db TO helpdesk_user;
\q
```

### 9.3 Backend Setup

```bash
cd helpdesk-center-backend

# Copy example config and fill in real values
cp src/main/resources/application.properties.example \
   src/main/resources/application.properties

# Run
mvn spring-boot:run
# → http://localhost:8080
```

### 9.4 application.properties

```properties
spring.application.name=helpdesk-center-backend

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/helpdesk_db
spring.datasource.username=helpdesk_user
spring.datasource.password=helpdesk_pass
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

# Server
server.port=8080

# Session
server.servlet.session.timeout=86400s

# Local file storage
app.upload.dir=uploads

# File size limits
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# IBM Watson NLU
watson.nlu.api-key=YOUR_WATSON_API_KEY_HERE
watson.nlu.url=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com
watson.nlu.version=2023-08-01
```

### 9.5 Frontend Setup

```bash
cd helpdesk-center-frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 10. TESTING STRATEGY

### 10.1 Testing Pyramid

```
         /\
        /  \         E2E Tests (manual smoke tests)
       /----\
      /      \       Integration Tests (Spring Boot Test)
     /--------\
    /          \     Unit Tests (JUnit 5 + Mockito)
   /____________\
```

### 10.2 Unit Tests

```java
// PriorityServiceTest.java
@ExtendWith(MockitoExtension.class)
class PriorityServiceTest {

    @InjectMocks
    private PriorityService priorityService;

    @Test
    void shouldReturnHighPriorityForUrgentKeyword() {
        String description = "This is urgent, I cannot work!";
        String result = priorityService.detectPriority(description);
        assertEquals("high", result);
    }

    @Test
    void shouldReturnLowPriorityForNeutralDescription() {
        String description = "Please update my email signature.";
        String result = priorityService.detectPriority(description);
        assertEquals("low", result);
    }
}
```

### 10.3 Manual Test Cases (Postman)

| Test Case | Steps | Expected Result |
|---|---|---|
| TC-001: Login | POST /api/auth/login with valid credentials | 200 OK + user object + session cookie |
| TC-002: Login Fail | POST /api/auth/login with wrong password | 401 Unauthorized |
| TC-003: Submit Ticket | POST /api/tickets with keyboard description | 201 Created, category=hardware |
| TC-004: AI Categorization | Submit ticket with "payroll" description | category=hr |
| TC-005: Priority Detection | Submit ticket with "urgent" keyword | priority=high |
| TC-006: Role Filtering | Login as it_hardware, GET /api/tickets | Only hardware tickets returned |
| TC-007: Employee Isolation | Login as Employee A, GET /api/tickets | Only own tickets returned |
| TC-008: File Upload | POST /api/tickets/{id}/attachments with JPEG | 201 Created, file saved to uploads/ |
| TC-009: File Download | GET /api/attachments/{id}/download | File returned as byte stream |
| TC-010: Add Comment | POST /api/tickets/{id}/comments | 201 Created, comment visible |
| TC-011: Update Status | PUT /api/tickets/{id}/status as agent | Status updated, 200 OK |

---

## 11. RISK MANAGEMENT

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Watson NLU API rate limit hit | Low | High | Implement fallback keyword classification if Watson fails |
| Local disk fills up | Low | Low | 10 MB file size limit per upload; only dev data stored |
| PostgreSQL connection lost | Low | High | Spring Boot auto-reconnects; connection pool configured |
| AI misclassifies ticket | Medium | Low | Agents can manually re-categorize tickets |
| File name collision | Low | Low | Prefix file names with UUID before saving |
| Time overrun on Day 3–4 | Medium | Medium | Cut comment feature first; attachment is MVP |
| Uploaded files not git-ignored | Low | Medium | Add `uploads/` to `.gitignore` |

---

## 12. KEY DECISIONS & RATIONALE

| Decision | Alternative Considered | Reason for Choice |
|---|---|---|
| Spring Boot over Jakarta EE | Jakarta EE + Open Liberty | Faster setup for solo 3–5 day project |
| PostgreSQL over MySQL | MySQL | Better JSON support; widely used with Spring Boot |
| Session auth over JWT | JWT | Simpler for MVP; no token management on frontend |
| Local disk over IBM COS | IBM Cloud Object Storage | Zero setup, zero cost, works offline, no SDK complexity |
| Watson NLU for AI | OpenAI GPT API, keyword-only | IBM ecosystem alignment; free tier available |
| React + Vite over CRA | Create React App | Faster builds, modern default, actively maintained |
| Netlify for frontend (optional) | GitHub Pages | Instant HTTPS, free tier, zero-config CDN |

---

## APPENDIX: PROJECT FILE STRUCTURE

```
helpdesk-center/
├── helpdesk-center-backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/helpdeskcenter/
│   │   │   │   ├── controllers/
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── TicketController.java
│   │   │   │   │   ├── CommentController.java
│   │   │   │   │   └── AttachmentController.java
│   │   │   │   ├── services/
│   │   │   │   │   ├── AuthService.java
│   │   │   │   │   ├── TicketService.java
│   │   │   │   │   ├── AIService.java
│   │   │   │   │   ├── PriorityService.java
│   │   │   │   │   └── AttachmentService.java   ← saves to uploads/ on disk
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   ├── TicketRepository.java
│   │   │   │   │   ├── CommentRepository.java
│   │   │   │   │   └── AttachmentRepository.java
│   │   │   │   ├── entities/
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Ticket.java
│   │   │   │   │   ├── Comment.java
│   │   │   │   │   └── Attachment.java          ← stores file_path, not file_url
│   │   │   │   ├── config/
│   │   │   │   │   └── SecurityConfig.java
│   │   │   │   └── util/
│   │   │   │       └── FileStorageUtil.java     ← replaces CosUtil.java
│   │   │   └── resources/
│   │   │       ├── application.properties       ← git-ignored
│   │   │       └── application.properties.example
│   │   └── test/java/com/helpdeskcenter/
│   │       ├── services/
│   │       │   └── PriorityServiceTest.java
│   │       └── controllers/
│   │           └── TicketControllerIntegrationTest.java
│   ├── uploads/                                 ← git-ignored, created at runtime
│   ├── Dockerfile
│   └── pom.xml
│
└── helpdesk-center-frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axiosInstance.js
    │   │   ├── authApi.js
    │   │   ├── ticketsApi.js
    │   │   └── attachmentsApi.js
    │   ├── components/
    │   │   ├── TicketCard.jsx
    │   │   ├── StatusBadge.jsx
    │   │   └── CommentSection.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SubmitTicketPage.jsx
    │   │   ├── EmployeeDashboard.jsx
    │   │   ├── AgentDashboard.jsx
    │   │   └── TicketDetailPage.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```
