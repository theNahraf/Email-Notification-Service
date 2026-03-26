import { getConfig, getLogger } from 'shared';

const logger = getLogger('retry-strategy');

export interface RetryDecision {
  shouldRetry: boolean;
  delay: number;
  moveToDLQ: boolean;
  reason: string;
}

/**
 * Non-retryable errors — these indicate permanent failures.
 * Retrying won't help for these cases.
 */
const NON_RETRYABLE_PATTERNS = [
  'invalid email',
  'email address not found',
  'mailbox not found',
  'user unknown',
  'no such user',
  'recipient rejected',
  'template not found',
  'invalid template',
];

/**
 * Determines whether a failed job should be retried, delayed, or moved to DLQ.
 */
export function evaluateRetry(
  attemptsMade: number,
  error: Error
): RetryDecision {
  const config = getConfig();
  const maxAttempts = config.retry.maxAttempts;
  const baseDelay = config.retry.baseDelayMs;

  // Check if the error is non-retryable
  const errorMessage = error.message.toLowerCase();
  const isNonRetryable = NON_RETRYABLE_PATTERNS.some((pattern) =>
    errorMessage.includes(pattern)
  );

  if (isNonRetryable) {
    logger.warn(
      { error: error.message, attemptsMade },
      'Non-retryable error — moving to DLQ immediately'
    );
    return {
      shouldRetry: false,
      delay: 0,
      moveToDLQ: true,
      reason: `Non-retryable error: ${error.message}`,
    };
  }

  // Check if max retries exceeded
  if (attemptsMade >= maxAttempts) {
    logger.warn(
      { attemptsMade, maxAttempts },
      'Max retries exceeded — moving to DLQ'
    );
    return {
      shouldRetry: false,
      delay: 0,
      moveToDLQ: true,
      reason: `Max retries (${maxAttempts}) exceeded. Last error: ${error.message}`,
    };
  }

  // Calculate exponential backoff delay
  // delay = baseDelay * 2^attempt (with jitter)
  const exponentialDelay = baseDelay * Math.pow(2, attemptsMade);
  const jitter = Math.random() * 1000; // Add 0-1s of jitter to prevent thundering herd
  const delay = Math.min(exponentialDelay + jitter, 60000); // Cap at 60s

  logger.info(
    { attemptsMade, nextAttempt: attemptsMade + 1, delay: Math.round(delay) },
    'Scheduling retry with exponential backoff'
  );

  return {
    shouldRetry: true,
    delay: Math.round(delay),
    moveToDLQ: false,
    reason: `Retry ${attemptsMade + 1}/${maxAttempts} after ${Math.round(delay)}ms`,
  };
}

/**
 * Calculate backoff delay for a given attempt number.
 * Useful for logging and monitoring.
 */
export function calculateBackoffDelay(attempt: number): number {
  const config = getConfig();
  const baseDelay = config.retry.baseDelayMs;
  return Math.min(baseDelay * Math.pow(2, attempt), 60000);
}
