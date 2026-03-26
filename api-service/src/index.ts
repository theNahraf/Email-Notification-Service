import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { getConfig, getLogger, initializeDatabase, closeDatabase } from 'shared';
import {
  requestIdMiddleware,
  authMiddleware,
  rateLimiterMiddleware,
  errorHandler,
  closeRateLimiterRedis,
} from './middlewares';
import { closeNotificationService } from './controllers/notification.controller';
import notificationRoutes from './routes/notification.routes';

const logger = getLogger('api-service');

async function bootstrap(): Promise<void> {
  const config = getConfig();
  const app = express();

  // --- Security & Compression ---
  app.use(helmet({
    contentSecurityPolicy: false, // Allow inline styles for web UI
  }));
  app.use(cors());
  app.use(compression());

  // --- Body Parsing ---
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // --- Custom Middlewares ---
  app.use(requestIdMiddleware);
  app.use(authMiddleware);
  app.use(rateLimiterMiddleware);

  // --- Request Logging ---
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(
        {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        },
        'Request completed'
      );
    });
    next();
  });

  // --- Health Check ---
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'api-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // --- Web UI: Email Compose Form ---
  app.get('/', (_req, res) => {
    res.send(getEmailFormHTML());
  });

  // --- Routes ---
  app.use('/notifications', notificationRoutes);

  // --- 404 Handler ---
  app.use((_req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: 'The requested endpoint does not exist',
    });
  });

  // --- Error Handler ---
  app.use(errorHandler);

  // --- Initialize Database ---
  await initializeDatabase();
  logger.info('Database initialized');

  // --- Start Server ---
  const server = app.listen(config.api.port, () => {
    logger.info(
      { port: config.api.port, env: config.nodeEnv },
      '🚀 API Service started'
    );
  });

  // --- Graceful Shutdown ---
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await closeNotificationService();
        await closeRateLimiterRedis();
        await closeDatabase();
        logger.info('All connections closed. Exiting.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });

    // Force exit after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    process.exit(1);
  });
}

function getEmailFormHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📧 Email Notification Service</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #0f0f1a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      width: 100%;
      max-width: 580px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .header p {
      color: #6b7280;
      font-size: 14px;
      font-weight: 400;
    }
    .card {
      background: #1a1a2e;
      border: 1px solid #2a2a40;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .field {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: #9ca3af;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
    }
    input, textarea {
      width: 100%;
      background: #12121f;
      border: 1px solid #2a2a40;
      border-radius: 10px;
      padding: 14px 16px;
      color: #e5e7eb;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }
    input:focus, textarea:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    }
    input::placeholder, textarea::placeholder {
      color: #4b5563;
    }
    textarea {
      min-height: 160px;
      resize: vertical;
      line-height: 1.6;
    }
    .btn {
      width: 100%;
      padding: 15px;
      border: none;
      border-radius: 10px;
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      letter-spacing: 0.3px;
    }
    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.35);
    }
    .btn:active { transform: translateY(0); }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .status {
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 10px;
      font-size: 13px;
      display: none;
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .status.success {
      display: block;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .status.error {
      display: block;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .status.loading {
      display: block;
      background: rgba(102, 126, 234, 0.1);
      border: 1px solid rgba(102, 126, 234, 0.3);
      color: #93a4f4;
    }
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(147, 164, 244, 0.3);
      border-top-color: #93a4f4;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .footer {
      text-align: center;
      margin-top: 24px;
      color: #4b5563;
      font-size: 12px;
    }
    .footer a { color: #667eea; text-decoration: none; }
    .history {
      margin-top: 16px;
    }
    .history-item {
      padding: 10px 14px;
      background: #12121f;
      border: 1px solid #2a2a40;
      border-radius: 8px;
      margin-top: 8px;
      font-size: 12px;
      color: #9ca3af;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge.sent { background: rgba(16,185,129,0.15); color: #34d399; }
    .badge.queued { background: rgba(102,126,234,0.15); color: #93a4f4; }
    .badge.failed { background: rgba(239,68,68,0.15); color: #f87171; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Email Notification Service</h1>
      <p>Compose and send emails instantly</p>
    </div>
    <div class="card">
      <form id="emailForm">
        <div class="field">
          <label for="email">Recipient Email</label>
          <input type="email" id="email" name="email" placeholder="recipient@example.com" required>
        </div>
        <div class="field">
          <label for="subject">Subject</label>
          <input type="text" id="subject" name="subject" placeholder="Your email subject" required>
        </div>
        <div class="field">
          <label for="body">Message Body</label>
          <textarea id="body" name="body" placeholder="Write your message here... (HTML supported)" required></textarea>
        </div>
        <button type="submit" class="btn" id="sendBtn">Send Email →</button>
      </form>
      <div id="status" class="status"></div>
      <div id="history" class="history"></div>
    </div>
    <div class="footer">
      <p>API: <a href="/health">/health</a> · <a href="/notifications/stats/queue">/stats</a></p>
    </div>
  </div>

  <script>
    const API_KEY = 'dev-api-key-change-in-production';
    const form = document.getElementById('emailForm');
    const statusEl = document.getElementById('status');
    const historyEl = document.getElementById('history');
    const sendBtn = document.getElementById('sendBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const subject = document.getElementById('subject').value;
      const body = document.getElementById('body').value;

      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';
      statusEl.className = 'status loading';
      statusEl.innerHTML = '<span class="spinner"></span> Sending email...';

      try {
        const res = await fetch('/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
          body: JSON.stringify({ email, subject, body }),
        });

        const data = await res.json();

        if (res.ok) {
          statusEl.className = 'status success';
          statusEl.textContent = '✅ ' + data.message + ' (ID: ' + data.id.slice(0,8) + '...)';
          addHistory(email, subject, 'queued');
          form.reset();
        } else {
          statusEl.className = 'status error';
          statusEl.textContent = '❌ ' + (data.error || 'Failed to send');
        }
      } catch (err) {
        statusEl.className = 'status error';
        statusEl.textContent = '❌ Network error: ' + err.message;
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Email →';
      }
    });

    function addHistory(email, subject, status) {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = '<span>' + email + ' — ' + subject + '</span><span class="badge ' + status + '">' + status + '</span>';
      historyEl.prepend(div);
    }
  </script>
</body>
</html>`;
}

bootstrap().catch((err) => {
  console.error('Failed to start API service:', err);
  process.exit(1);
});
