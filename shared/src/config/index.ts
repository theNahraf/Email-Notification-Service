import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface AppConfig {
  nodeEnv: string;
  logLevel: string;

  api: {
    port: number;
    apiKey: string;
  };

  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };

  redis: {
    host: string;
    port: number;
    password: string | undefined;
  };

  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  email: {
    provider: 'smtp' | 'console';
    from: string;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
    };
  };

  retry: {
    maxAttempts: number;
    baseDelayMs: number;
  };

  queue: {
    concurrency: number;
  };
}

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function intEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  return raw ? parseInt(raw, 10) : fallback;
}

function boolEnv(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (!raw) return fallback;
  return raw === 'true' || raw === '1';
}

export function loadConfig(): AppConfig {
  return {
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    logLevel: optionalEnv('LOG_LEVEL', 'info'),

    api: {
      port: intEnv('API_PORT', 3000),
      apiKey: requireEnv('API_KEY', 'dev-api-key-change-in-production'),
    },

    db: {
      host: requireEnv('DB_HOST', 'localhost'),
      port: intEnv('DB_PORT', 5432),
      username: requireEnv('DB_USERNAME', 'notify_user'),
      password: requireEnv('DB_PASSWORD', 'notify_password'),
      database: requireEnv('DB_DATABASE', 'notification_db'),
    },

    redis: {
      host: requireEnv('REDIS_HOST', 'localhost'),
      port: intEnv('REDIS_PORT', 6379),
      password: process.env.REDIS_PASSWORD || undefined,
    },

    rateLimit: {
      windowMs: intEnv('RATE_LIMIT_WINDOW_MS', 60000),
      maxRequests: intEnv('RATE_LIMIT_MAX_REQUESTS', 100),
    },

    email: {
      provider: optionalEnv('EMAIL_PROVIDER', 'console') as 'smtp' | 'console',
      from: optionalEnv('EMAIL_FROM', 'noreply@notification-service.local'),
      smtp: {
        host: optionalEnv('SMTP_HOST', 'localhost'),
        port: intEnv('SMTP_PORT', 1025),
        secure: boolEnv('SMTP_SECURE', false),
        user: optionalEnv('SMTP_USER', ''),
        pass: optionalEnv('SMTP_PASS', ''),
      },
    },

    retry: {
      maxAttempts: intEnv('RETRY_MAX_ATTEMPTS', 3),
      baseDelayMs: intEnv('RETRY_BASE_DELAY_MS', 2000),
    },

    queue: {
      concurrency: intEnv('QUEUE_CONCURRENCY', 5),
    },
  };
}

// Singleton config instance
let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}
