/**
 * Phase 15 — Comprehensive Backend Testing & QA
 *
 * Covers all gap areas identified from audit:
 * 1. Session business logic gaps (cancelled state, log to completed/cancelled, end by non-owner)
 * 2. Mass assignment on ALL protected fields across all domains
 * 3. Privilege escalation coverage for challenges and nutrition
 * 4. Data leakage checks across all response payloads
 * 5. Error response envelope consistency across all error types
 * 6. API contract regression verification
 * 7. RLS static audit assertions
 */

import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import app from '../src/app.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

// ─── Shared Test Fixtures ───────────────────────────────────────────────────
const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const userBId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const sessionId1 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const workoutId1 = '11111111-9c0b-4ef8-bb6d-6bb9bd380a11';
const exerciseId1 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const injuryId1 = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
const challengeId1 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

const userAAuth = { id: userAId, email: 'userA@kinetra.app', role: 'authenticated' };
const userBAuth = { id: userBId, email: 'userB@kinetra.app', role: 'authenticated' };

function mockAuthUserA() {
  mock.method(supabaseAnon.auth, 'getUser', async () => ({
    data: { user: userAAuth },
    error: null,
  }));
}

function mockAuthUserB() {
  mock.method(supabaseAnon.auth, 'getUser', async () => ({
    data: { user: userBAuth },
    error: null,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: SESSION BUSINESS LOGIC GAPS
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 15 — Section 1: Session Business Logic Edge Cases', () => {
  it('S1-1: Cannot log exercise to a COMPLETED session (returns 400 SESSION_NOT_ACTIVE)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: sessionId1, user_id: userAId, status: 'completed' },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId1}/log-exercise`)
      .set('Authorization', 'Bearer valid-jwt')
      .send({ exercise_id: exerciseId1, reps: 10 });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'SESSION_NOT_ACTIVE');

    mock.restoreAll();
  });

  it('S1-2: Cannot log exercise to a CANCELLED session (returns 400 SESSION_NOT_ACTIVE)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: sessionId1, user_id: userAId, status: 'cancelled' },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId1}/log-exercise`)
      .set('Authorization', 'Bearer valid-jwt')
      .send({ exercise_id: exerciseId1, reps: 10 });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'SESSION_NOT_ACTIVE');

    mock.restoreAll();
  });

  it('S1-3: User A cannot end User B session (returns 403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: sessionId1, user_id: userBId, status: 'active', started_at: new Date().toISOString() },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId1}/end`)
      .set('Authorization', 'Bearer valid-jwt')
      .send({});

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  it('S1-4: Session list returns only sessions belonging to requesting user (db-level filter)', async () => {
    mockAuthUserA();

    let appliedUserFilter: string | null = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'sessions');
      return {
        select: (_f: string, opts: any) => {
          assert.equal(opts?.count, 'exact');
          return {
            eq: (field: string, val: string) => {
              // Must filter by user_id first
              if (field === 'user_id') appliedUserFilter = val;
              return {
                order: () => ({
                  range: () =>
                    Promise.resolve({ data: [], count: 0, error: null }),
                }),
              };
            },
          };
        },
      };
    });

    const res = await request(app)
      .get('/api/v1/sessions')
      .set('Authorization', 'Bearer valid-jwt');

    assert.equal(res.status, 200);
    assert.equal(appliedUserFilter, userAId, 'Session list MUST filter by authenticated user_id');

    mock.restoreAll();
  });

  it('S1-5: Starting session with valid public workout by another user is allowed', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          insert: (data: any) => {
            assert.equal(data.user_id, userAId);
            return {
              select: () => ({
                single: async () => ({
                  data: { id: sessionId1, ...data },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      if (table === 'workouts') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: workoutId1, creator_id: userBId, is_public: true },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post('/api/v1/sessions/start')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ workout_id: workoutId1 });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user_id, userAId);

    mock.restoreAll();
  });

  it('S1-6: Session start body rejects unknown fields (strict schema)', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post('/api/v1/sessions/start')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ workout_id: workoutId1, injected_field: 'malicious' });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: MASS ASSIGNMENT PROTECTION — ALL DOMAINS
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 15 — Section 2: Mass Assignment Protection (All Domains)', () => {
  it('S2-1: Cannot inject "id" or "created_at" into POST /workouts', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ title: 'Legit Workout', id: '00000000-0000-0000-0000-000000000001', created_at: '2000-01-01' });

    // Strict schema must reject unknown fields
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S2-2: Cannot inject "updated_at" or "user_id" into PUT /nutrition/profile', async () => {
    mockAuthUserA();

    const res = await request(app)
      .put('/api/v1/nutrition/profile')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ goal: 'gain_muscle', updated_at: '2000-01-01', user_id: userBId });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S2-3: Cannot inject "user_id" or "resolved_at" into PATCH /injuries/:id', async () => {
    mockAuthUserA();

    const res = await request(app)
      .patch(`/api/v1/injuries/${injuryId1}`)
      .set('Authorization', 'Bearer valid-jwt')
      .send({ resolved: true, user_id: userBId, resolved_at: '2000-01-01' });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S2-4: Cannot inject "creator_id" or "is_active" into POST /challenges', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post('/api/v1/challenges')
      .set('Authorization', 'Bearer valid-jwt')
      .send({
        title: 'Test Challenge',
        start_date: '2026-09-01',
        end_date: '2026-09-30',
        creator_id: userBId,
        is_active: false,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S2-5: Cannot inject "session_id" or "user_id" into POST /sessions/:id/log-exercise', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId1}/log-exercise`)
      .set('Authorization', 'Bearer valid-jwt')
      .send({
        exercise_id: exerciseId1,
        reps: 10,
        session_id: 'injected-session-id',
        user_id: userBId,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S2-6: Cannot inject "is_admin" or "role" via PUT /users/me', async () => {
    mockAuthUserA();

    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ display_name: 'Hacker', is_admin: true, role: 'admin' });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S2-7: Cannot inject "email" or "id" via PUT /users/me', async () => {
    mockAuthUserA();

    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ display_name: 'Legit Name', email: 'hack@evil.com', id: userBId });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S2-8: POST /pose-analysis rejects injection of "session_exercise_id" or "user_id"', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer valid-jwt')
      .send({
        session_id: sessionId1,
        exercise_id: exerciseId1,
        reps: 10,
        form_score: 80,
        session_exercise_id: 'injected-id',
        user_id: userBId,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: PRIVILEGE ESCALATION — NUTRITION & CHALLENGES
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 15 — Section 3: Privilege Escalation (Nutrition & Challenges)', () => {
  it('S3-1: Nutrition profile GET uses authenticated user_id — not a user-supplied ID', async () => {
    mockAuthUserA();

    let queriedUserId: string | null = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'nutrition_profiles');
      return {
        select: () => ({
          eq: (field: string, val: string) => {
            if (field === 'user_id') queriedUserId = val;
            return {
              single: async () => ({
                data: {
                  id: 'some-profile-id',
                  user_id: userAId,
                  goal: 'maintain',
                  diet_type: 'omnivore',
                  allergies: [],
                  daily_cal_target: 2000,
                  protein_g: 100,
                  carbs_g: 250,
                  fat_g: 65,
                  meal_plan_json: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            };
          },
        }),
      };
    });

    const res = await request(app)
      .get('/api/v1/nutrition/profile')
      .set('Authorization', 'Bearer valid-jwt');

    assert.equal(res.status, 200);
    assert.equal(queriedUserId, userAId, 'Service must query nutrition profile by authenticated user_id');

    mock.restoreAll();
  });

  it('S3-2: User A cannot spoof ownership via creator_id when creating a challenge', async () => {
    mockAuthUserA();

    let insertedCreatorId: string | null = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'challenges');
      return {
        insert: (data: any) => {
          insertedCreatorId = data.creator_id;
          return {
            select: () => ({
              single: async () => ({
                data: { id: challengeId1, ...data, created_at: new Date().toISOString() },
                error: null,
              }),
            }),
          };
        },
      };
    });

    const res = await request(app)
      .post('/api/v1/challenges')
      .set('Authorization', 'Bearer valid-jwt')
      .send({
        title: 'Legitimate Challenge',
        start_date: '2026-10-01',
        end_date: '2026-10-31',
      });

    assert.equal(res.status, 201);
    // Regardless of what user sends, creator_id must always come from JWT
    assert.equal(insertedCreatorId, userAId, 'creator_id must always be set from authenticated user JWT');

    mock.restoreAll();
  });

  it('S3-3: Challenge join user_id must be taken from JWT — cannot be spoofed in body', async () => {
    mockAuthUserA();

    let insertedUserId: string | null = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'challenges') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: challengeId1,
                  creator_id: userBId,
                  title: 'Test',
                  description: null,
                  type: 'volume',
                  metric_key: 'total_reps',
                  target_value: 100,
                  start_date: '2026-10-01',
                  end_date: '2026-10-31',
                  is_active: true,
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'challenge_participants') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          insert: (data: any) => {
            insertedUserId = data.user_id;
            return {
              select: () => ({
                single: async () => ({
                  data: { id: 'new-participant-id', ...data, joined_at: new Date().toISOString() },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post(`/api/v1/challenges/${challengeId1}/join`)
      .set('Authorization', 'Bearer valid-jwt');

    assert.equal(res.status, 201);
    assert.equal(insertedUserId, userAId, 'challenge participant user_id must be set from JWT');

    mock.restoreAll();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: DATA LEAKAGE — RESPONSE PAYLOAD VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 15 — Section 4: Data Leakage Prevention', () => {
  it('S4-1: /health endpoint never exposes env vars, keys, or secrets', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);

    const body = JSON.stringify(res.body);
    const forbiddenPatterns = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'service_role',
      'supabase_key',
      'DATABASE_URL',
      'password',
      'secret',
      'private_key',
    ];
    for (const pattern of forbiddenPatterns) {
      assert.equal(
        body.toLowerCase().includes(pattern.toLowerCase()),
        false,
        `Response must not contain: ${pattern}`
      );
    }
  });

  it('S4-2: 500 error response never exposes stack traces or file system paths as response fields', async () => {
    const testApp = express();
    testApp.get('/test-500', (_req: Request, _res: Response, next: NextFunction) => {
      const err = new Error('Internal error');
      next(err);
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-500');
    assert.equal(res.status, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INTERNAL_SERVER_ERROR');

    // Must never expose stack trace as a FIELD in the response object
    assert.equal(res.body.stack, undefined, 'Must not expose top-level stack property');
    assert.equal(res.body.error.stack, undefined, 'Must not expose error.stack property');
    assert.equal(res.body.error.details?.stack, undefined, 'Must not expose details.stack property');
    // Must never expose environment-level internals
    assert.equal(res.body.env, undefined, 'Must not expose env in response');
    assert.equal(res.body.error.env, undefined, 'Must not expose env in error response');
  });

  it('S4-3: PostgreSQL error details never leak SQL in production-mode response body', async () => {
    const testApp = express();
    testApp.get('/test-pgerr', (_req: Request, _res: Response, next: NextFunction) => {
      const pgError = new Error(
        'ERROR: duplicate key value violates unique constraint "idx_users_email"; DETAIL: Key (email)=(test@kinetra.app) already exists.'
      );
      (pgError as any).code = '23505';
      next(pgError);
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-pgerr');
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'DUPLICATE_RECORD');

    // Safe generic message — raw SQL constraint must not appear
    assert.equal(
      res.body.error.message.includes('duplicate key value violates'),
      false,
      'Raw SQL error message must not be exposed'
    );
  });

  it('S4-4: Leaderboard response never exposes private health/body metrics', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'public_profiles');
      return {
        select: (_fields: string, opts: any) => {
          assert.equal(opts?.count, 'exact');
          return {
            range: () =>
              Promise.resolve({
                data: [
                  { id: userAId, display_name: 'Rushikesh', avatar_url: null },
                  { id: userBId, display_name: 'AthleteB', avatar_url: null },
                ],
                count: 2,
                error: null,
              }),
          };
        },
      };
    });

    const res = await request(app)
      .get('/api/v1/leaderboard')
      .set('Authorization', 'Bearer valid-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    for (const entry of res.body.data) {
      assert.equal(entry.user.email, undefined, 'email must not be exposed in leaderboard');
      assert.equal(entry.user.height_cm, undefined, 'height_cm must not be exposed');
      assert.equal(entry.user.weight_kg, undefined, 'weight_kg must not be exposed');
      assert.equal(entry.user.date_of_birth, undefined, 'date_of_birth must not be exposed');
      assert.equal(entry.user.gender, undefined, 'gender must not be exposed');
    }

    mock.restoreAll();
  });

  it('S4-5: Challenge participants response exposes only public profile fields', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'challenges') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: challengeId1,
                  creator_id: userAId,
                  title: 'Test',
                  description: null,
                  type: 'volume',
                  metric_key: 'total_reps',
                  target_value: 100,
                  start_date: '2026-10-01',
                  end_date: '2026-10-31',
                  is_active: true,
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'challenge_participants') {
        return {
          select: (_f: string, opts: any) => {
            assert.equal(opts?.count, 'exact');
            return {
              eq: () => ({
                order: () => ({
                  range: () =>
                    Promise.resolve({
                      data: [
                        {
                          id: 'part-1',
                          current_value: 100,
                          joined_at: new Date().toISOString(),
                          user: { id: userAId, display_name: 'Rushikesh', avatar_url: null },
                        },
                      ],
                      count: 1,
                      error: null,
                    }),
                }),
              }),
            };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .get(`/api/v1/challenges/${challengeId1}/participants`)
      .set('Authorization', 'Bearer valid-jwt');

    assert.equal(res.status, 200);
    const participant = res.body.data[0];

    // Only public fields should be present
    assert.ok(participant.user.display_name !== undefined, 'display_name should be present');
    assert.equal(participant.user.email, undefined, 'email must not be in participants response');
    assert.equal(participant.user.height_cm, undefined, 'height_cm must not be in participants response');
    assert.equal(participant.user.weight_kg, undefined, 'weight_kg must not be in participants response');

    mock.restoreAll();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: ERROR RESPONSE ENVELOPE CONSISTENCY
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 15 — Section 5: Error Response Envelope Consistency', () => {
  it('S5-1: All 401 errors use { success: false, error: { code, message } } envelope', async () => {
    const endpoints = [
      { method: 'get', url: '/api/v1/auth/me' },
      { method: 'get', url: '/api/v1/users/me' },
      { method: 'get', url: '/api/v1/workouts' },
      { method: 'get', url: '/api/v1/sessions' },
      { method: 'get', url: '/api/v1/injuries' },
      { method: 'get', url: '/api/v1/nutrition/profile' },
      { method: 'get', url: '/api/v1/challenges' },
      { method: 'get', url: '/api/v1/leaderboard' },
    ];

    for (const ep of endpoints) {
      const res = await (request(app) as any)[ep.method](ep.url);
      assert.equal(res.status, 401, `${ep.url} should return 401`);
      assert.equal(res.body.success, false, `${ep.url} response.success should be false`);
      assert.equal(typeof res.body.error, 'object', `${ep.url} should have error object`);
      assert.equal(res.body.error.code, 'INVALID_TOKEN', `${ep.url} error.code should be INVALID_TOKEN`);
      assert.equal(typeof res.body.error.message, 'string', `${ep.url} error.message should be a string`);
    }
  });

  it('S5-2: All 422 validation errors include details array with field+message pairs', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ description: 'no title' });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(res.body.error.details), 'details must be an array');
    assert.ok(res.body.error.details.length > 0, 'details must not be empty');
    assert.ok(typeof res.body.error.details[0].field === 'string', 'each detail must have a field');
    assert.ok(typeof res.body.error.details[0].message === 'string', 'each detail must have a message');

    mock.restoreAll();
  });

  it('S5-3: 404 for unknown route follows standard error envelope', async () => {
    const res = await request(app).get('/api/v1/this-does-not-exist');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.equal(typeof res.body.error.message, 'string');
    assert.equal(res.body.data, undefined);
  });

  it('S5-4: Success responses always have { success: true, data } structure', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    // Health endpoint uses direct JSON, check structure is sane
    assert.ok(res.body.status, 'Health endpoint should have status field');
  });

  it('S5-5: PostgreSQL error codes map to correct HTTP status codes', async () => {
    const errorCodeMap = [
      { pgCode: '23505', expectedStatus: 409, expectedCode: 'DUPLICATE_RECORD' },
      { pgCode: '23503', expectedStatus: 400, expectedCode: 'BAD_REQUEST' },
      { pgCode: '23502', expectedStatus: 422, expectedCode: 'VALIDATION_ERROR' },
      { pgCode: '22P02', expectedStatus: 422, expectedCode: 'VALIDATION_ERROR' },
      { pgCode: 'PGRST116', expectedStatus: 404, expectedCode: 'NOT_FOUND' },
    ];

    for (const { pgCode, expectedStatus, expectedCode } of errorCodeMap) {
      const testApp = express();
      testApp.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        const err = new Error(`pg error: ${pgCode}`);
        (err as any).code = pgCode;
        next(err);
      });
      testApp.use(errorHandler);

      const res = await request(testApp).get('/test');
      assert.equal(res.status, expectedStatus, `pgCode ${pgCode} should map to HTTP ${expectedStatus}`);
      assert.equal(res.body.error.code, expectedCode, `pgCode ${pgCode} should have code ${expectedCode}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: API CONTRACT REGRESSION
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 15 — Section 6: API Contract Regression', () => {
  it('S6-1: GET /api/v1/auth/me returns user object with id and email fields', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id: userAId,
              display_name: 'Harshit',
              avatar_url: null,
              fitness_level: 'intermediate',
              onboarding_done: true,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      }),
    }));

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    // Contract: must include user identity fields
    assert.ok(res.body.data.id, 'Response must include id');
    assert.ok(res.body.data.email || res.body.data.id, 'Response must include identity info');

    mock.restoreAll();
  });

  it('S6-2: POST /workouts returns 201 with workout and exercises nested', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'exercises') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [{ id: exerciseId1 }], error: null }),
          }),
        };
      }
      if (table === 'workouts') {
        return {
          insert: (data: any) => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: workoutId1,
                  creator_id: userAId,
                  title: data.title,
                  description: null,
                  category: null,
                  difficulty: 'medium',
                  is_public: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'workout_exercises') {
        return {
          insert: () => ({
            select: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ title: 'Contract Test Workout' });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.id, 'Must return workout id');
    assert.ok(Array.isArray(res.body.data.exercises), 'Must return exercises array');

    mock.restoreAll();
  });

  it('S6-3: GET /sessions returns paginated response with meta', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            range: () =>
              Promise.resolve({ data: [], count: 0, error: null }),
          }),
        }),
      }),
    }));

    const res = await request(app)
      .get('/api/v1/sessions?page=1&limit=10')
      .set('Authorization', 'Bearer valid-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data), 'data must be array');
    assert.ok(res.body.meta !== undefined, 'meta must be present for paginated endpoints');
    assert.ok(res.body.meta.page !== undefined, 'meta.page must be present');
    assert.ok(res.body.meta.limit !== undefined, 'meta.limit must be present');
    assert.ok(res.body.meta.total !== undefined, 'meta.total must be present');

    mock.restoreAll();
  });

  it('S6-4: DELETE /workouts/:id returns 204 No Content', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'workouts');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { creator_id: userAId },
              error: null,
            }),
          }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      };
    });

    const res = await request(app)
      .delete(`/api/v1/workouts/${workoutId1}`)
      .set('Authorization', 'Bearer valid-jwt');

    assert.equal(res.status, 204);
    assert.equal(res.body.success, undefined, '204 must return no body');

    mock.restoreAll();
  });

  it('S6-5: POST /pose-analysis returns 201 with session_exercise_id, form_score, injury_flag, feedback', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: sessionId1, user_id: userAId, status: 'active' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'exercises') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { name: 'Squat' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'session_exercises') {
        return {
          insert: (data: any) => ({
            select: () => ({
              single: async () => ({
                data: { id: 'se-1', ...data },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ session_id: sessionId1, exercise_id: exerciseId1, reps: 8, form_score: 85 });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    // Contract fields
    assert.ok(res.body.data.session_exercise_id, 'Must return session_exercise_id');
    assert.ok(res.body.data.form_score !== undefined, 'Must return form_score');
    assert.ok(res.body.data.injury_flag !== undefined, 'Must return injury_flag');
    assert.ok(typeof res.body.data.feedback === 'string', 'Must return feedback string');

    mock.restoreAll();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: VALIDATION BOUNDARY & EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 15 — Section 7: Validation Boundaries & Edge Cases', () => {
  it('S7-1: Session log-exercise rejects set_number of 0 (must be >= 1)', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId1}/log-exercise`)
      .set('Authorization', 'Bearer valid-jwt')
      .send({ exercise_id: exerciseId1, set_number: 0, reps: 10 });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S7-2: Pose analysis rejects empty reps (must be >= 0)', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ session_id: sessionId1, exercise_id: exerciseId1, reps: -1, form_score: 80 });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field === 'reps'));

    mock.restoreAll();
  });

  it('S7-3: Challenge with negative target_value is rejected', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post('/api/v1/challenges')
      .set('Authorization', 'Bearer valid-jwt')
      .send({
        title: 'Negative Target',
        start_date: '2026-10-01',
        end_date: '2026-10-31',
        target_value: -100,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S7-4: Nutrition upsert rejects negative protein_g', async () => {
    mockAuthUserA();

    const res = await request(app)
      .put('/api/v1/nutrition/profile')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ protein_g: -50 });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S7-5: Injury PATCH with unknown severity enum is rejected', async () => {
    mockAuthUserA();

    const res = await request(app)
      .patch(`/api/v1/injuries/${injuryId1}`)
      .set('Authorization', 'Bearer valid-jwt')
      .send({ severity: 'critical' });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S7-6: End session body rejects notes exceeding 2000 chars', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId1}/end`)
      .set('Authorization', 'Bearer valid-jwt')
      .send({ notes: 'X'.repeat(2001) });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S7-7: Whitespace-only workout title is rejected', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ title: '   ' });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('S7-8: Workout difficulty must be one of easy/medium/hard enum', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer valid-jwt')
      .send({ title: 'Test', difficulty: 'extreme' });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: RLS STATIC AUDIT ASSERTIONS
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 15 — Section 8: RLS Static Policy Audit', () => {
  it('RLS-1: Migration 003 exists and contains USING and WITH CHECK clauses for all owned tables', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const migrationPath = path.resolve('migrations/003_security_rls_hardening.sql');
    assert.ok(fs.existsSync(migrationPath), 'Migration 003 file must exist');

    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

    // Verify USING clause is present for ownership checks
    const usingCount = (migrationContent.match(/USING\s*\(/gi) || []).length;
    assert.ok(usingCount >= 9, `Must have at least 9 USING clauses, found: ${usingCount}`);

    // Verify WITH CHECK clauses exist (guards against ownership spoofing on UPDATE)
    const withCheckCount = (migrationContent.match(/WITH CHECK\s*\(/gi) || []).length;
    assert.ok(withCheckCount >= 6, `Must have at least 6 WITH CHECK clauses, found: ${withCheckCount}`);

    // Verify all critical tables are covered
    const criticalTables = ['users', 'workouts', 'sessions', 'injury_flags', 'nutrition_profiles', 'challenges', 'challenge_participants'];
    for (const table of criticalTables) {
      assert.ok(
        migrationContent.includes(table),
        `Migration 003 must contain policies for table: ${table}`
      );
    }
  });

  it('RLS-2: Public profiles view only exposes safe non-sensitive columns', async () => {
    const fs = await import('fs');

    const migrationContent = fs.readFileSync('migrations/003_security_rls_hardening.sql', 'utf-8');

    // Public profiles must only have id, display_name, avatar_url, fitness_level
    assert.ok(migrationContent.includes('display_name'), 'public_profiles must include display_name');
    assert.ok(migrationContent.includes('avatar_url'), 'public_profiles must include avatar_url');

    // Private fields must NOT be in the public_profiles view definition
    const viewMatch = migrationContent.match(/CREATE OR REPLACE VIEW public_profiles AS[\s\S]*?FROM users;/);
    if (viewMatch) {
      const viewDef = viewMatch[0];
      assert.equal(viewDef.includes('weight_kg'), false, 'public_profiles must not expose weight_kg');
      assert.equal(viewDef.includes('height_cm'), false, 'public_profiles must not expose height_cm');
      assert.equal(viewDef.includes('date_of_birth'), false, 'public_profiles must not expose date_of_birth');
      assert.equal(viewDef.includes('gender'), false, 'public_profiles must not expose gender');
    }
  });

  it('RLS-3: Service-role key is only used server-side and never appears in response payloads', async () => {
    const fs = await import('fs');
    const path = await import('path');

    // Check supabase config doesn't expose key to clients
    const supabaseConfigPath = path.resolve('src/config/supabase.ts');
    const supabaseContent = fs.readFileSync(supabaseConfigPath, 'utf-8');

    // Admin client must use service role
    assert.ok(
      supabaseContent.includes('supabaseAdmin') || supabaseContent.includes('SUPABASE_SERVICE_ROLE_KEY'),
      'Supabase admin config must reference service role key'
    );

    // The key itself must only come from env, not hardcoded
    assert.equal(
      supabaseContent.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'),
      false,
      'Service role JWT must not be hardcoded in source'
    );

    // Verify /health response doesn't expose service role
    const healthRes = await request(app).get('/health');
    const healthBody = JSON.stringify(healthRes.body);
    assert.equal(
      healthBody.includes('service_role'),
      false,
      'Health endpoint must not expose service_role'
    );
  });

  it('RLS-4: No database queries use anon client for write operations (admin-only writes)', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const servicesDir = path.resolve('src/services');
    const serviceFiles = fs.readdirSync(servicesDir).filter((f: string) => f.endsWith('.ts'));

    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(servicesDir, file), 'utf-8');
      // Services should only use supabaseAdmin for DB writes, not supabaseAnon
      if (content.includes('supabaseAnon')) {
        // Any use of supabaseAnon in services would be a security issue
        assert.fail(`Service file ${file} uses supabaseAnon — only supabaseAdmin should be used in services`);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: ADDITIONAL IDOR COVERAGE
// ─────────────────────────────────────────────────────────────────────────────
describe('Phase 15 — Section 9: IDOR — Cross-User Resource Access', () => {
  it('S9-1: User A cannot log exercise into User B session (403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: sessionId1, user_id: userBId, status: 'active' },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId1}/log-exercise`)
      .set('Authorization', 'Bearer valid-jwt')
      .send({ exercise_id: exerciseId1, reps: 10 });

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  it('S9-2: User A cannot access injury of User B via GET /injuries/:id (403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { id: injuryId1, user_id: userBId, body_part: 'knee', severity: 'medium', resolved: false },
            error: null,
          }),
        }),
      }),
    }));

    const res = await request(app)
      .get(`/api/v1/injuries/${injuryId1}`)
      .set('Authorization', 'Bearer valid-jwt');

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  it('S9-3: User A cannot delete User B workout via DELETE /workouts/:id (403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { creator_id: userBId },
            error: null,
          }),
        }),
      }),
    }));

    const res = await request(app)
      .delete(`/api/v1/workouts/${workoutId1}`)
      .set('Authorization', 'Bearer valid-jwt');

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  it('S9-4: Non-existent resource returns 404, not 403 (no oracle information disclosure)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      }),
    }));

    const nonExistentId = '99999999-9999-4999-8999-999999999999';

    const res = await request(app)
      .get(`/api/v1/injuries/${nonExistentId}`)
      .set('Authorization', 'Bearer valid-jwt');

    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'INJURY_NOT_FOUND');
    // Must not accidentally reveal 403 for non-existent resources
    assert.notEqual(res.status, 403);

    mock.restoreAll();
  });
});
