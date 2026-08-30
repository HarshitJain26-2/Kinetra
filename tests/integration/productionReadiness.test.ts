/**
 * Phase 26 — Production Readiness & Deployment Verification: Unit & Integration Tests
 *
 * Validates:
 *   - validateEnv() in development vs production modes
 *   - GET /health response safety (no secrets/stack traces)
 *   - Error handler sanitization for 500 responses in production
 *   - In-memory rate limiting with 429 status and Retry-After header
 *   - CORS headers configuration
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express, { Request, Response } from 'express';
import app from '../../src/app.js';
import { env, validateEnv, type EnvConfig } from '../../src/config/env.js';
import { InMemoryRateLimiter } from '../../src/middleware/rateLimiter.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

describe('Phase 26: Production Readiness & Deployment Verification', () => {

  // ── SECTION 1: Environment Validation ─────────────────────────────────────

  it('TEST 1: validateEnv() passes in development mode even with placeholder values', () => {
    const devConfig: EnvConfig = {
      PORT: 5000,
      NODE_ENV: 'development',
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      CORS_ORIGIN: '*',
      RATE_LIMIT_WINDOW_MS: 900000,
      RATE_LIMIT_MAX: 500,
    };

    const result = validateEnv(devConfig);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('TEST 2: validateEnv() in production mode flags missing Supabase credentials', () => {
    const prodConfigMissing: EnvConfig = {
      PORT: 5000,
      NODE_ENV: 'production',
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      CORS_ORIGIN: '*',
      RATE_LIMIT_WINDOW_MS: 900000,
      RATE_LIMIT_MAX: 500,
    };

    const result = validateEnv(prodConfigMissing);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('SUPABASE_URL')));
    assert.ok(result.errors.some(e => e.includes('SUPABASE_ANON_KEY')));
    assert.ok(result.errors.some(e => e.includes('SUPABASE_SERVICE_ROLE_KEY')));
  });

  it('TEST 3: validateEnv() in production mode validates valid Supabase HTTPS URL', () => {
    const prodConfigValid: EnvConfig = {
      PORT: 5000,
      NODE_ENV: 'production',
      SUPABASE_URL: 'https://abcdefghijkl.supabase.co',
      SUPABASE_ANON_KEY: 'valid-anon-key-string',
      SUPABASE_SERVICE_ROLE_KEY: 'valid-service-role-key-string',
      CORS_ORIGIN: 'https://app.kinetra.com',
      RATE_LIMIT_WINDOW_MS: 900000,
      RATE_LIMIT_MAX: 500,
    };

    const result = validateEnv(prodConfigValid);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  // ── SECTION 2: Health Endpoint Safety ─────────────────────────────────────

  it('TEST 4: GET /health returns 200 with safe status and zero secret leakage', async () => {
    const res = await request(app).get('/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.ok(res.body.timestamp);
    assert.ok(res.body.version);

    // Verify absolutely no sensitive keys or internal paths are present
    const rawBody = JSON.stringify(res.body);
    assert.ok(!rawBody.includes('SUPABASE'));
    assert.ok(!rawBody.includes('key'));
    assert.ok(!rawBody.includes('secret'));
    assert.ok(!rawBody.includes('token'));
  });

  // ── SECTION 3: Production Error Sanitization ──────────────────────────────

  it('TEST 5: Centralized errorHandler sanitizes 500 errors and suppresses stack traces in production', async () => {
    const prevEnv = env.NODE_ENV;
    env.NODE_ENV = 'production';

    try {
      const testApp = express();
      testApp.get('/test-error', (_req: Request, _res: Response) => {
        throw new Error('Database connection failed: postgresql://user:secretpass@db.kinetra.internal:5432/kinetra');
      });
      testApp.use(errorHandler);

      const res = await request(testApp).get('/test-error');

      assert.equal(res.status, 500);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'INTERNAL_SERVER_ERROR');
      assert.equal(res.body.error.message, 'An unexpected error occurred. Please try again later.');
      // Ensure no stack trace or raw SQL credentials leak to the client
      assert.ok(!res.body.error.stack);
      assert.ok(!JSON.stringify(res.body).includes('secretpass'));
    } finally {
      env.NODE_ENV = prevEnv;
    }
  });

  // ── SECTION 4: In-Memory Rate Limiter ─────────────────────────────────────

  it('TEST 6: InMemoryRateLimiter blocks requests exceeding threshold with 429 and Retry-After', async () => {
    const customLimiter = new InMemoryRateLimiter(60000, 3); // Max 3 requests per 60s
    const testApp = express();

    // Mark request so test environment allows rate limiter to run
    testApp.use((req, _res, next) => {
      (req as any).__testRateLimiter = true;
      next();
    });
    testApp.use(customLimiter.middleware());
    testApp.get('/api/test', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    // 1st request -> 200
    const r1 = await request(testApp).get('/api/test');
    assert.equal(r1.status, 200);

    // 2nd request -> 200
    const r2 = await request(testApp).get('/api/test');
    assert.equal(r2.status, 200);

    // 3rd request -> 200
    const r3 = await request(testApp).get('/api/test');
    assert.equal(r3.status, 200);

    // 4th request -> 429 (Exceeded limit)
    const r4 = await request(testApp).get('/api/test');
    assert.equal(r4.status, 429);
    assert.equal(r4.body.error.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(r4.headers['retry-after']);
  });

  // ── SECTION 5: CORS Configuration ─────────────────────────────────────────

  it('TEST 7: Preflight OPTIONS request returns valid CORS allowed headers and methods', async () => {
    const res = await request(app)
      .options('/api/v1/users/me')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    assert.ok([200, 204].includes(res.status));
    assert.ok(res.headers['access-control-allow-origin']);
  });

});
