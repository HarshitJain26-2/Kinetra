import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import app from '../src/app.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  InternalServerError,
} from '../src/utils/errors.js';

describe('Phase 4: Standardized API Responses & Error Handling', () => {
  it('1. GET /health returns standard 200 response with status, environment, version', async () => {
    const res = await request(app).get('/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(typeof res.body.environment, 'string');
    assert.equal(typeof res.body.timestamp, 'string');
    assert.equal(res.body.version, '1.0.0');
  });

  it('2. Unknown route triggers notFoundHandler with 404 and NOT_FOUND error envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-route-xyz');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.match(res.body.error.message, /not found/i);
  });

  it('3. Error handler formats 400 BadRequestError correctly', async () => {
    const testApp = express();
    testApp.get('/test-400', (_req: Request, _res: Response, next: NextFunction) => {
      next(new BadRequestError('Invalid input parameter', 'INVALID_PARAM'));
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-400');
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_PARAM');
    assert.equal(res.body.error.message, 'Invalid input parameter');
  });

  it('4. Error handler formats 401 UnauthorizedError correctly', async () => {
    const testApp = express();
    testApp.get('/test-401', (_req: Request, _res: Response, next: NextFunction) => {
      next(new UnauthorizedError('Missing or bad token', 'INVALID_TOKEN'));
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-401');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('5. Error handler formats 403 ForbiddenError correctly', async () => {
    const testApp = express();
    testApp.get('/test-403', (_req: Request, _res: Response, next: NextFunction) => {
      next(new ForbiddenError('You do not own this resource'));
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-403');
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');
  });

  it('6. Error handler formats 404 NotFoundError correctly', async () => {
    const testApp = express();
    testApp.get('/test-404', (_req: Request, _res: Response, next: NextFunction) => {
      next(new NotFoundError('Exercise not found', 'EXERCISE_NOT_FOUND'));
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-404');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'EXERCISE_NOT_FOUND');
  });

  it('7. Error handler formats 422 ValidationError with details field', async () => {
    const testApp = express();
    testApp.get('/test-422', (_req: Request, _res: Response, next: NextFunction) => {
      next(
        new ValidationError('Validation failed', [
          { field: 'form_score', message: 'Must be between 0 and 100' },
        ])
      );
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-422');
    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(res.body.error.details));
    assert.equal(res.body.error.details[0].field, 'form_score');
  });

  it('8. Unexpected error converts to safe 500 without leaking stack traces or internal secrets', async () => {
    const testApp = express();
    testApp.get('/test-500', () => {
      throw new Error('Database password / connection string crashed');
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-500');
    assert.equal(res.status, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INTERNAL_SERVER_ERROR');
    // Ensure stack trace property is not sent in response JSON
    assert.equal(res.body.stack, undefined);
    assert.equal(res.body.error.stack, undefined);
  });
});
