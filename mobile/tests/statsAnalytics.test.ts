import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SessionItem,
  FullSessionItem,
  computeAnalyticsFromSessions,
  apiClient,
} from '../src/api/client';

describe('Phase 32: Stats / Progress & Analytics Dashboard Tests', () => {
  describe('Analytics Calculation & No Fabrication Rule', () => {
    it('returns null / zero metrics when sessions list is empty without fabricating fake numbers', () => {
      const result = computeAnalyticsFromSessions([], '30D');

      assert.equal(result.totalWorkouts, 0);
      assert.equal(result.activeMinutes, 0);
      assert.equal(result.caloriesBurned, null);
      assert.equal(result.avgFormScore, null);
      assert.equal(result.totalReps, null);
      assert.equal(result.currentStreak, 0);
      assert.equal(result.repTrend.length, 0);
      assert.equal(result.formScoreTrend.length, 0);
      assert.equal(result.durationTrend.length, 0);
      assert.equal(result.calorieTrend.length, 0);
    });

    it('accurately aggregates real session metrics when present', () => {
      const now = new Date();
      const sessions: FullSessionItem[] = [
        {
          id: 's-1',
          user_id: 'u-1',
          workout_id: 'w-1',
          status: 'completed',
          started_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3600 * 1000).toISOString(),
          duration_sec: 3600, // 60 mins
          calories_est: 350,
          notes: null,
          summary: {
            total_sets: 4,
            total_reps: 48,
            avg_form_score: 92,
            injury_flags_raised: 0,
          },
        },
        {
          id: 's-2',
          user_id: 'u-1',
          workout_id: 'w-2',
          status: 'completed',
          started_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 1800 * 1000).toISOString(),
          duration_sec: 1800, // 30 mins
          calories_est: 180,
          notes: null,
          summary: {
            total_sets: 3,
            total_reps: 36,
            avg_form_score: 96,
            injury_flags_raised: 0,
          },
        },
      ];

      const result = computeAnalyticsFromSessions(sessions, '30D');

      assert.equal(result.totalWorkouts, 2);
      assert.equal(result.activeMinutes, 90);
      assert.equal(result.caloriesBurned, 530);
      assert.equal(result.totalReps, 84);
      assert.equal(result.avgFormScore, 94); // (92 + 96) / 2
      assert.equal(result.durationTrend.length, 2);
      assert.equal(result.formScoreTrend.length, 2);
      assert.equal(result.repTrend.length, 2);
      assert.equal(result.calorieTrend.length, 2);
    });

    it('filters sessions strictly by selected time range (7D vs 30D vs 90D vs ALL)', () => {
      const now = new Date();
      const sessions: SessionItem[] = [
        {
          id: 's-recent',
          user_id: 'u-1',
          workout_id: null,
          status: 'completed',
          started_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date().toISOString(),
          duration_sec: 1800,
          calories_est: 200,
          notes: null,
        },
        {
          id: 's-month-ago',
          user_id: 'u-1',
          workout_id: null,
          status: 'completed',
          started_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date().toISOString(),
          duration_sec: 2400,
          calories_est: 280,
          notes: null,
        },
        {
          id: 's-old',
          user_id: 'u-1',
          workout_id: null,
          status: 'completed',
          started_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date().toISOString(),
          duration_sec: 3000,
          calories_est: 320,
          notes: null,
        },
      ];

      const res7D = computeAnalyticsFromSessions(sessions, '7D');
      assert.equal(res7D.totalWorkouts, 1);

      const res30D = computeAnalyticsFromSessions(sessions, '30D');
      assert.equal(res30D.totalWorkouts, 2);

      const res90D = computeAnalyticsFromSessions(sessions, '90D');
      assert.equal(res90D.totalWorkouts, 3);

      const resALL = computeAnalyticsFromSessions(sessions, 'ALL');
      assert.equal(resALL.totalWorkouts, 3);
    });

    it('calculates consecutive workout day streak correctly', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

      const sessions: SessionItem[] = [
        {
          id: 's-1',
          user_id: 'u-1',
          workout_id: null,
          status: 'completed',
          started_at: today.toISOString(),
          ended_at: today.toISOString(),
          duration_sec: 1800,
          calories_est: 200,
          notes: null,
        },
        {
          id: 's-2',
          user_id: 'u-1',
          workout_id: null,
          status: 'completed',
          started_at: yesterday.toISOString(),
          ended_at: yesterday.toISOString(),
          duration_sec: 1800,
          calories_est: 200,
          notes: null,
        },
        {
          id: 's-3',
          user_id: 'u-1',
          workout_id: null,
          status: 'completed',
          started_at: twoDaysAgo.toISOString(),
          ended_at: twoDaysAgo.toISOString(),
          duration_sec: 1800,
          calories_est: 200,
          notes: null,
        },
      ];

      const result = computeAnalyticsFromSessions(sessions, 'ALL');
      assert.equal(result.currentStreak, 3);
    });

    it('handles null / malformed session entries gracefully without throwing', () => {
      const malformed: any[] = [
        null,
        undefined,
        { id: 'bad-1', status: 'cancelled' },
        { id: 'bad-2', status: 'completed', started_at: 'invalid-date' },
      ];

      const result = computeAnalyticsFromSessions(malformed, '30D');
      assert.ok(result);
      assert.equal(typeof result.totalWorkouts, 'number');
    });
  });

  describe('API Client Methods & Security Invariants', () => {
    it('defines getUserSessions and getSessionById methods on apiClient', () => {
      assert.equal(typeof apiClient.getUserSessions, 'function');
      assert.equal(typeof apiClient.getSessionById, 'function');
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
  });
});
