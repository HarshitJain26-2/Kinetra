import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';
import { calculateJointAngle, ExerciseRepCounter } from '../src/utils/geometry.js';

describe('Phase 10: Pose Analysis, Rep Counting & Form Scoring', () => {
  const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userBId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const sessionId1 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
  const sessionId2 = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
  const exerciseId1 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const sessionExerciseId1 = '55555555-9c0b-4ef8-bb6d-6bb9bd380a55';
  const injuryFlagId1 = '66666666-9c0b-4ef8-bb6d-6bb9bd380a66';

  const userAAuth = {
    id: userAId,
    email: 'userA@kinetra.app',
    role: 'authenticated',
  };

  const mockActiveSessionUserA = {
    id: sessionId1,
    user_id: userAId,
    status: 'active',
  };

  const mockSessionUserB = {
    id: sessionId2,
    user_id: userBId,
    status: 'active',
  };

  function mockAuthUserA() {
    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: userAAuth },
      error: null,
    }));
  }

  // ---------------------------------------------------------------------------
  // 1. Joint Angle Geometry & State Machine Unit Tests
  // ---------------------------------------------------------------------------
  it('TEST 1: calculateJointAngle accurately computes standard angles (90° and 180°)', () => {
    // 90-degree right angle (e.g. (0,1) -> (0,0) -> (1,0))
    const pA = { x: 0, y: 1 };
    const pB = { x: 0, y: 0 };
    const pC = { x: 1, y: 0 };
    const angle90 = calculateJointAngle(pA, pB, pC);
    assert.equal(angle90, 90.0);

    // 180-degree straight line (e.g. (-1,0) -> (0,0) -> (1,0))
    const pStraightA = { x: -1, y: 0 };
    const pStraightB = { x: 0, y: 0 };
    const pStraightC = { x: 1, y: 0 };
    const angle180 = calculateJointAngle(pStraightA, pStraightB, pStraightC);
    assert.equal(angle180, 180.0);
  });

  it('TEST 2: calculateJointAngle handles zero-length vectors and invalid coordinates safely without crashing', () => {
    const pOrigin = { x: 0, y: 0 };
    assert.equal(calculateJointAngle(pOrigin, pOrigin, pOrigin), 0);
    assert.equal(calculateJointAngle(null as any, pOrigin, pOrigin), 0);
    assert.equal(calculateJointAngle({ x: NaN, y: 0 }, pOrigin, { x: 1, y: 0 }), 0);
  });

  it('TEST 3: ExerciseRepCounter correctly counts completed reps and computes bounded form scores', () => {
    // Squat: Rest at 160°, target depth at 90°
    const counter = new ExerciseRepCounter({ restAngle: 160, targetAngle: 90 });

    // Step 1: Standing rest position
    counter.processSample(165);
    assert.equal(counter.getCount(), 0);

    // Step 2: Descending into squat
    counter.processSample(135);
    counter.processSample(110);
    assert.equal(counter.getCount(), 0);

    // Step 3: Inflection point at parallel depth (90°)
    counter.processSample(90);
    assert.equal(counter.getCount(), 0);

    // Step 4: Ascending back up
    counter.processSample(125);
    counter.processSample(145);
    assert.equal(counter.getCount(), 0);

    // Step 5: Full lockout return to rest
    const result = counter.processSample(160);
    assert.equal(result.count, 1);
    assert.equal(counter.getCount(), 1);
    assert.equal(result.completedRepScore, 100); // Hit target 90° exactly -> score 100
    assert.equal(counter.getAverageFormScore(), 100);
  });

  it('TEST 4: Incomplete movement does not increment rep count', () => {
    const counter = new ExerciseRepCounter({ restAngle: 160, targetAngle: 90 });

    // Half squat (stops at 130°, never reaches <= 100° inflection)
    counter.processSample(160);
    counter.processSample(140);
    counter.processSample(130);
    counter.processSample(145);
    counter.processSample(160);

    assert.equal(counter.getCount(), 0);
  });

  it('TEST 5: Static or jittery duplicate frames do not trigger multiple counts', () => {
    const counter = new ExerciseRepCounter({ restAngle: 160, targetAngle: 90 });

    // Multiple identical resting frames
    for (let i = 0; i < 20; i++) {
      counter.processSample(160);
    }
    assert.equal(counter.getCount(), 0);
  });

  // ---------------------------------------------------------------------------
  // 2. Authentication & Authorization HTTP Endpoint Tests
  // ---------------------------------------------------------------------------
  it('TEST 6: Unauthenticated POST /api/v1/pose-analysis returns 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .send({ session_id: sessionId1, exercise_id: exerciseId1, reps: 10, form_score: 90 });

    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 7: Authenticated user can submit valid set analysis with form feedback', async () => {
    mockAuthUserA();

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
              single: async () => ({ data: { name: 'Barbell Squat' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'session_exercises') {
        return {
          insert: (data: any) => {
            assert.equal(data.session_id, sessionId1);
            assert.equal(data.reps, 12);
            assert.equal(data.form_score, 92.5);
            return {
              select: () => ({
                single: async () => ({
                  data: { id: sessionExerciseId1, ...data },
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
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        session_id: sessionId1,
        exercise_id: exerciseId1,
        set_number: 1,
        reps: 12,
        weight_kg: 60.0,
        duration_sec: 40,
        form_score: 92.5,
        injury_flag: false,
        flagged_body_parts: [],
        rep_scores: [90.0, 92.5, 95.0],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.session_exercise_id, sessionExerciseId1);
    assert.equal(res.body.data.form_score, 92.5);
    assert.equal(res.body.data.injury_flag, false);
    assert.ok(res.body.data.feedback.includes('Barbell Squat'));

    mock.restoreAll();
  });

  it('TEST 8: Submitting set analysis with injury flag auto-creates injury_flags entry', async () => {
    mockAuthUserA();

    let createdInjuryFlag: any = null;

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
              single: async () => ({ data: { name: 'Barbell Squat' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'session_exercises') {
        return {
          insert: (data: any) => ({
            select: () => ({
              single: async () => ({
                data: { id: sessionExerciseId1, ...data },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'injury_flags') {
        return {
          insert: (data: any) => {
            createdInjuryFlag = data;
            assert.equal(data.user_id, userAId);
            assert.equal(data.body_part, 'left_knee');
            assert.equal(data.session_exercise_id, sessionExerciseId1);
            return {
              select: () => ({
                single: async () => ({
                  data: { id: injuryFlagId1 },
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
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        session_id: sessionId1,
        exercise_id: exerciseId1,
        set_number: 2,
        reps: 8,
        form_score: 65.0,
        injury_flag: true,
        flagged_body_parts: ['left_knee'],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.injury_flag, true);
    assert.equal(res.body.data.injury_flag_id, injuryFlagId1);
    assert.equal(createdInjuryFlag.body_part, 'left_knee');

    mock.restoreAll();
  });

  it('TEST 9: User A cannot submit pose analysis into User B\'s session (returns 403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockSessionUserB, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        session_id: sessionId2,
        exercise_id: exerciseId1,
        reps: 10,
        form_score: 85.0,
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  it('TEST 10: Inactive/completed session rejects pose analysis with 400 SESSION_NOT_ACTIVE', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { ...mockActiveSessionUserA, status: 'completed' },
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
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        session_id: sessionId1,
        exercise_id: exerciseId1,
        reps: 10,
        form_score: 85.0,
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'SESSION_NOT_ACTIVE');

    mock.restoreAll();
  });

  it('TEST 11: Non-existent exercise returns 404 EXERCISE_NOT_FOUND', async () => {
    mockAuthUserA();

    const nonExistentExerciseId = '99999999-9999-4999-8999-999999999999';

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
              single: async () => ({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        session_id: sessionId1,
        exercise_id: nonExistentExerciseId,
        reps: 10,
        form_score: 85.0,
      });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'EXERCISE_NOT_FOUND');

    mock.restoreAll();
  });
});
