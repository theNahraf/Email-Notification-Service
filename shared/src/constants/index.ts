// ============================================
// Notification Status
// ============================================
export enum NotificationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  SENT = 'sent',
  FAILED = 'failed',
  DLQ = 'dlq',
}

// ============================================
// Notification Channel (future: sms, push)
// ============================================
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

// ============================================
// Queue Names
// ============================================
export const QUEUE_NAMES = {
  EMAIL_NOTIFICATIONS: 'email-notifications',
  EMAIL_DLQ: 'email-dlq',
} as const;

// ============================================
// Redis Key Prefixes
// ============================================
export const REDIS_KEYS = {
  IDEMPOTENCY: 'idempotency:',
  RATE_LIMIT: 'ratelimit:',
} as const;

// ============================================
// Defaults
// ============================================
export const DEFAULTS = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 2000,
  IDEMPOTENCY_TTL_SECONDS: 86400, // 24 hours
  QUEUE_CONCURRENCY: 5,
} as const;

// ============================================
// HTTP Status Codes
// ============================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
