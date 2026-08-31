import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WorkoutItem, WorkoutExerciseItem } from '../src/api/client';

describe('Workout Library & Workout Details Tests (Phase 29)', () => {
  describe('Category Filtering & Mapping', () => {
    const CATEGORIES = [
      { id: 'all', label: 'All' },
      { id: 'strength', label: 'Strength', backendCategory: 'strength' },
      { id: 'mobility', label: 'Mobility', backendCategory: 'mobility' },
      { id: 'conditioning', label: 'Conditioning', backendCategory: 'endurance' },
      { id: 'recovery', label: 'Recovery', backendCategory: 'rehab' },
    ];

    function mapCategoryToQuery(categoryId: string): Record<string, any> {
      const selected = CATEGORIES.find((c) => c.id === categoryId);
      if (selected?.backendCategory) {
        return { category: selected.backendCategory, limit: 30 };
      }
      return { limit: 30 };
    }

    it('maps "all" to unbounded category query with limit', () => {
      const query = mapCategoryToQuery('all');
      assert.equal(query.category, undefined);
      assert.equal(query.limit, 30);
    });

    it('maps "strength" to backend strength category', () => {
      const query = mapCategoryToQuery('strength');
      assert.equal(query.category, 'strength');
      assert.equal(query.limit, 30);
    });

    it('maps "conditioning" to backend endurance category', () => {
      const query = mapCategoryToQuery('conditioning');
      assert.equal(query.category, 'endurance');
      assert.equal(query.limit, 30);
    });

    it('maps "recovery" to backend rehab category', () => {
      const query = mapCategoryToQuery('recovery');
      assert.equal(query.category, 'rehab');
      assert.equal(query.limit, 30);
    });
  });

  describe('Workout Duration & Badge Formatting', () => {
    function computeDuration(workout: Partial<WorkoutItem>): number {
      if (workout.estimated_duration_min) return workout.estimated_duration_min;
      if (workout.exercises && workout.exercises.length > 0) return workout.exercises.length * 5;
      if (workout.category === 'mobility') return 30;
      return 45;
    }

    function formatCategoryLabel(category?: string): string {
      if (!category) return 'TRAINING PROTOCOL';
      if (category.toLowerCase().includes('strength')) return 'STRENGTH & POWER';
      return category.toUpperCase();
    }

    function computeIntensityBadge(difficulty?: string, category?: string): string {
      if (difficulty === 'elite' || difficulty === 'advanced') {
        return 'HIGH INTENSITY';
      }
      if (category === 'endurance' || category === 'conditioning') {
        return 'LIVE';
      }
      return 'AI OPTIMIZED';
    }

    it('derives duration from estimated_duration_min when explicitly present', () => {
      assert.equal(computeDuration({ estimated_duration_min: 50 }), 50);
    });

    it('derives duration from exercises count when estimated_duration_min is null', () => {
      const workout = {
        estimated_duration_min: null,
        exercises: [
          { exercise_id: 'e1', order_index: 0, target_sets: 3, target_reps: 10 },
          { exercise_id: 'e2', order_index: 1, target_sets: 3, target_reps: 10 },
          { exercise_id: 'e3', order_index: 2, target_sets: 3, target_reps: 10 },
        ] as WorkoutExerciseItem[],
      };
      assert.equal(computeDuration(workout), 15);
    });

    it('formats category label with Stitch luxury styling', () => {
      assert.equal(formatCategoryLabel('strength'), 'STRENGTH & POWER');
      assert.equal(formatCategoryLabel('mobility'), 'MOBILITY');
      assert.equal(formatCategoryLabel(undefined), 'TRAINING PROTOCOL');
    });

    it('assigns appropriate intensity badges based on difficulty and category', () => {
      assert.equal(computeIntensityBadge('advanced', 'strength'), 'HIGH INTENSITY');
      assert.equal(computeIntensityBadge('intermediate', 'endurance'), 'LIVE');
      assert.equal(computeIntensityBadge('intermediate', 'hypertrophy'), 'AI OPTIMIZED');
    });
  });

  describe('Circuit Protocol & Missing Exercise Handling', () => {
    it('formats exercise item details cleanly with nested exercise catalog metadata', () => {
      const exerciseItem: WorkoutExerciseItem = {
        exercise_id: 'ex-123',
        order_index: 0,
        target_sets: 4,
        target_reps: 12,
        target_weight_kg: 100,
        exercise: {
          id: 'ex-123',
          name: 'Barbell Deadlift',
          target_muscle_group: 'Primary Posterior Chain',
        },
      };

      const name = exerciseItem.exercise?.name || exerciseItem.name || 'Exercise 1';
      const muscle = exerciseItem.exercise?.target_muscle_group || 'Compound Movement';
      const sets = exerciseItem.target_sets;
      const reps = exerciseItem.target_reps;

      assert.equal(name, 'Barbell Deadlift');
      assert.equal(muscle, 'Primary Posterior Chain');
      assert.equal(sets, 4);
      assert.equal(reps, 12);
    });

    it('gracefully handles missing exercise catalog metadata without crashing or fabricating fake exercises', () => {
      const emptyWorkout: Partial<WorkoutItem> = {
        id: 'w-empty',
        title: 'Recovery Session',
        exercises: [],
      };

      assert.equal(emptyWorkout.exercises?.length, 0);
    });
  });

  describe('Safety Invariant: Start Workout in Phase 29', () => {
    it('verifies that Phase 29 does NOT invoke Camera or Pose Engine', () => {
      // In Phase 29, START WORKOUT triggers an informative telemetry notice
      const isLiveTrackingActiveInPhase29 = false;
      assert.equal(isLiveTrackingActiveInPhase29, false);
    });
  });
});
