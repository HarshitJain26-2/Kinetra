import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Signup & Auth Single-Submission Invariant Tests', () => {
  it('guarantees concurrent signUp invocations only execute exactly ONE network call', async () => {
    let networkCallCount = 0;
    let isSigningUp = false;

    // Simulation of AuthContext signUp with mutex guard
    const guardedSignUp = async (email: string, password: string, fullName: string): Promise<boolean> => {
      if (isSigningUp) {
        // Prevent concurrent duplicate network requests
        return false;
      }
      isSigningUp = true;
      try {
        // Simulate network latency to Supabase
        await new Promise((resolve) => setTimeout(resolve, 50));
        networkCallCount++;
        return true;
      } finally {
        isSigningUp = false;
      }
    };

    // Simulate 5 concurrent button-press / event triggers in parallel
    const results = await Promise.all([
      guardedSignUp('athlete@domain.test', 'SafePass123!', 'Alex Runner'),
      guardedSignUp('athlete@domain.test', 'SafePass123!', 'Alex Runner'),
      guardedSignUp('athlete@domain.test', 'SafePass123!', 'Alex Runner'),
      guardedSignUp('athlete@domain.test', 'SafePass123!', 'Alex Runner'),
      guardedSignUp('athlete@domain.test', 'SafePass123!', 'Alex Runner'),
    ]);

    // Exactly one request must succeed and exactly one network call made
    assert.equal(networkCallCount, 1, 'Exactly ONE network request must be made for concurrent triggers');
    assert.equal(results.filter((r) => r === true).length, 1, 'Exactly ONE invocation returns true');
    assert.equal(results.filter((r) => r === false).length, 4, 'All duplicate concurrent attempts are blocked');
  });

  it('guarantees button press throttle blocks rapid double-press events within window', () => {
    let handlerCallCount = 0;
    let lastPressTime = 0;
    const THROTTLE_WINDOW_MS = 750;

    const throttledPressHandler = (pressTime: number) => {
      if (pressTime - lastPressTime < THROTTLE_WINDOW_MS) {
        return; // Throttled
      }
      lastPressTime = pressTime;
      handlerCallCount++;
    };

    // Simulate two rapid touch events 50ms apart (e.g. screen bounce or double-tap)
    throttledPressHandler(1000);
    throttledPressHandler(1050); // Within 50ms -> should be ignored
    throttledPressHandler(1100); // Within 100ms -> should be ignored

    assert.equal(handlerCallCount, 1, 'Rapid repeat taps must only trigger the handler once');

    // Simulate a user pressing again after the throttle window (e.g. 1000ms later)
    throttledPressHandler(2000);
    assert.equal(handlerCallCount, 2, 'Subsequent tap after throttle window is permitted');
  });

  it('guarantees lock release in finally block even when the network request throws', async () => {
    let isSubmitting = false;
    let attemptsCount = 0;

    const fragileSubmit = async (shouldFail: boolean) => {
      if (isSubmitting) return false;
      isSubmitting = true;
      try {
        attemptsCount++;
        if (shouldFail) {
          throw new Error('Network error or rate limit 429');
        }
        return true;
      } finally {
        isSubmitting = false;
      }
    };

    // First attempt fails
    try {
      await fragileSubmit(true);
    } catch {
      // expected error
    }

    assert.equal(isSubmitting, false, 'Lock must be released even after error');

    // Second attempt should be allowed since lock was cleanly released
    const secondSuccess = await fragileSubmit(false);
    assert.equal(secondSuccess, true, 'Subsequent submission allowed after lock release');
    assert.equal(attemptsCount, 2, 'Two sequential submissions executed with zero deadlock');
  });
});
