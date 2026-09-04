import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeAuthError } from '../src/utils/authErrors';

describe('Mobile Auth Error Sanitizer Tests', () => {
  it('maps invalid login credentials to clean error', () => {
    const error = { message: 'Invalid login credentials' };
    assert.equal(sanitizeAuthError(error), 'Email or password is incorrect.');
  });

  it('maps already registered user to sign in prompt', () => {
    const error = { message: 'User already registered' };
    assert.equal(
      sanitizeAuthError(error),
      'An account with this email already exists. Please sign in.'
    );
  });

  it('maps rate limit errors to patience prompt', () => {
    const error = { message: 'rate limit exceeded', status: 429 };
    assert.equal(
      sanitizeAuthError(error),
      'Too many attempts. Please wait a moment and try again.'
    );
  });

  it('maps email rate limit errors to actionable dashboard advice', () => {
    const error = { message: 'email rate limit exceeded', status: 429, code: 'over_email_send_rate_limit' };
    assert.equal(
      sanitizeAuthError(error),
      'Email rate limit reached. Please disable "Confirm email" in Supabase Auth settings or wait a few minutes.'
    );
  });

  it('maps network failures to connection prompt', () => {
    const error = new Error('Failed to fetch from network');
    assert.equal(
      sanitizeAuthError(error),
      'Something went wrong. Check your connection and try again.'
    );
  });

  it('never exposes raw stack traces or internal database errors', () => {
    const rawError = {
      message: 'Postgres error 23505: duplicate key value violates unique constraint users_pkey at src/backend/pg.ts:42',
      stack: 'Error at /var/app/dist/pg.js:12:45',
    };
    const sanitized = sanitizeAuthError(rawError);
    assert.equal(sanitized.includes('Postgres'), false);
    assert.equal(sanitized.includes('23505'), false);
    assert.equal(sanitized.includes('stack'), false);
    assert.equal(sanitized.includes('.ts'), false);
    assert.equal(sanitized, 'Unable to complete request. Please verify your details and try again.');
  });
});
