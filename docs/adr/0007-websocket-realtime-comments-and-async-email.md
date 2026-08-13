# ADR-0007 — Real-Time WebSocket Comments and Asynchronous Email Notifications

**Status:** Accepted  
**Branch:** `agent-side-improvements`  
**Date:** 2025

---

## Context

The comment thread in the ticket detail view previously relied on a 5-second HTTP polling interval (`refetchInterval: 5000` in `useMessages`). While functional, polling creates unnecessary backend load and introduces up to 5-second latency before a reply appears for the other participant. The platform's blueprint (§F, §J) also mandated a fully asynchronous, non-blocking email layer that had not yet been implemented.

Two problems to solve:

1. **Comment latency**: Both parties in a ticket conversation should see new replies appear within one second, not five.
2. **Email notifications**: Participants should receive an email when a comment is posted or a ticket is assigned to them, without blocking the HTTP response.

---

## Decision

### 1 — STOMP-over-SockJS WebSocket for Comment Streaming

**Why STOMP over raw WebSocket?**  
STOMP provides a standard framing layer (subscribe/send/ack) on top of the raw WebSocket protocol, which means:
- Spring Boot's `@EnableWebSocketMessageBroker` handles session management, subscription routing, and message dispatch with zero custom frame-parsing code.
- The frontend uses `@stomp/stompjs` — a mature, actively maintained client library — rather than managing raw `WebSocket.onmessage` handlers.
- The `/topic` destination prefix maps cleanly to broadcast fan-out (one message → all subscribers on a ticket).

**Why SockJS?**  
SockJS provides a transparent HTTP long-poll fallback for environments where WebSocket is blocked (corporate proxies, some CDN edge nodes). This keeps the feature working in all deployment contexts without code changes.

**Why token-in-query-param for WS auth?**  
The HTTP `Authorization` header is not accessible during a WebSocket upgrade handshake from browser JavaScript. Passing `?token=<JWT>` as a query parameter is the industry-standard solution for stateless JWT WebSocket auth. `WebSocketHandshakeInterceptor` validates the token before the STOMP session is created, ensuring unauthenticated connections are rejected at the lowest layer.

**Polling retained at 30 s (not removed)**  
The React Query `refetchInterval` was reduced from 5 s to 30 s rather than disabled entirely. This acts as a gap-filler for:
- Transient WS disconnects during reconnection.
- Frames missed due to browser tab visibility changes.
- Any backend restart that drops in-flight STOMP sessions.

### 2 — Spring Mail + Thymeleaf for Async Email

**Why `@Async`?**  
Email delivery over SMTP can take 200–2000 ms depending on network conditions and TLS handshake overhead. Running it synchronously inside the HTTP request thread would add visible latency to every `POST /api/tickets/{id}/comments` response. Spring's `@Async` annotation with `@EnableAsync` delegates the call to a separate thread pool thread with no code complexity overhead.

**Why Thymeleaf for email templates?**  
Thymeleaf is already a first-class Spring Boot dependency and renders HTML templates with full variable interpolation. Inline alternatives (string concatenation, `MessageFormat`) are brittle and hard to style. HTML email templates allow consistent branding with no additional library.

**Triggers:**  
| Event | Email sent to |
|---|---|
| Comment posted | The other ticket participant (recipient ≠ sender) |
| `assignToMe` | The claiming agent |
| `reassignTicket` | The newly assigned agent |

---

## Consequences

### Positive
- Comment delivery latency: 5 000 ms → **< 200 ms** in normal conditions.
- Email notifications require zero user action — recipients are informed passively.
- WS infra is extensible: the `/user/queue/notifications` destination is already registered and can be used for real-time in-app notification push in a future iteration.
- Backend load from comment polling reduced by ~6× (30 s vs 5 s).

### Negative / Trade-offs
- WebSocket connections consume server memory proportional to concurrent open tickets. At capstone scale this is negligible; at production scale a message broker (Redis Pub/Sub or RabbitMQ) would replace the in-memory simple broker.
- Email delivery requires correctly configured SMTP credentials in production (`MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD`). Without them, `EmailService` logs a warning and silently no-ops — it does not crash the application.
- SockJS HTTP fallback polling adds `/ws/info` preflight requests; these are permitted via `SecurityConfig` (`/ws/**`).

---

## Affected Files

### Backend (new)
| File | Role |
|---|---|
| `config/WebSocketConfig.java` | STOMP broker registration, SockJS endpoint, allowed origins |
| `security/WebSocketHandshakeInterceptor.java` | JWT validation on WS handshake |
| `dto/CommentPayload.java` | WS broadcast shape |
| `services/EmailService.java` | Async SMTP delivery |
| `resources/templates/email/new-comment.html` | Comment notification email template |
| `resources/templates/email/ticket-assigned.html` | Assignment notification email template |

### Backend (modified)
| File | Change |
|---|---|
| `pom.xml` | Added `spring-boot-starter-websocket`, `spring-boot-starter-mail`, `spring-boot-starter-thymeleaf` |
| `HelpdeskCenterApplication.java` | Added `@EnableAsync` |
| `config/SecurityConfig.java` | Permit `/ws/**`; switch CORS to `setAllowedOriginPatterns` + `allowCredentials(true)` |
| `services/CommentService.java` | Broadcast via `SimpMessagingTemplate`; call `EmailService.sendNewCommentNotification()` |
| `services/TicketService.java` | Call `EmailService.sendTicketAssignedNotification()` in `assignToMe` and `reassignTicket` |
| `resources/application.properties` | Added `spring.mail.*`, `app.mail.from`, `app.base-url` |
| `.env.example` | Documented `MAIL_*` and `APP_BASE_URL` variables |

### Frontend (new)
| File | Role |
|---|---|
| `src/hooks/useTicketSocket.js` | STOMP client hook — connect, subscribe, teardown |

### Frontend (modified)
| File | Change |
|---|---|
| `package.json` | Added `@stomp/stompjs ^7.3.0`, `sockjs-client ^1.6.1` |
| `src/hooks/useMessages.js` | Wire `useTicketSocket`; inject WS frames into React Query cache; reduce polling to 30 s |
| `src/components/CommentSection.jsx` | Add Live/Connecting/Disconnected status strip |
