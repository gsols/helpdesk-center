# IBM Bob Rule Configurations & Custom Modes Blueprint
# Target Project: Multi-Tenant AI Support Help Desk

## 1. Global Architectural Directives (Always Enforced)
- **Primary Platform Stack**: Spring Boot 3.4+ (Java 21 LTS), React 19, Tailwind CSS v4, and TanStack Query v5.
- **Reference Document Compliance**: All sub-agents spawned by Bob MUST cross-reference `plan.md` and files within `docs/adr/` before executing refactors or file generation.
- **Data Persistence Boundaries**: Never allow Bob agents to write binary blobs directly to PostgreSQL for attachments. Enforce metadata persistence inside the `attachments` table linked via the S3 string locator property (`secure_url`).
- **Context Grounding**: Before modifying any backend JPA entity, controller, or service layer, you MUST read all active files in `docs/adr/`.
- **Compliance Enforcement**: If a user request contradicts an accepted decision inside an ADR file, pause execution and ask the user to clarify if they intend to update the ADR first.


---

## 2. Custom Development Modes

### Mode A: Security Guardrail & Tenant Interceptor Mode
*Trigger Pattern: Applies automatically to any classes under `com.helpdesk.controller.*` or `com.helpdesk.service.TicketService`*

#### Instructions:
1. **Enforce Cross-Department Separation**: Whenever generating or editing a Ticket retrieval endpoint, you must explicitly inject the authorization context interceptor. 
2. **The Verification Condition**: Explicitly verify that the requesting user's department matching parameter corresponds to the target dataset:
   ```java
   if (!ticket.getDepartment().getId().equals(currentUser.getDepartment().getId())) {
       throw new org.springframework.security.access.AccessDeniedException("403 Forbidden: Cross-department access violation.");
   }
   ```
3. **The Collaboration Clause**: If a ticket matches the user's `department_id` but is assigned to a teammate (`assignee_id != currentUser.id`), mark the transfer payload object with `readOnly = true` flags to restrict frontend modifications unless a takeover transition is initiated.

### Mode B: IBM watsonx Integration Audit Mode
*Trigger Pattern: Applies to changes targeting `com.helpdesk.service.TicketClassificationService`*

#### Instructions:
1. **Fallback Resilience Execution**: Bob must ensure that if the external unified `watsonx.ai` SDK network call fails or throws any exception, it is caught cleanly using an internal try-catch block. The fallback must route seamlessly by returning `null` (mapping directly to the Uncategorized Triage Queue) rather than breaking the application pipeline.
2. **Confidence Threshold Gate**: Enforce a strict double-conditional verification logic:
   ```java
   if (confidenceScore >= 60.00) { 
       ticket.setDepartment(predictedDept); 
   } else { 
       ticket.setDepartment(null); // Explicit Triage routing
   }
   ```
3. **Audit Log Hook**: Ensure every invocation writes an event telemetry entry payload directly to the `ai_classification_logs` table for model tuning loops.

### Mode C: Conversation State Automation Mode
*Trigger Pattern: Targets endpoints interacting with `ticket_messages` transactions*

#### Instructions:
1. **SLA State-Machine Tracking**: When an Agent adds a record comment thread block targeting an Employee, auto-mutate `ticket.status` immediately to `PENDING_EMPLOYEE`.
2. **Employee Response Reversion**: When an Employee updates the record thread, reset `ticket.status` instantly back to `IN_PROGRESS` to wake up the SLA countdown trackers.

---

## 3. Bob Review Mode & Quality Assurance Mandates
When executing terminal pipeline commands using `Bob Shell` or entering IDE `Review Mode`, check for these structural failures before marking tasks complete:
- **No Blocking Thread Latencies**: Check that all notification delivery scripts (such as confirmation email generation triggers) run asynchronously inside background threads via Spring's `@Async` annotation framework.
- **Anti-Hallucination Testing Requirements**: Bob is strictly required to draft functional JUnit 5 test cases matching Mockito architectures for all newly introduced lifecycle workflows before triggering branch compilation tests.
