import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { getConfig, getLogger, REDIS_KEYS, HTTP_STATUS } from 'shared';

const logger = getLogger('rate-limiter');

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const config = getConfig();
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

/**
 * Sliding window rate limiter using Redis.
 * Tracks requests per IP within a configurable time window.
 */
export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip rate limiting for health check and web UI
  if (req.path === '/health' || req.path === '/') {
    return next();
  }

  const config = getConfig();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.maxRequests;
  const identifier = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `${REDIS_KEYS.RATE_LIMIT}${identifier}`;

  const now = Date.now();
  const windowStart = now - windowMs;

  const client = getRedis();

  // Use Redis sorted set for sliding window
  client
    .multi()
    .zremrangebyscore(key, 0, windowStart) // Remove expired entries
    .zadd(key, now, `${now}-${Math.random()}`) // Add current request
    .zcard(key) // Count requests in window
    .pexpire(key, windowMs) // Set TTL
    .exec()
    .then((results) => {
      if (!results) {
        return next();
      }

      const requestCount = results[2][1] as number;

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': String(Math.max(0, maxRequests - requestCount)),
        'X-RateLimit-Reset': String(Math.ceil((now + windowMs) / 1000)),
      });

      if (requestCount > maxRequests) {
        logger.warn(
          { identifier, requestCount, maxRequests },
          'Rate limit exceeded'
        );

        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000}s`,
          retryAfter: Math.ceil(windowMs / 1000),
        });
        return;
      }

      next();
    })
    .catch((err) => {
      // If Redis fails, allow the request (fail-open)
      logger.error({ err }, 'Rate limiter Redis error — failing open');
      next();
    });
}

export async function closeRateLimiterRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
