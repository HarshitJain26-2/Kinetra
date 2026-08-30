import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 12: Nutrition APIs (/api/v1/nutrition)', () => {
  const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userBId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const userAAuth = {
    id: userAId,
    email: 'userA@kinetra.app',
    role: 'authenticated',
  };

  const mockProfileUserA = {
    id: '11111111-9c0b-4ef8-bb6d-6bb9bd380a11',
    user_id: userAId,
    goal: 'gain_muscle',
    diet_type: 'vegetarian',
    allergies: ['gluten'],
    daily_cal_target: 2800,
    protein_g: 180,
    carbs_g: 320,
    fat_g: 78,
    meal_plan_json: null,
    created_at: '2026-08-28T10:00:00.000Z',
    updated_at: '2026-08-28T10:00:00.000Z',
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
  it('TEST 1: Unauthenticated GET /api/v1/nutrition/profile returns 401 INVALID_TOKEN', async () => {
    const res = await request(app).get('/api/v1/nutrition/profile');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 2: Unauthenticated PUT /api/v1/nutrition/profile returns 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .put('/api/v1/nutrition/profile')
      .send({ goal: 'gain_muscle' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 3: Unauthenticated POST /api/v1/nutrition/recommend returns 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .post('/api/v1/nutrition/recommend')
      .send({ num_meals: 4 });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  // ---------------------------------------------------------------------------
  // 2. Nutrition Profile Retrieval & Upsert
  // ---------------------------------------------------------------------------
  it('TEST 4: Authenticated user can get own nutrition profile', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'nutrition_profiles');
      return {
        select: () => ({
          eq: (field: string, val: string) => {
            assert.equal(field, 'user_id');
            assert.equal(val, userAId);
            return {
              single: async () => ({ data: mockProfileUserA, error: null }),
            };
          },
        }),
      };
    });

    const res = await request(app)
      .get('/api/v1/nutrition/profile')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.goal, 'gain_muscle');
    assert.equal(res.body.data.daily_cal_target, 2800);

    mock.restoreAll();
  });

  it('TEST 5: Non-existent profile returns 404 NUTRITION_PROFILE_NOT_FOUND', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Not found' } }),
        }),
      }),
    }));

    const res = await request(app)
      .get('/api/v1/nutrition/profile')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NUTRITION_PROFILE_NOT_FOUND');

    mock.restoreAll();
  });

  it('TEST 6: Authenticated user can upsert nutrition profile with allowlisted fields', async () => {
    mockAuthUserA();

    let upsertedData: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'nutrition_profiles');
      return {
        upsert: (data: any, opts: any) => {
          upsertedData = data;
          assert.equal(data.user_id, userAId);
          assert.equal(opts.onConflict, 'user_id');
          return {
            select: () => ({
              single: async () => ({
                data: { ...mockProfileUserA, ...data },
                error: null,
              }),
            }),
          };
        },
      };
    });

    const res = await request(app)
      .put('/api/v1/nutrition/profile')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        goal: 'lose_weight',
        diet_type: 'vegan',
        daily_cal_target: 2200,
        protein_g: 140,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.goal, 'lose_weight');
    assert.equal(upsertedData.goal, 'lose_weight');
    assert.equal(upsertedData.user_id, userAId);

    mock.restoreAll();
  });

  it('TEST 7: User cannot spoof ownership via user_id in PUT /nutrition/profile', async () => {
    mockAuthUserA();

    const res = await request(app)
      .put('/api/v1/nutrition/profile')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        user_id: userBId,
        goal: 'gain_muscle',
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 3. Nutrition Recommendation Generation
  // ---------------------------------------------------------------------------
  it('TEST 8: Generates contract-compliant meal plan recommendation using provider abstraction', async () => {
    mockAuthUserA();

    let updatedMealPlan: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'nutrition_profiles');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: mockProfileUserA, error: null }),
          }),
        }),
        update: (data: any) => {
          updatedMealPlan = data.meal_plan_json;
          return {
            eq: () => Promise.resolve({ error: null }),
          };
        },
      };
    });

    const res = await request(app)
      .post('/api/v1/nutrition/recommend')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ num_meals: 4, date: '2026-08-30' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.saved, true);
    assert.equal(res.body.data.meal_plan.meals.length, 4);
    assert.equal(res.body.data.meal_plan.total_calories, 2800);
    assert.ok(updatedMealPlan);

    mock.restoreAll();
  });
});
