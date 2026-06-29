# HELPDESK CENTER — PROJECT PLAN
### Complete Development & Deployment Guide

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack Explanation](#2-technology-stack-explanation)
3. [Architecture & Design Decisions](#3-architecture--design-decisions)
4. [User Roles & Workflows](#4-user-roles--workflows)
5. [Database Design](#5-database-design)
6. [API Endpoints](#6-api-endpoints)
7. [Development Timeline](#7-development-timeline)
8. [Setup Instructions](#8-setup-instructions)
9. [Deployment Guide](#9-deployment-guide)
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

- Employees submit tickets with attachments
- AI automatically categorizes tickets (Hardware, Software, HR)
- Priority is auto-assigned based on keywords
- Support agents see role-filtered dashboards
- Status tracking provides transparency

### 1.4 Project Constraints

| Constraint | Value |
|---|---|
| Timeline | 3–5 days |
| Team | 1 developer (solo project) |
| Budget | $0 (using free tiers) |
| Scope | MVP only (no email automation, no mobile app) |

---

## 2. TECHNOLOGY STACK EXPLANATION

### 2.1 Why Spring Boot Instead of Jakarta EE?

**Decision:** Use Spring Boot (Jakarta EE encouraged but not required)

**Rationale:**

- **Faster setup:** Spring Boot auto-configures everything (no `server.xml`, no `persistence.xml` complexity)
- **Better documentation:** Massive community support, more Stack Overflow answers
- **Time savings:** 1–2 days faster development for a 3–5 day project
- **Still satisfies requirement:** Spring Boot uses Jakarta EE standards (JPA, Servlet API)
- **Industry relevance:** More commonly used in modern enterprises

**Comparison:**

| Feature | Jakarta EE (Open Liberty) | Spring Boot |
|---|---|---|
| Setup time | 2–3 hours | 15 minutes |
| Configuration | Manual (XML files) | Auto-configuration |
| DAO layer | Write manually | Auto-generated (Spring Data JPA) |
| Community support | Smaller | Massive |
| Time to first API | 3–4 hours | 30 minutes |

> For a 1-person, 3–5 day capstone: Spring Boot is the pragmatic choice.

---

### 2.2 Technology Stack Breakdown

#### Backend
| Component | Technology |
|---|---|
| Framework | Spring Boot 3.2.x |
| Language | Java 17 |
| Build Tool | Maven 3.9.x |
| Database | PostgreSQL 15.x |
| ORM | Spring Data JPA (implements Jakarta Persistence API) |
| Security | Spring Security (BCrypt password hashing) |

#### Frontend
| Component | Technology |
|---|---|
| Framework | React 18.x |
| Language | JavaScript (ES6+) |
| HTTP Client | Axios |
| Routing | React Router |
| Styling | CSS / Bootstrap (optional) |

#### AI & Cloud Services
| Service | Provider |
|---|---|
| AI Classification | IBM Watson Natural Language Understanding (NLU) |
| File Storage | IBM Cloud Object Storage (COS) |
| Database Hosting | IBM Cloud Databases for PostgreSQL |
| Application Hosting | IBM Cloud Code Engine |

#### DevOps
| Tool | Purpose |
|---|---|
| Docker | Containerization |
| Git / GitHub | Version Control |

---

### 2.3 What is Maven?

Maven is a build automation tool for Java projects.

**What it does:**

- **Manages dependencies** — automatically downloads libraries (Spring Boot, PostgreSQL driver, Watson SDK)
- **Builds the project** — compiles Java code into an executable `.jar` file
- **Runs tests** — executes unit and integration tests
- **Packages the application** — creates deployable artifacts

**Key file:** `pom.xml` (Project Object Model)

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
  </dependency>
</dependencies>
```

**Common Maven commands:**

```bash
mvn clean           # Delete previous builds
mvn compile         # Compile Java code
mvn test            # Run tests
mvn package         # Create .jar file
mvn spring-boot:run # Run the application
```

---

### 2.4 What is Docker?

Docker packages your application and all its dependencies into a **container** — a lightweight, portable unit that runs the same way everywhere.

**Problem it solves:**

- "It works on my laptop but not on the server"
- Different Java versions
- Missing dependencies
- Configuration differences

**How it works:**

1. Create a `Dockerfile` (recipe for your container):

```dockerfile
FROM eclipse-temurin:17-jre
COPY target/helpdesk-backend.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

2. Build the image:

```bash
docker build -t helpdesk-backend .
```

3. Run locally (test):

```bash
docker run -p 8080:8080 helpdesk-backend
```

4. Push to IBM Cloud:

```bash
docker push us.icr.io/namespace/helpdesk-backend
```

5. Deploy to Code Engine:

```bash
ibmcloud ce application create --image us.icr.io/namespace/helpdesk-backend
```

**Benefits:**

- Runs the same on your laptop, classmate's laptop, and IBM Cloud
- Easy deployment (one command)
- Professional standard (used by Netflix, Uber, PayPal)
- IBM Cloud Code Engine requires Docker images

---

## 3. ARCHITECTURE & DESIGN DECISIONS

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   USER LAYER                        │
│  Employee, IT Hardware Agent, IT Software Agent,    │
│  HR Agent (Web Browser)                             │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
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
                     │ REST API (JSON)
┌────────────────────▼────────────────────────────────┐
│           APPLICATION LAYER                         │
│          Spring Boot Backend                        │
│  ┌────────────────────────────────────────────┐    │
│  │ REST Controllers                           │    │
│  │  - AuthController  (/api/auth/login)       │    │
│  │  - TicketController (/api/tickets)         │    │
│  │  - CommentController (/api/comments)       │    │
│  │  - AttachmentController (/api/attachments) │    │
│  └──────────────────┬─────────────────────────┘    │
│  ┌──────────────────▼─────────────────────────┐    │
│  │ Business Services                          │    │
│  │  - TicketService (CRUD logic)              │    │
│  │  - AIService (Watson NLU integration)      │    │
│  │  - PriorityService (keyword detection)     │    │
│  │  - AttachmentService (presigned URLs)      │    │
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
│  PostgreSQL DB   │      │ - Watson NLU        │
│  - users         │      │ - Object Storage    │
│  - tickets       │      └─────────────────────┘
│  - comments      │
│  - attachments   │
└──────────────────┘
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
| CSRF | CORS configuration, stateless REST API |
| Password theft | BCrypt hashing (never store plaintext) |
| Unauthorized access | Role-based access control |
| File upload abuse | File type validation, size limits (10MB) |

---

## 4. USER ROLES & WORKFLOWS

### 4.1 User Roles

| Role | Description | Permissions |
|---|---|---|
| Employee | Regular user who submits tickets | Create tickets, view own tickets, add comments to own tickets |
| IT Hardware Agent | Handles hardware issues | View all hardware tickets, update status, add comments, resolve tickets |
| IT Software Agent | Handles software issues | View all software tickets, update status, add comments, resolve tickets |
| HR Agent | Handles HR/facilities issues | View all HR tickets, update status, add comments, resolve tickets |

---

### 4.2 Employee Workflow

**Scenario: Employee's laptop keyboard is broken**

```
STEP 1: Login
──────────────────────────────────────────────────────
- Navigate to https://helpdesk-center.com
- Enter username: john.doe
- Enter password: ********
- Click "Login"
- System validates credentials and creates session

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
   - Generate presigned URL for Object Storage
   - Upload keyboard-photo.jpg to COS
   - Store file URL in database

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

[View My Tickets] button

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
- View description, attachments, and history
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
| `password_hash` | VARCHAR(255) | NOT NULL | BCrypt hashed |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | Contact email |
| `role` | VARCHAR(30) | NOT NULL | EMPLOYEE, IT_HARDWARE_AGENT, IT_SOFTWARE_AGENT, HR_AGENT |
| `full_name` | VARCHAR(100) | NOT NULL | Display name |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation |
| `is_active` | BOOLEAN | DEFAULT TRUE | Soft-delete flag |

**Roles Enum:**
```
EMPLOYEE
IT_HARDWARE_AGENT
IT_SOFTWARE_AGENT
HR_AGENT
```

---

### 5.3 Table: `tickets`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-increment |
| `title` | VARCHAR(200) | NOT NULL | Short summary |
| `description` | TEXT | NOT NULL | Full description |
| `category` | VARCHAR(20) | NOT NULL | HARDWARE, SOFTWARE, HR |
| `priority` | VARCHAR(10) | NOT NULL | LOW, MEDIUM, HIGH, CRITICAL |
| `status` | VARCHAR(20) | NOT NULL | OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| `created_by` | BIGINT | FK → users.id | Ticket submitter |
| `assigned_to` | BIGINT | FK → users.id, NULL | Assigned agent |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Submission time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification |
| `resolved_at` | TIMESTAMP | NULL | Resolution time |

**Categories Enum:**
```
HARDWARE
SOFTWARE
HR
```

**Priority Keyword Mapping:**
```
CRITICAL  → "system down", "server down", "production down", "outage"
HIGH      → "urgent", "cannot work", "blocked", "asap", "critical"
MEDIUM    → "slow", "error", "not working", "issue", "problem"
LOW       → everything else (default)
```

**Status Transitions:**
```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
OPEN → CLOSED (direct closure by agent)
```

---

### 5.4 Table: `comments`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-increment |
| `ticket_id` | BIGINT | FK → tickets.id, NOT NULL | Parent ticket |
| `author_id` | BIGINT | FK → users.id, NOT NULL | Comment author |
| `content` | TEXT | NOT NULL | Comment body |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Posted time |

---

### 5.5 Table: `attachments`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-increment |
| `ticket_id` | BIGINT | FK → tickets.id, NOT NULL | Parent ticket |
| `file_name` | VARCHAR(255) | NOT NULL | Original file name |
| `file_url` | TEXT | NOT NULL | COS object URL |
| `file_size` | BIGINT | NOT NULL | Size in bytes |
| `content_type` | VARCHAR(100) | NOT NULL | MIME type |
| `uploaded_at` | TIMESTAMP | DEFAULT NOW() | Upload time |

**Allowed file types:** `image/jpeg`, `image/png`, `image/gif`, `application/pdf`, `text/plain`  
**Max file size:** 10 MB

---

### 5.6 SQL Schema (DDL)

```sql
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    role          VARCHAR(30)  NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP    DEFAULT NOW(),
    is_active     BOOLEAN      DEFAULT TRUE
);

CREATE TABLE tickets (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT         NOT NULL,
    category    VARCHAR(20)  NOT NULL,
    priority    VARCHAR(10)  NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    created_by  BIGINT       NOT NULL REFERENCES users(id),
    assigned_to BIGINT                REFERENCES users(id),
    created_at  TIMESTAMP    DEFAULT NOW(),
    updated_at  TIMESTAMP    DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE TABLE comments (
    id         BIGSERIAL PRIMARY KEY,
    ticket_id  BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id  BIGINT NOT NULL REFERENCES users(id),
    content    TEXT   NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attachments (
    id           BIGSERIAL PRIMARY KEY,
    ticket_id    BIGINT       NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_name    VARCHAR(255) NOT NULL,
    file_url     TEXT         NOT NULL,
    file_size    BIGINT       NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    uploaded_at  TIMESTAMP    DEFAULT NOW()
);
```

---

## 6. API ENDPOINTS

### 6.1 Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login with username + password, returns JWT |
| POST | `/api/auth/logout` | JWT | Invalidate session |
| GET | `/api/auth/me` | JWT | Get current user profile |

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 42,
    "username": "john.doe",
    "fullName": "John Doe",
    "role": "EMPLOYEE",
    "email": "john.doe@company.com"
  }
}
```

---

### 6.2 Tickets

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/tickets` | JWT | EMPLOYEE | Create new ticket |
| GET | `/api/tickets` | JWT | All | List tickets (role-filtered) |
| GET | `/api/tickets/{id}` | JWT | All | Get single ticket details |
| PATCH | `/api/tickets/{id}/status` | JWT | AGENT | Update ticket status |
| PATCH | `/api/tickets/{id}/assign` | JWT | AGENT | Assign ticket to agent |

**Create Ticket Request:**
```json
{
  "title": "Laptop keyboard not working",
  "description": "Several keys are stuck. Cannot type. Urgent.",
  "email": "john.doe@company.com"
}
```

**Create Ticket Response:**
```json
{
  "id": 1001,
  "title": "Laptop keyboard not working",
  "category": "HARDWARE",
  "priority": "HIGH",
  "status": "OPEN",
  "createdAt": "2025-01-15T09:30:00Z"
}
```

**List Tickets Response (Employee):** Returns only tickets where `created_by = current_user.id`  
**List Tickets Response (IT Hardware Agent):** Returns only tickets where `category = HARDWARE`

---

### 6.3 Comments

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/tickets/{id}/comments` | JWT | All | Add comment to ticket |
| GET | `/api/tickets/{id}/comments` | JWT | All | List comments on ticket |

---

### 6.4 Attachments

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/tickets/{id}/attachments` | JWT | EMPLOYEE | Upload file (multipart/form-data) |
| GET | `/api/tickets/{id}/attachments` | JWT | All | List attachments on ticket |
| GET | `/api/attachments/{id}/download` | JWT | All | Get presigned download URL |

---

## 7. DEVELOPMENT TIMELINE

### Day 1 — Backend Foundation
- [ ] Initialize Spring Boot project (Spring Initializr)
- [ ] Configure PostgreSQL connection (`application.properties`)
- [ ] Create JPA entities: `User`, `Ticket`, `Comment`, `Attachment`
- [ ] Create repositories: `UserRepository`, `TicketRepository`, etc.
- [ ] Implement `AuthController` + `AuthService` (login endpoint)
- [ ] Configure Spring Security + BCrypt
- [ ] Test login with Postman

### Day 2 — Core Ticket Features
- [ ] Implement `TicketController` + `TicketService`
- [ ] Implement `PriorityService` (keyword detection logic)
- [ ] Integrate Watson NLU for AI categorization (`AIService`)
- [ ] Implement `CommentController` + `CommentService`
- [ ] Role-based ticket filtering logic
- [ ] Test all ticket endpoints with Postman

### Day 3 — File Upload & Frontend Start
- [ ] Implement `AttachmentService` (IBM COS presigned URLs)
- [ ] Implement `AttachmentController` (multipart upload)
- [ ] Initialize React project (`create-react-app` or Vite)
- [ ] Build Login page
- [ ] Build Submit Ticket form
- [ ] Connect frontend to backend (Axios, CORS configuration)

### Day 4 — Frontend Dashboards
- [ ] Build Employee Dashboard (My Tickets list)
- [ ] Build Agent Dashboard (Role-filtered ticket queue)
- [ ] Build Ticket Detail page (comments + attachments)
- [ ] Implement React Router navigation
- [ ] JWT storage and Axios interceptors

### Day 5 — Testing & Deployment
- [ ] Write unit tests (JUnit 5 + Mockito)
- [ ] Write integration tests (Spring Boot Test)
- [ ] Build Docker image, test locally
- [ ] Push image to IBM Container Registry
- [ ] Deploy backend to IBM Cloud Code Engine
- [ ] Deploy frontend (Netlify or Code Engine)
- [ ] End-to-end smoke test in production

---

## 8. SETUP INSTRUCTIONS

### 8.1 Prerequisites

```bash
# Verify installations
java --version        # Must be 17+
mvn --version         # Must be 3.9+
node --version        # Must be 18+
docker --version      # Any recent version
psql --version        # PostgreSQL 15+
```

### 8.2 Backend Setup (Local)

```bash
# 1. Clone repository
git clone https://github.com/your-org/helpdesk-center.git
cd helpdesk-center/helpdesk-center-backend

# 2. Create local PostgreSQL database
psql -U postgres -c "CREATE DATABASE helpdesk_db;"
psql -U postgres -c "CREATE USER helpdesk_user WITH PASSWORD 'helpdesk_pass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE helpdesk_db TO helpdesk_user;"

# 3. Configure environment variables (copy and edit)
cp src/main/resources/application.properties.example \
   src/main/resources/application.properties

# 4. Run the backend
mvn spring-boot:run
# Backend available at http://localhost:8080
```

### 8.3 application.properties Template

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/helpdesk_db
spring.datasource.username=helpdesk_user
spring.datasource.password=helpdesk_pass

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JWT Secret (change in production)
app.jwt.secret=your-secret-key-min-32-chars
app.jwt.expiration-ms=86400000

# IBM Watson NLU
watson.nlu.api-key=your-watson-api-key
watson.nlu.url=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com

# IBM Cloud Object Storage
cos.api-key=your-cos-api-key
cos.service-instance-id=your-service-instance-id
cos.endpoint=https://s3.us-south.cloud-object-storage.appdomain.cloud
cos.bucket-name=helpdesk-attachments
```

### 8.4 Frontend Setup (Local)

```bash
cd helpdesk-center/helpdesk-center-frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend available at http://localhost:5173

# Configure API base URL
# In src/config.js:
export const API_BASE_URL = 'http://localhost:8080/api';
```

---

## 9. DEPLOYMENT GUIDE

### 9.1 IBM Cloud Services Setup

```bash
# Install IBM Cloud CLI
# https://cloud.ibm.com/docs/cli

# Login
ibmcloud login --sso

# Target resource group
ibmcloud target -g default

# Install Code Engine plugin
ibmcloud plugin install code-engine

# Install Container Registry plugin
ibmcloud plugin install container-registry
```

### 9.2 Build & Push Docker Image

```bash
# Build the Spring Boot jar
mvn clean package -DskipTests

# Build Docker image
docker build -t helpdesk-backend:latest .

# Login to IBM Container Registry
ibmcloud cr login

# Tag and push image
ibmcloud cr namespace-add helpdesk-ns
docker tag helpdesk-backend:latest us.icr.io/helpdesk-ns/helpdesk-backend:latest
docker push us.icr.io/helpdesk-ns/helpdesk-backend:latest
```

### 9.3 Deploy to Code Engine

```bash
# Create Code Engine project
ibmcloud ce project create --name helpdesk-center

# Select project
ibmcloud ce project select --name helpdesk-center

# Create application
ibmcloud ce application create \
  --name helpdesk-backend \
  --image us.icr.io/helpdesk-ns/helpdesk-backend:latest \
  --port 8080 \
  --env SPRING_DATASOURCE_URL="jdbc:postgresql://..." \
  --env SPRING_DATASOURCE_USERNAME="helpdesk_user" \
  --env SPRING_DATASOURCE_PASSWORD="helpdesk_pass" \
  --env APP_JWT_SECRET="your-production-secret" \
  --env WATSON_NLU_API_KEY="your-watson-key" \
  --env COS_API_KEY="your-cos-key"

# Get backend URL
ibmcloud ce application get --name helpdesk-backend
```

### 9.4 Frontend Deployment (Netlify)

```bash
# Build frontend
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Set environment variable in Netlify UI:
# VITE_API_BASE_URL = https://helpdesk-backend.<code-engine-url>/api
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

**Target:** Services (business logic)

```java
// Example: PriorityServiceTest.java
@ExtendWith(MockitoExtension.class)
class PriorityServiceTest {

    @InjectMocks
    private PriorityService priorityService;

    @Test
    void shouldReturnHighPriorityForUrgentKeyword() {
        String description = "This is urgent, I cannot work!";
        Priority result = priorityService.detectPriority(description);
        assertEquals(Priority.HIGH, result);
    }

    @Test
    void shouldReturnLowPriorityForNeutralDescription() {
        String description = "Please update my email signature.";
        Priority result = priorityService.detectPriority(description);
        assertEquals(Priority.LOW, result);
    }
}
```

### 10.3 Integration Tests

**Target:** Controllers + Repository + Database

```java
// Example: TicketControllerIntegrationTest.java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class TicketControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldCreateTicketAndReturnCategory() throws Exception {
        mockMvc.perform(post("/api/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "Keyboard broken",
                      "description": "My laptop keyboard is not working",
                      "email": "test@test.com"
                    }
                """)
                .header("Authorization", "Bearer " + testToken))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.category").value("HARDWARE"))
            .andExpect(jsonPath("$.status").value("OPEN"));
    }
}
```

### 10.4 Manual Test Cases (Postman)

| Test Case | Steps | Expected Result |
|---|---|---|
| TC-001: Login | POST /api/auth/login with valid credentials | 200 OK + JWT token |
| TC-002: Login Fail | POST /api/auth/login with wrong password | 401 Unauthorized |
| TC-003: Submit Ticket | POST /api/tickets with keyboard description | 201 Created, category=HARDWARE |
| TC-004: AI Categorization | Submit ticket with "payroll" description | category=HR |
| TC-005: Priority Detection | Submit ticket with "urgent" keyword | priority=HIGH |
| TC-006: Role Filtering | Login as IT_HARDWARE_AGENT, GET /api/tickets | Only HARDWARE tickets returned |
| TC-007: Employee Isolation | Login as Employee A, GET /api/tickets | Only own tickets returned |
| TC-008: File Upload | POST /api/tickets/{id}/attachments with JPEG | 201 Created, file URL in response |
| TC-009: Add Comment | POST /api/tickets/{id}/comments | 201 Created, comment visible |
| TC-010: Update Status | PATCH /api/tickets/{id}/status as agent | Status updated, 200 OK |

---

## 11. RISK MANAGEMENT

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Watson NLU API rate limit hit | Low | High | Cache results, implement fallback keyword classification |
| COS upload fails | Low | Medium | Return error to user, allow retry; ticket can be submitted without attachment |
| IBM Cloud free tier exhausted | Low | High | Monitor usage daily; stay within limits |
| PostgreSQL connection lost | Low | High | Spring Boot auto-reconnects; connection pool configured |
| JWT secret exposed | Low | Critical | Store in environment variables, never in code |
| AI misclassifies ticket | Medium | Low | Agents can manually re-categorize tickets |
| Time overrun on Day 3–4 | Medium | Medium | Cut attachment feature if needed; submit text-only tickets as MVP |

---

## 12. KEY DECISIONS & RATIONALE

| Decision | Alternative Considered | Reason for Choice |
|---|---|---|
| Spring Boot over Jakarta EE | Jakarta EE + Open Liberty | Faster setup for solo 3–5 day project |
| PostgreSQL over MySQL | MySQL | IBM Cloud Databases offers managed PostgreSQL; better JSON support |
| JWT over sessions | HTTP Sessions | Stateless; works across Code Engine instances |
| IBM Watson NLU over custom ML | OpenAI GPT API | IBM ecosystem alignment; free tier available |
| IBM COS over AWS S3 | AWS S3, local disk | IBM ecosystem; presigned URL support; free tier |
| React over Angular/Vue | Angular, Vue | Most widely used; faster to scaffold; team familiarity |
| Netlify for frontend | Code Engine, GitHub Pages | Instant HTTPS, free tier, zero-config CDN |

---

## APPENDIX: PROJECT FILE STRUCTURE

```
helpdesk-center/
├── helpdesk-center-backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/helpdeskce/
│   │   │   │   ├── controller/
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── TicketController.java
│   │   │   │   │   ├── CommentController.java
│   │   │   │   │   └── AttachmentController.java
│   │   │   │   ├── service/
│   │   │   │   │   ├── AuthService.java
│   │   │   │   │   ├── TicketService.java
│   │   │   │   │   ├── AIService.java
│   │   │   │   │   ├── PriorityService.java
│   │   │   │   │   └── AttachmentService.java
│   │   │   │   ├── repository/
│   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   ├── TicketRepository.java
│   │   │   │   │   ├── CommentRepository.java
│   │   │   │   │   └── AttachmentRepository.java
│   │   │   │   ├── model/
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Ticket.java
│   │   │   │   │   ├── Comment.java
│   │   │   │   │   └── Attachment.java
│   │   │   │   ├── dto/
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── LoginResponse.java
│   │   │   │   │   ├── TicketRequest.java
│   │   │   │   │   └── TicketResponse.java
│   │   │   │   ├── security/
│   │   │   │   │   ├── JwtUtil.java
│   │   │   │   │   ├── JwtAuthFilter.java
│   │   │   │   │   └── SecurityConfig.java
│   │   │   │   └── HelpdeskCenterApplication.java
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── application-prod.properties
│   │   └── test/
│   │       └── java/com/helpdeskce/
│   │           ├── service/
│   │           │   └── PriorityServiceTest.java
│   │           └── controller/
│   │               └── TicketControllerIntegrationTest.java
│   ├── Dockerfile
│   └── pom.xml
│
└── helpdesk-center-frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SubmitTicketPage.jsx
    │   │   ├── EmployeeDashboard.jsx
    │   │   ├── AgentDashboard.jsx
    │   │   └── TicketDetailPage.jsx
    │   ├── components/
    │   │   ├── TicketCard.jsx
    │   │   ├── CommentSection.jsx
    │   │   └── FileUpload.jsx
    │   ├── services/
    │   │   ├── authService.js
    │   │   └── ticketService.js
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── config.js
    │   └── App.jsx
    ├── public/
    └── package.json
```

---

*This document is the single source of truth for the Helpdesk Center capstone project. All implementation decisions should reference and align with this plan.*
