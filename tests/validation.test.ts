import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';
import { WorkoutsService } from '../src/services/workouts.service.js';

const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const mockExerciseId1 = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const mockExerciseId2 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const mockSessionId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const mockChallengeId = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
const mockInjuryId = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';

const setupAuthMock = () => {
  mock.method(supabaseAnon.auth, 'getUser', async () => ({
    data: {
      user: { id: mockUserId, email: 'tester@kinetra.app', role: 'authenticated' },
    },
    error: null,
  }));
};

describe('Phase 5: Request Validation Hardening', () => {
  beforeEach(() => {
    setupAuthMock();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  // 1. Invalid UUID in Route Params
  it('1. Rejects invalid UUID route parameter with 422 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .get('/api/v1/workouts/not-a-valid-uuid')
      .set('Authorization', 'Bearer token');

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.equal(res.body.error.message, 'Request validation failed');
    assert.ok(Array.isArray(res.body.error.details));
    assert.equal(res.body.error.details[0].field, 'id');
  });

  it('1b. Rejects invalid UUID for users, sessions, and challenges route params', async () => {
    const resUser = await request(app)
      .get('/api/v1/users/bad-user-id')
      .set('Authorization', 'Bearer token');
    assert.equal(resUser.status, 422);
    assert.equal(resUser.body.error.code, 'VALIDATION_ERROR');

    const resSession = await request(app)
      .get('/api/v1/sessions/bad-session-id')
      .set('Authorization', 'Bearer token');
    assert.equal(resSession.status, 422);
    assert.equal(resSession.body.error.code, 'VALIDATION_ERROR');

    const resChallenge = await request(app)
      .get('/api/v1/challenges/bad-challenge-id')
      .set('Authorization', 'Bearer token');
    assert.equal(resChallenge.status, 422);
    assert.equal(resChallenge.body.error.code, 'VALIDATION_ERROR');
  });

  // 2. Missing required body field
  it('2. Rejects missing required field (title) on POST /workouts with 422', async () => {
    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer token')
      .send({
        description: 'Workout with no title',
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field === 'title'));
  });

  // 3. Wrong data type
  it('3. Rejects wrong data type on POST /workouts with 422', async () => {
    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer token')
      .send({
        title: 12345, // should be string
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field === 'title'));
  });

  // 4. Negative reps
  it('4. Rejects negative reps on POST /pose-analysis with 422', async () => {
    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer token')
      .send({
        session_id: mockSessionId,
        exercise_id: mockExerciseId1,
        set_number: 1,
        reps: -5,
        form_score: 85,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field === 'reps'));
  });

  // 5. Negative weight
  it('5. Rejects negative weight on POST /sessions/:id/log-exercise with 422', async () => {
    const res = await request(app)
      .post(`/api/v1/sessions/${mockSessionId}/log-exercise`)
      .set('Authorization', 'Bearer token')
      .send({
        exercise_id: mockExerciseId1,
        set_number: 1,
        reps: 10,
        weight_kg: -20,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field === 'weight_kg'));
  });

  // 6. Negative duration
  it('6. Rejects negative duration on POST /sessions/:id/log-exercise with 422', async () => {
    const res = await request(app)
      .post(`/api/v1/sessions/${mockSessionId}/log-exercise`)
      .set('Authorization', 'Bearer token')
      .send({
        exercise_id: mockExerciseId1,
        duration_sec: -60,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field === 'duration_sec'));
  });

  // 7. Form score below 0
  it('7. Rejects form_score below 0 on POST /pose-analysis with 422', async () => {
    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer token')
      .send({
        session_id: mockSessionId,
        exercise_id: mockExerciseId1,
        set_number: 1,
        reps: 10,
        form_score: -1,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field === 'form_score'));
  });

  // 8. Form score above 100
  it('8. Rejects form_score above 100 on POST /pose-analysis with 422', async () => {
    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer token')
      .send({
        session_id: mockSessionId,
        exercise_id: mockExerciseId1,
        set_number: 1,
        reps: 10,
        form_score: 101,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field === 'form_score'));
  });

  // 9. Invalid injury_flag type
  it('9. Rejects non-boolean injury_flag on POST /pose-analysis with 422', async () => {
    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer token')
      .send({
        session_id: mockSessionId,
        exercise_id: mockExerciseId1,
        set_number: 1,
        reps: 10,
        form_score: 90,
        injury_flag: 'true', // string instead of boolean
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field === 'injury_flag'));
  });

  // 10. Invalid rep_scores (elements out of range)
  it('10. Rejects invalid rep_scores outside 0-100 on POST /pose-analysis with 422', async () => {
    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer token')
      .send({
        session_id: mockSessionId,
        exercise_id: mockExerciseId1,
        set_number: 1,
        reps: 3,
        form_score: 90,
        rep_scores: [95, 105, 88], // 105 is invalid
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field.startsWith('rep_scores')));
  });

  // 11. Invalid nested workout exercise (e.g. malformed exercise_id)
  it('11. Rejects invalid nested workout exercise on POST /workouts with 422', async () => {
    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer token')
      .send({
        title: 'Full Body Blast',
        exercises: [
          {
            exercise_id: 'bad-exercise-uuid',
            order_index: 0,
            target_sets: 3,
          },
        ],
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field.includes('exercise_id')));
  });

  // 12. Duplicate workout order_index
  it('12. Rejects duplicate order_index in workout exercises with 422', async () => {
    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer token')
      .send({
        title: 'Leg Day',
        exercises: [
          {
            exercise_id: mockExerciseId1,
            order_index: 0,
            target_sets: 3,
          },
          {
            exercise_id: mockExerciseId2,
            order_index: 0, // Duplicate order_index
            target_sets: 4,
          },
        ],
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      res.body.error.details.some((d: any) =>
        d.message.toLowerCase().includes('duplicate order_index')
      )
    );
  });

  // 13. Oversized string limits
  it('13. Rejects oversized strings exceeding max length limits with 422', async () => {
    const hugeTitle = 'A'.repeat(151); // max is 150
    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer token')
      .send({
        title: hugeTitle,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some((d: any) => d.field === 'title'));
  });

  // 14. Mass assignment / unknown security field protection
  it('14. Rejects mass assignment / unauthorized field injection on strict payload with 422', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', 'Bearer token')
      .send({
        display_name: 'Harshit Hacker',
        role: 'admin', // strict schema rejects unknown / privileged field
        user_id: '00000000-0000-0000-0000-000000000000',
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  // 15. Challenge date validation: invalid calendar date & end_date < start_date
  it('15. Rejects invalid calendar date and end_date before start_date on POST /challenges with 422', async () => {
    // Non-existent calendar date (e.g. Feb 30)
    const resBadDate = await request(app)
      .post('/api/v1/challenges')
      .set('Authorization', 'Bearer token')
      .send({
        title: '30-Day Pushup',
        start_date: '2026-02-30',
        end_date: '2026-03-30',
      });

    assert.equal(resBadDate.status, 422);
    assert.equal(resBadDate.body.error.code, 'VALIDATION_ERROR');

    // End date before start date
    const resInvertedDates = await request(app)
      .post('/api/v1/challenges')
      .set('Authorization', 'Bearer token')
      .send({
        title: '30-Day Pushup',
        start_date: '2026-09-30',
        end_date: '2026-09-01',
      });

    assert.equal(resInvertedDates.status, 422);
    assert.equal(resInvertedDates.body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      resInvertedDates.body.error.details.some((d: any) =>
        d.message.toLowerCase().includes('end_date must be on or after start_date')
      )
    );
  });

  // 16. Invalid injury update (empty or invalid severity)
  it('16. Rejects empty body or invalid severity on PATCH /injuries/:id with 422', async () => {
    const resEmpty = await request(app)
      .patch(`/api/v1/injuries/${mockInjuryId}`)
      .set('Authorization', 'Bearer token')
      .send({});

    assert.equal(resEmpty.status, 422);
    assert.equal(resEmpty.body.error.code, 'VALIDATION_ERROR');

    const resBadSeverity = await request(app)
      .patch(`/api/v1/injuries/${mockInjuryId}`)
      .set('Authorization', 'Bearer token')
      .send({
        severity: 'fatal', // not in low, medium, high
      });

    assert.equal(resBadSeverity.status, 422);
    assert.equal(resBadSeverity.body.error.code, 'VALIDATION_ERROR');
  });

  // 17. Proof that validation occurs BEFORE controller / service / database execution
  it('17. Proves validation occurs BEFORE controller/service/database execution on invalid input', async () => {
    let serviceCallCount = 0;
    mock.method(WorkoutsService, 'createWorkout', async () => {
      serviceCallCount++;
      return {} as any;
    });

    let dbCallCount = 0;
    mock.method(supabaseAdmin, 'from', () => {
      dbCallCount++;
      return {} as any;
    });

    // Send invalid workout request (missing title, duplicate order index)
    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer token')
      .send({
        exercises: [
          { exercise_id: mockExerciseId1, order_index: 0, target_sets: 3 },
          { exercise_id: mockExerciseId2, order_index: 0, target_sets: 3 },
        ],
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    // Confirm neither service nor database was touched
    assert.equal(serviceCallCount, 0, 'WorkoutsService.createWorkout must NOT be executed');
    assert.equal(dbCallCount, 0, 'Supabase database query must NOT be executed');
  });

  // 18. Valid request passes validation and reaches service layer successfully
  it('18. Valid request passes validation and reaches service layer successfully', async () => {
    const mockCreatedWorkout = {
      id: '77777777-7777-7777-7777-777777777777',
      creator_id: mockUserId,
      title: 'Upper Body Power',
      description: 'Chest and Arms',
      difficulty: 'hard',
      is_public: false,
      exercises: [],
      created_at: new Date().toISOString(),
    };

    let serviceExecuted = false;
    mock.method(WorkoutsService, 'createWorkout', async (_userId: string, input: any) => {
      serviceExecuted = true;
      assert.equal(input.title, 'Upper Body Power');
      return mockCreatedWorkout as any;
    });

    const res = await request(app)
      .post('/api/v1/workouts')
      .set('Authorization', 'Bearer token')
      .send({
        title: 'Upper Body Power',
        description: 'Chest and Arms',
        difficulty: 'hard',
        is_public: false,
        exercises: [
          {
            exercise_id: mockExerciseId1,
            order_index: 0,
            target_sets: 4,
            target_reps: 10,
            target_weight_kg: 60,
          },
          {
            exercise_id: mockExerciseId2,
            order_index: 1,
            target_sets: 3,
            target_reps: 12,
            target_weight_kg: 25,
          },
        ],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(serviceExecuted, true);
    assert.equal(res.body.data.id, mockCreatedWorkout.id);
  });

  // 19. Accepts mobile client parameter names (sets, duration_seconds) on POST /sessions/:id/log-exercise
  it('19. Accepts mobile client parameter names (sets, duration_seconds) on log-exercise', async () => {
    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: mockSessionId, user_id: mockUserId, status: 'active' },
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
              single: () => Promise.resolve({
                data: { id: mockExerciseId1, name: 'Squat' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'session_exercises') {
        return {
          insert: (payload: any) => {
            assert.equal(payload.set_number, 2);
            assert.equal(payload.duration_sec, 45);
            return {
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'se-1', ...payload },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
    });

    const res = await request(app)
      .post(`/api/v1/sessions/${mockSessionId}/log-exercise`)
      .set('Authorization', 'Bearer token')
      .send({
        exercise_id: mockExerciseId1,
        sets: 2,
        reps: 10,
        duration_seconds: 45,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.set_number, 2);
    assert.equal(res.body.data.duration_sec, 45);
  });

  // 20. Accepts mobile client parameter names (flags, duration_ms) on POST /pose-analysis
  it('20. Accepts mobile client parameter names (flags, duration_ms) on pose-analysis', async () => {
    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { id: mockSessionId, user_id: mockUserId, status: 'active' },
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
              single: () => Promise.resolve({
                data: { id: mockExerciseId1, name: 'Push-up' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'session_exercises') {
        return {
          insert: (payload: any) => {
            assert.equal(payload.duration_sec, 30);
            return {
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'se-2', ...payload },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      if (table === 'injury_flags') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'inj-1' }, error: null }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
    });

    const res = await request(app)
      .post('/api/v1/pose-analysis')
      .set('Authorization', 'Bearer token')
      .send({
        session_id: mockSessionId,
        exercise_id: mockExerciseId1,
        reps: 15,
        form_score: 88,
        flags: ['elbow_flare'],
        duration_ms: 30000,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.form_score, 88);
  });
});
