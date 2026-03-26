# 📧 Email Notification Service

A **production-ready, scalable, event-driven** email notification microservice built with Node.js, TypeScript, BullMQ, PostgreSQL, and Redis.

## Architecture

```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌────────────────┐
│  Client  │────▶│ API Service │────▶│  BullMQ  │────▶│ Worker Service │
│          │     │  (Express)  │     │  (Redis)  │     │                │
└─────────┘     └──────┬──────┘     └────┬─────┘     └───────┬────────┘
                       │                 │                    │
                       ▼                 │                    ▼
                ┌──────────────┐         │           ┌───────────────┐
                │  PostgreSQL  │         │           │ Email Provider│
                │  (Primary)   │         │           │ (SMTP / SES)  │
                └──────────────┘         │           └───────────────┘
                                         ▼
                                  ┌──────────────┐
                                  │     DLQ      │
                                  │ (Dead Letter) │
                                  └──────────────┘
```

## Features

- **REST API** to trigger email notifications
- **Event-driven** async processing via BullMQ (Redis-backed)
- **Email worker** with template rendering (Handlebars)
- **Retry + DLQ** — exponential backoff with dead letter queue
- **Idempotency** — duplicate request protection (Redis + DB)
- **Rate limiting** — sliding window, Redis-backed
- **Structured logging** — Pino with JSON output
- **Plug-and-play** email providers (SMTP, Console, extensible to SES)
- **Docker** — full containerized setup with health checks
- **Clean architecture** — SOLID principles, loosely coupled

## Tech Stack

| Component       | Technology               |
| --------------- | ------------------------ |
| Backend         | Node.js + TypeScript     |
| Framework       | Express.js               |
| Queue           | BullMQ (Redis)           |
| Database        | PostgreSQL 16            |
| Cache           | Redis 7                  |
| Email           | Nodemailer (SMTP)        |
| Templates       | Handlebars               |
| Logging         | Pino                     |
| Container       | Docker + Compose         |

## Project Structure

```
notification-service/
├── api-service/              # REST API (Express)
│   └── src/
│       ├── controllers/      # Request handlers
│       ├── routes/           # Route definitions
│       ├── services/         # Business logic
│       ├── middlewares/      # Auth, rate-limit, error handling
│       └── index.ts          # App bootstrap
├── worker-service/           # Queue consumer + email sender
│   └── src/
│       ├── consumers/        # Job processors
│       ├── email/            # Provider interface + implementations
│       ├── retry/            # Retry strategy + DLQ logic
│       ├── templates/        # Handlebars email templates
│       └── index.ts          # Worker bootstrap
├── shared/                   # Shared library
│   └── src/
│       ├── config/           # Centralized config
│       ├── constants/        # Enums, queue names
│       ├── database/         # TypeORM setup
│       ├── logger/           # Pino logger
│       ├── models/           # Entity definitions
│       └── queue/            # Producer, consumer, types
├── docker/
│   ├── docker-compose.yml    # Full stack
│   ├── Dockerfile.api        # API multi-stage build
│   ├── Dockerfile.worker     # Worker multi-stage build
│   └── init.sql              # DB schema
├── .env                      # Environment variables
└── README.md
```

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and navigate to project
cd notification-service

# Start all services
docker compose -f docker/docker-compose.yml up --build

# Or use the npm script
npm run docker:up
```

This starts:
- **API Service** → `http://localhost:3000`
- **PostgreSQL** → `localhost:5432`
- **Redis** → `localhost:6379`
- **Mailhog** Web UI → `http://localhost:8025` (catches all emails)

### Option 2: Local Development

```bash
# Prerequisites: PostgreSQL and Redis running locally

# Install dependencies
npm install

# Build shared library first
npm run build:shared

# Run API service
npm run dev:api

# In another terminal, run Worker service
npm run dev:worker
```

## API Reference

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "api-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### Send Email Notification

```bash
POST /notifications/email
```

**Headers:**
```
Content-Type: application/json
x-api-key: dev-api-key-change-in-production
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "template_id": "welcome_email",
  "subject": "Welcome!",
  "payload": {
    "name": "Farhan",
    "actionUrl": "https://example.com/dashboard"
  },
  "user_id": "user-123",
  "idempotency_key": "unique-key-abc123"
}
```

**Response (202 Accepted):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Notification queued for delivery"
}
```

### Get Notification Status

```bash
GET /notifications/:id
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "channel": "email",
  "template_id": "welcome_email",
  "status": "sent",
  "retry_count": 0,
  "failure_reason": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:01.000Z",
  "sent_at": "2024-01-01T00:00:01.000Z"
}
```

### Queue Statistics

```bash
GET /notifications/stats/queue
```

**Response:**
```json
{
  "emailQueue": {
    "waiting": 0,
    "active": 1,
    "completed": 42,
    "failed": 2,
    "delayed": 0
  },
  "dlq": {
    "waiting": 1,
    "active": 0
  }
}
```

## Available Templates

| Template ID        | Description               | Variables                          |
| ------------------ | ------------------------- | ---------------------------------- |
| `welcome_email`    | Welcome new user          | `name`, `actionUrl`                |
| `password_reset`   | Password reset link       | `name`, `resetUrl`, `expiresIn`, `resetCode` |

### Adding New Templates

1. Create a `.hbs` file in `worker-service/src/templates/`
2. Use Handlebars syntax: `{{variableName}}`
3. Available helpers: `{{uppercase str}}`, `{{formatDate date}}`, `{{#ifEquals a b}}`

## End-to-End Flow

```
1. Client → POST /notifications/email
2. API validates request + checks idempotency
3. API stores notification in PostgreSQL (status: pending)
4. API enqueues job to BullMQ (status: queued)
5. Worker picks up job (status: processing)
6. Worker renders Handlebars template
7. Worker sends email via provider
8. Success → status: sent
   Failure → retry with exponential backoff
   Max retries exceeded → status: dlq (Dead Letter Queue)
```

## Retry Strategy

- **Max retries:** 3 (configurable)
- **Backoff:** Exponential with jitter
  - Attempt 1: ~2s
  - Attempt 2: ~4s
  - Attempt 3: ~8s
- **Non-retryable errors** (e.g., invalid email) → skip to DLQ immediately
- **DLQ** preserves failure reason and total attempts

## Configuration

All settings are controlled via environment variables (see `.env`):

| Variable                 | Default                              | Description                   |
| ------------------------ | ------------------------------------ | ----------------------------- |
| `API_PORT`               | `3000`                               | API server port               |
| `API_KEY`                | `dev-api-key-change-in-production`   | API authentication key        |
| `DB_HOST`                | `localhost`                          | PostgreSQL host               |
| `REDIS_HOST`             | `localhost`                          | Redis host                    |
| `EMAIL_PROVIDER`         | `console`                            | `smtp` or `console`           |
| `SMTP_HOST`              | `localhost`                          | SMTP server host              |
| `SMTP_PORT`              | `1025`                               | SMTP server port              |
| `RETRY_MAX_ATTEMPTS`     | `3`                                  | Max retry attempts            |
| `RETRY_BASE_DELAY_MS`    | `2000`                               | Base delay for backoff (ms)   |
| `QUEUE_CONCURRENCY`      | `5`                                  | Concurrent worker jobs        |
| `RATE_LIMIT_MAX_REQUESTS`| `100`                                | Max requests per window       |
| `RATE_LIMIT_WINDOW_MS`   | `60000`                              | Rate limit window (ms)        |

## Scaling

### Horizontal Scaling
- Run multiple worker containers consuming the same queue
- BullMQ handles job distribution automatically

### Rate Control
- Worker-level rate limiting (50 jobs/second)
- API-level rate limiting (sliding window)

### Future Extensions
- **SMS**: Add a new worker consuming an `sms-notifications` queue
- **Push**: Same pattern for push notifications
- **Multi-provider**: Route emails through SES, SendGrid, or Mailgun based on region/cost
- **Priority queues**: BullMQ supports job priorities natively

## Testing with cURL

```bash
# Health check
curl http://localhost:3000/health

# Send a welcome email
curl -X POST http://localhost:3000/notifications/email \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-change-in-production" \
  -d '{
    "email": "farhan@example.com",
    "template_id": "welcome_email",
    "payload": { "name": "Farhan", "actionUrl": "https://example.com" },
    "idempotency_key": "test-001"
  }'

# Check notification status
curl http://localhost:3000/notifications/<notification-id> \
  -H "x-api-key: dev-api-key-change-in-production"

# View queue stats
curl http://localhost:3000/notifications/stats/queue \
  -H "x-api-key: dev-api-key-change-in-production"

# Test idempotency (same key → same response, no duplicate)
curl -X POST http://localhost:3000/notifications/email \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-change-in-production" \
  -d '{
    "email": "farhan@example.com",
    "template_id": "welcome_email",
    "payload": { "name": "Farhan" },
    "idempotency_key": "test-001"
  }'

# Test rate limiting (run in a loop)
for i in $(seq 1 105); do
  curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/notifications/email \
    -H "Content-Type: application/json" \
    -H "x-api-key: dev-api-key-change-in-production" \
    -d "{\"email\": \"test@example.com\", \"template_id\": \"welcome_email\", \"payload\": {\"name\": \"Test\"}, \"idempotency_key\": \"rate-test-$i\"}"
  echo ""
done
```

## License

MIT
