import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Attaches a unique correlation ID to every request.
 * Uses client-provided X-Request-ID if present, otherwise generates one.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.requestId = requestId;
  res.set('X-Request-ID', requestId);
  next();
}
