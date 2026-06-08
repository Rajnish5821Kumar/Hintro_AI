# 🧠 Meeting Intelligence Service

> Enterprise-grade AI-powered Meeting Intelligence Platform built with Node.js, TypeScript, Gemini 2.5 Flash, and Telegram Bot API.

[![CI](https://github.com/rajnishkumar/meeting-intelligence-service/actions/workflows/ci.yml/badge.svg)](https://github.com/rajnishkumar/meeting-intelligence-service/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 JWT Authentication | Secure register/login with bcrypt password hashing |
| 📅 Meeting Management | Full CRUD with pagination, search, and date filters |
| 🤖 AI Analysis | Gemini 2.5 Flash transcript analysis with grounded citations |
| 🚫 No Hallucinations | Every insight cites exact speaker + timestamp from transcript |
| ✅ Action Items | Create, track, filter, and manage tasks with overdue detection |
| ⏰ Reminder Scheduler | Automated hourly cron job for overdue notifications |
| 📱 Telegram Integration | Real-time delivery of reminders via Telegram Bot API |
| 🗄️ Redis Caching | Intelligent caching layer with graceful degradation |
| 🛡️ Rate Limiting | Per-endpoint rate limits (auth: 10/15min, API: 100/15min) |
| 📖 Swagger Docs | Full OpenAPI 3.0 spec at `/docs` |
| 🪪 Trace IDs | Every request gets a UUID trace ID returned in `X-Trace-Id` header |
| 📝 Structured Logging | Winston JSON logging with trace ID correlation |
| 🐳 Docker Support | Multi-stage Dockerfile + Docker Compose |
| 🔄 CI/CD | GitHub Actions: lint → test → build → deploy |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (optional)
- Google AI Studio API Key
- Telegram Bot Token (optional)

### 1. Clone & Install

```bash
git clone https://github.com/rajnishkumar/meeting-intelligence-service.git
cd meeting-intelligence-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

**Minimum required variables:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/meeting_intelligence
JWT_SECRET=your-super-secret-key-at-least-32-chars
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio
```

### 3. Database Setup

```bash
# Create database and run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed with sample data (optional)
npm run prisma:seed
```

### 4. Run in Development

```bash
npm run dev
```

The server starts at: `http://localhost:3000`

---

## 🐳 Docker Quick Start

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env

# Start all services (app + postgres + redis)
docker-compose up -d

# Run migrations
docker-compose run --rm migrate
```

---

## 📖 API Documentation

Swagger UI is available at: `http://localhost:3000/docs`

Raw OpenAPI JSON: `http://localhost:3000/docs.json`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meetings` | Create a meeting |
| GET | `/api/meetings` | List meetings (paginated) |
| GET | `/api/meetings/:id` | Get meeting by ID |
| PUT | `/api/meetings/:id` | Update meeting |
| DELETE | `/api/meetings/:id` | Delete meeting |
| POST | `/api/meetings/:id/analyze` | AI analysis |

### Action Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/action-items` | Create action item |
| GET | `/api/action-items` | List action items |
| PATCH | `/api/action-items/:id/status` | Update status |
| GET | `/api/action-items/overdue` | Get overdue items |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/evaluation` | Candidate info |
| GET | `/docs` | Swagger UI |

---

## 🤖 AI Analysis

The `/api/meetings/:id/analyze` endpoint uses **Gemini 2.5 Flash** to analyze meeting transcripts and returns:

```json
{
  "summary": [
    {
      "text": "Team agreed to launch next Friday.",
      "citations": [
        {
          "timestamp": "00:10",
          "speaker": "Alice",
          "quote": "We launch next Friday, confirmed."
        }
      ]
    }
  ],
  "actionItems": [...],
  "decisions": [...],
  "followUpSuggestions": [...]
}
```

**Every insight is grounded** — no hallucinations. The AI is strictly instructed to:
- Only use content from the provided transcript
- Never invent attendees, tasks, or decisions
- Cite every insight with exact speaker + timestamp

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only
npm test -- --testPathPattern="tests/unit"

# Integration tests only (requires DB)
npm test -- --testPathPattern="tests/integration"

# Coverage report
npm run test:coverage
```

Coverage target: **80%+**

---

## 🏗️ Architecture

```
src/
├── ai/                  # Gemini client, prompts, response parser
├── controllers/         # HTTP request handlers
├── docs/                # Swagger/OpenAPI setup
├── integrations/        # Telegram Bot API
├── jobs/                # node-cron scheduled tasks
├── middleware/          # Auth, traceId, validation, logging, error handler
├── prisma/              # Prisma client singleton
├── repositories/        # Database query layer (Repository Pattern)
├── routes/              # Express route definitions
├── services/            # Business logic (Service Layer Pattern)
├── tests/               # Unit + integration tests
├── utils/               # Logger, response builder, error classes, cache
└── validators/          # Zod validation schemas
```

**Patterns used:**
- Repository Pattern — all DB queries isolated
- Service Layer Pattern — business logic separated from HTTP
- Dependency Injection — singletons exported from each module
- Centralized Error Handling — one global error middleware

---

## 📦 Deployment

### Render

1. Connect your GitHub repo to Render
2. Set environment variables in the Render dashboard
3. Set build command: `npm install && npx prisma generate && npm run build`
4. Set start command: `npx prisma migrate deploy && node dist/server.js`

### Railway

1. Connect GitHub repo to Railway
2. Add PostgreSQL and Redis services
3. Set environment variables
4. Railway auto-detects the Node.js app and deploys

---

## 📱 Telegram Setup

1. Message `@BotFather` on Telegram → `/newbot`
2. Copy the bot token to `TELEGRAM_BOT_TOKEN` in `.env`
3. Start a chat with your bot and get your Chat ID:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
4. Set `TELEGRAM_CHAT_ID` in `.env`

---

## 🔧 Environment Variables

See [`.env.example`](.env.example) for the full list.

---

## 👤 Author

**Rajnish Kumar** — rk2452003@gmail.com
