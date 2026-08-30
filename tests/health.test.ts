import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Phase 18: Health Check Probe (/health)', () => {
  it('1. GET /health returns HTTP 200 with status "ok"', async () => {
    const res = await request(app).get('/health');

    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type']?.includes('application/json'), true);
    assert.equal(res.body.status, 'ok');
    assert.ok(res.body.timestamp);
    assert.ok(res.body.version);
    assert.ok(res.body.environment);
  });

  it('2. GET /health is publicly accessible without Authorization header', async () => {
    const res = await request(app).get('/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('3. GET /health never exposes secrets, Supabase keys, DB credentials, or process.env', async () => {
    const res = await request(app).get('/health');

    const bodyString = JSON.stringify(res.body);
    const forbiddenPatterns = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'service_role',
      'DATABASE_URL',
      'password',
      'secret',
      'token',
      'process.env',
    ];

    for (const pattern of forbiddenPatterns) {
      assert.equal(
        bodyString.toLowerCase().includes(pattern.toLowerCase()),
        false,
        `Health check response must not leak: ${pattern}`
      );
    }
  });

  it('4. GET /health does not reflect Authorization tokens if provided', async () => {
    const testSecretToken = 'secret-jwt-token-do-not-reflect-12345';
    const res = await request(app)
      .get('/health')
      .set('Authorization', `Bearer ${testSecretToken}`);

    assert.equal(res.status, 200);
    const bodyString = JSON.stringify(res.body);
    assert.equal(bodyString.includes(testSecretToken), false);
  });

  it('5. GET /health is hosted at root, not under /api/v1', async () => {
    const resRoot = await request(app).get('/health');
    assert.equal(resRoot.status, 200);

    const resV1 = await request(app).get('/api/v1/health');
    assert.equal(resV1.status, 404);
    assert.equal(resV1.body.error.code, 'NOT_FOUND');
  });
});
