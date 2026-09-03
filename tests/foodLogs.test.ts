import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 35 Backend: Daily Food Logs APIs (/api/v1/nutrition/logs)', () => {
  const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userAAuth = {
    id: userAId,
    email: 'userA@kinetra.app',
    role: 'authenticated',
  };

  function mockAuthUserA() {
    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: userAAuth },
      error: null,
    }));
  }

  it('TEST 1: Unauthenticated GET /api/v1/nutrition/logs returns 401 INVALID_TOKEN', async () => {
    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: null },
      error: new Error('Invalid token'),
    }));

    const res = await request(app).get('/api/v1/nutrition/logs');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('TEST 2: Authenticated user creates a valid food log item', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'daily_food_logs');
      return {
        insert: (payload: any) => ({
          select: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'food-log-uuid-1',
                ...payload,
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      };
    });

    const res = await request(app)
      .post('/api/v1/nutrition/logs')
      .set('Authorization', 'Bearer valid-user-a-token')
      .send({
        meal_name: 'Wild Caught Salmon & Quinoa',
        timing: 'post_workout',
        calories: 650,
        protein_g: 45,
        carbs_g: 50,
        fat_g: 18,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.meal_name, 'Wild Caught Salmon & Quinoa');
    assert.equal(res.body.data.calories, 650);

    mock.restoreAll();
  });

  it('TEST 3: Rejects invalid negative calories with 422 VALIDATION_ERROR', async () => {
    mockAuthUserA();

    const res = await request(app)
      .post('/api/v1/nutrition/logs')
      .set('Authorization', 'Bearer valid-user-a-token')
      .send({
        meal_name: 'Invalid Meal',
        calories: -50,
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
  });

  it('TEST 4: Lists food logs filtered by date', async () => {
    mockAuthUserA();

    const todayStr = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .get(`/api/v1/nutrition/logs?date=${todayStr}`)
      .set('Authorization', 'Bearer valid-user-a-token');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });
});
