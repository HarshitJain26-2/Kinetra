/**
 * Kinetra API — Lightweight Production Rate Limiter Middleware
 *
 * Provides in-memory abuse protection per IP address with configurable window and thresholds.
 * Zero external database/Redis dependencies.
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

interface ClientRecord {
  count: number;
  resetTime: number;
}

export class InMemoryRateLimiter {
  private clients: Map<string, ClientRecord> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(windowMs: number = 900000, maxRequests: number = 500) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Periodically prune expired client records to prevent memory growth
    this.cleanupInterval = setInterval(() => this.cleanup(), Math.min(this.windowMs, 60000));
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, record] of this.clients.entries()) {
      if (now > record.resetTime) {
        this.clients.delete(ip);
      }
    }
  }

  public reset(): void {
    this.clients.clear();
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): any => {
      // Allow bypassing in standard test runs unless testing rate limiter directly
      if (env.NODE_ENV === 'test' && !(req as any).__testRateLimiter) {
        return next();
      }

      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
      const now = Date.now();

      let record = this.clients.get(ip);
      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + this.windowMs,
        };
        this.clients.set(ip, record);
        return next();
      }

      record.count++;

      if (record.count > this.maxRequests) {
        const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec.toString());
        return sendError(
          res,
          429,
          'RATE_LIMIT_EXCEEDED',
          'Too many requests. Please try again later.'
        );
      }

      return next();
    };
  }
}

export const globalRateLimiter = new InMemoryRateLimiter(
  env.RATE_LIMIT_WINDOW_MS,
  env.RATE_LIMIT_MAX
);
