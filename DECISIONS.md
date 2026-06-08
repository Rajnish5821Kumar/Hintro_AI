# Architecture & Design Decisions

This document explains the key architectural and design decisions made in the Meeting Intelligence Service.

---

## 1. Repository Pattern

**Decision:** All database queries are isolated in `src/repositories/`.

**Rationale:**
- Controllers and services never import Prisma directly
- Enables easy mocking in unit tests (just mock the repository module)
- Centralizes query logic — changes to the DB schema require edits in one place
- Enforces a clear separation of concerns between business logic and persistence

---

## 2. Service Layer Pattern

**Decision:** All business logic lives in `src/services/`, not in controllers.

**Rationale:**
- Controllers handle only HTTP concerns (request parsing, response formatting)
- Services own business rules (ownership validation, overdue detection, AI orchestration)
- Services can be tested independently of Express
- Makes codebase composable — `reminderService` calls `overdueService` without any HTTP coupling

---

## 3. Singleton Pattern for External Clients

**Decision:** Prisma, Redis, and Gemini clients are all initialized as singletons.

**Rationale:**
- Prevents connection pool exhaustion from multiple PrismaClient instances
- In development hot-reload, the singleton is stored on `global.__prisma` to survive module re-evaluation
- Gemini and Redis clients are initialized once at server startup with graceful degradation if config is missing

---

## 4. Grounded AI Prompting (No Hallucinations)

**Decision:** The Gemini prompt explicitly bans invention of any information not present in the transcript.

**Rationale:**
- AI models can hallucinate attendees, tasks, or dates that were never discussed
- For a meeting intelligence tool, this is critically harmful (spurious action items, wrong assignees)
- The prompt uses ABSOLUTE RULES that:
  - Require every item to be cited with exact speaker + timestamp + verbatim quote
  - Mandate empty arrays for sections with no grounded content
  - Reject ambiguous or implied conclusions

**Trade-off:** This is stricter than most AI use cases — the AI may produce fewer items, but every item is trustworthy.

---

## 5. Unified API Response Envelope

**Decision:** Every response uses `{ traceId, success, data }` or `{ traceId, success, error }`.

**Rationale:**
- Consistent structure makes frontend integration predictable
- `traceId` in every response allows end-to-end debugging across logs and API responses
- The `success` boolean lets clients branch without checking HTTP status codes

---

## 6. Trace ID Middleware

**Decision:** Every request gets a UUID trace ID, which is attached to all log entries and returned in `X-Trace-Id` response header.

**Rationale:**
- Production debugging is impossible without request correlation
- The trace ID flows through: middleware → controller → service → repository → log → response
- Upstream systems (load balancers, API gateways) can inject their own trace ID via `X-Trace-Id` header

---

## 7. Redis Caching with Graceful Degradation

**Decision:** Redis is optional — if `REDIS_URL` is not set or Redis is unreachable, all cache operations become no-ops.

**Rationale:**
- Many deployment environments (free tiers) don't include Redis
- Cache failures should never break the application
- The caching layer uses a `try/catch` pattern that silently swallows cache errors
- Cache is applied to read-heavy, stable data: individual meetings (120s TTL), meeting lists (60s TTL)

---

## 8. Rate Limiting Strategy

**Decision:** Three different rate limiters with different thresholds.

| Limiter | Endpoints | Window | Max Requests |
|---|---|---|---|
| Auth | `/api/auth/*` | 15 min | 10 |
| General API | All `/api/*` | 15 min | 100 |
| AI Analysis | `POST /api/meetings/:id/analyze` | 1 min | 5 |

**Rationale:**
- Auth endpoints are brute-force targets — strict limit prevents credential stuffing
- AI analysis calls Gemini API which has cost implications — limited to 5/min per IP
- General API gets a generous 100 req/15min to support normal usage

---

## 9. Action Items Auto-Created from AI

**Decision:** When the AI extracts action items, they are automatically persisted to the `ActionItem` table.

**Rationale:**
- Reduces friction — users don't have to manually re-enter items the AI already found
- Creates a single source of truth for overdue tracking and reminders
- Items without an explicit due date default to 7 days from now (can be updated later)

---

## 10. Cron Job Design

**Decision:** node-cron runs inside the same process, not as a separate worker.

**Rationale:**
- Simpler deployment (single process)
- Sufficient for hourly reminder frequency
- The `REMINDER_JOB_ENABLED=false` flag allows disabling in test environments

**Future consideration:** For high-frequency jobs or distributed deployments, move to BullMQ + Redis workers.

---

## 11. JWT Authentication (Stateless)

**Decision:** Stateless JWT tokens with no refresh token flow.

**Rationale:**
- Simplicity for an API-first service
- 7-day token expiry balances security and user experience

**Trade-off:** Tokens cannot be revoked server-side before expiry. For production, consider adding a token blacklist in Redis.

---

## 12. Cascade Deletes

**Decision:** All child models (Transcript, Analysis, ActionItem, ReminderHistory) use `onDelete: Cascade`.

**Rationale:**
- Deleting a meeting atomically removes all related data
- No orphaned records
- Simplifies cleanup logic in tests
