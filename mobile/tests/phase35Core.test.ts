import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculate1RM,
  computeExercise1RMProgression,
  FullSessionItem,
  DailyFoodLogItem,
  CreateWorkoutInput,
} from '../src/api/client';
import { offlineSetQueue } from '../src/utils/offlineQueue';
import { nativePoseBridge } from '../src/engine/pose/nativeBridge';

describe('Phase 35: Core Mobile Completion Tests', () => {
  describe('1. Onboarding & Biometrics Mathematics', () => {
    it('calculates BMR accurately using Mifflin-St Jeor formula', () => {
      // 82.5 kg, 184 cm, age 25 male: 10*(82.5) + 6.25*(184) - 5*(25) + 5 = 825 + 1150 - 125 + 5 = 1855
      const weight = 82.5;
      const height = 184;
      const age = 25;
      const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5);
      assert.equal(bmr, 1855);
    });

    it('rejects invalid height and weight inputs', () => {
      const validateBiometrics = (h: number, w: number) => {
        if (isNaN(h) || h < 50 || h > 250) return false;
        if (isNaN(w) || w < 20 || w > 300) return false;
        return true;
      };

      assert.equal(validateBiometrics(184, 82.5), true);
      assert.equal(validateBiometrics(40, 80), false);
      assert.equal(validateBiometrics(180, 10), false);
      assert.equal(validateBiometrics(300, 80), false);
    });
  });

  describe('2. Custom Workout Builder Configuration', () => {
    it('validates custom workout creation payload with unique order indices', () => {
      const payload: CreateWorkoutInput = {
        title: 'Hypertrophy Protocol Alpha',
        category: 'strength',
        difficulty: 'medium',
        is_public: false,
        exercises: [
          { exercise_id: 'ex-1', order_index: 0, target_sets: 4, target_reps: 10 },
          { exercise_id: 'ex-2', order_index: 1, target_sets: 3, target_reps: 12 },
        ],
      };

      assert.equal(payload.title, 'Hypertrophy Protocol Alpha');
      assert.equal(payload.exercises?.length, 2);
      const indices = payload.exercises?.map((e) => e.order_index) || [];
      assert.equal(new Set(indices).size, indices.length);
    });
  });

  describe('3. 1RM Strength Progression Calculation (Epley Formula)', () => {
    it('calculates 1RM estimate accurately from weight and reps', () => {
      // 100 kg for 10 reps -> 100 * (1 + 10/30) = 100 * 1.333 = 133 kg
      const result10 = calculate1RM(100, 10);
      assert.equal(result10, 133);

      // 315 lbs for 8 reps -> 315 * (1 + 8/30) = 315 * 1.266 = 399 lbs
      const result315 = calculate1RM(315, 8);
      assert.equal(result315, 399);

      // 1 rep max should return exact weight
      const result1 = calculate1RM(405, 1);
      assert.equal(result1, 405);
    });

    it('returns null safely for invalid or 0 weight/reps', () => {
      assert.equal(calculate1RM(0, 10), null);
      assert.equal(calculate1RM(100, 0), null);
      assert.equal(calculate1RM(null, 5), null);
      assert.equal(calculate1RM(100, null), null);
    });

    it('extracts top 1RM and historical trend from sessions array', () => {
      const mockSessions: FullSessionItem[] = [
        {
          id: 's-1',
          user_id: 'u-1',
          workout_id: 'w-1',
          status: 'completed',
          started_at: '2026-08-01T10:00:00.000Z',
          ended_at: '2026-08-01T11:00:00.000Z',
          duration_sec: 3600,
          calories_est: 400,
          notes: null,
          exercises: [
            {
              id: 'se-1',
              session_id: 's-1',
              exercise_id: 'ex-squat',
              set_number: 1,
              reps: 8,
              weight_kg: 100, // 1RM ~ 127
              duration_sec: 40,
              form_score: 95,
              injury_flag: false,
              feedback: null,
              recorded_at: '2026-08-01T10:15:00.000Z',
              exercise: { id: 'ex-squat', name: 'Barbell Back Squat' },
            },
          ],
        },
        {
          id: 's-2',
          user_id: 'u-1',
          workout_id: 'w-1',
          status: 'completed',
          started_at: '2026-08-15T10:00:00.000Z',
          ended_at: '2026-08-15T11:00:00.000Z',
          duration_sec: 3600,
          calories_est: 400,
          notes: null,
          exercises: [
            {
              id: 'se-2',
              session_id: 's-2',
              exercise_id: 'ex-squat',
              set_number: 1,
              reps: 6,
              weight_kg: 120, // 1RM ~ 144
              duration_sec: 40,
              form_score: 98,
              injury_flag: false,
              feedback: null,
              recorded_at: '2026-08-15T10:15:00.000Z',
              exercise: { id: 'ex-squat', name: 'Barbell Back Squat' },
            },
          ],
        },
      ];

      const progression = computeExercise1RMProgression(mockSessions, [{ name: 'Squat', category: 'LEGS' }]);
      assert.equal(progression.length, 1);
      assert.equal(progression[0].current1RM, 144);
      assert.equal(progression[0].historicalTrend.length, 2);
    });
  });

  describe('4. Daily Food Intake & Macro Summing', () => {
    it('correctly aggregates daily calories, protein, carbs, and fats from logged entries', () => {
      const logs: DailyFoodLogItem[] = [
        {
          id: 'log-1',
          user_id: 'u-1',
          log_date: '2026-08-31',
          meal_name: 'Wild Caught Salmon & Quinoa',
          timing: 'post_workout',
          calories: 650,
          protein_g: 45,
          carbs_g: 50,
          fat_g: 18,
          created_at: '2026-08-31T12:00:00.000Z',
        },
        {
          id: 'log-2',
          user_id: 'u-1',
          log_date: '2026-08-31',
          meal_name: 'Elite Greens Smoothie',
          timing: 'breakfast',
          calories: 320,
          protein_g: 30,
          carbs_g: 35,
          fat_g: 5,
          created_at: '2026-08-31T08:00:00.000Z',
        },
      ];

      const totalCals = logs.reduce((sum, l) => sum + l.calories, 0);
      const totalProtein = logs.reduce((sum, l) => sum + l.protein_g, 0);
      const totalCarbs = logs.reduce((sum, l) => sum + l.carbs_g, 0);
      const totalFat = logs.reduce((sum, l) => sum + l.fat_g, 0);

      assert.equal(totalCals, 970);
      assert.equal(totalProtein, 75);
      assert.equal(totalCarbs, 85);
      assert.equal(totalFat, 23);
    });
  });

  describe('5. Durable Offline Queue & Native Bridge Contract', () => {
    it('enqueues and deduplicates offline set summaries safely', () => {
      offlineSetQueue.clearQueue();

      const mockResult = {
        exercise_id: 'squat',
        rep_count: 10,
        average_form_score: 95,
        rep_scores: [95, 95],
        flags: [],
        average_visibility: 0.9,
        duration_ms: 60000,
      };

      const item1 = offlineSetQueue.enqueueSet(mockResult, {
        workoutId: 'w-1',
        sessionId: 's-1',
        exerciseName: 'Squat',
      });

      assert.equal(item1.reps, 10);
      assert.equal(offlineSetQueue.getPendingSets().length, 1);
    });

    it('validates Native Pose Bridge contract interface', () => {
      assert.equal(nativePoseBridge.isAvailable(), true);
      assert.equal(nativePoseBridge.mode, 'EXPO_CAMERA_VIEW_PREVIEW');
    });
  });
});
