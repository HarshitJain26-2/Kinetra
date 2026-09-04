import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAnon, supabaseAdmin } from '../src/config/supabase.js';

describe('Phase 6: User APIs (/auth/me, /users/me, /users/:id)', () => {
  const userAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userBId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const userAAuth = {
    id: userAId,
    email: 'userA@kinetra.app',
    role: 'authenticated',
  };


  const userAFullProfile = {
    id: userAId,
    display_name: 'Alice Workout',
    avatar_url: 'https://kinetra.app/avatars/alice.png',
    date_of_birth: '1995-06-15',
    gender: 'female',
    height_cm: 168.5,
    weight_kg: 62.0,
    fitness_level: 'intermediate',
    onboarding_done: true,
    created_at: '2026-08-01T10:00:00.000Z',
    updated_at: '2026-08-15T12:00:00.000Z',
  };

  const userBPublicProfile = {
    id: userBId,
    display_name: 'Bob Runner',
    avatar_url: 'https://kinetra.app/avatars/bob.png',
    fitness_level: 'advanced',
  };

  // Helper to mock Supabase Auth for User A
  function mockAuthUserA() {
    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: userAAuth },
      error: null,
    }));
  }

  // ---------------------------------------------------------------------------
  // 1. Authentication requirement tests
  // ---------------------------------------------------------------------------
  it('TEST 1: GET /api/v1/auth/me without token returns 401 INVALID_TOKEN', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 2: GET /api/v1/users/me without token returns 401 INVALID_TOKEN', async () => {
    const res = await request(app).get('/api/v1/users/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  it('TEST 3: PUT /api/v1/users/me without token returns 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .send({ display_name: 'Hacker' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });

  // ---------------------------------------------------------------------------
  // 2. Authenticated Profile Retrieval (/auth/me and /users/me)
  // ---------------------------------------------------------------------------
  it('TEST 4a: GET /api/v1/auth/me with valid authenticated user returns profile with token claims', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'users');
      return {
        select: () => ({
          eq: (field: string, val: string) => {
            assert.equal(field, 'id');
            assert.equal(val, userAId);
            return {
              single: async () => ({ data: userAFullProfile, error: null }),
            };
          },
        }),
      };
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, userAId);
    assert.equal(res.body.data.email, 'userA@kinetra.app');
    assert.equal(res.body.data.display_name, 'Alice Workout');
    assert.equal(res.body.data.fitness_level, 'intermediate');
    assert.equal(res.body.data.onboarding_done, true);

    mock.restoreAll();
  });

  it('TEST 4b: GET /api/v1/users/me with valid authenticated user returns own full private profile', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'users');
      return {
        select: () => ({
          eq: (field: string, val: string) => {
            assert.equal(field, 'id');
            assert.equal(val, userAId);
            return {
              single: async () => ({ data: userAFullProfile, error: null }),
            };
          },
        }),
      };
    });

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, userAId);
    assert.equal(res.body.data.email, 'userA@kinetra.app');
    assert.equal(res.body.data.display_name, 'Alice Workout');
    assert.equal(res.body.data.gender, 'female');
    assert.equal(res.body.data.height_cm, 168.5);
    assert.equal(res.body.data.weight_kg, 62.0);
    assert.equal(res.body.data.date_of_birth, '1995-06-15');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 3. Updating Profile (PUT /users/me)
  // ---------------------------------------------------------------------------
  it('TEST 5: PUT /api/v1/users/me with valid payload updates authenticated user profile', async () => {
    mockAuthUserA();

    const updatePayload = {
      display_name: 'Alice Champion',
      weight_kg: 60.5,
      fitness_level: 'advanced',
    };

    const updatedProfile = {
      ...userAFullProfile,
      ...updatePayload,
      updated_at: '2026-08-30T10:00:00.000Z',
    };

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'users');
      return {
        update: (sanitizedData: any) => {
          assert.equal(sanitizedData.display_name, 'Alice Champion');
          assert.equal(sanitizedData.weight_kg, 60.5);
          assert.equal(sanitizedData.fitness_level, 'advanced');
          assert.ok(sanitizedData.updated_at);
          return {
            eq: (field: string, val: string) => {
              assert.equal(field, 'id');
              assert.equal(val, userAId);
              return {
                select: () => ({
                  single: async () => ({ data: updatedProfile, error: null }),
                }),
              };
            },
          };
        },
      };
    });

    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send(updatePayload);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.display_name, 'Alice Champion');
    assert.equal(res.body.data.weight_kg, 60.5);
    assert.equal(res.body.data.fitness_level, 'advanced');
    assert.equal(res.body.data.email, 'userA@kinetra.app');

    mock.restoreAll();
  });

  it('TEST 6: Attempt to update another user profile via IDOR or body injection is prevented', async () => {
    mockAuthUserA();

    // Attempting to supply id / user_id in body must fail strict validation (422)
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        id: userBId,
        user_id: userBId,
        display_name: 'Attacker Attempt',
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 4. Public Profile Separation (GET /users/:id)
  // ---------------------------------------------------------------------------
  it('TEST 7: GET /api/v1/users/:id fetches public profile from public_profiles view', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      // Must query public_profiles view, never full users table
      assert.equal(table, 'public_profiles');
      return {
        select: () => ({
          eq: (field: string, val: string) => {
            assert.equal(field, 'id');
            assert.equal(val, userBId);
            return {
              single: async () => ({ data: userBPublicProfile, error: null }),
            };
          },
        }),
      };
    });

    const res = await request(app)
      .get(`/api/v1/users/${userBId}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, userBId);
    assert.equal(res.body.data.display_name, 'Bob Runner');
    assert.equal(res.body.data.fitness_level, 'advanced');

    mock.restoreAll();
  });

  it('TEST 8: Verify private fields are NOT present in public profile response', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'public_profiles');
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: userBPublicProfile, error: null }),
          }),
        }),
      };
    });

    const res = await request(app)
      .get(`/api/v1/users/${userBId}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 200);
    // Private metrics must not exist
    assert.equal(res.body.data.weight_kg, undefined);
    assert.equal(res.body.data.height_cm, undefined);
    assert.equal(res.body.data.date_of_birth, undefined);
    assert.equal(res.body.data.gender, undefined);
    assert.equal(res.body.data.email, undefined);
    assert.equal(res.body.data.onboarding_done, undefined);
    assert.equal(res.body.data.password, undefined);

    mock.restoreAll();
  });

  // ---------------------------------------------------------------------------
  // 5. Validation and Edge Cases
  // ---------------------------------------------------------------------------
  it('TEST 9: Invalid UUID in /users/:id returns 422 VALIDATION_ERROR', async () => {
    mockAuthUserA();

    const res = await request(app)
      .get('/api/v1/users/not-a-valid-uuid')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('TEST 10a: Non-existent user profile on GET /users/:id returns 404 USER_NOT_FOUND', async () => {
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
      .get(`/api/v1/users/${nonExistentId}`)
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'USER_NOT_FOUND');

    mock.restoreAll();
  });

  it('TEST 10b: Non-existent user profile on GET /users/me returns 404 PROFILE_NOT_FOUND', async () => {
    mockAuthUserA();

    mock.method(supabaseAdmin, 'from', () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Row not found' } }),
        }),
      }),
    }));

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-user-a-jwt');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'PROFILE_NOT_FOUND');

    mock.restoreAll();
  });

  it('TEST 11: Unknown / disallowed update fields on PUT /users/me return 422 VALIDATION_ERROR', async () => {
    mockAuthUserA();

    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        display_name: 'Valid Name',
        unexpected_extra_field: 'malicious-data',
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('TEST 12: Sensitive fields (role, is_admin, email, created_at) cannot be modified through PUT /users/me', async () => {
    mockAuthUserA();

    const attempts = [
      { role: 'admin' },
      { is_admin: true },
      { email: 'hacker@kinetra.app' },
      { created_at: '2020-01-01T00:00:00Z' },
      { updated_at: '2020-01-01T00:00:00Z' },
    ];

    for (const body of attempts) {
      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-user-a-jwt')
        .send(body);

      assert.equal(res.status, 422);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }

    mock.restoreAll();
  });

  it('TEST 13: Invalid calendar dates (e.g. 2026-02-31) in date_of_birth return 422 VALIDATION_ERROR', async () => {
    mockAuthUserA();

    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        date_of_birth: '2026-02-31',
      });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');

    mock.restoreAll();
  });

  it('TEST 14: Out of range height and weight return 422 VALIDATION_ERROR', async () => {
    mockAuthUserA();

    const negativeHeight = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ height_cm: -10 });
    assert.equal(negativeHeight.status, 422);

    const excessiveWeight = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({ weight_kg: 999 });
    assert.equal(excessiveWeight.status, 422);

    mock.restoreAll();
  });

  it('TEST 15: PUT /api/v1/users/me self-heals and creates user profile via upsert if row does not exist yet', async () => {
    mockAuthUserA();

    let upsertPayload: any = null;

    mock.method(supabaseAdmin, 'from', (table: string) => {
      assert.equal(table, 'users');
      return {
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'Row not found' } }),
            }),
          }),
        }),
        upsert: (data: any) => {
          upsertPayload = data;
          return {
            select: () => ({
              single: async () => ({
                data: {
                  id: userAId,
                  ...data,
                  created_at: '2026-09-04T12:00:00.000Z',
                  updated_at: '2026-09-04T12:00:00.000Z',
                },
                error: null,
              }),
            }),
          };
        },
      };
    });

    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-user-a-jwt')
      .send({
        display_name: 'Apex Athlete',
        height_cm: 182,
        weight_kg: 80.5,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.display_name, 'Apex Athlete');
    assert.equal(res.body.data.height_cm, 182);
    assert.equal(res.body.data.weight_kg, 80.5);
    assert.equal(upsertPayload.id, userAId);
    assert.equal(upsertPayload.height_cm, 182);
    assert.equal(upsertPayload.weight_kg, 80.5);

    mock.restoreAll();
  });
});
