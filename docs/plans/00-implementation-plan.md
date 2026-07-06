# Helpdesk Center — Implementation Plan

## Overview

Implement the full Helpdesk Center application as defined in `plan.md`.

**Stack confirmed:** Spring Boot 3.3.5 · Java 21 · PostgreSQL · Session auth (no JWT) · Local disk file storage · IBM Watson NLU · React 19 + Vite · Axios · React Router 7

**Starting state:**
- Backend folders exist (`controllers/`, `services/`, `repositories/`, `entities/`, `config/`, `util/`) but all files are empty
- Frontend is stock Vite scaffold (no pages, no api layer)
- `pom.xml` still contains IBM COS SDK — must be removed
- `application.properties` still has COS keys — must be cleaned up

**Approach:** Each sub-task is self-contained, implemented one at a time, verified before moving to the next.

---

## Sub-Task 1 — Clean Up & Backend Foundation

**Status:** [ ] pending

### Intent
Remove leftover IBM COS references, fix `application.properties`, create the main application entry point, and verify the backend starts and connects to PostgreSQL cleanly.

### Expected Outcomes
- `pom.xml` has IBM COS SDK removed
- `application.properties` has COS keys removed, `app.upload.dir=uploads` added
- `HelpdeskCenterApplication.java` exists in `com.helpdeskcenter`
- `mvn spring-boot:run` starts without errors and connects to `helpdesk_db`

### Todo List
1. Remove IBM COS SDK dependency from `pom.xml` (keep Watson NLU)
2. Remove COS keys from `application.properties`, add `app.upload.dir=uploads`
3. Create `HelpdeskCenterApplication.java` in `src/main/java/com/helpdeskcenter/`
4. Delete the old empty stub at `com/helpdeskce/helpdesk_center_backend/` (already deleted per git status)
5. Run `mvn spring-boot:run` and confirm startup succeeds

### Relevant Context
- `helpdesk-center-backend/pom.xml` — lines 65-70 contain IBM COS dep to remove
- `helpdesk-center-backend/src/main/resources/application.properties` — lines 26-30 contain COS keys to remove

---

## Sub-Task 2 — JPA Entities

**Status:** [ ] pending

### Intent
Create the four database entities. Spring Boot will auto-create the tables in PostgreSQL via `ddl-auto=update` on startup.

### Expected Outcomes
- `User.java`, `Ticket.java`, `Attachment.java`, `Comment.java` exist in `entities/`
- Tables `users`, `tickets`, `attachments`, `comments` are auto-created in `helpdesk_db` on next startup
- All relationships (`@ManyToOne`) correctly map to foreign keys per the plan

### Todo List
1. Create `User.java` — fields: `id`, `username`, `password`, `email`, `role`, `fullName`, `createdAt`
2. Create `Ticket.java` — fields: `id`, `title`, `description`, `email`, `category`, `priority`, `status`, `createdBy` (FK User), `assignedTo` (FK User, nullable), `createdAt`, `updatedAt`
3. Create `Attachment.java` — fields: `id`, `ticket` (FK Ticket), `fileName`, `filePath`, `fileSize`, `contentType`, `uploadedAt`
4. Create `Comment.java` — fields: `id`, `ticket` (FK Ticket), `user` (FK User), `message`, `createdAt`
5. Restart backend and confirm all 4 tables are created in PostgreSQL

### Relevant Context
- `plan.md` §5 — full column definitions and FK relationships
- Use Lombok `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`
- Use `@EntityListeners(AuditingEntityListener.class)` + `@CreatedDate`/`@LastModifiedDate` for timestamps, or plain `@PrePersist`/`@PreUpdate`

---

## Sub-Task 3 — Repositories

**Status:** [ ] pending

### Intent
Create Spring Data JPA repository interfaces. Provides all basic CRUD and the role-filtered query needed for ticket listing.

### Expected Outcomes
- `UserRepository`, `TicketRepository`, `AttachmentRepository`, `CommentRepository` exist
- `TicketRepository` has custom queries for role-based filtering (`findByCreatedBy` and `findByCategory`)
- `UserRepository` has `findByUsername` for login lookup

### Todo List
1. Fill `UserRepository.java` — `findByUsername(String username)`
2. Fill `TicketRepository.java` — `findByCreatedBy(User user)`, `findByCategory(String category)`, `findAllByOrderByCreatedAtDesc()`
3. Fill `AttachmentRepository.java` — `findByTicketId(Long ticketId)`
4. Fill `CommentRepository.java` — `findByTicketIdOrderByCreatedAtAsc(Long ticketId)`

### Relevant Context
- All files already exist as empty stubs in `repositories/`
- Each interface extends `JpaRepository<Entity, Long>`

---

## Sub-Task 4 — Security Configuration & Auth

**Status:** [ ] pending

### Intent
Configure Spring Security for session-based authentication with BCrypt password hashing. Expose the login and logout endpoints. Permit CORS from the React frontend (`localhost:5173`).

### Expected Outcomes
- `SecurityConfig.java` permits `POST /api/auth/login` without auth, secures all other endpoints
- CORS allows `http://localhost:5173` with credentials
- `POST /api/auth/login` with valid username+password returns the user object (id, username, role, email, fullName) and sets `JSESSIONID` cookie
- `POST /api/auth/logout` invalidates the session
- `GET /api/auth/me` returns the current logged-in user
- BCrypt bean is configured

### Todo List
1. Create `SecurityConfig.java` in `config/` — session management, BCrypt bean, CORS, permit login endpoint
2. Create `AuthService.java` in `services/` — `login(username, password)` validates credentials with BCrypt, returns user object
3. Create `AuthController.java` in `controllers/` — `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
4. Create a `CommandLineRunner` bean (or `data.sql`) that seeds 4 test users with BCrypt-hashed passwords
5. Test with Postman: login returns user JSON + cookie; `/api/tickets` without login returns 401

### Relevant Context
- `plan.md` §6.1 — login request/response shapes
- `plan.md` §2.1 — "Session-based — no JWT"
- Test users to seed: `john.doe` (employee), `it.hardware` (it_hardware), `it.software` (it_software), `hr.agent` (hr) — all password `password123`

---

## Sub-Task 5 — Ticket CRUD + AI + Priority

**Status:** [ ] pending

### Intent
Implement the core ticket feature: create ticket (with Watson NLU categorization and keyword priority detection), list tickets (role-filtered), get single ticket, and update status.

### Expected Outcomes
- `POST /api/tickets` creates a ticket, auto-sets `category` via Watson NLU and `priority` via keyword scan
- `GET /api/tickets` returns only the caller's tickets (employee) or category-filtered tickets (agent)
- `GET /api/tickets/{id}` returns full ticket detail
- `PUT /api/tickets/{id}/status` updates status (agent only)
- Watson NLU falls back to keyword classification if the API key is not yet configured

### Todo List
1. Create `PriorityService.java` — keyword scan returning `critical`/`high`/`medium`/`low`
2. Create `AIService.java` — calls Watson NLU with ticket description; on failure falls back to keyword-based category detection
3. Create `TicketService.java` — `createTicket()`, `getTicketsForUser()` (role-filtered), `getTicketById()`, `updateStatus()`
4. Create `TicketController.java` — `POST /api/tickets`, `GET /api/tickets`, `GET /api/tickets/{id}`, `PUT /api/tickets/{id}/status`
5. Test with Postman: submit ticket with "keyboard broken" → category=hardware; "payroll issue" → category=hr

### Relevant Context
- `plan.md` §6.2 — endpoint definitions and role filtering rules
- `plan.md` §5.3 — priority keyword mapping
- Watson NLU SDK is `com.ibm.watson:natural-language-understanding:11.0.0`
- `application.properties` has `watson.nlu.api-key` (placeholder until IBM account set up)
- Fallback logic: if Watson call throws, run description through a keyword map (hardware/software/hr keywords)

---

## Sub-Task 6 — File Attachments (Local Disk)

**Status:** [ ] pending

### Intent
Implement file upload (multipart → local disk), file listing, file download (stream from disk), and file delete. No cloud storage involved.

### Expected Outcomes
- `POST /api/tickets/{id}/attachments` saves the uploaded file to `uploads/{ticketId}/{uuid}_{originalName}` and creates an `Attachment` DB record
- `GET /api/tickets/{id}/attachments` returns attachment metadata list for a ticket
- `GET /api/attachments/{id}/download` streams the file back to the browser with the correct `Content-Type` header
- `DELETE /api/attachments/{id}` removes the file from disk and deletes the DB record
- File type and size validation (max 10 MB, allowed MIME types only)
- `uploads/` directory is created automatically on first upload

### Todo List
1. Create `FileStorageUtil.java` in `util/` — `save(ticketId, file)`, `load(filePath)`, `delete(filePath)`, directory creation, UUID prefix, file name sanitization
2. Create `AttachmentService.java` in `services/` — wraps `FileStorageUtil`, validates type/size, manages DB record via `AttachmentRepository`
3. Fill `AttachmentRepository.java` with `findByTicketId(Long ticketId)`
4. Create `AttachmentController.java` in `controllers/` — all four endpoints
5. Test upload a JPEG, verify file appears in `uploads/`, download it back

### Relevant Context
- `plan.md` §7 — full upload and download flow
- `plan.md` §5.4 — `file_path` column (not `file_url`)
- `application.properties` `app.upload.dir=uploads`
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `application/pdf`, `text/plain`

---

## Sub-Task 7 — Comments (Deferred)

**Status:** [ ] deferred — implement after Sub-Task 10 if time allows

### Intent
Add commenting to tickets. Both employees and agents can post and read comments.

### Expected Outcomes
- `POST /api/tickets/{id}/comments` adds a comment to a ticket
- `GET /api/tickets/{id}/comments` returns comments ordered by `createdAt` ascending

### Todo List
1. Create `CommentService.java` — `addComment()`, `getComments()`
2. Create `CommentController.java` — `POST` and `GET` endpoints

### Relevant Context
- `plan.md` §6.4 — endpoint definitions
- `plan.md` §5.5 — `comments` table schema

---

## Sub-Task 8 — React Frontend: Auth + Routing

**Status:** [ ] pending

### Intent
Set up the React app structure: Axios instance with session credentials, auth context for storing the logged-in user, protected routes, and the Login page.

### Expected Outcomes
- `src/api/axiosInstance.js` — base URL `http://localhost:8080`, `withCredentials: true`
- `src/api/authApi.js` — `login()`, `logout()`, `getMe()` functions
- `src/context/AuthContext.jsx` — stores user in `localStorage`, exposes `user`, `login()`, `logout()`
- `src/App.jsx` — React Router routes with protected route wrapper
- Login page connects to backend, on success redirects to the correct dashboard (employee → EmployeeDashboard, agent → AgentDashboard)
- Stock Vite boilerplate (`App.css`, `index.css`, assets) cleaned out

### Todo List
1. Create folder structure: `src/api/`, `src/context/`, `src/pages/`, `src/components/`
2. Create `axiosInstance.js`
3. Create `authApi.js`, `ticketsApi.js`, `attachmentsApi.js`
4. Create `AuthContext.jsx` with `localStorage` persistence
5. Build `LoginPage.jsx` — form with username/password, calls `authApi.login()`, redirects on success
6. Update `App.jsx` — React Router with protected route wrapper; routes to Login, EmployeeDashboard, AgentDashboard, TicketDetail
7. Clean out stock Vite boilerplate files

### Relevant Context
- `plan.md` §6.1 — login response shape (id, username, role, email, fullName)
- Axios `withCredentials: true` is required for the session cookie to be sent
- Role-based redirect: `employee` → `/dashboard`, `it_hardware`/`it_software`/`hr` → `/agent`

---

## Sub-Task 9 — React Frontend: Employee Dashboard + Submit Ticket

**Status:** [ ] pending

### Intent
Build the employee-facing pages: a list of their own tickets and a form to submit a new ticket with file attachments.

### Expected Outcomes
- `EmployeeDashboard.jsx` — fetches and lists the current user's tickets with status badges
- `SubmitTicketPage.jsx` — form with title, description, email, file input; on submit posts to backend; shows ticket ID + auto-assigned category/priority on success
- File upload sends multipart/form-data directly to `POST /api/tickets/{id}/attachments`
- `TicketCard.jsx` component reused for the list

### Todo List
1. Create `StatusBadge.jsx` component — colour-coded badge for open/in_progress/resolved
2. Create `TicketCard.jsx` component — renders ticket summary row
3. Build `EmployeeDashboard.jsx` — fetch `/api/tickets`, map to `TicketCard`, link to detail page
4. Build `SubmitTicketPage.jsx` — two-step: (1) POST ticket JSON, (2) if file selected, POST multipart to attachments endpoint
5. Wire navigation between pages

### Relevant Context
- `plan.md` §4.2 — employee workflow
- `plan.md` §7 — file upload flow (multipart to `/api/tickets/{id}/attachments`)

---

## Sub-Task 10 — React Frontend: Agent Dashboard + Ticket Detail

**Status:** [ ] pending

### Intent
Build the agent-facing pages: a role-filtered ticket queue and a full ticket detail view with attachment download and status update.

### Expected Outcomes
- `AgentDashboard.jsx` — shows tickets filtered by agent's role (backend handles filtering), with status update button
- `TicketDetailPage.jsx` — shows full ticket info, attachment list with download links, comment thread, and status dropdown for agents
- `CommentSection.jsx` — list of comments + add comment form
- End-to-end flow works: employee submits → agent sees in dashboard → agent downloads attachment → agent updates status to resolved

### Todo List
1. Build `AgentDashboard.jsx` — fetch `/api/tickets`, render `TicketCard` list, sort by priority
2. Build `TicketDetailPage.jsx` — fetch ticket by id, display all fields, render attachments with download links, render `CommentSection`
3. Build `CommentSection.jsx` — fetch comments, add comment form
4. Add status update control in `TicketDetailPage` (agent only) — calls `PUT /api/tickets/{id}/status`
5. Wire download link to `GET /api/attachments/{id}/download`

### Relevant Context
- `plan.md` §4.3 — agent workflow
- `plan.md` §6.2, §6.3, §6.4 — endpoint definitions
- Only agents (not employees) should see the status update control

---

## Sub-Task 11 — End-to-End Smoke Test & Cleanup

**Status:** [ ] pending

### Intent
Verify the full application works end-to-end, fix any integration bugs, and clean up loose ends.

### Expected Outcomes
- Full employee flow works: login → submit ticket with file → see ticket in dashboard → status changes visible
- Full agent flow works: login → see filtered queue → open ticket → download attachment → update status → resolved
- Watson NLU fallback works when API key is placeholder
- No console errors in browser, no stack traces in backend logs during normal use

### Todo List
1. Run both servers (`mvn spring-boot:run` + `npm run dev`)
2. Test TC-001 through TC-011 from `plan.md` §10.3
3. Fix any bugs found
4. Commit all changes to GitHub

### Relevant Context
- `plan.md` §10.3 — full manual test case list
