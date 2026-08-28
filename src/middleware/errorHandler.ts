import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[AppError ${err.code}]: ${err.message}`, err.details || '');
    } else {
      logger.warn(`[AppError ${err.code}]: ${err.message}`);
    }

    return sendError(
      res,
      err.statusCode,
      err.code,
      err.message,
      err.details
    );
  }

  // Handle unhandled / unexpected runtime errors
  logger.error(`[UnhandledError]: ${err.message}`, err.stack);

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', message);
};
