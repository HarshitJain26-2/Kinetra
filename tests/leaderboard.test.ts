import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 12: Leaderboard APIs (/api/v1/leaderboard)', () => {
  const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userBId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const userAAuth = {
    id: userAId,
    email: 'userA@kinetra.app',
    role: 'authenticated',
  };

  const mockPublicProfile1 = {
    id: userAId,
    display_name: 'Rushikesh',
    avatar_url: 'https://assets.kinetra.app/avatars/userA.png',
  };

  const mockPublicProfile2 = {
    id: userBId,
    display_name: 'AthleteB',
    avatar_url: null,
  };

  function mockAuthUserA() {
    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: userAAuth },
      error: null,
    }));
  }

  it('TEST 1: Unauthenticated GET /api/v1/leaderboard returns 401 INVALID_TOKEN', async () => {
    const res = await request(app).get('/api/v1/leaderboard');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 2: Authenticated user can retrieve global leaderboard without exposing private data', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'public_profiles');
      return {
        select: (_fields: string, opts: any) => {
          assert.equal(opts?.count, 'exact');
          return {
            range: (start: number, end: number) => {
              assert.equal(start, 0);
              assert.equal(end, 49);
              return Promise.resolve({
                data: [mockPublicProfile1, mockPublicProfile2],
                count: 2,
                error: null,
              });
            },
          };
        },
      };
    });

    const res = await request(app)
      .get('/api/v1/leaderboard?metric=total_reps&page=1&limit=50')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.data[0].rank, 1);
    assert.equal(res.body.data[0].user.display_name, 'Rushikesh');
    assert.equal(res.body.data[0].metric, 'total_reps');
    assert.equal(res.body.data[1].rank, 2);
    assert.deepEqual(res.body.meta, { page: 1, limit: 50, total: 2 });

    // Ensure no private user data leaked
    assert.equal(res.body.data[0].user.email, undefined);
    assert.equal(res.body.data[0].user.height_cm, undefined);
    assert.equal(res.body.data[0].user.weight_kg, undefined);

    mock.restoreAll();
  });
});
