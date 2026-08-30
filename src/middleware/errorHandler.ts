import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // 1. Direct AppError instances
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

  // 2. Safe mapping for PostgreSQL / Supabase PostgREST error codes
  if (err && typeof err === 'object') {
    const pgCode = err.code || err.statusCode;

    // 23505: Unique constraint violation -> 409 DUPLICATE_RECORD
    if (pgCode === '23505') {
      logger.warn(`[Database Unique Violation 23505]: ${err.message || ''}`);
      return sendError(res, 409, 'DUPLICATE_RECORD', 'A record with these values already exists');
    }

    // 23503: Foreign key constraint violation -> 400 BAD_REQUEST
    if (pgCode === '23503') {
      logger.warn(`[Database Foreign Key Violation 23503]: ${err.message || ''}`);
      return sendError(res, 400, 'BAD_REQUEST', 'Referenced entity does not exist');
    }

    // 23502: Not-null violation -> 422 VALIDATION_ERROR
    if (pgCode === '23502') {
      logger.warn(`[Database Not-Null Violation 23502]: ${err.message || ''}`);
      return sendError(res, 422, 'VALIDATION_ERROR', 'Required database field is missing');
    }

    // 22P02: Invalid text representation (e.g. malformed UUID) -> 422 VALIDATION_ERROR
    if (pgCode === '22P02') {
      logger.warn(`[Database Invalid Syntax 22P02]: ${err.message || ''}`);
      return sendError(res, 422, 'VALIDATION_ERROR', 'Invalid parameter format');
    }

    // PGRST116: PostgREST single row not found -> 404 NOT_FOUND
    if (pgCode === 'PGRST116') {
      logger.warn(`[PostgREST Row Not Found PGRST116]: ${err.message || ''}`);
      return sendError(res, 404, 'NOT_FOUND', 'Requested resource was not found');
    }
  }

  // 3. Unhandled / unexpected runtime errors
  logger.error(`[UnhandledError]: ${err?.message || 'Unknown error'}`, err?.stack);

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err?.message || 'Internal Server Error';

  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', message);
};

