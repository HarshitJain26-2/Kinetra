import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getApiBaseUrl, ApiError, apiRequest, apiClient } from '../src/api/client';

describe('Mobile API Client & Security Tests', () => {
  it('resolves the base URL from EXPO_PUBLIC_API_BASE_URL or default', () => {
    const defaultUrl = getApiBaseUrl();
    assert.ok(typeof defaultUrl === 'string');
    assert.ok(defaultUrl.length > 0);
    assert.equal(defaultUrl.endsWith('/'), false);
  });

  it('constructs ApiError correctly with code and HTTP status', () => {
    const error = new ApiError('Workout not found', 'WORKOUT_NOT_FOUND', 404, { id: '123' });
    assert.equal(error.name, 'ApiError');
    assert.equal(error.message, 'Workout not found');
    assert.equal(error.code, 'WORKOUT_NOT_FOUND');
    assert.equal(error.status, 404);
    assert.deepEqual(error.details, { id: '123' });
  });

  it('correctly constructs query strings and attaches Authorization header', async () => {
    const originalFetch = globalThis.fetch;
    let interceptedUrl: string = '';
    let interceptedHeaders: any = {};

    globalThis.fetch = async (url: any, init?: any) => {
      interceptedUrl = String(url);
      interceptedHeaders = init?.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [
            {
              id: 'w-1',
              title: 'Tactical Strength',
              category: 'strength',
              difficulty: 'intermediate',
              is_public: true,
            },
          ],
        }),
      } as any;
    };

    try {
      const data = await apiRequest('/api/v1/workouts', {
        token: 'test-jwt-token-12345',
        query: { limit: 10, category: 'strength' },
      });

      assert.ok(interceptedUrl.includes('/api/v1/workouts?limit=10&category=strength'));
      assert.equal(interceptedHeaders?.['Authorization'], 'Bearer test-jwt-token-12345');
      assert.equal(Array.isArray(data), true);
      assert.equal((data as any)[0].title, 'Tactical Strength');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('never logs access tokens or sensitive user data in errors', async () => {
    const originalFetch = globalThis.fetch;
    const originalConsoleError = console.error;
    let loggedMessages: string[] = [];

    console.error = (...args: any[]) => {
      loggedMessages.push(args.map(String).join(' '));
    };

    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Authorization header missing or malformed',
          },
        }),
      } as any;
    };

    try {
      const sensitiveToken = 'SUPER_SECRET_JWT_TOKEN_ABC123';
      await assert.rejects(
        async () => {
          await apiRequest('/api/v1/users/me', { token: sensitiveToken });
        },
        (err: any) => {
          assert.equal(err.status, 401);
          assert.equal(err.code, 'INVALID_TOKEN');
          return true;
        }
      );

      // Verify no console log contained the sensitive token
      for (const msg of loggedMessages) {
        assert.equal(msg.includes(sensitiveToken), false);
      }
    } finally {
      globalThis.fetch = originalFetch;
      console.error = originalConsoleError;
    }
  });

  it('handles backend envelope error formats properly', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 422,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: [{ field: 'title', message: 'Title is required' }],
          },
        }),
      } as any;
    };

    try {
      await assert.rejects(
        async () => {
          await apiClient.get('/api/v1/workouts/invalid-uuid');
        },
        (err: any) => {
          assert.equal(err instanceof ApiError, true);
          assert.equal(err.code, 'VALIDATION_ERROR');
          assert.equal(err.status, 422);
          assert.deepEqual(err.details, [{ field: 'title', message: 'Title is required' }]);
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
