import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 13: Database Safety, RLS & Security Audit', () => {
  const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userBId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const workoutIdB = '11111111-9c0b-4ef8-bb6d-6bb9bd380a11';
  const sessionIdB = '22222222-9c0b-4ef8-bb6d-6bb9bd380a22';
  const injuryIdB = '33333333-9c0b-4ef8-bb6d-6bb9bd380a33';

  const userAAuth = {
    id: userAId,
    email: 'userA@kinetra.app',
    role: 'authenticated',
  };

  const mockUserBProfile = {
    id: userBId,
    display_name: 'User B',
    avatar_url: null,
    date_of_birth: '1995-05-15',
    gender: 'female',
    height_cm: 168.0,
    weight_kg: 62.5,
    fitness_level: 'intermediate',
    onboarding_done: true,
    created_at: '2026-08-20T10:00:00.000Z',
    updated_at: '2026-08-20T10:00:00.000Z',
  };

  const mockWorkoutB = {
    id: workoutIdB,
    creator_id: userBId,
    title: 'User B Private Workout',
    description: 'Private routine',
    category: 'strength',
    difficulty: 'hard',
    is_public: false,
    created_at: '2026-08-25T10:00:00.000Z',
    updated_at: '2026-08-25T10:00:00.000Z',
  };

  const mockSessionB = {
    id: sessionIdB,
    user_id: userBId,
    workout_id: workoutIdB,
    status: 'active',
    started_at: '2026-08-30T10:00:00.000Z',
    ended_at: null,
    duration_sec: null,
    calories_est: null,
    notes: null,
  };

  const mockInjuryB = {
    id: injuryIdB,
    user_id: userBId,
    session_exercise_id: null,
    body_part: 'right_shoulder',
    severity: 'high',
    description: 'Shoulder impingement',
    source: 'ai',
    resolved: false,
    flagged_at: '2026-08-29T10:00:00.000Z',
    resolved_at: null,
  };

  function mockAuthUserA() {
    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: userAAuth },
      error: null,
    }));
  }

  // ---------------------------------------------------------------------------
  // 1. User Profile Boundary & IDOR
  // ---------------------------------------------------------------------------
  it('SECURITY 1: GET /api/v1/users/:id exposes only public profile and protects private fields', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'public_profiles');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: {
                id: userBId,
                display_name: 'User B',
                avatar_url: null,
                fitness_level: 'intermediate',
              },
              error: null,
            }),
          }),
        }),
      };
    });

    const res = await request(app)
      .get(`/api/v1/users/${userBId}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, userBId);
    assert.equal(res.body.data.display_name, 'User B');
    assert.equal(res.body.data.fitness_level, 'intermediate');

    // Verify private data is never exposed
    assert.equal(res.body.data.email, undefined);
    assert.equal(res.body.data.height_cm, undefined);
    assert.equal(res.body.data.weight_kg, undefined);
    assert.equal(res.body.data.date_of_birth, undefined);
    assert.equal(res.body.data.gender, undefined);

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 2. Workout Privacy & IDOR
  // ---------------------------------------------------------------------------
  it('SECURITY 2: User A cannot read User B private workout (returns 403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'workouts') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockWorkoutB, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .get(`/api/v1/workouts/${workoutIdB}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  it('SECURITY 3: User A cannot modify or delete User B workout (returns 403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'workouts') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockWorkoutB, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const resUpdate = await request(app)
      .put(`/api/v1/workouts/${workoutIdB}`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ title: 'Hacked Title' });

    assert.equal(resUpdate.status, 403);
    assert.equal(resUpdate.body.error.code, 'FORBIDDEN');

    const resDelete = await request(app)
      .delete(`/api/v1/workouts/${workoutIdB}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(resDelete.status, 403);
    assert.equal(resDelete.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 3. Sessions & Pose Analysis IDOR
  // ---------------------------------------------------------------------------
  it('SECURITY 4: User A cannot access User B session or submit pose analysis to it', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockSessionB, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const resGet = await request(app)
      .get(`/api/v1/sessions/${sessionIdB}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(resGet.status, 403);
    assert.equal(resGet.body.error.code, 'FORBIDDEN');

    const resPose = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        session_id: sessionIdB,
        exercise_id: '44444444-9c0b-4ef8-bb6d-6bb9bd380a44',
        reps: 10,
        form_score: 85,
        injury_flag: false,
      });

    assert.equal(resPose.status, 403);
    assert.equal(resPose.body.error.code, 'FORBIDDEN');


    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 4. Injury Flags Isolation & IDOR
  // ---------------------------------------------------------------------------
  it('SECURITY 5: User A cannot read, modify, or resolve User B injury flag (returns 403 FORBIDDEN)', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'injury_flags');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: mockInjuryB, error: null }),
          }),
        }),
      };
    });

    const resGet = await request(app)
      .get(`/api/v1/injuries/${injuryIdB}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(resGet.status, 403);
    assert.equal(resGet.body.error.code, 'FORBIDDEN');

    const resPatch = await request(app)
      .patch(`/api/v1/injuries/${injuryIdB}`)
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ resolved: true });

    assert.equal(resPatch.status, 403);
    assert.equal(resPatch.body.error.code, 'FORBIDDEN');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 5. Privilege Escalation & Mass Assignment
  // ---------------------------------------------------------------------------
  it('SECURITY 6: User cannot spoof creator_id or user_id in payload bodies', async () => {
    mockAuthUserA();

    const resWorkout = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        creator_id: userBId,
        title: 'Spoofed Workout',
      });

    assert.equal(resWorkout.status, 422);
    assert.equal(resWorkout.body.error.code, 'VALIDATION_ERROR');

    const resProfile = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        id: userBId,
        display_name: 'Spoofed Name',
      });

    assert.equal(resProfile.status, 422);
    assert.equal(resProfile.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 6. Service Role & Credentials Leakage Protection
  // ---------------------------------------------------------------------------
  it('SECURITY 7: API responses never leak service-role credentials or internal secret tokens', async () => {
    mockAuthUserA();

    const res = await request(app).get('/health');
    assert.equal(res.status, 200);

    const responseBodyStr = JSON.stringify(res.body);
    assert.equal(responseBodyStr.includes('service_role'), false);
    assert.equal(responseBodyStr.includes('SUPABASE_SERVICE_ROLE_KEY'), false);

    mock.restoreAll();
  });
});
