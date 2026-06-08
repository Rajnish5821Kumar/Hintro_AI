# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-06-07

### Added

#### Authentication
- `POST /api/auth/register` — User registration with bcrypt password hashing (12 rounds)
- `POST /api/auth/login` — JWT login with 7-day token expiry
- Email enumeration protection (same error for wrong email / wrong password)
- Auth rate limiting (10 requests per 15 minutes per IP)

#### Meeting Management
- `POST /api/meetings` — Create meeting with optional transcript entries
- `GET /api/meetings` — Paginated meeting list with search and date filters
- `GET /api/meetings/:id` — Get meeting with transcripts and action item count
- `PUT /api/meetings/:id` — Update meeting metadata and replace transcripts
- `DELETE /api/meetings/:id` — Delete meeting (cascades to all related data)
- Owner-based access control on all meeting operations
- Redis caching for meeting list and individual meetings

#### AI Analysis
- `POST /api/meetings/:id/analyze` — Gemini 2.5 Flash transcript analysis
- Grounded summary with citations (speaker + timestamp + verbatim quote)
- Grounded action item extraction with assignee and optional due date
- Grounded decision extraction
- Grounded follow-up suggestion extraction
- Automatic action item persistence after analysis
- AI rate limiting (5 analysis requests per minute per IP)
- Token usage tracking (promptTokens, completionTokens)
- Code fence stripping for model output compatibility
- Zod schema validation of AI response structure

#### Action Items
- `POST /api/action-items` — Create action item linked to a meeting
- `GET /api/action-items` — Paginated list with status/assignee/meetingId filters
- `PATCH /api/action-items/:id/status` — Update status (PENDING/IN_PROGRESS/COMPLETED)
- `GET /api/action-items/overdue` — All items past due date and not completed
- Meeting ownership validation for all action item operations
- Bulk creation of action items from AI analysis results

#### Reminder System
- Hourly cron job (configurable via `REMINDER_CRON_SCHEDULE`)
- Overdue detection: `status != COMPLETED AND dueDate < now()`
- Telegram Bot API integration for reminder delivery
- HTML-formatted reminder messages with assignee, task, due date, status
- ReminderHistory persisted for every delivery attempt (SENT/FAILED/PENDING)
- Reminder count tracking per action item
- `REMINDER_JOB_ENABLED=false` flag to disable in test environments

#### Infrastructure
- Request trace ID middleware (UUID v4, forwarded from `X-Trace-Id` header)
- `X-Trace-Id` response header on every response
- Winston structured logging (JSON in production, colorized in development)
- Slow query detection (warns for Prisma queries > 500ms)
- Global error handler: AppError, ZodError, PrismaClientKnownRequestError, unknown errors
- Three-tier rate limiting (auth / api / analysis)
- Helmet security headers
- CORS configuration
- Redis caching with graceful degradation
- Graceful shutdown (SIGTERM/SIGINT with 30s force-exit)
- Unhandled rejection and uncaught exception handlers

#### API Documentation
- Full OpenAPI 3.0 spec with all schemas, security schemes, and examples
- Swagger UI at `GET /docs`
- Raw JSON spec at `GET /docs.json`
- All endpoints documented with JSDoc `@openapi` comments

#### System Endpoints
- `GET /health` — Service health with DB connectivity check
- `GET /api/evaluation` — Candidate evaluation info with full feature list

#### Database
- Prisma schema: User, Meeting, Transcript, Analysis, ActionItem, ReminderHistory
- Cascade deletes on all child relationships
- Composite indexes for performance: `(status, dueDate)`, `(meetingId, sequence)`
- Prisma singleton with dev hot-reload safety

#### DevOps
- Multi-stage Dockerfile (builder + production, non-root user, dumb-init)
- Docker Compose: app + PostgreSQL 15 + Redis 7 + migration service
- GitHub Actions CI: lint → TypeScript check → unit tests → integration tests → Docker build
- GitHub Actions CD: Render deploy webhook + Docker Hub push + post-deploy health check
- Database seed script with demo user, sample meeting, 4 action items

#### Testing
- Unit tests: AuthService, OverdueService, AnalysisParser (3 files, 15+ test cases)
- Integration tests: Auth, Meetings, ActionItems (3 files, 25+ test cases)
- 80%+ coverage target configured

#### Documentation
- README.md — Quick start, API reference, architecture, deployment guide
- DECISIONS.md — 12 architectural decisions with rationale and trade-offs
- AI_APPROACH.md — Grounding strategy, prompt engineering, anti-hallucination architecture
- TESTING.md — Test structure, environment setup, full test case inventory
- CHANGELOG.md — This file
- CHECKLIST.md — Feature delivery checklist

---

## [Unreleased]

### Planned
- Refresh token flow
- Token revocation via Redis blacklist
- WebSocket support for real-time analysis progress
- Audio file transcription via Whisper API
- Multi-language transcript support
- Team/organization support for shared meetings
- Email reminders as alternative to Telegram
