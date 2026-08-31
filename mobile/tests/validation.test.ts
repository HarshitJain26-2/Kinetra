import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateEmail, validatePassword, validateFullName } from '../src/utils/validation';

describe('Mobile Form Validation Tests', () => {
  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      const validEmails = [
        'athlete@kinetra.app',
        'elite.coach@domain.co',
        'user+tag@example.com',
        'harshit@gmail.com',
      ];

      for (const email of validEmails) {
        const res = validateEmail(email);
        assert.equal(res.isValid, true, `Expected ${email} to be valid`);
        assert.equal(res.error, undefined);
      }
    });

    it('rejects invalid email formats with friendly error message', () => {
      const invalidEmails = [
        'invalid-email',
        'athlete@',
        '@kinetra.app',
        'athlete@domain',
        ' athlete with space@domain.com ',
      ];

      for (const email of invalidEmails) {
        const res = validateEmail(email);
        assert.equal(res.isValid, false, `Expected ${email} to be invalid`);
        assert.equal(res.error, 'Please enter a valid email address.');
      }
    });

    it('rejects empty or whitespace email', () => {
      const res = validateEmail('   ');
      assert.equal(res.isValid, false);
      assert.equal(res.error, 'Email address is required.');
    });
  });

  describe('validatePassword', () => {
    it('accepts passwords with 8 or more characters', () => {
      const res = validatePassword('elitePass123!');
      assert.equal(res.isValid, true);
      assert.equal(res.error, undefined);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const res = validatePassword('short');
      assert.equal(res.isValid, false);
      assert.equal(res.error, 'Password must be at least 8 characters long.');
    });

    it('rejects empty password', () => {
      const res = validatePassword('');
      assert.equal(res.isValid, false);
      assert.equal(res.error, 'Password is required.');
    });
  });

  describe('validateFullName', () => {
    it('accepts full name with 2 or more characters', () => {
      const res = validateFullName('John Doe');
      assert.equal(res.isValid, true);
      assert.equal(res.error, undefined);
    });

    it('rejects empty name', () => {
      const res = validateFullName('   ');
      assert.equal(res.isValid, false);
      assert.equal(res.error, 'Full name is required.');
    });

    it('rejects single character name', () => {
      const res = validateFullName('J');
      assert.equal(res.isValid, false);
      assert.equal(res.error, 'Name must be at least 2 characters long.');
    });
  });
});
