import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 9: Session APIs (/api/v1/sessions)', () => {
  const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userBId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const sessionId1 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
  const sessionId2 = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
  const workoutId1 = '11111111-9c0b-4ef8-bb6d-6bb9bd380a11';
  const workoutId2Private = '22222222-9c0b-4ef8-bb6d-6bb9bd380a22';
  const exerciseId1 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  const userAAuth = {
    id: userAId,
    email: 'userA@kinetra.app',
    role: 'authenticated',
  };

  const mockActiveSessionUserA = {
    id: sessionId1,
    user_id: userAId,
    workout_id: workoutId1,
    status: 'active',
    started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    ended_at: null,
    duration_sec: null,
    calories_est: null,
    notes: null,
  };

  const mockSessionUserBPrivate = {
    id: sessionId2,
    user_id: userBId,
    workout_id: null,
    status: 'active',
    started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ended_at: null,
    duration_sec: null,
    calories_est: null,
    notes: null,
  };

  const mockLoggedExercise = {
    id: '33333333-9c0b-4ef8-bb6d-6bb9bd380a33',
    session_id: sessionId1,
    exercise_id: exerciseId1,
    set_number: 1,
    reps: 12,
    weight_kg: 50.0,
    duration_sec: null,
    form_score: 88.5,
    injury_flag: false,
    feedback: null,
    recorded_at: new Date().toISOString(),
    exercise: {
      id: exerciseId1,
      name: 'Barbell Squat',
    },
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
  it('TEST 1: Unauthenticated requests to session endpoints return 401 INVALID_TOKEN', async () => {
    const resStart = await request(app).post('/api/v1/sessions/start').send({});
    assert.equal(resStart.status, 401);
    assert.equal(resStart.body.error.code, 'INVALID_TOKEN');

    const resLog = await request(app).post(`/api/v1/sessions/${sessionId1}/log-exercise`).send({});
    assert.equal(resLog.status, 401);

    const resEnd = await request(app).post(`/api/v1/sessions/${sessionId1}/end`).send({});
    assert.equal(resEnd.status, 401);

    const resList = await request(app).get('/api/v1/sessions');
    assert.equal(resList.status, 401);

    const resGet = await request(app).get(`/api/v1/sessions/${sessionId1}`);
    assert.equal(resGet.status, 401);
  });

  // ---------------------------------------------------------------------------
  // 2. Start Session (POST /sessions/start)
  // ---------------------------------------------------------------------------
  it('TEST 2: Authenticated user can start a new freestyle session', async () => {
    mockAuthUserA();

    let insertedSession: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'sessions');
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }), // no active session
            }),
          }),
        }),
        insert: (data: any) => {
          insertedSession = data;
          assert.equal(data.user_id, userAId);
          assert.equal(data.status, 'active');
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
    });

    const res = await request(app)
      .post('/api/v1/sessions/start')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({});

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, sessionId1);
    assert.equal(res.body.data.user_id, userAId);
    assert.equal(res.body.data.status, 'active');
    assert.equal(insertedSession.user_id, userAId);

    mock.restoreAll();
  });

  it('TEST 3: Starting a session when another active session exists returns 400 SESSION_ALREADY_ACTIVE', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: sessionId1 }, error: null }),
          }),
        }),
      }),
    }));

    const res = await request(app)
      .post('/api/v1/sessions/start')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'SESSION_ALREADY_ACTIVE');

    mock.restoreAll();
  });

  it('TEST 4: Starting a session with another user\'s private workout returns 403 FORBIDDEN', async () => {
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
        };
      }
      if (table === 'workouts') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: workoutId2Private, creator_id: userBId, is_public: false },
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
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ workout_id: workoutId2Private });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 3. Manual Exercise Logging (POST /sessions/:id/log-exercise)
  // ---------------------------------------------------------------------------
  it('TEST 5: Authenticated owner can log an exercise set on an active session', async () => {
    mockAuthUserA();

    let insertedSet: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockActiveSessionUserA, error: null }),
            }),
          }),
        };
      }
      if (table === 'exercises') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { id: exerciseId1 }, error: null }),
            }),
          }),
        };
      }
      if (table === 'session_exercises') {
        return {
          insert: (data: any) => {
            insertedSet = data;
            return {
              select: () => ({
                single: async () => ({ data: { ...mockLoggedExercise, ...data }, error: null }),
              }),
            };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId1}/log-exercise`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        exercise_id: exerciseId1,
        set_number: 1,
        reps: 12,
        weight_kg: 50.0,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.exercise_id, exerciseId1);
    assert.equal(res.body.data.reps, 12);
    assert.equal(insertedSet.session_id, sessionId1);
    assert.equal(insertedSet.exercise_id, exerciseId1);

    mock.restoreAll();
  });

  it('TEST 6: Logging exercise on another user\'s session returns 403 FORBIDDEN', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockSessionUserBPrivate, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId2}/log-exercise`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        exercise_id: exerciseId1,
        set_number: 1,
        reps: 10,
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 4. End Session (POST /sessions/:id/end)
  // ---------------------------------------------------------------------------
  it('TEST 7: Ending active session computes duration, calories, and summary metrics', async () => {
    mockAuthUserA();

    let updatedSessionData: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockActiveSessionUserA, error: null }),
            }),
          }),
          update: (data: any) => {
            updatedSessionData = data;
            return {
              eq: () => ({
                select: () => ({
                  single: async () => ({
                    data: { ...mockActiveSessionUserA, ...data },
                    error: null,
                  }),
                }),
              }),
            };
          },
        };
      }

      if (table === 'session_exercises') {
        return {
          select: () => ({
            eq: () => Promise.resolve({
              data: [
                { reps: 10, form_score: 90.0, injury_flag: false },
                { reps: 12, form_score: 80.0, injury_flag: true },
              ],
              error: null,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId1}/end`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ notes: 'Felt great, pushed hard.' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'completed');
    assert.ok(res.body.data.duration_sec > 0);
    assert.ok(res.body.data.calories_est > 0);
    assert.equal(res.body.data.notes, 'Felt great, pushed hard.');
    assert.deepEqual(res.body.data.summary, {
      total_sets: 2,
      total_reps: 22,
      avg_form_score: 85.0,
      injury_flags_raised: 1,
    });
    assert.equal(updatedSessionData.status, 'completed');

    mock.restoreAll();
  });

  it('TEST 8: Ending an already ended/inactive session returns 400 SESSION_NOT_ACTIVE', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { ...mockActiveSessionUserA, status: 'completed' },
            error: null,
          }),
        }),
      }),
    }));

    const res = await request(app)
      .post(`/api/v1/sessions/${sessionId1}/end`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'SESSION_NOT_ACTIVE');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 5. Listing Sessions (GET /sessions)
  // ---------------------------------------------------------------------------
  it('TEST 9: Listing sessions applies database-level user isolation and pagination', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'sessions');
      return {
        select: (_fields: string, opts: any) => {
          assert.equal(opts?.count, 'exact');
          return {
            eq: (field: string, val: string) => {
              assert.equal(field, 'user_id');
              assert.equal(val, userAId);
              return {
                order: () => ({
                  range: (start: number, end: number) => {
                    assert.equal(start, 0);
                    assert.equal(end, 19);
                    return Promise.resolve({
                      data: [mockActiveSessionUserA],
                      count: 1,
                      error: null,
                    });
                  },
                }),
              };
            },
          };
        },
      };
    });

    const res = await request(app)
      .get('/api/v1/sessions')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].user_id, userAId);
    assert.deepEqual(res.body.meta, { page: 1, limit: 20, total: 1 });

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 6. Single Session Retrieval (GET /sessions/:id)
  // ---------------------------------------------------------------------------
  it('TEST 10: Authenticated user retrieves own single session with logged exercises', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: (_field: string, val: string) => {
              assert.equal(val, sessionId1);
              return {
                single: async () => ({ data: mockActiveSessionUserA, error: null }),
              };
            },
          }),
        };
      }

      if (table === 'session_exercises') {
        return {
          select: () => ({
            eq: (_field: string, val: string) => {
              assert.equal(val, sessionId1);
              return {
                order: () => Promise.resolve({
                  data: [mockLoggedExercise],
                  error: null,
                }),
              };
            },
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .get(`/api/v1/sessions/${sessionId1}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, sessionId1);
    assert.equal(res.body.data.exercises.length, 1);
    assert.equal(res.body.data.exercises[0].exercise.name, 'Barbell Squat');

    mock.restoreAll();
  });

  it('TEST 11: User A cannot retrieve User B\'s session (returns 403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockSessionUserBPrivate, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .get(`/api/v1/sessions/${sessionId2}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 7. Validation & UUID Error Handling
  // ---------------------------------------------------------------------------
  it('TEST 12: Invalid session UUID returns 422 VALIDATION_ERROR', async () => {
    mockAuthUserA();

    const res = await request(app)
      .get('/api/v1/sessions/invalid-session-uuid')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('TEST 13: Non-existent session returns 404 SESSION_NOT_FOUND', async () => {
    mockAuthUserA();

    const nonExistentId = '99999999-9999-4999-8999-999999999999';

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Row not found' } }),
        }),
      }),
    }));

    const res = await request(app)
      .get(`/api/v1/sessions/${nonExistentId}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'SESSION_NOT_FOUND');

    mock.restoreAll();
  });
});
