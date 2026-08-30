/**
 * Kinetra Pose Analysis Core Engine — Exercise Config Parser
 *
 * Normalises the raw pose_landmarks JSONB stored in the exercises table
 * into a clean, typed ExerciseAnalysisConfig the PoseEngine can consume.
 *
 * Handles all key-name variants present in Migration 002 seed data.
 * Safe to call with null — returns a deterministic default config.
 *
 * Framework-independent: no Express, Supabase, or HTTP imports.
 */

import type { ExerciseAnalysisConfig, AngleRule, RepRule } from './types.js';

/**
 * Parse and normalise the raw pose_landmarks JSONB from exercises.pose_landmarks
 * into a typed ExerciseAnalysisConfig.
 *
 * @param exerciseId   - The exercise's UUID from the catalog
 * @param exerciseName - Human-readable name used in feedback strings
 * @param raw          - Raw JSONB object from exercises.pose_landmarks (may be null)
 * @returns            - A fully valid ExerciseAnalysisConfig with safe defaults
 */
export function parsePoseConfig(
  exerciseId: string,
  exerciseName: string,
  raw: Record<string, any> | null | undefined
): ExerciseAnalysisConfig {
  const data = raw ?? {};

  // ── 1. Extract landmark names ────────────────────────────────────────────
  // Seed data uses "keypoints"; future normalised schema uses "required_landmarks"
  const keypoints: string[] = Array.isArray(data.keypoints)
    ? (data.keypoints as string[])
    : Array.isArray(data.required_landmarks)
    ? (data.required_landmarks as string[])
    : [];

  // Primary joint triplet: first three keypoints define the dominant-side joint
  const proximal = keypoints[0] ?? 'left_hip';
  const vertex   = keypoints[1] ?? 'left_knee';
  const distal   = keypoints[2] ?? 'left_ankle';

  // ── 2. Resolve target angle (9 legacy key-name variants in seed data) ────
  const targetAngle: number = resolveFiniteNumber(
    [
      data.target_angle,
      // target_angle_range: [min, max] — Bicep Curl
      Array.isArray(data.target_angle_range) ? (data.target_angle_range[0] as number) : undefined,
      // Lunges
      data.knee_angle_target,
      // Leg Press
      data.knee_flexion_target,
      // Tricep Dips
      data.elbow_flexion_target,
      // Romanian Deadlift
      data.hip_hinge_depth,
      // Shoulder Press (lock-out)
      data.lockout_angle,
      // Russian Twist
      data.rotation_angle_min,
      // Lateral Raise
      data.arm_abduction_max_deg,
    ],
    90 // safe fallback: right-angle depth
  );

  // ── 3. Resolve rest angle ────────────────────────────────────────────────
  // Not present in any current seed exercise; inferred from target_angle direction.
  const restAngle: number = resolveFiniteNumber(
    [data.rest_angle, data.restAngle],
    inferRestAngle(targetAngle)
  );

  // ── 4. Resolve threshold tolerance ──────────────────────────────────────
  const thresholdTolerance: number = resolveFiniteNumber(
    [data.threshold_tolerance, data.thresholdTolerance],
    10
  );

  // ── 5. Resolve minimum visibility ───────────────────────────────────────
  const minVisibility: number = resolveFiniteNumber(
    [data.min_visibility, data.minVisibility],
    0.5
  );

  // ── 6. Build normalised angle rule ───────────────────────────────────────
  // Named "<vertex>_angle" so output keys are self-documenting
  const angleName = `${vertex}_angle`;
  const angleRule: AngleRule = {
    name: angleName,
    proximal,
    vertex,
    distal,
  };

  // ── 7. Build rep rule ────────────────────────────────────────────────────
  const repRule: RepRule = {
    angle_name: angleName,
    rest_angle: restAngle,
    target_angle: targetAngle,
    threshold_tolerance: thresholdTolerance,
  };

  // ── 8. Extract form rules if present ─────────────────────────────────────
  const formRules = Array.isArray(data.form_rules)
    ? data.form_rules
    : Array.isArray(data.formRules)
    ? data.formRules
    : undefined;

  return {
    exercise_id: exerciseId,
    exercise_name: exerciseName,
    required_landmarks:
      keypoints.length > 0 ? keypoints : [proximal, vertex, distal],
    angle_rules: [angleRule],
    rep_rule: repRule,
    min_visibility: minVisibility,
    ...(formRules ? { form_rules: formRules } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the first candidate that is a finite number; otherwise return fallback.
 */
function resolveFiniteNumber(
  candidates: (number | undefined | null)[],
  fallback: number
): number {
  for (const v of candidates) {
    if (v !== undefined && v !== null && Number.isFinite(v)) {
      return v;
    }
  }
  return fallback;
}

/**
 * Infer a sensible rest angle from the target angle.
 *
 * Low target angles (e.g. 90° squat depth) → rest at high angle (160° standing).
 * High target angles (e.g. 175° lock-out) → rest at low angle (45°).
 */
function inferRestAngle(targetAngle: number): number {
  // Standard threshold: exercises with a target below 120° are "decreasing" movements
  return targetAngle < 120 ? 160 : 45;
}
