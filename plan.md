# Helpdesk Center – Project Plan

## Project Information

| Item                     | Details                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| **Project Name**         | Helpdesk Center                                                     |
| **Project Type**         | AI-Powered Internal Helpdesk Ticketing System                       |
| **Developer**            | Solo Developer                                                      |
| **Estimated Duration**   | 3–5 Days                                                            |
| **Development Approach** | Local Development (Days 1–4), Optional IBM Cloud Deployment (Day 5) |

---

# 1. Project Overview

## Objective

Helpdesk Center is an AI-powered internal ticketing system that enables employees to submit technical or HR support requests while allowing support agents to efficiently manage and resolve them.

The system integrates IBM Cloud services for intelligent ticket categorization and secure file storage.

---

## Core Features

### Employee Features

* Secure login
* Submit support tickets
* Upload attachments (screenshots, documents, logs)
* Automatic AI ticket categorization
* View submitted tickets
* Track ticket status

### Support Agent Features

* Role-based dashboard
* View assigned tickets
* Download attachments
* Update ticket status
* Resolve tickets
* Optional comments

### AI Features

* Automatic ticket categorization

  * Hardware
  * Software
  * Human Resources

* Automatic priority detection using keywords

  * Low
  * Medium
  * High
  * Critical

---

# 2. Technology Stack

## Backend

* Spring Boot 3.2.x
* Java 17
* Maven 3.9.x
* Spring Data JPA
* PostgreSQL 15
* IBM Cloud Object Storage SDK
* IBM Watson Natural Language Understanding

## Frontend

* React 18
* Axios
* React Router

## Database

* PostgreSQL

## Cloud Services

* IBM Watson NLU
* IBM Cloud Object Storage

## Deployment (Optional)

* IBM Cloud Code Engine

---

# 3. System Architecture

```
Browser (React)

        │

        ▼

React Frontend (localhost:3000)

        │
        │ REST API
        ▼

Spring Boot Backend (localhost:8080)

        │
        │ JPA / JDBC
        ▼

PostgreSQL Database

External Services
-----------------------------
IBM Watson NLU
IBM Cloud Object Storage
```

---

# 4. Project Structure

## Backend

```
src/main/java/com/helpdeskcenter/

controllers/
services/
repositories/
entities/
config/
util/
dto/
security/
```

## Frontend

```
src/

components/
pages/
api/
hooks/
utils/
App.js
```

---

# 5. Database Design

## Users

| Column     | Description                               |
| ---------- | ----------------------------------------- |
| id         | Primary Key                               |
| username   | Login username                            |
| password   | Encrypted password                        |
| role       | employee / it_hardware / it_software / hr |
| email      | User email                                |
| created_at | Timestamp                                 |

---

## Tickets

| Column      | Description                    |
| ----------- | ------------------------------ |
| id          | Primary Key                    |
| title       | Ticket title                   |
| description | Problem description            |
| email       | Contact email                  |
| category    | Hardware / Software / HR       |
| priority    | Low / Medium / High / Critical |
| status      | Open / In Progress / Resolved  |
| created_by  | FK → Users                     |
| assigned_to | FK → Users                     |
| created_at  | Timestamp                      |
| updated_at  | Timestamp                      |

---

## Attachments

| Column       | Description       |
| ------------ | ----------------- |
| id           | Primary Key       |
| ticket_id    | FK → Ticket       |
| file_name    | Uploaded filename |
| file_url     | IBM COS URL       |
| file_size    | Size              |
| content_type | MIME type         |
| uploaded_at  | Timestamp         |

---

## Comments (Optional)

| Column     | Description |
| ---------- | ----------- |
| id         | Primary Key |
| ticket_id  | FK          |
| user_id    | FK          |
| message    | Comment     |
| created_at | Timestamp   |

---

# 6. API Endpoints

## Authentication

```
POST   /api/auth/login
POST   /api/auth/logout
```

---

## Tickets

```
GET    /api/tickets
GET    /api/tickets/{id}
POST   /api/tickets
PUT    /api/tickets/{id}/status
```

---

## Attachments

```
POST   /api/attachments/presigned-url

GET    /api/tickets/{id}/attachments

POST   /api/tickets/{id}/attachments

DELETE /api/attachments/{id}
```

---

## Comments (Optional)

```
GET    /api/tickets/{id}/comments

POST   /api/tickets/{id}/comments
```

---

# 7. File Upload Workflow

```
Employee

Select File
      │
      ▼
Request Presigned URL
      │
      ▼
Backend generates URL
      │
      ▼
Upload directly to IBM Cloud Object Storage
      │
      ▼
Save metadata in PostgreSQL
      │
      ▼
Attachment available in ticket
```

Download Flow

```
Agent

Open Ticket

      │

      ▼

Click Attachment

      │

      ▼

Download directly from IBM Cloud Object Storage
```

---

# 8. User Workflows

## Employee Workflow

1. Login
2. Open Submit Ticket
3. Enter title
4. Enter description
5. Upload attachments
6. Submit
7. AI categorizes ticket
8. View ticket status

---

## Support Agent Workflow

1. Login
2. Open dashboard
3. View assigned tickets
4. Review ticket
5. Download attachments
6. Update status
7. Resolve ticket

---

# 9. Development Timeline

## Day 1 — Backend Foundation

### Tasks

* Install Java
* Install PostgreSQL
* Install Maven
* Create database
* Generate Spring Boot project
* Configure database
* Create JPA entities
* Build repositories
* Implement authentication
* Implement Ticket CRUD
* Test with Postman

### Deliverable

Working backend with PostgreSQL integration.

---

## Day 2 — AI + File Storage

### Tasks

* Configure IBM Watson NLU
* Implement AI categorization
* Implement Priority Service
* Configure IBM Cloud Object Storage
* Generate presigned upload URLs
* Save attachment metadata

### Deliverable

Automatic ticket categorization and secure file upload support.

---

## Day 3 — React Frontend

### Tasks

* Create React project
* Configure routing
* Build login page
* Build submit ticket page
* Implement attachment upload
* Connect backend APIs
* Display ticket list

### Deliverable

Complete frontend connected to backend.

---

## Day 4 — Agent Dashboard

### Tasks

* Dashboard
* Ticket filtering
* Ticket details
* Attachment download
* Status updates
* Optional comments
* Testing
* Bug fixes
* UI improvements

### Deliverable

Fully functional local application.

---

## Day 5 — Deployment (Optional)

### Option A

Deploy backend to IBM Cloud Code Engine

* Build JAR
* Configure environment variables
* Deploy
* Test

### Option B

Local demonstration

* Final testing
* Documentation
* README
* Presentation
* Demo

---

# 10. Local Development Setup

## Prerequisites

* Java 17
* Maven 3.9+
* PostgreSQL 15+
* Node.js 18+

---

## Database

Create

* Database
* User
* Grant permissions

Configure

```
spring.datasource.url
spring.datasource.username
spring.datasource.password
```

---

## IBM Cloud Setup

### Watson NLU

* Create service
* Generate API Key
* Save URL

### Cloud Object Storage

* Create bucket
* Enable HMAC credentials
* Save

  * Access Key
  * Secret Key
  * Endpoint

---

# 11. Configuration

Application configuration includes

* PostgreSQL
* JPA
* Watson NLU
* IBM Cloud Object Storage
* Server Port

Secrets should be stored using environment variables or a `.env` file and excluded from version control.

---

# 12. Project Milestones

| Day | Milestone                             |
| --- | ------------------------------------- |
| 1   | Backend CRUD complete                 |
| 2   | AI categorization complete            |
| 2   | IBM Object Storage integrated         |
| 3   | React frontend completed              |
| 4   | Agent dashboard completed             |
| 4   | End-to-end testing completed          |
| 5   | Deployment or documentation completed |

---

# 13. Success Criteria

The project is considered complete when:

* User authentication works
* Employees can submit tickets
* AI categorizes tickets automatically
* Attachments upload successfully to IBM Cloud Object Storage
* Attachment metadata is stored in PostgreSQL
* Agents can download files
* Ticket status updates correctly
* Role-based dashboards function properly
* End-to-end workflow is fully operational
