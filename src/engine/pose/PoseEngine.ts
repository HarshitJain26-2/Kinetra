/**
 * Kinetra Pose Analysis Core Engine — PoseEngine
 *
 * Framework-independent analysis module.
 *
 * DEPENDENCIES (all pure, no I/O):
 *   calculateJointAngle   — src/utils/geometry.ts  (REUSED — do not duplicate)
 *   ExerciseRepCounter    — src/utils/geometry.ts  (REUSED — do not duplicate)
 *
 * NO imports from:
 *   - express / any HTTP library
 *   - @supabase/supabase-js
 *   - src/config/*
 *   - src/middleware/*
 *   - src/controllers/*
 *   - src/routes/*
 *   - src/services/*  (PoseAnalysisService is the persistence layer above this)
 */

import {
  calculateJointAngle,
  ExerciseRepCounter,
  type LandmarkPoint,
  type LandmarkMap,
} from '../../utils/geometry.js';

import { analyzeForm } from './formAnalyzer.js';

import type {
  PoseFrame,
  ExerciseAnalysisConfig,
  PoseAnalysisResult,
  FormFlag,
} from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// PoseEngine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Core pose-analysis engine.
 *
 * Responsibilities:
 *   1. Convert named PoseFrame landmarks into LandmarkMap records.
 *   2. Apply visibility filtering to discard low-confidence keypoints.
 *   3. Compute joint angles using calculateJointAngle (geometry.ts).
 *   4. Feed angles into ExerciseRepCounter state machine (geometry.ts).
 *   5. Evaluate form rules via formAnalyzer.ts (Phase 20).
 *   6. Aggregate per-rep scores, overall form score, and form quality alerts.
 *   7. Return a PoseAnalysisResult that maps cleanly onto PoseAnalysisSetSummaryInput.
 *
 * Each call to PoseEngine.analyze() is stateless — a fresh ExerciseRepCounter
 * is created for every invocation. This represents one complete exercise set.
 * The caller does not need to manage counter lifecycle.
 */
export class PoseEngine {
  /**
   * Analyse a chronologically ordered batch of pose frames for one exercise set.
   *
   * @param config  - Normalised exercise configuration (from parsePoseConfig or direct)
   * @param frames  - Ordered frames from any detector (MediaPipe, TFLite, synthetic)
   * @returns       - Complete analysis result including rep count, form score, angles, and flags
   *
   * @example
   * ```ts
   * const config = parsePoseConfig(exerciseRow.id, exerciseRow.name, exerciseRow.pose_landmarks);
   * const output = PoseEngine.analyze(config, frames);
   *
   * // Wire result into the existing Phase 10 DB persistence layer:
   * await PoseAnalysisService.submitSetAnalysis(userId, {
   *   session_id,
   *   exercise_id: config.exercise_id,
   *   reps:                output.rep_count,
   *   form_score:          output.average_form_score,
   *   rep_scores:          output.rep_scores,
   *   injury_flag:         output.flags.some(f => f.severity === 'high'),
   *   flagged_body_parts:  output.flags.filter(f => f.severity === 'high').map(f => f.flag),
   * });
   * ```
   */
  static analyze(
    config: ExerciseAnalysisConfig,
    frames: PoseFrame[]
  ): PoseAnalysisResult {
    const { rep_rule, angle_rules, min_visibility = 0.5, form_rules = [] } = config;

    // Fresh counter per call — each analyze() represents one exercise set.
    // ExerciseRepCounter handles both decreasing (squat) and increasing (leg press) motion
    // by comparing targetAngle with restAngle internally.
    const counter = new ExerciseRepCounter({
      restAngle:          rep_rule.rest_angle,
      targetAngle:        rep_rule.target_angle,
      thresholdTolerance: rep_rule.threshold_tolerance,
    });

    let lastAngles: Record<string, number> = {};
    let lastStage  = 'REST';
    let totalVisibility = 0;
    let visibilitySamples = 0;
    const flags: FormFlag[] = [];

    for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
      const frame = frames[frameIdx];

      // Convert named PoseLandmark[] → Record<name, LandmarkPoint>
      const landmarkMap = frameToLandmarkMap(frame);

      // ── Compute all configured angle measurements ──────────────────────
      const frameAngles: Record<string, number> = {};
      for (const rule of angle_rules) {
        const a = getVisibleLandmark(landmarkMap, rule.proximal, min_visibility);
        const b = getVisibleLandmark(landmarkMap, rule.vertex,   min_visibility);
        const c = getVisibleLandmark(landmarkMap, rule.distal,   min_visibility);

        // calculateJointAngle handles null/undefined inputs and always returns a
        // finite, non-NaN number (0 for degenerate inputs). Verified by Phase 10 tests.
        frameAngles[rule.name] = calculateJointAngle(a, b, c);
      }

      // ── Form Analysis Evaluation (Phase 20) ────────────────────────────
      if (form_rules.length > 0) {
        const frameFlags = analyzeForm(frameAngles, frame, form_rules, {
          frameIndex: frameIdx,
          minVisibility: min_visibility,
        });
        if (frameFlags.length > 0) {
          flags.push(...frameFlags);
        }
      }

      // ── Track average visibility across required landmarks ─────────────
      const frameVis = computeFrameVisibility(landmarkMap, config.required_landmarks);
      if (frameVis !== null) {
        totalVisibility += frameVis;
        visibilitySamples++;
      }

      // ── Feed primary angle into the rep-counter state machine ──────────
      // ExerciseRepCounter.processSample() safely ignores angle=0 (missing landmark)
      // so occluded frames are effectively skipped without corrupting the count.
      const repAngle = frameAngles[rep_rule.angle_name] ?? 0;
      const sampleResult = counter.processSample(repAngle);
      lastStage  = sampleResult.stage;
      lastAngles = frameAngles;
    }

    const confidence =
      visibilitySamples > 0 ? totalVisibility / visibilitySamples : undefined;

    return {
      rep_count:          counter.getCount(),
      stage:              lastStage,
      angles:             lastAngles,
      confidence,
      flags,
      rep_scores:         counter.getRepScores(),
      average_form_score: counter.getAverageFormScore(),
      frames_analyzed:    frames.length,
    };
  }

  /**
   * Validate an ExerciseAnalysisConfig for internal consistency.
   *
   * @returns Array of human-readable error messages. Empty array means the config is valid.
   *
   * @example
   * ```ts
   * const errors = PoseEngine.validateConfig(config);
   * if (errors.length > 0) throw new Error(errors.join('; '));
   * ```
   */
  static validateConfig(config: ExerciseAnalysisConfig): string[] {
    const errors: string[] = [];

    if (!config.exercise_id || config.exercise_id.trim() === '') {
      errors.push('exercise_id is required and must not be empty');
    }
    if (!config.exercise_name || config.exercise_name.trim() === '') {
      errors.push('exercise_name is required and must not be empty');
    }
    if (!Array.isArray(config.angle_rules) || config.angle_rules.length === 0) {
      errors.push('angle_rules must contain at least one AngleRule');
    }
    if (!config.rep_rule) {
      errors.push('rep_rule is required');
    } else {
      const { angle_name, rest_angle, target_angle } = config.rep_rule;

      if (!angle_name || angle_name.trim() === '') {
        errors.push('rep_rule.angle_name is required');
      }
      if (!Number.isFinite(rest_angle)) {
        errors.push('rep_rule.rest_angle must be a finite number');
      }
      if (!Number.isFinite(target_angle)) {
        errors.push('rep_rule.target_angle must be a finite number');
      }
      if (Number.isFinite(rest_angle) && Number.isFinite(target_angle) && rest_angle === target_angle) {
        errors.push('rep_rule.rest_angle and rep_rule.target_angle must differ');
      }

      // rep_rule.angle_name must reference an existing angle_rule
      if (angle_name && Array.isArray(config.angle_rules)) {
        const knownNames = config.angle_rules.map(r => r.name);
        if (!knownNames.includes(angle_name)) {
          errors.push(
            `rep_rule.angle_name "${angle_name}" does not reference any angle_rule (known: ${knownNames.join(', ')})`
          );
        }
      }
    }

    // Validate form_rules if provided
    if (config.form_rules !== undefined) {
      if (!Array.isArray(config.form_rules)) {
        errors.push('form_rules must be an array of FormRule objects');
      } else {
        const validSeverities = ['low', 'medium', 'high'];
        const validConditions = ['lt', 'lte', 'gt', 'gte', 'outside_range', 'inside_range'];

        for (let i = 0; i < config.form_rules.length; i++) {
          const rule = config.form_rules[i];
          if (!rule.id || rule.id.trim() === '') {
            errors.push(`form_rules[${i}].id is required and must not be empty`);
          }
          if (!rule.flag || rule.flag.trim() === '') {
            errors.push(`form_rules[${i}].flag is required and must not be empty`);
          }
          if (!validSeverities.includes(rule.severity)) {
            errors.push(`form_rules[${i}].severity must be 'low', 'medium', or 'high'`);
          }
          if (!validConditions.includes(rule.condition)) {
            errors.push(`form_rules[${i}].condition is invalid (got: ${rule.condition})`);
          }
          if (!rule.angle_name && (!Array.isArray(rule.joint_triplet) || rule.joint_triplet.length !== 3)) {
            errors.push(`form_rules[${i}] must specify either angle_name or a 3-element joint_triplet`);
          }
          if (['lt', 'lte', 'gt', 'gte'].includes(rule.condition) && (rule.threshold === undefined || !Number.isFinite(rule.threshold))) {
            errors.push(`form_rules[${i}].threshold must be a finite number for condition '${rule.condition}'`);
          }
          if (['outside_range', 'inside_range'].includes(rule.condition)) {
            if (!Array.isArray(rule.range) || rule.range.length !== 2 || !Number.isFinite(rule.range[0]) || !Number.isFinite(rule.range[1])) {
              errors.push(`form_rules[${i}].range must be a [min, max] numeric tuple for condition '${rule.condition}'`);
            }
          }
        }
      }
    }

    return errors;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-private helpers — pure, no I/O, no side effects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a PoseFrame (named array) into a LandmarkMap (keyed record)
 * compatible with calculateJointAngle's expected input.
 */
function frameToLandmarkMap(frame: PoseFrame): LandmarkMap {
  const map: LandmarkMap = {};
  for (const lm of frame.landmarks) {
    map[lm.name] = {
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility,
    };
  }
  return map;
}

/**
 * Return the named landmark only if it passes the visibility threshold.
 *
 * Returns null (safely handled by calculateJointAngle) if:
 *   - The landmark is not in the map (not detected).
 *   - The landmark's visibility is defined and below minVisibility.
 *
 * Note: if visibility is undefined (detector did not provide it), the landmark
 * is always included — the caller must configure minVisibility = 0.0 to
 * unconditionally accept all landmarks.
 */
function getVisibleLandmark(
  map: LandmarkMap,
  name: string,
  minVisibility: number
): LandmarkPoint | null {
  const lm = map[name];
  if (!lm) return null;
  if (lm.visibility !== undefined && lm.visibility < minVisibility) return null;
  return lm;
}

/**
 * Compute the average visibility for a set of required landmarks in one frame.
 *
 * @returns Average visibility [0.0–1.0] or null if no visibility data is present.
 */
function computeFrameVisibility(
  map: LandmarkMap,
  requiredLandmarks: string[]
): number | null {
  let total = 0;
  let count = 0;
  for (const name of requiredLandmarks) {
    const lm = map[name];
    if (lm?.visibility !== undefined) {
      total += lm.visibility;
      count++;
    }
  }
  return count > 0 ? total / count : null;
}
