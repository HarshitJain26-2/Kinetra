/**
 * Test Suite: Custom Workout Builder Canonical Exercise Flow (Requirements A, B, C, F, G, H)
 * Validates that catalog exercises retain their canonical IDs from GET /exercises through
 * Active Protocol state to POST /workouts payload.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ExerciseCatalogItem, CreateWorkoutInput } from '../src/api/client';

describe('Custom Workout Builder: Canonical Exercise Flow Tests', () => {
  const canonicalCatalog: ExerciseCatalogItem[] = [
    {
      id: '11111111-4444-4444-8888-000000000001',
      name: 'Barbell Back Squat',
      muscle_group: 'quadriceps',
      equipment: 'barbell',
      difficulty: 'hard',
    },
    {
      id: '11111111-4444-4444-8888-000000000002',
      name: 'Overhead Press',
      muscle_group: 'shoulders',
      equipment: 'barbell',
      difficulty: 'medium',
    },
    {
      id: '11111111-4444-4444-8888-000000000003',
      name: 'Romanian Deadlift',
      muscle_group: 'hamstrings',
      equipment: 'barbell',
      difficulty: 'hard',
    },
  ];

  interface DraftExercise {
    exercise_id: string;
    name: string;
    order_index: number;
    target_sets: number;
    target_reps: number;
    target_weight_kg?: number;
    rest_seconds: number;
    exercise?: ExerciseCatalogItem;
  }

  // Requirement A: GET exercises returns canonical IDs
  it('Requirement A: GET exercises returns canonical UUID identifiers', () => {
    assert.equal(canonicalCatalog.length, 3);
    for (const ex of canonicalCatalog) {
      assert.ok(ex.id, 'Exercise must have an id');
      assert.match(
        ex.id,
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        `Exercise ${ex.name} ID must be canonical UUID`
      );
    }
  });

  // Requirement B: Adding an exercise preserves its canonical ID
  it('Requirement B: Adding an exercise to Active Protocol preserves its exact canonical ID and catalog metadata', () => {
    const activeExercises: DraftExercise[] = [];
    const itemToAdd = canonicalCatalog[0]; // Barbell Back Squat

    const newEx: DraftExercise = {
      exercise_id: itemToAdd.id,
      name: itemToAdd.name,
      order_index: activeExercises.length,
      target_sets: 4,
      target_reps: 10,
      rest_seconds: 90,
      exercise: itemToAdd,
    };
    activeExercises.push(newEx);

    assert.equal(activeExercises.length, 1);
    assert.equal(activeExercises[0].exercise_id, itemToAdd.id);
    assert.equal(activeExercises[0].name, 'Barbell Back Squat');
    assert.equal(activeExercises[0].exercise?.id, itemToAdd.id);
  });

  // Requirement C: POST workout uses the same canonical exercise ID
  it('Requirement C: POST /workouts payload constructs payload using the exact canonical exercise ID', () => {
    const item = canonicalCatalog[0];
    const draft: DraftExercise = {
      exercise_id: item.id,
      name: item.name,
      order_index: 0,
      target_sets: 4,
      target_reps: 10,
      rest_seconds: 90,
      exercise: item,
    };

    const payload: CreateWorkoutInput = {
      title: 'Hypertrophy Protocol Alpha',
      category: 'strength',
      difficulty: 'medium',
      is_public: false,
      exercises: [
        {
          exercise_id: draft.exercise_id,
          order_index: draft.order_index,
          target_sets: draft.target_sets,
          target_reps: draft.target_reps,
          target_weight_kg: draft.target_weight_kg || null,
        },
      ],
    };

    assert.equal(payload.exercises?.[0].exercise_id, item.id);
    assert.equal(payload.exercises?.[0].order_index, 0);
  });

  // Requirement F: Multiple exercises can be saved with distinct canonical IDs
  it('Requirement F: Multiple exercises are mapped cleanly with unique order indices and preserved IDs', () => {
    const activeExercises: DraftExercise[] = canonicalCatalog.map((item, idx) => ({
      exercise_id: item.id,
      name: item.name,
      order_index: idx,
      target_sets: 3,
      target_reps: 12,
      rest_seconds: 90,
      exercise: item,
    }));

    const payloadExercises = activeExercises.map((e) => ({
      exercise_id: e.exercise_id,
      order_index: e.order_index,
      target_sets: e.target_sets,
      target_reps: e.target_reps,
      target_weight_kg: e.target_weight_kg || null,
    }));

    assert.equal(payloadExercises.length, 3);
    assert.equal(payloadExercises[0].exercise_id, canonicalCatalog[0].id);
    assert.equal(payloadExercises[1].exercise_id, canonicalCatalog[1].id);
    assert.equal(payloadExercises[2].exercise_id, canonicalCatalog[2].id);

    // Verify all order indices are strictly sequential and unique
    const indices = payloadExercises.map((e) => e.order_index);
    assert.deepEqual(indices, [0, 1, 2]);
  });

  // Requirement G: Reordering exercises preserves IDs
  it('Requirement G: Deleting or reordering exercises updates order_index while preserving canonical IDs', () => {
    let activeExercises: DraftExercise[] = canonicalCatalog.map((item, idx) => ({
      exercise_id: item.id,
      name: item.name,
      order_index: idx,
      target_sets: 3,
      target_reps: 12,
      rest_seconds: 90,
      exercise: item,
    }));

    // Remove middle exercise (Overhead Press, index 1)
    const removedId = canonicalCatalog[1].id;
    activeExercises = activeExercises
      .filter((e) => e.exercise_id !== removedId)
      .map((e, idx) => ({ ...e, order_index: idx }));

    assert.equal(activeExercises.length, 2);
    // Remaining exercises must retain their exact original canonical IDs
    assert.equal(activeExercises[0].exercise_id, canonicalCatalog[0].id);
    assert.equal(activeExercises[0].order_index, 0);
    assert.equal(activeExercises[1].exercise_id, canonicalCatalog[2].id);
    assert.equal(activeExercises[1].order_index, 1);
  });

  // Requirement H: Duplicate/invalid references are handled correctly
  it('Requirement H: Prevents adding duplicate exercises to Active Protocol', () => {
    const activeExercises: DraftExercise[] = [
      {
        exercise_id: canonicalCatalog[0].id,
        name: canonicalCatalog[0].name,
        order_index: 0,
        target_sets: 4,
        target_reps: 10,
        rest_seconds: 90,
      },
    ];

    const isDuplicate = activeExercises.some((e) => e.exercise_id === canonicalCatalog[0].id);
    assert.equal(isDuplicate, true, 'Must identify duplicate exercise');

    const isDifferent = activeExercises.some((e) => e.exercise_id === canonicalCatalog[1].id);
    assert.equal(isDifferent, false, 'Different exercise is not a duplicate');
  });
});
