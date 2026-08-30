import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 8: Workout APIs (/api/v1/workouts)', () => {
  const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userBId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const workout1Id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
  const workout2Id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
  const exerciseId1 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const exerciseId2 = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';

  const userAAuth = {
    id: userAId,
    email: 'userA@kinetra.app',
    role: 'authenticated',
  };

  const userBAuth = {
    id: userBId,
    email: 'userB@kinetra.app',
    role: 'authenticated',
  };

  const mockWorkoutUserA = {
    id: workout1Id,
    creator_id: userAId,
    title: 'Leg Day Blast',
    description: 'Heavy quad and hamstring focus',
    category: 'strength',
    difficulty: 'hard',
    is_public: false,
    created_at: '2026-08-29T10:00:00.000Z',
    updated_at: '2026-08-29T10:00:00.000Z',
  };

  const mockWorkoutUserBPrivate = {
    id: workout2Id,
    creator_id: userBId,
    title: 'Secret Endurance Routine',
    description: 'Private routine',
    category: 'cardio',
    difficulty: 'medium',
    is_public: false,
    created_at: '2026-08-29T11:00:00.000Z',
    updated_at: '2026-08-29T11:00:00.000Z',
  };

  const mockWorkoutExercise1 = {
    id: '11111111-9c0b-4ef8-bb6d-6bb9bd380a11',
    workout_id: workout1Id,
    exercise_id: exerciseId1,
    order_index: 0,
    target_sets: 4,
    target_reps: 10,
    target_weight_kg: 80.0,
    exercise: {
      id: exerciseId1,
      name: 'Barbell Squat',
      muscle_group: 'quadriceps',
    },
  };

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

  // ---------------------------------------------------------------------------
  // 1. Authentication requirement tests
  // ---------------------------------------------------------------------------
  it('TEST 1: Unauthenticated GET /api/v1/workouts returns 401 INVALID_TOKEN', async () => {
    const res = await request(app).get('/api/v1/workouts');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 2: Unauthenticated POST /api/v1/workouts returns 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .post('/api/v1/workouts')
      .send({ title: 'Unauthorized Workout' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  // ---------------------------------------------------------------------------
  // 2. Workout Creation & Ownership Assignment (POST /workouts)
  // ---------------------------------------------------------------------------
  it('TEST 3: Authenticated user can create own workout with nested exercises', async () => {
    mockAuthUserA();

    let insertedWorkoutRecord: any = null;
    let insertedExerciseRecords: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'exercises') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ id: exerciseId1 }],
              error: null,
            }),
          }),
        };
      }

      if (table === 'workouts') {
        return {
          insert: (data: any) => {
            insertedWorkoutRecord = data;
            assert.equal(data.creator_id, userAId);
            assert.equal(data.title, 'Leg Day Blast');
            return {
              select: () => ({
                single: async () => ({
                  data: { id: workout1Id, ...data, created_at: '2026-08-29T10:00:00.000Z', updated_at: '2026-08-29T10:00:00.000Z' },
                  error: null,
                }),
              }),
            };
          },
        };
      }

      if (table === 'workout_exercises') {
        return {
          insert: (data: any) => {
            insertedExerciseRecords = data;
            return {
              select: () => Promise.resolve({
                data: [mockWorkoutExercise1],
                error: null,
              }),
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        title: 'Leg Day Blast',
        description: 'Heavy quad and hamstring focus',
        category: 'strength',
        difficulty: 'hard',
        is_public: false,
        exercises: [
          {
            exercise_id: exerciseId1,
            order_index: 0,
            target_sets: 4,
            target_reps: 10,
            target_weight_kg: 80.0,
          },
        ],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, workout1Id);
    assert.equal(res.body.data.creator_id, userAId);
    assert.equal(res.body.data.title, 'Leg Day Blast');
    assert.equal(res.body.data.exercises.length, 1);
    assert.equal(insertedWorkoutRecord.creator_id, userAId);
    assert.equal(insertedExerciseRecords.length, 1);

    mock.restoreAll();
  });

  it('TEST 4: User cannot spoof ownership via creator_id or user_id in request body', async () => {
    mockAuthUserA();

    // Body with creator_id/user_id must fail strict validation
    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        title: 'Spoofed Workout',
        creator_id: userBId,
        user_id: userBId,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('TEST 5: Non-existent exercise UUID cannot be attached to a workout', async () => {
    mockAuthUserA();

    const nonExistentExerciseId = '99999999-9999-4999-8999-999999999999';

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'exercises') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [], // exercise does not exist
              error: null,
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        title: 'Workout with Fake Exercise',
        exercises: [
          {
            exercise_id: nonExistentExerciseId,
            order_index: 0,
            target_sets: 3,
          },
        ],
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 3. Listing Workouts (GET /workouts)
  // ---------------------------------------------------------------------------
  it('TEST 6: Authenticated user lists workouts with database-level ownership filter', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'workouts');
      return {
        select: (_fields: string, opts: any) => {
          assert.equal(opts?.count, 'exact');
          return {
            or: (orFilter: string) => {
              assert.equal(orFilter, `creator_id.eq.${userAId},is_public.eq.true`);
              return {
                order: () => ({
                  range: () => Promise.resolve({
                    data: [{ ...mockWorkoutUserA, exercises: [mockWorkoutExercise1] }],
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
      .get('/api/v1/workouts')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].creator_id, userAId);
    assert.deepEqual(res.body.meta, { page: 1, limit: 20, total: 1 });

    mock.restoreAll();
  });

  it('TEST 7: GET /api/v1/workouts?mine=true filters strictly by user creator_id', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'workouts');
      return {
        select: () => ({
          eq: (field: string, val: string) => {
            assert.equal(field, 'creator_id');
            assert.equal(val, userAId);
            return {
              order: () => ({
                range: () => Promise.resolve({
                  data: [{ ...mockWorkoutUserA, exercises: [] }],
                  count: 1,
                  error: null,
                }),
              }),
            };
          },
        }),
      };
    });

    const res = await request(app)
      .get('/api/v1/workouts?mine=true')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 1);

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 4. Single Workout Retrieval & Privacy (GET /workouts/:id)
  // ---------------------------------------------------------------------------
  it('TEST 8: Authenticated user retrieves own workout with full nested exercise details', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'workouts') {
        return {
          select: () => ({
            eq: (_field: string, val: string) => {
              assert.equal(val, workout1Id);
              return {
                single: async () => ({ data: mockWorkoutUserA, error: null }),
              };
            },
          }),
        };
      }

      if (table === 'workout_exercises') {
        return {
          select: () => ({
            eq: (_field: string, val: string) => {
              assert.equal(val, workout1Id);
              return {
                order: () => Promise.resolve({
                  data: [mockWorkoutExercise1],
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
      .get(`/api/v1/workouts/${workout1Id}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, workout1Id);
    assert.equal(res.body.data.title, 'Leg Day Blast');
    assert.equal(res.body.data.exercises.length, 1);
    assert.equal(res.body.data.exercises[0].exercise.name, 'Barbell Squat');

    mock.restoreAll();
  });

  it('TEST 9: User A cannot retrieve User B private workout (returns 403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'workouts') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockWorkoutUserBPrivate, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .get(`/api/v1/workouts/${workout2Id}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 5. Update Workout & Exercise Replacement (PUT /workouts/:id)
  // ---------------------------------------------------------------------------
  it('TEST 10: Owner can update workout metadata and replace nested exercises', async () => {
    mockAuthUserA();

    let updatedFields: any = null;
    let deletedOldExercises = false;
    let insertedNewExercises: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'exercises') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ id: exerciseId2 }],
              error: null,
            }),
          }),
        };
      }

      if (table === 'workouts') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockWorkoutUserA, error: null }),
            }),
          }),
          update: (data: any) => {
            updatedFields = data;
            return {
              eq: () => Promise.resolve({ error: null }),
            };
          },
        };
      }

      if (table === 'workout_exercises') {
        return {
          delete: () => {
            deletedOldExercises = true;
            return {
              eq: () => Promise.resolve({ error: null }),
            };
          },
          insert: (data: any) => {
            insertedNewExercises = data;
            return Promise.resolve({ error: null });
          },
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({
                data: [
                  {
                    id: '22222222-9c0b-4ef8-bb6d-6bb9bd380a22',
                    workout_id: workout1Id,
                    exercise_id: exerciseId2,
                    order_index: 0,
                    target_sets: 3,
                    target_reps: 15,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .put(`/api/v1/workouts/${workout1Id}`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        title: 'Updated Leg Routine',
        difficulty: 'medium',
        exercises: [
          {
            exercise_id: exerciseId2,
            order_index: 0,
            target_sets: 3,
            target_reps: 15,
          },
        ],
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(updatedFields.title, 'Updated Leg Routine');
    assert.equal(updatedFields.difficulty, 'medium');
    assert.equal(deletedOldExercises, true);
    assert.equal(insertedNewExercises.length, 1);

    mock.restoreAll();
  });

  it('TEST 11: User A cannot update User B workout (returns 403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'workouts') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockWorkoutUserBPrivate, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .put(`/api/v1/workouts/${workout2Id}`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ title: 'Hacked Title' });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 6. Delete Workout (DELETE /workouts/:id)
  // ---------------------------------------------------------------------------
  it('TEST 12: Owner can delete own workout (returns 204)', async () => {
    mockAuthUserA();

    let deletedWorkoutId = '';

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'workouts');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: mockWorkoutUserA, error: null }),
          }),
        }),
        delete: () => ({
          eq: (_field: string, val: string) => {
            deletedWorkoutId = val;
            return Promise.resolve({ error: null });
          },
        }),
      };
    });

    const res = await request(app)
      .delete(`/api/v1/workouts/${workout1Id}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 204);
    assert.equal(deletedWorkoutId, workout1Id);

    mock.restoreAll();
  });

  it('TEST 13: User A cannot delete User B workout (returns 403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'workouts');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: mockWorkoutUserBPrivate, error: null }),
          }),
        }),
      };
    });

    const res = await request(app)
      .delete(`/api/v1/workouts/${workout2Id}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 7. Validation & Error Handling
  // ---------------------------------------------------------------------------
  it('TEST 14: Non-existent workout returns 404 WORKOUT_NOT_FOUND', async () => {
    mockAuthUserA();

    const nonExistentId = '99999999-9999-4999-8999-999999999999';

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'workouts');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Row not found' } }),
          }),
        }),
      };
    });

    const res = await request(app)
      .get(`/api/v1/workouts/${nonExistentId}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'WORKOUT_NOT_FOUND');

    mock.restoreAll();
  });

  it('TEST 15: Invalid workout UUID returns 422 VALIDATION_ERROR', async () => {
    mockAuthUserA();

    const res = await request(app)
      .get('/api/v1/workouts/invalid-uuid-format')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });
});
