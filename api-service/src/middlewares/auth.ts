import { Request, Response, NextFunction } from 'express';
import { getConfig } from 'shared';
import { HTTP_STATUS } from 'shared';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health check and web UI
  if (req.path === '/health' || req.path === '/') {
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

  if (apiKey !== config.api.apiKey) {
    res.status(HTTP_STATUS.FORBIDDEN).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid',
    });
    return;
  }

  next();
}
