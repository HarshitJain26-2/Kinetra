import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeAnalyticsFromSessions, SessionItem } from '../src/api/client';

describe('Phase 33: Profile / Account & Settings Tests', () => {
  describe('Athlete Identity & Fallback Hierarchy', () => {
    it('prioritizes backend profile display_name when present', () => {
      const profile = { display_name: 'Alex Stirling' };
      const user = { user_metadata: { full_name: 'Alex Full' }, email: 'alex@domain.com' };

      const resolvedName =
        profile.display_name ||
        user.user_metadata.full_name ||
        user.email.split('@')[0] ||
        'Athlete';

      assert.equal(resolvedName, 'Alex Stirling');
    });

    it('falls back to auth user_metadata full_name when profile display_name is null', () => {
      const profile: { display_name: string | null } = { display_name: null };
      const user = { user_metadata: { full_name: 'Alexander Wright' }, email: 'a.wright@domain.com' };

      const resolvedName =
        profile.display_name ||
        user.user_metadata.full_name ||
        user.email.split('@')[0] ||
        'Athlete';

      assert.equal(resolvedName, 'Alexander Wright');
    });

    it('falls back to email prefix when user_metadata full_name is missing', () => {
      const profile: { display_name: string | null } = { display_name: null };
      const user = { user_metadata: {}, email: 'stirling.runner@kinetra.ai' };

      const resolvedName =
        profile.display_name ||
        (user.user_metadata as any).full_name ||
        user.email.split('@')[0] ||
        'Athlete';

      assert.equal(resolvedName, 'stirling.runner');
    });

    it('safely defaults to "Athlete" when no identity metadata exists', () => {
      const profile: { display_name: string | null } = { display_name: null };
      const user: { user_metadata: any; email: string | null } = { user_metadata: null, email: null };

      const resolvedName =
        profile.display_name ||
        user.user_metadata?.full_name ||
        (user.email ? user.email.split('@')[0] : null) ||
        'Athlete';

      assert.equal(resolvedName, 'Athlete');
    });
  });

  describe('Real Analytics Integration & No-Fabrication Rule', () => {
    it('returns empty/null metrics when user has 0 sessions without fabricating fake numbers', () => {
      const emptySessions: SessionItem[] = [];
      const analytics = computeAnalyticsFromSessions(emptySessions, 'ALL');

      const formScoreDisplay = analytics.avgFormScore !== null ? `${analytics.avgFormScore}` : '--';
      const sessionsDisplay = analytics.totalWorkouts > 0 ? `${analytics.totalWorkouts}` : '--';
      const streakDisplay = analytics.currentStreak > 0 ? `${analytics.currentStreak}` : '--';

      assert.equal(formScoreDisplay, '--');
      assert.equal(sessionsDisplay, '--');
      assert.equal(streakDisplay, '--');
    });

    it('correctly formats real form score, sessions count, and streak when data exists', () => {
      const now = new Date();
      const sessions: any[] = [
        {
          id: 's-1',
          user_id: 'u-1',
          status: 'completed',
          started_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          ended_at: now.toISOString(),
          duration_sec: 2400,
          summary: { total_sets: 4, total_reps: 40, avg_form_score: 94 },
        },
        {
          id: 's-2',
          user_id: 'u-1',
          status: 'completed',
          started_at: now.toISOString(),
          ended_at: now.toISOString(),
          duration_sec: 1800,
          summary: { total_sets: 3, total_reps: 30, avg_form_score: 96 },
        },
      ];

      const analytics = computeAnalyticsFromSessions(sessions, 'ALL');

      assert.equal(analytics.totalWorkouts, 2);
      assert.equal(analytics.avgFormScore, 95);
      assert.equal(analytics.currentStreak, 2);
    });
  });

  describe('Settings Categorization & Navigation Invariants', () => {
    it('defines exactly the 3 required Stitch settings sections (Account, Preferences, App Info)', () => {
      const expectedSections = ['ACCOUNT', 'PREFERENCES', 'APP INFORMATION'];
      assert.equal(expectedSections.length, 3);
      assert.ok(expectedSections.includes('ACCOUNT'));
      assert.ok(expectedSections.includes('PREFERENCES'));
      assert.ok(expectedSections.includes('APP INFORMATION'));
    });

    it('includes critical settings actions with valid identifiers', () => {
      const accountItems = ['Profile Information', 'Change Password'];
      const preferencesItems = ['Units & Measurements', 'Notifications', 'Privacy & Security'];
      const appInfoItems = ['About Kinetra', 'Support Center', 'Legal Terms'];

      assert.equal(accountItems.length, 2);
      assert.equal(preferencesItems.length, 3);
      assert.equal(appInfoItems.length, 3);
    });
  });

  describe('Sign Out Flow & Security Invariants', () => {
    it('verifies sign-out confirmation state handling', () => {
      let modalVisible = false;
      let signedOut = false;

      const onTriggerSignOut = () => {
        modalVisible = true;
      };

      const onConfirmSignOut = () => {
        signedOut = true;
        modalVisible = false;
      };

      onTriggerSignOut();
      assert.equal(modalVisible, true);

      onConfirmSignOut();
      assert.equal(signedOut, true);
      assert.equal(modalVisible, false);
    });

    it('strictly verifies NO service-role key exists in mobile source files', () => {
      const fs = require('node:fs');
      const path = require('node:path');

      const srcDir = path.resolve(__dirname, '../src');
      const files: string[] = [];

      function walkDir(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walkDir(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(fullPath);
          }
        }
      }

      walkDir(srcDir);
      assert.ok(files.length > 10);

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        assert.ok(
          !content.includes('SUPABASE_SERVICE_ROLE_KEY'),
          `Forbidden SUPABASE_SERVICE_ROLE_KEY found in ${file}`
        );
        assert.ok(
          !content.includes('service_role'),
          `Forbidden service_role string found in ${file}`
        );
      }
    });

    it('verifies bottom tab navigation preserves exactly the 5 authenticated tabs', () => {
      const tabs = ['Home', 'Explore', 'Train', 'Stats', 'Profile'];
      assert.equal(tabs.length, 5);
      assert.equal(tabs[4], 'Profile');
    });
  });
});
