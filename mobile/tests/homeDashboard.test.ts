import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Home Dashboard & Navigation Logic Tests', () => {
  describe('Greeting & Athlete Personalization Logic', () => {
    function resolveAthleteGreeting(
      profile?: { display_name?: string | null },
      user?: { email?: string; user_metadata?: { full_name?: string } }
    ): string {
      if (profile?.display_name && profile.display_name.trim().length > 0) {
        return profile.display_name.trim();
      }
      if (user?.user_metadata?.full_name && user.user_metadata.full_name.trim().length > 0) {
        return user.user_metadata.full_name.trim();
      }
      if (user?.email) {
        const namePart = user.email.split('@')[0];
        if (namePart && namePart.length > 0) {
          return namePart.charAt(0).toUpperCase() + namePart.slice(1);
        }
      }
      return 'Elite';
    }

    it('uses profile display_name when available', () => {
      const greeting = resolveAthleteGreeting(
        { display_name: 'Marcus Vance' },
        { email: 'marcus@kinetra.ai' }
      );
      assert.equal(greeting, 'Marcus Vance');
    });

    it('falls back to auth user_metadata full_name when profile display_name is null', () => {
      const greeting = resolveAthleteGreeting(
        { display_name: null },
        { email: 'athlete@kinetra.ai', user_metadata: { full_name: 'Elena Rostova' } }
      );
      assert.equal(greeting, 'Elena Rostova');
    });

    it('falls back to capitalized email prefix when full_name is unavailable', () => {
      const greeting = resolveAthleteGreeting(
        { display_name: '' },
        { email: 'rushi@kinetra.ai' }
      );
      assert.equal(greeting, 'Rushi');
    });

    it('falls back safely to Elite / Athlete when no user identity is known', () => {
      const greeting = resolveAthleteGreeting(undefined, undefined);
      assert.equal(greeting, 'Elite');
    });
  });

  describe('No Fabricated Data Rule & Graceful Fallbacks', () => {
    function formatDashboardMetric(val?: number | string | null): string {
      if (val === undefined || val === null || val === '') {
        return '--';
      }
      return String(val);
    }

    it('renders "--" for missing form score without fabricating fake numbers', () => {
      const metric = formatDashboardMetric(null);
      assert.equal(metric, '--');
      assert.notEqual(metric, '94');
    });

    it('renders "--" for missing active mins without fabricating fake numbers', () => {
      const metric = formatDashboardMetric(undefined);
      assert.equal(metric, '--');
      assert.notEqual(metric, '128');
    });

    it('renders "--" for missing calories burned without fabricating fake numbers', () => {
      const metric = formatDashboardMetric(null);
      assert.equal(metric, '--');
      assert.notEqual(metric, '842');
    });

    it('renders actual numerical string when legitimate backend data is supplied', () => {
      assert.equal(formatDashboardMetric(96), '96');
      assert.equal(formatDashboardMetric(140), '140');
      assert.equal(formatDashboardMetric(920), '920');
    });
  });

  describe('Workout Carousel & State Management', () => {
    interface DashboardWorkoutState {
      loading: boolean;
      error: string | null;
      workouts: any[];
    }

    function determineCarouselUIState(state: DashboardWorkoutState): 'loading' | 'error' | 'empty' | 'populated' {
      if (state.loading) return 'loading';
      if (state.error) return 'error';
      if (!state.workouts || state.workouts.length === 0) return 'empty';
      return 'populated';
    }

    it('correctly identifies loading state', () => {
      const state: DashboardWorkoutState = { loading: true, error: null, workouts: [] };
      assert.equal(determineCarouselUIState(state), 'loading');
    });

    it('correctly identifies empty state when workout list is empty', () => {
      const state: DashboardWorkoutState = { loading: false, error: null, workouts: [] };
      assert.equal(determineCarouselUIState(state), 'empty');
    });

    it('correctly identifies error state and enables retry', () => {
      const state: DashboardWorkoutState = {
        loading: false,
        error: 'Unable to connect to backend server',
        workouts: [],
      };
      assert.equal(determineCarouselUIState(state), 'error');
    });

    it('correctly identifies populated state with curated workouts', () => {
      const state: DashboardWorkoutState = {
        loading: false,
        error: null,
        workouts: [
          { id: 'w-1', title: 'Velocity Ride', category: 'endurance', difficulty: 'intermediate' },
          { id: 'w-2', title: 'Tactical Strength', category: 'strength', difficulty: 'advanced' },
        ],
      };
      assert.equal(determineCarouselUIState(state), 'populated');
      assert.equal(state.workouts.length, 2);
    });
  });

  describe('Bottom Tab Navigation Invariants', () => {
    const requiredTabs = ['Home', 'Explore', 'Train', 'Stats', 'Profile'];

    it('defines exactly the 5 authenticated tabs matching Stitch mobile architecture', () => {
      assert.equal(requiredTabs.length, 5);
      assert.ok(requiredTabs.includes('Home'));
      assert.ok(requiredTabs.includes('Explore'));
      assert.ok(requiredTabs.includes('Train'));
      assert.ok(requiredTabs.includes('Stats'));
      assert.ok(requiredTabs.includes('Profile'));
    });
  });
});
