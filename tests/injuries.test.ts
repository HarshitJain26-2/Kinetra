import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 11: Injury APIs (/api/v1/injuries)', () => {
  const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userBId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const injuryId1 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
  const injuryId2 = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
  const sessionExerciseId1 = '55555555-9c0b-4ef8-bb6d-6bb9bd380a55';

  const userAAuth = {
    id: userAId,
    email: 'userA@kinetra.app',
    role: 'authenticated',
  };

  const mockInjuryUserA = {
    id: injuryId1,
    user_id: userAId,
    session_exercise_id: sessionExerciseId1,
    body_part: 'left_knee',
    severity: 'medium',
    description: 'Knee valgus detected during squat',
    source: 'ai',
    resolved: false,
    flagged_at: '2026-08-29T10:00:00.000Z',
    resolved_at: null,
  };

  const mockInjuryUserB = {
    id: injuryId2,
    user_id: userBId,
    session_exercise_id: null,
    body_part: 'lower_back',
    severity: 'high',
    description: 'Spinal flexion under load',
    source: 'ai',
    resolved: false,
    flagged_at: '2026-08-29T11:00:00.000Z',
    resolved_at: null,
  };

  function mockAuthUserA() {
    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: userAAuth },
      error: null,
    }));
  }

  // ---------------------------------------------------------------------------
  // 1. Authentication requirement tests
  // ---------------------------------------------------------------------------
  it('TEST 1: Unauthenticated GET /api/v1/injuries returns 401 INVALID_TOKEN', async () => {
    const res = await request(app).get('/api/v1/injuries');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 2: Unauthenticated GET /api/v1/injuries/:id returns 401 INVALID_TOKEN', async () => {
    const res = await request(app).get(`/api/v1/injuries/${injuryId1}`);
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 3: Unauthenticated PATCH /api/v1/injuries/:id returns 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .patch(`/api/v1/injuries/${injuryId1}`)
      .send({ resolved: true });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  // ---------------------------------------------------------------------------
  // 2. Listing Injuries (GET /injuries)
  // ---------------------------------------------------------------------------
  it('TEST 4: Authenticated user can list own injuries with database-level ownership filter', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'injury_flags');
      return {
        select: (_fields: string, opts: any) => {
          assert.equal(opts?.count, 'exact');
          return {
            eq: (field: string, val: string) => {
              assert.equal(field, 'user_id');
              assert.equal(val, userAId);
              return {
                order: () => ({
                  range: () => Promise.resolve({
                    data: [mockInjuryUserA],
                    count: 1,
                    error: null,
                  }),
                }),
              };
            },
          };
        },
      };
    });

    const res = await request(app)
      .get('/api/v1/injuries')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].user_id, userAId);
    assert.equal(res.body.data[0].body_part, 'left_knee');
    assert.deepEqual(res.body.meta, { page: 1, limit: 20, total: 1 });

    mock.restoreAll();
  });

  it('TEST 5: Listing injuries supports status and severity query filters', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'injury_flags');
      return {
        select: () => ({
          eq: (field1: string, val1: any) => {
            assert.equal(field1, 'user_id');
            assert.equal(val1, userAId);
            return {
              eq: (field2: string, val2: any) => {
                assert.equal(field2, 'resolved');
                assert.equal(val2, false);
                return {
                  eq: (field3: string, val3: any) => {
                    assert.equal(field3, 'severity');
                    assert.equal(val3, 'medium');
                    return {
                      order: () => ({
                        range: () => Promise.resolve({
                          data: [mockInjuryUserA],
                          count: 1,
                          error: null,
                        }),
                      }),
                    };
                  },
                };
              },
            };
          },
        }),
      };
    });

    const res = await request(app)
      .get('/api/v1/injuries?resolved=false&severity=medium')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 1);

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 3. Single Injury Retrieval (GET /injuries/:id)
  // ---------------------------------------------------------------------------
  it('TEST 6: Authenticated user can retrieve own single injury flag', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'injury_flags');
      return {
        select: () => ({
          eq: (_field: string, val: string) => {
            assert.equal(val, injuryId1);
            return {
              single: async () => ({ data: mockInjuryUserA, error: null }),
            };
          },
        }),
      };
    });

    const res = await request(app)
      .get(`/api/v1/injuries/${injuryId1}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, injuryId1);
    assert.equal(res.body.data.body_part, 'left_knee');

    mock.restoreAll();
  });

  it('TEST 7: User A cannot retrieve User B\'s injury flag (returns 403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'injury_flags');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: mockInjuryUserB, error: null }),
          }),
        }),
      };
    });

    const res = await request(app)
      .get(`/api/v1/injuries/${injuryId2}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 4. Update Injury Flag (PATCH /injuries/:id)
  // ---------------------------------------------------------------------------
  it('TEST 8: Owner can mark injury flag as resolved (sets resolved_at)', async () => {
    mockAuthUserA();

    let updatedPayload: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'injury_flags');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: mockInjuryUserA, error: null }),
          }),
        }),
        update: (data: any) => {
          updatedPayload = data;
          return {
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: { ...mockInjuryUserA, ...data },
                  error: null,
                }),
              }),
            }),
          };
        },
      };
    });

    const res = await request(app)
      .patch(`/api/v1/injuries/${injuryId1}`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ resolved: true });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.resolved, true);
    assert.ok(res.body.data.resolved_at);
    assert.equal(updatedPayload.resolved, true);
    assert.ok(updatedPayload.resolved_at);

    mock.restoreAll();
  });

  it('TEST 9: Owner can update injury severity (e.g. low/medium/high)', async () => {
    mockAuthUserA();

    let updatedPayload: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'injury_flags');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: mockInjuryUserA, error: null }),
          }),
        }),
        update: (data: any) => {
          updatedPayload = data;
          return {
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: { ...mockInjuryUserA, ...data },
                  error: null,
                }),
              }),
            }),
          };
        },
      };
    });

    const res = await request(app)
      .patch(`/api/v1/injuries/${injuryId1}`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ severity: 'low' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.severity, 'low');
    assert.equal(updatedPayload.severity, 'low');

    mock.restoreAll();
  });

  it('TEST 10: User A cannot PATCH User B\'s injury flag (returns 403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'injury_flags');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: mockInjuryUserB, error: null }),
          }),
        }),
      };
    });

    const res = await request(app)
      .patch(`/api/v1/injuries/${injuryId2}`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ resolved: true });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 5. Validation & Error Handling
  // ---------------------------------------------------------------------------
  it('TEST 11: Non-existent injury returns 404 INJURY_NOT_FOUND', async () => {
    mockAuthUserA();

    const nonExistentId = '99999999-9999-4999-8999-999999999999';

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Not found' } }),
        }),
      }),
    }));

    const res = await request(app)
      .get(`/api/v1/injuries/${nonExistentId}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INJURY_NOT_FOUND');

    mock.restoreAll();
  });

  it('TEST 12: Invalid injury UUID returns 422 VALIDATION_ERROR', async () => {
    mockAuthUserA();

    const res = await request(app)
      .get('/api/v1/injuries/invalid-uuid-string')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('TEST 13: Empty PATCH body or unknown fields return 422 VALIDATION_ERROR', async () => {
    mockAuthUserA();

    const resEmpty = await request(app)
      .patch(`/api/v1/injuries/${injuryId1}`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({});

    assert.equal(resEmpty.status, 422);
    assert.equal(resEmpty.body.error.code, 'VALIDATION_ERROR');

    const resSpoof = await request(app)
      .patch(`/api/v1/injuries/${injuryId1}`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ user_id: userBId, resolved: true });

    assert.equal(resSpoof.status, 422);
    assert.equal(resSpoof.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });
});
