import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 3: Supabase Authentication Middleware & /auth/me', () => {
  it('1. Rejects unauthenticated request with 401 and INVALID_TOKEN', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('2. Rejects malformed authorization header (not Bearer) with 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Basic dXNlcjpwYXNz');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('3. Rejects empty Bearer token with 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer ');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('4. Rejects invalid / expired JWT with 401', async () => {
    // Mock supabase.auth.getUser returning an error
    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: null },
      error: { message: 'Invalid JWT signature', status: 401, name: 'AuthApiError' },
    }));

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-expired-token');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
    assert.equal(res.body.error.message, 'Invalid or expired authentication token');

    mock.restoreAll();
  });

  it('5. Successfully authenticates valid JWT and returns user profile from GET /api/v1/auth/me', async () => {
    const mockUserId = '11111111-2222-3333-4444-555555555555';
    const mockUser = {
      id: mockUserId,
      email: 'harshit@kinetra.app',
      role: 'authenticated',
    };

    const mockProfile = {
      id: mockUserId,
      display_name: 'Harshit',
      avatar_url: 'https://kinetra.app/avatar.png',
      fitness_level: 'intermediate',
      onboarding_done: true,
    };

    // Mock Supabase getUser
    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: mockUser },
      error: null,
    }));

    // Mock Supabase from('users').select('*').eq('id', ...).single()
    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: mockProfile, error: null }),
        }),
      }),
    }));

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-jwt-token-12345');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, mockUserId);
    assert.equal(res.body.data.email, 'harshit@kinetra.app');
    assert.equal(res.body.data.display_name, 'Harshit');
    assert.equal(res.body.data.fitness_level, 'intermediate');
    assert.equal(res.body.data.onboarding_done, true);

    mock.restoreAll();
  });

  it('6. Returns 404 PROFILE_NOT_FOUND when user is authenticated in Supabase but no row exists in users table', async () => {
    const mockUserId = '99999999-8888-7777-6666-555555555555';

    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: {
        user: { id: mockUserId, email: 'newuser@kinetra.app', role: 'authenticated' },
      },
      error: null,
    }));

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Row not found' } }),
        }),
      }),
    }));

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-token-new-user');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'PROFILE_NOT_FOUND');

    mock.restoreAll();
  });
});
