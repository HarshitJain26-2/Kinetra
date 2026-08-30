import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 7: Exercise APIs (GET /exercises, GET /exercises/:id)', () => {
  const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const exerciseId1 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const exerciseId2 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

  const mockUserAuth = {
    id: mockUserId,
    email: 'athlete@kinetra.app',
    role: 'authenticated',
  };

  const mockExercise1 = {
    id: exerciseId1,
    name: 'Barbell Squat',
    description: 'Compound lower-body exercise targeting quadriceps, hamstrings, and glutes.',
    muscle_group: 'quadriceps',
    equipment: 'barbell',
    difficulty: 'hard',
    pose_landmarks: {
      keypoints: ['left_hip', 'left_knee', 'left_ankle'],
      target_angle: 90,
      plane: 'sagittal',
    },
    demo_video_url: 'https://assets.kinetra.app/videos/squat_demo.mp4',
    created_at: '2026-08-28T00:00:00.000Z',
  };

  const mockExercise2 = {
    id: exerciseId2,
    name: 'Push-Up',
    description: 'Classic bodyweight upper body exercise targeting chest and triceps.',
    muscle_group: 'chest',
    equipment: 'bodyweight',
    difficulty: 'easy',
    pose_landmarks: {
      keypoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
      target_angle: 90,
      plane: 'transverse',
    },
    demo_video_url: 'https://assets.kinetra.app/videos/pushup_demo.mp4',
    created_at: '2026-08-28T00:00:00.000Z',
  };

  function mockAuth() {
    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: mockUserAuth },
      error: null,
    }));
  }

  // ---------------------------------------------------------------------------
  // 1. Authentication requirement tests
  // ---------------------------------------------------------------------------
  it('TEST 1: GET /api/v1/exercises without token returns 401 INVALID_TOKEN', async () => {
    const res = await request(app).get('/api/v1/exercises');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 2: GET /api/v1/exercises/:id without token returns 401 INVALID_TOKEN', async () => {
    const res = await request(app).get(`/api/v1/exercises/${exerciseId1}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  // ---------------------------------------------------------------------------
  // 2. Exercise Catalog Listing (GET /exercises)
  // ---------------------------------------------------------------------------
  it('TEST 3: GET /api/v1/exercises successfully lists exercises with standard pagination meta', async () => {
    mockAuth();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'exercises');
      return {
        select: (_fields: string, opts: any) => {
          assert.equal(opts?.count, 'exact');
          return {
            order: (sortField: string, sortOpts: any) => {
              assert.equal(sortField, 'name');
              assert.equal(sortOpts?.ascending, true);
              return {
                range: (start: number, end: number) => {
                  assert.equal(start, 0);
                  assert.equal(end, 19);
                  return Promise.resolve({
                    data: [mockExercise1, mockExercise2],
                    count: 2,
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    });

    const res = await request(app)
      .get('/api/v1/exercises')
      .set('Authorization', 'Bearer valid-jwt-token');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.data[0].name, 'Barbell Squat');
    assert.equal(res.body.data[1].name, 'Push-Up');
    assert.deepEqual(res.body.meta, {
      page: 1,
      limit: 20,
      total: 2,
    });

    mock.restoreAll();
  });

  it('TEST 4: GET /api/v1/exercises applies query filters correctly', async () => {
    mockAuth();

    let appliedMuscleGroup = '';
    let appliedDifficulty = '';
    let appliedEquipment = '';
    let appliedSearch = '';

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'exercises');
      return {
        select: () => {
          const chain: any = {
            ilike: (field: string, pattern: string) => {
              if (field === 'muscle_group') appliedMuscleGroup = pattern;
              if (field === 'equipment') appliedEquipment = pattern;
              if (field === 'name') appliedSearch = pattern;
              return chain;
            },
            eq: (field: string, val: string) => {
              if (field === 'difficulty') appliedDifficulty = val;
              return chain;
            },
            order: () => ({
              range: (start: number, end: number) => {
                assert.equal(start, 10);
                assert.equal(end, 14);
                return Promise.resolve({
                  data: [mockExercise1],
                  count: 1,
                  error: null,
                });
              },
            }),
          };
          return chain;
        },
      };
    });

    const res = await request(app)
      .get('/api/v1/exercises?muscle_group=quadriceps&difficulty=hard&equipment=barbell&search=squat&page=3&limit=5')
      .set('Authorization', 'Bearer valid-jwt-token');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(appliedMuscleGroup, '%quadriceps%');
    assert.equal(appliedDifficulty, 'hard');
    assert.equal(appliedEquipment, '%barbell%');
    assert.equal(appliedSearch, '%squat%');
    assert.deepEqual(res.body.meta, {
      page: 3,
      limit: 5,
      total: 1,
    });

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 3. Validation & Query Parameter Hardening
  // ---------------------------------------------------------------------------
  it('TEST 5: Rejects invalid difficulty enum with 422 VALIDATION_ERROR', async () => {
    mockAuth();

    const res = await request(app)
      .get('/api/v1/exercises?difficulty=extreme')
      .set('Authorization', 'Bearer valid-jwt-token');

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('TEST 6: Rejects negative or invalid page/limit with 422 VALIDATION_ERROR', async () => {
    mockAuth();

    const resZeroPage = await request(app)
      .get('/api/v1/exercises?page=0')
      .set('Authorization', 'Bearer valid-jwt-token');
    assert.equal(resZeroPage.status, 422);
    assert.equal(resZeroPage.body.error.code, 'VALIDATION_ERROR');

    const resExcessiveLimit = await request(app)
      .get('/api/v1/exercises?limit=500')
      .set('Authorization', 'Bearer valid-jwt-token');
    assert.equal(resExcessiveLimit.status, 422);
    assert.equal(resExcessiveLimit.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 4. Single Exercise Retrieval (GET /exercises/:id)
  // ---------------------------------------------------------------------------
  it('TEST 7: GET /api/v1/exercises/:id returns full exercise details including pose_landmarks and description', async () => {
    mockAuth();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'exercises');
      return {
        select: () => ({
          eq: (field: string, val: string) => {
            assert.equal(field, 'id');
            assert.equal(val, exerciseId1);
            return {
              single: async () => ({ data: mockExercise1, error: null }),
            };
          },
        }),
      };
    });

    const res = await request(app)
      .get(`/api/v1/exercises/${exerciseId1}`)
      .set('Authorization', 'Bearer valid-jwt-token');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, exerciseId1);
    assert.equal(res.body.data.name, 'Barbell Squat');
    assert.equal(res.body.data.description, mockExercise1.description);
    assert.equal(res.body.data.muscle_group, 'quadriceps');
    assert.equal(res.body.data.equipment, 'barbell');
    assert.equal(res.body.data.difficulty, 'hard');
    assert.deepEqual(res.body.data.pose_landmarks, mockExercise1.pose_landmarks);
    assert.equal(res.body.data.demo_video_url, mockExercise1.demo_video_url);

    mock.restoreAll();
  });

  it('TEST 8: GET /api/v1/exercises/:id with non-existent UUID returns 404 EXERCISE_NOT_FOUND', async () => {
    mockAuth();

    const nonExistentId = '99999999-9999-4999-8999-999999999999';

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'exercises');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Row not found' } }),
          }),
        }),
      };
    });

    const res = await request(app)
      .get(`/api/v1/exercises/${nonExistentId}`)
      .set('Authorization', 'Bearer valid-jwt-token');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'EXERCISE_NOT_FOUND');
    assert.equal(res.body.error.message, 'Exercise not found');

    mock.restoreAll();
  });

  it('TEST 9: GET /api/v1/exercises/:id with invalid UUID returns 422 VALIDATION_ERROR', async () => {
    mockAuth();

    const res = await request(app)
      .get('/api/v1/exercises/not-a-valid-uuid')
      .set('Authorization', 'Bearer valid-jwt-token');

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 5. Read-Only Catalog Guard (No user-level mutation routes exist)
  // ---------------------------------------------------------------------------
  it('TEST 10: Exercises catalog is read-only — POST /exercises returns 404', async () => {
    mockAuth();

    const res = await request(app)
      .post('/api/v1/exercises')
      .set('Authorization', 'Bearer valid-jwt-token')
      .send({
        name: 'Unauthorized Custom Exercise',
        muscle_group: 'chest',
      });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NOT_FOUND');

    mock.restoreAll();
  });
});
