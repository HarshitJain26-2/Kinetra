import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 12: Challenge APIs (/api/v1/challenges)', () => {
  const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userBId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const challengeId1 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
  const challengeId2Ended = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

  const userAAuth = {
    id: userAId,
    email: 'userA@kinetra.app',
    role: 'authenticated',
  };

  const mockChallengeActive = {
    id: challengeId1,
    creator_id: userAId,
    title: 'September 500 Rep Challenge',
    description: 'Complete 500 squats in September',
    type: 'volume',
    metric_key: 'total_reps',
    target_value: 500,
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    is_active: true,
    created_at: '2026-08-30T10:00:00.000Z',
  };

  const mockChallengeEnded = {
    id: challengeId2Ended,
    creator_id: userBId,
    title: 'July Sprint',
    description: 'Sprint challenge',
    type: 'time',
    metric_key: 'duration_sec',
    target_value: 3600,
    start_date: '2026-07-01',
    end_date: '2026-07-31',
    is_active: false,
    created_at: '2026-06-30T10:00:00.000Z',
  };

  const mockParticipant1 = {
    id: '44444444-9c0b-4ef8-bb6d-6bb9bd380a44',
    challenge_id: challengeId1,
    user_id: userAId,
    current_value: 120,
    joined_at: '2026-08-30T12:00:00.000Z',
    user: {
      id: userAId,
      display_name: 'Rushikesh',
      avatar_url: null,
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
  it('TEST 1: Unauthenticated GET /api/v1/challenges returns 401 INVALID_TOKEN', async () => {
    const res = await request(app).get('/api/v1/challenges');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 2: Unauthenticated POST /api/v1/challenges returns 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .post('/api/v1/challenges')
      .send({ title: 'Test Challenge' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  // ---------------------------------------------------------------------------
  // 2. Create and List Challenges
  // ---------------------------------------------------------------------------
  it('TEST 3: Authenticated user can create a challenge with creator_id assigned from JWT', async () => {
    mockAuthUserA();

    let insertedChallenge: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'challenges');
      return {
        insert: (data: any) => {
          insertedChallenge = data;
          assert.equal(data.creator_id, userAId);
          return {
            select: () => ({
              single: async () => ({
                data: { id: challengeId1, ...data, created_at: '2026-08-30T10:00:00.000Z' },
                error: null,
              }),
            }),
          };
        },
      };
    });

    const res = await request(app)
      .post('/api/v1/challenges')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        title: 'September 500 Rep Challenge',
        description: 'Complete 500 squats in September',
        type: 'volume',
        metric_key: 'total_reps',
        target_value: 500,
        start_date: '2026-09-01',
        end_date: '2026-09-30',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, challengeId1);
    assert.equal(res.body.data.creator_id, userAId);
    assert.equal(insertedChallenge.creator_id, userAId);

    mock.restoreAll();
  });

  it('TEST 4: Authenticated user can list challenges with filters and pagination', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'challenges');
      return {
        select: (_fields: string, opts: any) => {
          assert.equal(opts?.count, 'exact');
          return {
            eq: (field: string, val: string) => {
              assert.equal(field, 'type');
              assert.equal(val, 'volume');
              return {
                order: () => ({
                  range: () => Promise.resolve({
                    data: [mockChallengeActive],
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
      .get('/api/v1/challenges?type=volume&page=1&limit=20')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].id, challengeId1);
    assert.deepEqual(res.body.meta, { page: 1, limit: 20, total: 1 });

    mock.restoreAll();
  });

  it('TEST 5: Authenticated user can get challenge details with participant count', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'challenges') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockChallengeActive, error: null }),
            }),
          }),
        };
      }
      if (table === 'challenge_participants') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ count: 15, error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .get(`/api/v1/challenges/${challengeId1}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, challengeId1);
    assert.equal(res.body.data.participant_count, 15);

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 3. Join Challenge & Participants
  // ---------------------------------------------------------------------------
  it('TEST 6: Authenticated user can join an active challenge', async () => {
    mockAuthUserA();

    let insertedParticipant: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'challenges') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockChallengeActive, error: null }),
            }),
          }),
        };
      }
      if (table === 'challenge_participants') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }), // not yet joined
              }),
            }),
          }),
          insert: (data: any) => {
            insertedParticipant = data;
            assert.equal(data.user_id, userAId);
            assert.equal(data.challenge_id, challengeId1);
            return {
              select: () => ({
                single: async () => ({
                  data: { id: '99999999-9c0b-4ef8-bb6d-6bb9bd380a99', ...data, joined_at: new Date().toISOString() },
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
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.challenge_id, challengeId1);
    assert.equal(res.body.data.user_id, userAId);
    assert.equal(insertedParticipant.user_id, userAId);

    mock.restoreAll();
  });

  it('TEST 7: Joining an already joined challenge returns 400 ALREADY_JOINED', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'challenges') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockChallengeActive, error: null }),
            }),
          }),
        };
      }
      if (table === 'challenge_participants') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: 'existing-id' }, error: null }),
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await request(app)
      .post(`/api/v1/challenges/${challengeId1}/join`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'ALREADY_JOINED');

    mock.restoreAll();
  });

  it('TEST 8: Joining an ended challenge returns 400 CHALLENGE_ENDED', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'challenges') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockChallengeEnded, error: null }),
            }),
          }),
        };
      }
      if (table === 'challenge_participants') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ count: 5, error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });


    const res = await request(app)
      .post(`/api/v1/challenges/${challengeId2Ended}/join`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'CHALLENGE_ENDED');

    mock.restoreAll();
  });

  it('TEST 9: Listing challenge participants returns ranked leaderboard with public profiles only', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'challenges') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockChallengeActive, error: null }),
            }),
          }),
        };
      }
      if (table === 'challenge_participants') {
        return {
          select: (_fields: string, opts: any) => {
            assert.equal(opts?.count, 'exact');
            return {
              eq: () => ({
                order: () => ({
                  range: () => Promise.resolve({
                    data: [mockParticipant1],
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
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].rank, 1);
    assert.equal(res.body.data[0].user.display_name, 'Rushikesh');
    assert.equal(res.body.data[0].value, 120);

    mock.restoreAll();
  });
});
