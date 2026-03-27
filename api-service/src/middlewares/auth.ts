import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { getConfig, getDataSource, HTTP_STATUS } from 'shared';
import { ApiKey } from 'shared';

// Extend Express Request to carry user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * API Key auth middleware for API endpoints.
 * Looks up the key in the api_keys table. Falls back to the global API_KEY from .env for backward compatibility.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health check, web UI, and auth routes
  if (
    req.path === '/health' ||
    req.path === '/' ||
    req.path.startsWith('/auth/') ||
    req.path.startsWith('/dashboard')
  ) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  const config = getConfig();

  if (!apiKey) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Missing API key',
      message: 'Provide a valid API key in the x-api-key header',
    });
    return;
  }

  // Check per-user API key from database
  const keyRepo = getDataSource().getRepository(ApiKey);
  keyRepo
    .findOne({ where: { apiKey, isActive: true } })
    .then(async (keyRecord) => {
      if (keyRecord) {
        req.userId = keyRecord.userId;
        // Update last_used timestamp (fire-and-forget)
        keyRepo.update(keyRecord.id, { lastUsed: new Date() }).catch(() => {});
        return next();
      }

      // Fallback: check legacy global API key
      if (apiKey === config.api.apiKey) {
        return next();
      }

      res.status(HTTP_STATUS.FORBIDDEN).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid',
      });
    })
    .catch((err) => {
      next(err);
    });
}

/**
 * JWT session auth middleware for dashboard endpoints.
 * Validates the Bearer token or cookie.
 */
export function jwtMiddleware(req: Request, res: Response, next: NextFunction): void {
  const config = getConfig();
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Authentication required',
      message: 'Please login to access this resource',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Invalid or expired token',
      message: 'Please login again',
    });
  }
}
