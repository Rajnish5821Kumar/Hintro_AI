# Testing Guide

## Overview

The Meeting Intelligence Service maintains **80%+ code coverage** using:
- **Jest** — Test runner
- **ts-jest** — TypeScript support
- **Supertest** — HTTP integration testing

---

## Test Structure

```
src/tests/
├── unit/
│   ├── authService.test.ts       # Auth service logic
│   ├── overdueService.test.ts    # Overdue detection logic
│   └── analysisParser.test.ts   # AI response parsing
└── integration/
    ├── auth.test.ts              # Full auth HTTP cycle
    ├── meetings.test.ts          # Full meeting CRUD cycle
    └── actionItems.test.ts      # Full action item lifecycle
```

---

## Running Tests

```bash
# All tests
npm test

# Unit tests only (no DB required)
npm test -- --testPathPattern="tests/unit"

# Integration tests (requires DATABASE_URL)
npm test -- --testPathPattern="tests/integration" --runInBand

# With coverage report
npm run test:coverage

# Watch mode (development)
npm run test:watch
```

---

## Environment Setup for Testing

Integration tests require a real PostgreSQL database. Create a test database:

```bash
# Create test DB
psql -U postgres -c "CREATE DATABASE meeting_intelligence_test;"

# Set in .env or inline:
DATABASE_URL=postgresql://postgres:password@localhost:5432/meeting_intelligence_test \
  npm test -- --testPathPattern="tests/integration"
```

Minimum `.env` for tests:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=test-secret-key-min-32-chars-for-testing
JWT_EXPIRES_IN=1h
```

---

## Unit Tests

Unit tests mock all external dependencies (Prisma, bcrypt, JWT):

```typescript
jest.mock('../../repositories/userRepository');
jest.mock('bcryptjs');
```

### AuthService Tests (`authService.test.ts`)
- ✅ Registers new user and returns JWT token
- ✅ Strips passwordHash from returned user object
- ✅ Throws ConflictError for duplicate email
- ✅ Calls bcrypt.hash before storing password
- ✅ Logs in successfully with valid credentials
- ✅ Throws UnauthorizedError for wrong password
- ✅ Returns same error message for both email-not-found and wrong-password cases (prevents email enumeration)

### OverdueService Tests (`overdueService.test.ts`)
- ✅ Returns all overdue items from repository
- ✅ Returns empty array when no items are overdue
- ✅ `isOverdue()` returns true for PENDING items past due date
- ✅ `isOverdue()` returns true for IN_PROGRESS items past due date
- ✅ `isOverdue()` returns false for COMPLETED items (regardless of date)
- ✅ `isOverdue()` returns false for items with future due dates

### AnalysisParser Tests (`analysisParser.test.ts`)
- ✅ Parses valid JSON AI response correctly
- ✅ Strips markdown code fences before parsing
- ✅ Throws AIAnalysisError for non-JSON responses
- ✅ Throws AIAnalysisError when citations are missing
- ✅ Accepts empty arrays for all sections

---

## Integration Tests

Integration tests make real HTTP requests against the Express app with a real database.

### Auth Tests (`auth.test.ts`)
- ✅ `POST /api/auth/register` — Creates user, returns token, excludes passwordHash
- ✅ `POST /api/auth/register` — Returns 409 for duplicate email
- ✅ `POST /api/auth/register` — Returns 400 for invalid email format
- ✅ `POST /api/auth/register` — Returns 400 for weak password
- ✅ `POST /api/auth/login` — Returns token for valid credentials
- ✅ `POST /api/auth/login` — Returns 401 for wrong password
- ✅ `POST /api/auth/login` — Returns 401 for non-existent user
- ✅ `GET /health` — Returns health status

### Meeting Tests (`meetings.test.ts`)
- ✅ `POST /api/meetings` — Creates meeting with transcripts
- ✅ `POST /api/meetings` — Returns 401 without auth token
- ✅ `POST /api/meetings` — Returns 400 for missing required fields
- ✅ `GET /api/meetings` — Returns paginated list with metadata
- ✅ `GET /api/meetings?search=` — Filters by search term
- ✅ `GET /api/meetings/:id` — Returns specific meeting
- ✅ `GET /api/meetings/:id` — Returns 404 for non-existent ID
- ✅ `PUT /api/meetings/:id` — Updates meeting title
- ✅ `DELETE /api/meetings/:id` — Deletes meeting
- ✅ `GET /api/meetings/:id` — Returns 404 after deletion

### Action Item Tests (`actionItems.test.ts`)
- ✅ `POST /api/action-items` — Creates action item
- ✅ `GET /api/action-items` — Lists all items with pagination
- ✅ `GET /api/action-items?status=PENDING` — Filters by status
- ✅ `PATCH /api/action-items/:id/status` — Updates to IN_PROGRESS
- ✅ `PATCH /api/action-items/:id/status` — Returns 400 for invalid status
- ✅ `GET /api/action-items/overdue` — Returns overdue summary

---

## Test Data Isolation

Each integration test suite:
1. Creates its own unique user (email includes timestamp: `test-{Date.now()}@example.com`)
2. Runs `afterAll` cleanup that deletes the test user (cascades to all related data)
3. Uses `--runInBand` to prevent concurrent test interference on the database

---

## Mocking Strategy

| Layer | Mock Strategy |
|---|---|
| Repositories | `jest.mock()` — full module mock |
| bcrypt | `jest.mock('bcryptjs')` |
| JWT | Real JWT signing/verification in tests |
| Gemini AI | Not tested in integration tests (mocked at service level) |
| Telegram | Not tested in integration tests (graceful no-op) |
| Redis | Disabled in test environment (`REDIS_URL` not set) |

---

## Coverage Report

Generate an HTML coverage report:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

Coverage thresholds (configured in `package.json`):
- Branches: 70%
- Functions: 75%
- Lines: 80%
- Statements: 80%
