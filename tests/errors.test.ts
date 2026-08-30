import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import app from '../src/app.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 14: Centralized Error Handling & Sanitization', () => {
  const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const userAAuth = {
    id: userAId,
    email: 'userA@kinetra.app',
    role: 'authenticated',
  };

  function mockAuthUserA() {
    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: userAAuth },
      error: null,
    }));
  }

  // ---------------------------------------------------------------------------
  // 1. Standard Error Envelope across All Classes
  // ---------------------------------------------------------------------------
  it('TEST 1: Unknown route returns 404 NOT_FOUND with standard error envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-domain/unknown');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.ok(res.body.error.message);
  });

  it('TEST 2: Missing authorization returns 401 INVALID_TOKEN with standard error envelope', async () => {
    const res = await request(app).get('/api/v1/users/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 3: Validation failure returns 422 VALIDATION_ERROR with standard error envelope', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ invalid_field: 'bad' });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 2. PostgreSQL / Supabase Error Mapping
  // ---------------------------------------------------------------------------
  it('TEST 4: Maps PostgreSQL 23505 unique violation to 409 DUPLICATE_RECORD', async () => {
    const testApp = express();
    testApp.get('/test-duplicate', (_req: Request, _res: Response, next: NextFunction) => {
      const pgError = new Error('duplicate key value violates unique constraint "idx_unique"');
      (pgError as any).code = '23505';
      next(pgError);
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-duplicate');
    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'DUPLICATE_RECORD');
    assert.equal(res.body.error.message, 'A record with these values already exists');
  });

  it('TEST 5: Maps PostgreSQL 23503 foreign key violation to 400 BAD_REQUEST', async () => {
    const testApp = express();
    testApp.get('/test-foreign-key', (_req: Request, _res: Response, next: NextFunction) => {
      const pgError = new Error('insert or update on table violates foreign key constraint');
      (pgError as any).code = '23503';
      next(pgError);
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-foreign-key');
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'BAD_REQUEST');
    assert.equal(res.body.error.message, 'Referenced entity does not exist');
  });

  it('TEST 6: Maps PostgreSQL 23502 not-null violation to 422 VALIDATION_ERROR', async () => {
    const testApp = express();
    testApp.get('/test-not-null', (_req: Request, _res: Response, next: NextFunction) => {
      const pgError = new Error('null value in column "title" violates not-null constraint');
      (pgError as any).code = '23502';
      next(pgError);
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-not-null');
    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.equal(res.body.error.message, 'Required database field is missing');
  });

  it('TEST 7: Maps PostgreSQL 22P02 invalid syntax to 422 VALIDATION_ERROR', async () => {
    const testApp = express();
    testApp.get('/test-syntax', (_req: Request, _res: Response, next: NextFunction) => {
      const pgError = new Error('invalid input syntax for type uuid');
      (pgError as any).code = '22P02';
      next(pgError);
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-syntax');
    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.equal(res.body.error.message, 'Invalid parameter format');
  });

  it('TEST 8: Maps PostgREST PGRST116 single row not found to 404 NOT_FOUND', async () => {
    const testApp = express();
    testApp.get('/test-pgrst', (_req: Request, _res: Response, next: NextFunction) => {
      const pgError = new Error('JSON object requested, multiple (or no) rows returned');
      (pgError as any).code = 'PGRST116';
      next(pgError);
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-pgrst');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.equal(res.body.error.message, 'Requested resource was not found');
  });

  // ---------------------------------------------------------------------------
  // 3. Unexpected Runtime Exceptions & Security Sanitization
  // ---------------------------------------------------------------------------
  it('TEST 9: Unexpected runtime exception returns 500 INTERNAL_SERVER_ERROR without leaking secrets or paths', async () => {
    const testApp = express();
    testApp.get('/test-unhandled', (_req: Request, _res: Response, next: NextFunction) => {
      next(new Error('Sensitive DB password leaked in exception /var/secrets/db.key'));
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-unhandled');
    assert.equal(res.status, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INTERNAL_SERVER_ERROR');

    // Never leak stack traces in response body
    assert.equal(res.body.stack, undefined);
    assert.equal(res.body.error.stack, undefined);
  });
});
