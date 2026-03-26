import { Request, Response, NextFunction } from 'express';
import { getLogger, HTTP_STATUS } from 'shared';

const logger = getLogger('error-handler');

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handler. Catches all unhandled errors and returns structured responses.
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isOperational = err.isOperational ?? false;

  logger.error(
    {
      err,
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode,
      isOperational,
    },
    'Request error'
  );

  // Don't leak internal error details in production
  const message =
    statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      ...(req.requestId && { requestId: req.requestId }),
    },
  });
}

/**
 * Factory for creating operational errors with status codes.
 */
export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
