# 🔌 Integration Guide: Plug & Play Email Service

This guide shows you how to connect **any application** (Node.js, Python, React, Next.js, Django, Spring Boot, etc.) to your Email Notification Service using simple HTTP requests.

---

## How It Works

Your Email Service is a **standalone microservice** that runs independently. Any application talks to it over HTTP — just like calling any REST API. No libraries or SDKs to install.

```
┌──────────────────┐         HTTP POST          ┌──────────────────────┐
│  Your App        │  ───────────────────────▶   │  Email Service       │
│  (Any Language)  │                             │  (Docker Container)  │
│                  │  ◀───────────────────────   │                      │
│                  │      JSON Response          │  localhost:3000       │
└──────────────────┘                             └──────────────────────┘
```

**You need only 2 things:**
1. The **URL** of the email service (e.g. `http://localhost:3000`)
2. The **API Key** (from your `.env` file's `API_KEY` value)

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/notifications/send` | **Quick send** — just provide email, subject, body |
| `POST` | `/notifications/email` | **Template send** — uses Handlebars templates with dynamic data |
| `GET`  | `/notifications/:id` | **Check status** — track if the email was delivered |
| `GET`  | `/notifications/stats/queue` | **Queue stats** — see pending/completed/failed counts |
| `GET`  | `/health` | **Health check** — verify the service is running |

---

## Quick Send (Simplest Way)

This is the easiest endpoint. Just provide `email`, `subject`, and `body`:

### cURL
```bash
curl -X POST http://localhost:3000/notifications/send \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "email": "user@example.com",
    "subject": "Order Confirmed!",
    "body": "<h1>Thank you!</h1><p>Your order #1234 has been confirmed.</p>"
  }'
```

### Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Notification queued for delivery"
}
```

---

## Integration Examples

### 1. Node.js / Express (Backend)

```javascript
// emailService.js — reusable helper
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3000';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'dev-api-key-change-in-production';

async function sendEmail({ to, subject, body }) {
  const response = await fetch(`${EMAIL_SERVICE_URL}/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': EMAIL_API_KEY,
    },
    body: JSON.stringify({ email: to, subject, body }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Email failed: ${error.message || error.error}`);
  }

  return response.json();
}

module.exports = { sendEmail };
```

**Usage in your Express app:**
```javascript
const { sendEmail } = require('./emailService');

// Example: Send welcome email after user registration
app.post('/api/register', async (req, res) => {
  const user = await User.create(req.body);

  // Fire-and-forget email (don't block the response)
  sendEmail({
    to: user.email,
    subject: `Welcome to MyApp, ${user.name}!`,
    body: `<h1>Welcome ${user.name}!</h1><p>Thanks for joining us.</p>`,
  }).catch(err => console.error('Email failed:', err));

  res.json({ message: 'Registration successful', user });
});

// Example: Send OTP / verification code
app.post('/api/send-otp', async (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000);

  await sendEmail({
    to: req.body.email,
    subject: 'Your Verification Code',
    body: `<h2>Your OTP is: ${otp}</h2><p>This code expires in 10 minutes.</p>`,
  });

  res.json({ message: 'OTP sent!' });
});
```

---

### 2. Python / Django / Flask / FastAPI

```python
# email_service.py
import requests
import os

EMAIL_SERVICE_URL = os.getenv('EMAIL_SERVICE_URL', 'http://localhost:3000')
EMAIL_API_KEY = os.getenv('EMAIL_API_KEY', 'dev-api-key-change-in-production')

def send_email(to: str, subject: str, body: str) -> dict:
    response = requests.post(
        f'{EMAIL_SERVICE_URL}/notifications/send',
        json={'email': to, 'subject': subject, 'body': body},
        headers={
            'Content-Type': 'application/json',
            'x-api-key': EMAIL_API_KEY,
        }
    )
    response.raise_for_status()
    return response.json()
```

**Usage in Django views:**
```python
from email_service import send_email

def register_user(request):
    user = User.objects.create_user(...)

    send_email(
        to=user.email,
        subject=f'Welcome {user.first_name}!',
        body=f'<h1>Welcome!</h1><p>Your account has been created.</p>'
    )

    return JsonResponse({'status': 'success'})
```

**Usage in FastAPI:**
```python
from fastapi import FastAPI
from email_service import send_email

app = FastAPI()

@app.post("/api/forgot-password")
async def forgot_password(email: str):
    reset_link = generate_reset_link(email)
    send_email(
        to=email,
        subject="Reset Your Password",
        body=f"<p>Click here to reset: <a href='{reset_link}'>Reset Password</a></p>"
    )
    return {"message": "Reset email sent"}
```

---

### 3. React / Next.js (Frontend via API Route)

**Never call the email service directly from the browser** (it would expose your API key). Instead, proxy through your backend:

```javascript
// pages/api/contact.js (Next.js API Route)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, message } = req.body;

  const response = await fetch('http://localhost:3000/notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EMAIL_API_KEY,
    },
    body: JSON.stringify({
      email: 'yourteam@gmail.com',         // Your team receives the message
      subject: `Contact Form: ${name}`,
      body: `<p><strong>From:</strong> ${name} (${email})</p><p>${message}</p>`,
    }),
  });

  const data = await response.json();
  res.status(200).json(data);
}
```

**React component:**
```jsx
function ContactForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
      }),
    });

    if (res.ok) alert('Message sent!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="message" placeholder="Message" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

---

### 4. Java / Spring Boot

```java
@Service
public class EmailService {
    private final RestTemplate restTemplate = new RestTemplate();
    private final String emailServiceUrl = "http://localhost:3000";
    private final String apiKey = "dev-api-key-change-in-production";

    public void sendEmail(String to, String subject, String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);

        Map<String, String> payload = Map.of(
            "email", to,
            "subject", subject,
            "body", body
        );

        HttpEntity<Map<String, String>> request = new HttpEntity<>(payload, headers);
        restTemplate.postForObject(emailServiceUrl + "/notifications/send", request, Map.class);
    }
}
```

---

## Template-Based Emails (Advanced)

For consistent, branded emails, use the `/notifications/email` endpoint with pre-built templates:

```bash
curl -X POST http://localhost:3000/notifications/email \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "email": "user@example.com",
    "template_id": "welcome_email",
    "subject": "Welcome to Our App!",
    "payload": {
      "name": "Farhan",
      "actionUrl": "https://myapp.com/dashboard"
    },
    "idempotency_key": "welcome-user-123"
  }'
```

Available templates: `welcome_email`, `password_reset`. Add your own by creating `.hbs` files in `worker-service/src/templates/`.

---

## Tracking Email Delivery

After sending, you get back an `id`. Use it to check the delivery status:

```bash
curl http://localhost:3000/notifications/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-api-key: YOUR_API_KEY"
```

**Possible statuses:** `pending` → `queued` → `processing` → `sent` | `failed` | `dlq`

---

## Running Alongside Your App (Docker Compose)

If your app also uses Docker, add the email service to your existing `docker-compose.yml`:

```yaml
services:
  # --- Your existing app ---
  my-app:
    build: .
    ports:
      - "8080:8080"
    environment:
      EMAIL_SERVICE_URL: http://email-api:3000
      EMAIL_API_KEY: your-secret-api-key
    depends_on:
      email-api:
        condition: service_healthy

  # --- Email Service (plug & play) ---
  email-postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: notify_user
      POSTGRES_PASSWORD: notify_password
      POSTGRES_DB: notification_db
    volumes:
      - email_pg_data:/var/lib/postgresql/data
      - ./notification-service/docker/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U notify_user -d notification_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  email-redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  email-api:
    build:
      context: ./notification-service
      dockerfile: docker/Dockerfile.api
    environment:
      DB_HOST: email-postgres
      REDIS_HOST: email-redis
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 587
      SMTP_USER: your-email@gmail.com
      SMTP_PASS: your-app-password
      EMAIL_FROM: your-email@gmail.com
      API_KEY: your-secret-api-key
    depends_on:
      email-postgres:
        condition: service_healthy
      email-redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  email-worker:
    build:
      context: ./notification-service
      dockerfile: docker/Dockerfile.worker
    environment:
      DB_HOST: email-postgres
      REDIS_HOST: email-redis
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 587
      SMTP_USER: your-email@gmail.com
      SMTP_PASS: your-app-password
      EMAIL_FROM: your-email@gmail.com
    depends_on:
      email-api:
        condition: service_healthy

volumes:
  email_pg_data:
```

Then from your app, just call `http://email-api:3000/notifications/send` (Docker resolves the hostname automatically).

---

## Summary Cheat Sheet

| What you want to do | Endpoint | Required fields |
|---------------------|----------|-----------------|
| Send a quick email | `POST /notifications/send` | `email`, `subject`, `body` |
| Send a template email | `POST /notifications/email` | `email`, `template_id` |
| Check delivery status | `GET /notifications/:id` | — |
| View queue health | `GET /notifications/stats/queue` | — |

**Every request needs this header:** `x-api-key: YOUR_API_KEY`

That's it! Your email service is fully plug-and-play. 🚀
