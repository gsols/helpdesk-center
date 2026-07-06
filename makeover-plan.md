# Project Makeover Plan: Multi-Tenant AI Help Desk Platform

**Source of Truth**: `plan.md` + ADRs in `docs/adr/`
**Goal**: Bring the entire project (backend + frontend) into full compliance with the approved system blueprint and all accepted ADRs.

## Scope Decisions (Confirmed)
| Decision | Choice |
|----------|--------|
| Object storage (Sub-Task 3) | **Skipped** — keep local disk storage; implement everything else first |
| Async email (Sub-Task 7) | **Skipped** — focus on auth, AI, lifecycle, and frontend first |
| React Router mode (Sub-Task 9) | **Migrate to `createBrowserRouter`** — Data API routing with loaders/actions |

---

## Current State Assessment

### What Exists (Salvageable)
- All 8 JPA entities exist and are schema-aligned (`Company`, `Department`, `User`, `Ticket`, `TicketMessage`, `Attachment`, `SlaRule`, `AiClassificationLog`)
- All 8 repositories exist with JPA queries (KPI SQL queries for FRT, MTTR, AI Accuracy are already written)
- Basic ticket CRUD endpoints exist
- Basic auth flow (login/logout) exists
- Frontend layout shell, split-pane component, employee submission form, file dropzone, and AI preview integration exist
- React 19 + Vite 8 + React Router DOM v7 + Lucide React are already in `package.json`

### What's Broken (Requires Rewrite)
| Layer | Issue |
|-------|-------|
| **Backend auth** | Session/cookie-based — must become JWT stateless |
| **Backend file storage** | Local filesystem (`FileStorageUtil`) — must become S3/MinIO |
| **Backend AI service** | No 60% confidence gate, no `ai_classification_logs` writes |
| **Backend security** | No role + department-scoped authorization enforcement |
| **Backend ticket logic** | Missing: parent-child splitting, re-route endpoint, auto-status transitions, SLA assignment |
| **Frontend data fetching** | Vanilla Axios everywhere — must migrate to TanStack Query v5 |
| **Frontend auth** | `withCredentials: true` + sessions — must become Bearer JWT token |
| **Frontend agent view** | Single generic list — must split into My Queue / Pool / Archive tabs |
| **Frontend admin view** | Missing SLA panel and analytics KPI dashboard entirely |
| **Frontend styling** | Inline JS style objects everywhere — must migrate to Tailwind CSS classes |

### What's Missing (Net New)
- JWT generation, validation, and filter chain (backend)
- `JwtAuthenticationFilter`, `JwtProvider`, `CustomUserDetailsService` (backend security)
- MinIO/S3 integration service (backend)
- Re-route endpoint + AI misclassification logging on reroute (backend)
- Parent-child ticket splitting logic (backend)
- Fair-share/round-robin assignment engine (backend)
- Async `@Async` email notification pipeline (backend)
- SLA due-date calculation and clock suspension on `PENDING_EMPLOYEE` (backend)
- Analytics/KPI endpoints (FRT, MTTR, AI Accuracy) (backend)
- TanStack Query v5 + `@tanstack/react-query` in frontend deps
- Tailwind CSS v4 in frontend deps
- Agent tabbed workspace (My Queue / Pool / Archive)
- Admin SLA configuration panel
- Admin analytics KPI dashboard
- Triage queue view for uncategorized/low-confidence tickets
- Re-route UI action for misclassified tickets
- `PENDING_EMPLOYEE` status handling in frontend

---

## Sub-Tasks

---

### Sub-Task 1: Backend — Harden JPA Entities with Enums and Validation

**Status**: `[x] done`

**Intent**: Replace plain `String` status/priority/role fields on `Ticket` and `User` entities with proper Java `enum` types and add Jakarta validation annotations. This creates compile-time safety and ensures no invalid values enter the database.

**Expected Outcomes**:
- `Ticket.status` is backed by a `TicketStatus` enum (`OPEN`, `IN_PROGRESS`, `PENDING_EMPLOYEE`, `RESOLVED`, `CLOSED`)
- `Ticket.priority` is backed by a `Priority` enum (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `User.role` is backed by a `UserRole` enum (`EMPLOYEE`, `AGENT`, `DEPT_MANAGER`, `SYS_ADMIN`)
- `SlaRule.priority` uses the shared `Priority` enum
- `@Enumerated(EnumType.STRING)` annotations present on all enum fields
- `@NotBlank`, `@NotNull`, `@Size` annotations added to required fields on `Ticket`, `User`, `TicketMessage`
- `DataSeeder` updated to use enum values instead of string literals

**Todo List**:
1. Create `enums/TicketStatus.java` with values `OPEN, IN_PROGRESS, PENDING_EMPLOYEE, RESOLVED, CLOSED`
2. Create `enums/Priority.java` with values `LOW, MEDIUM, HIGH, CRITICAL`
3. Create `enums/UserRole.java` with values `EMPLOYEE, AGENT, DEPT_MANAGER, SYS_ADMIN`
4. Update `Ticket.java`: change `String status` → `TicketStatus status`, `String priority` → `Priority priority`, add `@Enumerated(EnumType.STRING)` to both
5. Update `User.java`: change `String role` → `UserRole role`, add `@Enumerated(EnumType.STRING)`
6. Update `SlaRule.java`: change `String priority` → `Priority priority`, add `@Enumerated(EnumType.STRING)`
7. Add `@NotBlank`/`@NotNull`/`@Size` annotations to `Ticket` (`title`, `description`), `User` (`name`, `email`, `passwordHash`), `TicketMessage` (`body`)
8. Update `DataSeeder.java` to use enum constants
9. Verify all existing repository queries still compile (enum comparisons in JPQL use `.name()` for string comparisons in `@Query`)

**Relevant Context**:
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/entities/Ticket.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/entities/User.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/entities/SlaRule.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/config/DataSeeder.java`
- `schema.sql` — defines the valid enum string values

---

### Sub-Task 2: Backend — Replace Session Auth with JWT

**Status**: `[x] done`

**Intent**: Completely replace the existing session/cookie authentication system with a stateless JWT-based system as required by the plan. Remove `SessionAuthFilter`, add `JwtProvider` for token signing/validation, add `JwtAuthenticationFilter` to the Spring Security filter chain, and update `AuthService`/`AuthController` to generate and return JWT tokens on login. Update `SecurityConfig` to `STATELESS` session policy.

**Expected Outcomes**:
- `POST /api/auth/login` returns a JSON response containing a JWT access token and the authenticated user's id, role, companyId, and departmentId
- Every subsequent API call is authenticated by reading `Authorization: Bearer <token>` header
- Spring Security `SecurityContext` is populated from JWT claims — no server-side session state
- `SessionAuthFilter.java` and session-based logic are removed
- All service methods that accepted `HttpSession` now accept the authenticated `User` object resolved from `SecurityContextHolder`
- `pom.xml` gains a JJWT or `spring-boot-starter-oauth2-resource-server` dependency for JWT signing/parsing

**Todo List**:
1. Add JWT library dependency to `pom.xml` (JJWT `io.jsonwebtoken:jjwt-api`, `jjwt-impl`, `jjwt-jackson`, or `spring-security-oauth2-jose`)
2. Create `security/JwtProvider.java` — generates signed JWT with claims (`userId`, `email`, `role`, `companyId`, `departmentId`), validates token signature and expiry
3. Create `security/JwtAuthenticationFilter.java` — reads `Authorization: Bearer` header, calls `JwtProvider.validate()`, populates `SecurityContextHolder` with an `Authentication` object
4. Create `security/CustomUserDetailsService.java` — implements `UserDetailsService`, loads `User` by email from `UserRepository`, maps to Spring's `UserDetails` with role-based `GrantedAuthority`
5. Create `security/AuthenticatedUser.java` — a custom principal record/class wrapping the decoded JWT claims for convenient access in controllers via `@AuthenticationPrincipal`
6. Update `SecurityConfig.java`:
   - Change `SessionCreationPolicy` to `STATELESS`
   - Register `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`
   - Remove `SessionAuthFilter`
   - Configure CORS to allow `Authorization` header (remove `setAllowCredentials(true)` pattern)
7. Update `AuthService.java`: on successful login, call `JwtProvider.generateToken(user)` and return a `LoginResponse` DTO containing the token string and user metadata
8. Update `AuthController.java`: return `LoginResponse` from login endpoint; remove all `HttpSession` usage
9. Delete `config/SessionAuthFilter.java`
10. Verify `application.properties` has a `app.jwt.secret` and `app.jwt.expiration-ms` property

**Relevant Context**:
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/config/SecurityConfig.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/config/SessionAuthFilter.java` (to be deleted)
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/services/AuthService.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/controllers/AuthController.java`
- ADR 0001 — User roles: `EMPLOYEE`, `AGENT`, `DEPT_MANAGER`, `SYS_ADMIN`

---

### Sub-Task 3: Backend — Replace Local File Storage with Object Storage (MinIO/S3)

**Status**: `[ ] SKIPPED — deferred, keeping local disk storage for now`

> Deferred by design decision. All other sub-tasks proceed. Object storage migration will be a future sub-task.

---

### Sub-Task 4: Backend — AI Service Confidence Gating and Classification Logging

**Status**: `[x] done`

**Intent**: Enforce the 60% confidence threshold rule from plan section 2A and ADR 0002. When confidence is below 60% or the AI call fails, set `department_id = NULL` (triage queue). Write an `AiClassificationLog` record on every classification event. Add a re-route endpoint that logs misclassifications for model retraining.

**Expected Outcomes**:
- `AIService.categorize()` returns a structured result containing `{ departmentId, confidenceScore }` or `null` if below threshold or service failure
- `TicketService.createTicket()` uses the 60% gate: assigns `department_id` only when confidence ≥ 60, otherwise leaves `department_id = NULL`
- Every classification attempt (pass or fail) writes a row to `ai_classification_logs` with `raw_text`, `predicted_department_id`, `confidence_score`, and `is_misclassified = FALSE` initially
- `POST /api/tickets/{id}/reroute` endpoint exists; accepting a `targetDepartmentId`, it updates `ticket.department_id`, sets `is_misclassified = TRUE` on the existing log row, and sets `actual_department_id`
- The IBM Watson NLU SDK (already present in `pom.xml`) is used; the AIService handles `InternalServerErrorException` and network failures by returning `null` (triggering triage fallback)

**Todo List**:
1. Create `dto/AiClassificationResult.java` — record with `Long departmentId`, `double confidenceScore`
2. Update `AIService.java`:
   - Change `categorize(String text)` to return `Optional<AiClassificationResult>` — returns empty if confidence < 60 or if an exception is thrown
   - Map Watson NLU category names back to `Department` entities by name lookup (`DepartmentRepository.findByNameIgnoreCaseAndCompanyId`)
3. Update `TicketService.createTicket()`:
   - Call updated `AIService.categorize()`
   - If result present: assign `ticket.departmentId`, log to `ai_classification_logs` with confidence and predicted dept
   - If result empty: leave `ticket.departmentId = null`, log to `ai_classification_logs` with null `predicted_department_id` and actual confidence score
4. Add `AiClassificationLogRepository` method: `findByTicketId(Long ticketId)` returning `Optional<AiClassificationLog>`
5. Create `POST /api/tickets/{id}/reroute` in `TicketController`:
   - Accepts `{ "targetDepartmentId": <Long> }` in request body
   - Validates caller is `AGENT` or `DEPT_MANAGER`
   - Updates `ticket.department_id` to new value
   - Finds the existing `AiClassificationLog` for the ticket; sets `is_misclassified = true`, sets `actual_department_id`
   - Returns updated ticket
6. Remove the legacy `String`-returning `categorize()` method signature after migration

**Relevant Context**:
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/services/AIService.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/services/TicketService.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/repositories/AiClassificationLogRepository.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/controllers/TicketController.java`
- ADR 0002 — 60% threshold, `ai_classification_logs` as retraining dataset
- `schema.sql:84-93` — `ai_classification_logs` table structure

---

### Sub-Task 5: Backend — Department-Scoped Authorization and Multi-Tenant Enforcement

**Status**: `[x] done`

**Intent**: Enforce the role + department authorization matrix defined in plan section 2B and ADR 0003 across all ticket endpoints. Every authenticated request must be scoped to the user's `company_id`. Agents must receive HTTP 403 for any attempt to access tickets belonging to a different department.

**Expected Outcomes**:
- All ticket list endpoints scope queries by `company_id` from the JWT principal
- EMPLOYEE: can only see tickets where `creator_id = current_user.id`
- AGENT: My Queue (`assignee_id = me`), Department Pool (`department_id = my_dept AND assignee_id IS NULL`), Archive (`department_id = my_dept AND assignee_id != me, read-only`)
- AGENT attempting to access ticket from another department → HTTP 403 Forbidden
- DEPT_MANAGER: all tickets in their department
- SYS_ADMIN: unrestricted within company scope
- `TicketController` and `CommentController` use `@AuthenticationPrincipal AuthenticatedUser` to extract user context instead of `HttpSession`
- Missing repository queries are added: `findByCompanyIdAndDepartmentIdIsNull`, `findByParentId`

**Todo List**:
1. Add missing `TicketRepository` queries:
   - `findByCompanyIdAndDepartmentIdIsNull` (triage queue)
   - `findByParentId` (child tickets)
   - `findByCompanyIdAndDepartmentIdAndAssigneeIdIsNull` (dept pool)
   - `findByCompanyIdAndDepartmentIdAndAssigneeId` (my queue)
2. Create `services/TicketAuthorizationService.java` — `assertCanRead(AuthenticatedUser, Ticket)` and `assertCanWrite(AuthenticatedUser, Ticket)` that throw `ResponseStatusException(FORBIDDEN)` on violations
3. Update `TicketController.java`:
   - Replace `HttpSession` parameter with `@AuthenticationPrincipal AuthenticatedUser principal`
   - Add authorization check on every `GET /api/tickets/{id}`, `PUT`, `DELETE` endpoint using `TicketAuthorizationService`
   - Add a `GET /api/tickets/my-queue` endpoint (returns assignee = me)
   - Add a `GET /api/tickets/pool` endpoint (returns dept unassigned tickets)
   - Add a `GET /api/tickets/archive` endpoint (returns dept peer-assigned read-only tickets)
   - Add a `GET /api/tickets/triage` endpoint (returns `department_id IS NULL`, accessible to SYS_ADMIN/DEPT_MANAGER only)
4. Update `CommentController.java`: replace `HttpSession` with `@AuthenticationPrincipal`, verify ticket access before allowing message creation
5. Update `TicketService.createTicket()` to bind `company_id` from the authenticated user's JWT claims, not from the request body

**Relevant Context**:
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/controllers/TicketController.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/controllers/CommentController.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/repositories/TicketRepository.java`
- ADR 0003 — departmental isolation rules and HTTP 403 for cross-dept access

---

### Sub-Task 6: Backend — Ticket Lifecycle: Status Transitions, SLA, Parent-Child, and Assignment

**Status**: `[x] done`

**Intent**: Implement the remaining core ticket lifecycle features: automatic status transitions based on who sends a message, SLA due-date calculation on ticket creation/priority change, parent-child ticket splitting, and the fair-share/round-robin assignment engine.

**Expected Outcomes**:
- When an AGENT or DEPT_MANAGER posts a message on an `IN_PROGRESS` ticket: status auto-transitions to `PENDING_EMPLOYEE`
- When an EMPLOYEE posts a message on a `PENDING_EMPLOYEE` ticket: status auto-transitions to `IN_PROGRESS`
- On ticket creation, backend looks up `sla_rules` by `(department_id, priority)` and sets `ticket.due_at = created_at + target_resolution_hours`
- When ticket transitions to `PENDING_EMPLOYEE`, store the pause start time; when employee replies, append elapsed pause duration back onto `due_at`
- `POST /api/tickets/{id}/split` endpoint creates child tickets (one per target department), links them via `parent_id`, sets parent status to reflect pending child resolution
- Parent ticket auto-closes when all children are `RESOLVED` or `CLOSED`
- `POST /api/tickets/{id}/assign-me` allows an agent to claim an unassigned pool ticket
- `application.properties` has a `app.assignment.mode` toggle (`MANUAL` or `ROUND_ROBIN`)
- In ROUND_ROBIN mode, on ticket creation the backend auto-assigns to the active agent with the lowest open workload count

**Todo List**:
1. Update `CommentService.addComment()`:
   - After saving the message, check sender role
   - If sender is `AGENT`/`DEPT_MANAGER` and ticket status is `IN_PROGRESS` or `OPEN`: update ticket status to `PENDING_EMPLOYEE`, record `sla_pause_start_at` (can store in a transient field or separate mechanism)
   - If sender is `EMPLOYEE` and ticket status is `PENDING_EMPLOYEE`: update ticket status to `IN_PROGRESS`, compute elapsed pause and extend `due_at` accordingly
2. Add SLA calculation helper in `TicketService`:
   - On `createTicket()`: query `SlaRuleRepository.findByDepartmentIdAndPriority()`, compute `due_at = now + target_resolution_hours`; if no SLA rule found, leave `due_at = null`
   - On `updatePriority()`: recompute `due_at` based on updated priority
3. Add `POST /api/tickets/{id}/split` endpoint in `TicketController`:
   - Accept body: `[ { "departmentId": X, "title": "...", "description": "..." }, ... ]`
   - Create child `Ticket` records linking `parent_id = id`
   - Run AI classification for each child if watsonx available
   - Return the list of created child tickets
4. Add parent auto-closure logic: a method checked whenever a child ticket is marked `RESOLVED`/`CLOSED` — if all siblings are `RESOLVED`/`CLOSED`, close the parent
5. Add `POST /api/tickets/{id}/assign-me` endpoint: sets `ticket.assigneeId = currentUser.id` and `ticket.status = IN_PROGRESS` if currently unassigned
6. Create `services/AssignmentService.java`: reads `app.assignment.mode`; in ROUND_ROBIN mode, queries `TicketRepository` for agent with min active ticket count in the department; in MANUAL mode, returns `null` (agent self-assigns)
7. Call `AssignmentService` from `TicketService.createTicket()` if department was assigned

**Relevant Context**:
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/services/CommentService.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/services/TicketService.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/repositories/SlaRuleRepository.java`
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/controllers/TicketController.java`
- `plan.md` sections 2D, 2G, 2H
- `schema.sql:45-59` — `tickets` table with `parent_id`, `due_at`, `status`

---

### Sub-Task 7: Backend — Async Email Notification Pipeline

**Status**: `[ ] SKIPPED — deferred, to be implemented after core features are complete`

> Deferred by design decision. Focus is on auth, AI, lifecycle, and frontend first. No email infra needed yet.

---

### Sub-Task 8: Backend — Analytics KPI Endpoints

**Status**: `[x] done`

**Intent**: Expose the three KPI metrics (First Response Time, Mean Time to Resolution, AI Classification Accuracy) as REST endpoints. Per ADR 0005, all computations must happen at the database level using the SQL aggregation queries already defined in `TicketRepository`.

**Expected Outcomes**:
- `GET /api/analytics/frt?companyId=X` returns average first response time in hours
- `GET /api/analytics/mttr?companyId=X` returns MTTR per department
- `GET /api/analytics/ai-accuracy?companyId=X` returns AI accuracy percentage
- All endpoints are restricted to `DEPT_MANAGER` and `SYS_ADMIN` roles
- Responses are simple JSON DTOs, no in-memory Java loops over entity collections

**Todo List**:
1. Verify the three KPI `@Query` methods in `TicketRepository.java` compile correctly against the enum-refactored entities
2. Create `controllers/AnalyticsController.java` — three endpoints mapping to the three `TicketRepository` queries
3. Create response DTOs: `dto/FrtResponse.java`, `dto/MttrResponse.java`, `dto/AiAccuracyResponse.java`
4. Add method-level security (`@PreAuthorize("hasAnyRole('DEPT_MANAGER','SYS_ADMIN')")`) on all three endpoints
5. Enable `@EnableMethodSecurity` in `SecurityConfig.java`

**Relevant Context**:
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/repositories/TicketRepository.java` — KPI queries already exist
- `plan.md` section 2H — KPI SQL reference implementations
- ADR 0005 — database-level aggregation requirement

---

### Sub-Task 9: Frontend — Add TanStack Query v5, Tailwind CSS v4, and Migrate to React Router Data API

**Status**: `[x] done`

**Intent**: Add the plan-mandated dependencies that are entirely absent: TanStack Query v5 and Tailwind CSS v4. Migrate React Router from declarative `<BrowserRouter>` mode to the v7 Data API routing pattern using `createBrowserRouter`. Wrap the app with `QueryClientProvider`. Replace `withCredentials: true` in `axiosInstance` with a JWT Bearer token interceptor.

**Expected Outcomes**:
- `@tanstack/react-query` v5 is in `package.json` dependencies
- `tailwindcss` v4 is in `devDependencies`; Vite plugin `@tailwindcss/vite` is configured
- `App.jsx` uses `createBrowserRouter` with route objects instead of `<BrowserRouter>/<Routes>` JSX
- `main.jsx` wraps the application in `<QueryClientProvider client={queryClient}>`
- `axiosInstance.js` injects `Authorization: Bearer <token>` header from `localStorage`; `withCredentials: true` is removed
- `AuthContext.jsx` stores the JWT token string separately alongside the user object; `login()` saves the token, `logout()` clears it
- `index.css` imports `@import "tailwindcss"` (Tailwind v4 import syntax)

**Todo List**:
1. Run: `npm install @tanstack/react-query@^5` inside `helpdesk-center-frontend`
2. Run: `npm install -D tailwindcss@next @tailwindcss/vite` inside `helpdesk-center-frontend`
3. Update `vite.config.js` to add the `@tailwindcss/vite` plugin
4. Update `src/index.css` to add `@import "tailwindcss";` at the top
5. Update `src/main.jsx` — import `QueryClient`, `QueryClientProvider` from `@tanstack/react-query`; wrap `<App>` in `<QueryClientProvider client={new QueryClient()}>`
6. Migrate `src/App.jsx` from `<BrowserRouter><Routes>` to `createBrowserRouter` / `RouterProvider`:
   - Define route objects with `path`, `element`, `loader` (where applicable), and `errorElement`
   - Use `AppShell` as a layout route wrapper with an `<Outlet>`
   - Protected route logic moves to a layout-level `loader` that checks auth and redirects to `/login` if unauthenticated
7. Update `src/context/AuthContext.jsx`:
   - Store `token` separately in state and `localStorage`
   - `login(user, token)` saves both; `logout()` clears both
   - Expose `token` from context for the axios interceptor
8. Update `src/api/axiosInstance.js`:
   - Remove `withCredentials: true`
   - Add a request interceptor that reads the JWT token from `localStorage.getItem('token')` and sets `headers.Authorization = 'Bearer ' + token` if present

**Relevant Context**:
- `helpdesk-center-frontend/package.json`
- `helpdesk-center-frontend/src/main.jsx`
- `helpdesk-center-frontend/src/App.jsx`
- `helpdesk-center-frontend/src/context/AuthContext.jsx`
- `helpdesk-center-frontend/src/api/axiosInstance.js`
- `plan.md` — Frontend tech stack requirements (React Router DOM v7 Data API routing)

---

### Sub-Task 10: Frontend — Migrate Data Fetching to TanStack Query and Convert Styling to Tailwind

**Status**: `[x] done`

**Intent**: Refactor all data-fetching code in every page and component from raw `useState + useEffect + axios.then()` patterns to TanStack Query `useQuery` and `useMutation` hooks. Simultaneously, convert all inline JavaScript style objects (using `tokens.js`) to Tailwind CSS utility classes. These two changes must happen together to avoid a broken intermediate state.

**Expected Outcomes**:
- No component uses `useState` + `useEffect` for data fetching; all use `useQuery` or `useMutation`
- Cache invalidation replaces manual `refetch` calls (e.g., after creating a ticket, invalidate `['tickets']` query key)
- All inline `style={{ ... }}` blocks using `T.` token values are converted to equivalent Tailwind CSS `className="..."` strings
- Loading and error states come from TanStack Query's `isLoading`/`isError` flags, not manual booleans
- `tokens.js` file is removed or reduced to truly project-specific values not expressible in Tailwind

**Todo List**:
1. Create `src/hooks/useTickets.js` — exports `useTickets()`, `useMyQueue()`, `usePool()`, `useArchive()`, `useCreateTicket()`, `useUpdateStatus()`, `useRerouteTicket()` using `useQuery`/`useMutation`
2. Create `src/hooks/useMessages.js` — exports `useMessages(ticketId)`, `useAddMessage()` using `useQuery`/`useMutation`
3. Create `src/hooks/useAnalytics.js` — exports `useFrt()`, `useMttr()`, `useAiAccuracy()` using `useQuery`
4. Refactor `EmployeeDashboard.jsx` — replace all `useState`/`useEffect` data fetching with hooks from step 1
5. Refactor `AgentDashboard.jsx` — replace data fetching with hooks
6. Refactor `AdminDashboard.jsx` — replace data fetching with hooks from step 3
7. Refactor `TicketDetailPanel.jsx` — replace `useEffect + getTicket()` with `useQuery`; replace `updateStatus` call with `useMutation`
8. Refactor `CommentSection.jsx` — use `useMessages()` and `useAddMessage()` hooks
9. Convert inline styles to Tailwind in all components/pages listed above
10. Remove or archive `src/styles/tokens.js`

**Relevant Context**:
- `helpdesk-center-frontend/src/pages/*.jsx` (all four pages)
- `helpdesk-center-frontend/src/components/TicketDetailPanel.jsx`
- `helpdesk-center-frontend/src/components/CommentSection.jsx`
- `plan.md` — TanStack Query v5 as mandatory data fetching layer

---

### Sub-Task 11: Frontend — Agent Tabbed Workspace (My Queue / Pool / Archive)

**Status**: `[x] done`

**Intent**: Rebuild `AgentDashboard.jsx` into the three-view tabbed workspace defined in plan section 2B. Each tab maps to a distinct backend endpoint with different authorization semantics. The Archive tab must be strictly read-only (no edit/assign controls).

**Expected Outcomes**:
- Agent dashboard has three tabs: **My Queue**, **Department Pool**, **Department Archive**
- My Queue tab: tickets where `assignee_id = me`; full read/write controls
- Department Pool tab: unassigned tickets in my department (`department_id = my_dept, assignee_id IS NULL`); "Claim Ticket" button calls `POST /api/tickets/{id}/assign-me`
- Department Archive tab: tickets assigned to peers in my dept; no status change or assignment controls visible
- Active ticket detail appears in the split-pane panel on the right
- Re-route button visible on ticket detail for AGENT/DEPT_MANAGER; opens a modal with target department dropdown
- All data fetching via TanStack Query hooks from Sub-Task 10
- No cross-department ticket data is fetched or displayed (enforced by backend; UI simply reflects what the API returns)

**Todo List**:
1. Create `src/components/TabBar.jsx` — reusable tab component accepting `tabs: [{id, label, count}]` and `activeTab`/`onTabChange` props
2. Refactor `AgentDashboard.jsx`:
   - Add tab state: `activeTab` defaulting to `'myQueue'`
   - Render `TabBar` with My Queue / Pool / Archive tabs
   - Render the ticket list from the appropriate `useMyQueue()`/`usePool()`/`useArchive()` hook based on active tab
   - Pass `readOnly={activeTab === 'archive'}` prop to `TicketDetailPanel`
3. Update `TicketDetailPanel.jsx` to accept and respect `readOnly` prop — hides status dropdown and save button when `readOnly=true`
4. Add "Claim Ticket" button to `TicketCard.jsx` visible only when `showClaim=true` prop is passed; calls `useAssignMe()` mutation
5. Add "Re-Route" button in `TicketDetailPanel.jsx` for AGENT/DEPT_MANAGER — opens a `RerouteModal` component
6. Create `src/components/RerouteModal.jsx` — dropdown of available departments, confirm button calls `useRerouteTicket()` mutation, closes on success

**Relevant Context**:
- `helpdesk-center-frontend/src/pages/AgentDashboard.jsx`
- `helpdesk-center-frontend/src/components/TicketDetailPanel.jsx`
- `helpdesk-center-frontend/src/components/TicketCard.jsx`
- `plan.md` section 2B — Agent workspace definition
- ADR 0003 — department collaboration boundaries

---

### Sub-Task 12: Frontend — Admin SLA Panel and Analytics KPI Dashboard

**Status**: `[x] done`

**Intent**: Build out the `AdminDashboard.jsx` with two new functional panels: an SLA configuration panel where admins configure per-department priority rules, and an analytics KPI panel displaying FRT, MTTR, and AI Classification Accuracy from the backend analytics endpoints.

**Expected Outcomes**:
- Admin dashboard has two main panels/sections: **SLA Configuration** and **Analytics**
- SLA panel shows a table of all departments with editable `target_resolution_hours` per priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- Saving a row calls a `PUT /api/sla-rules/{id}` endpoint (or `POST` to create)
- Analytics panel shows three KPI cards: Average FRT (hours), MTTR per department (bar chart or table), AI Accuracy (percentage)
- Triage queue section shows all tickets with `department_id = null` for admin review
- All data is fetched via TanStack Query

**Todo List**:
1. Create backend `SlaRuleController.java` (if not yet existing) — `GET /api/sla-rules?companyId=X`, `POST /api/sla-rules`, `PUT /api/sla-rules/{id}`; restricted to `SYS_ADMIN` and `DEPT_MANAGER`
2. Create `src/hooks/useSlaRules.js` — `useSlaRules()` and `useUpsertSlaRule()` hooks
3. Create `src/components/SlaConfigPanel.jsx` — renders a table with rows per department, inputs for each priority's hours, save button per row
4. Create `src/components/AnalyticsPanel.jsx` — renders three KPI stat cards/sections using `useFrt()`, `useMttr()`, `useAiAccuracy()` from Sub-Task 10's hooks
5. Create `src/components/TriageQueue.jsx` — list of uncategorized tickets with assign-department dropdown for each; only visible to `SYS_ADMIN`/`DEPT_MANAGER`
6. Refactor `AdminDashboard.jsx` — add tabbed navigation: **Overview** (existing stat cards), **SLA Rules**, **Analytics**, **Triage Queue**; embed new panel components
7. Wire up analytics data to display actual computed values from backend

**Relevant Context**:
- `helpdesk-center-frontend/src/pages/AdminDashboard.jsx`
- `plan.md` sections 2H — KPI requirements
- ADR 0005 — database-level analytics
- `helpdesk-center-backend/src/main/java/com/helpdeskcenter/repositories/TicketRepository.java` — KPI queries

---

## Implementation Order

The sub-tasks are designed to be executed sequentially. Backend tasks must be completed before their corresponding frontend tasks. Sub-Tasks 3 (Object Storage) and 7 (Email) are deferred.

```
Sub-Task 1  (Entities/Enums)
    ↓
Sub-Task 2  (JWT Auth — replaces sessions entirely)
    ↓
Sub-Task 4  (AI Confidence Gating + Logging)
    ↓
Sub-Task 5  (Department Authorization)
    ↓
Sub-Task 6  (Ticket Lifecycle: SLA, Parent-Child, Assignment)
    ↓
Sub-Task 8  (Analytics KPI Endpoints)
    ↓
Sub-Task 9  (Frontend: TanStack Query + Tailwind CSS + Data API Router install/config)
    ↓
Sub-Task 10 (Frontend: Migrate data fetching + styling)
    ↓
Sub-Task 11 (Frontend: Agent Tabbed Workspace)
    ↓
Sub-Task 12 (Frontend: Admin SLA + Analytics)

[DEFERRED] Sub-Task 3  (Object Storage — MinIO/S3)
[DEFERRED] Sub-Task 7  (Async Email Notifications)
```

---

## Dependencies to Add

### Backend (`pom.xml`)
| Dependency | Purpose |
|-----------|---------|
| `io.jsonwebtoken:jjwt-api/jjwt-impl/jjwt-jackson` | JWT generation and validation |

> Note: `spring-boot-starter-security`, Watson NLU SDK, Spring Data JPA, Lombok, and Validation are already present. Object Storage and Mail dependencies are deferred.

### Frontend (`package.json`)
| Dependency | Purpose |
|-----------|---------|
| `@tanstack/react-query@^5` | Data fetching, caching, mutations |
| `tailwindcss@next` + `@tailwindcss/vite` | Utility CSS styling |

> Note: React 19, Vite 8, React Router DOM v7, Lucide React, and Axios are already present.

---

## Files to Delete

| File | Reason |
|------|--------|
| `helpdesk-center-backend/src/main/java/com/helpdeskcenter/config/SessionAuthFilter.java` | Replaced by JWT filter |
| `helpdesk-center-backend/src/main/java/com/helpdeskcenter/entities/Comment.java` (deleted in git) | Already removed; replaced by `TicketMessage` |
| `helpdesk-center-backend/src/main/java/com/helpdeskcenter/repositories/CommentRepository.java` (deleted in git) | Already removed |
| `helpdesk-center-frontend/src/styles/tokens.js` | Replaced by Tailwind CSS classes |
| `helpdesk-center-frontend/src/components/AppHeader.jsx` | Orphaned; not used anywhere |
| `helpdesk-center-backend/src/main/java/com/helpdesk/` (unknown package) | Wrong package name; should be investigated and removed if stale |
