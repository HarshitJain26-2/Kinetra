/**
 * Kinetra Pose Analysis Core Engine — Form Analyzer
 *
 * Evaluates deterministic exercise form rules against video frames.
 *
 * DEPENDENCIES (pure math only):
 *   calculateJointAngle — src/utils/geometry.ts (REUSED — do not duplicate)
 *
 * NO imports from:
 *   - express / any HTTP library
 *   - @supabase/supabase-js
 *   - src/config/*
 *   - src/middleware/*
 *   - src/controllers/*
 *   - src/routes/*
 *   - src/services/*
 */

import {
  calculateJointAngle,
  type LandmarkPoint,
  type LandmarkMap,
} from '../../utils/geometry.js';

import type {
  PoseFrame,
  FormRule,
  FormFlag,
  FormRuleCondition,
} from './types.js';

/**
 * Options for form rule evaluation.
 */
export interface FormAnalysisOptions {
  /** Frame index within a multi-frame video sequence (0-indexed) */
  frameIndex?: number;
  /** Minimum landmark visibility score [0.0–1.0]. Default: 0.5 */
  minVisibility?: number;
}

/**
 * Analyze a single frame's joint angles and landmark positions against a set of form rules.
 *
 * Evaluates each FormRule independently. If a rule condition is violated, a FormFlag is
 * produced with movement/form observations and risk severity.
 *
 * Degenerate inputs (missing landmarks, NaN coordinates, missing angles, undefined rules)
 * are handled safely by returning no flag rather than throwing exceptions or false alarms.
 *
 * @param angles      - Pre-computed joint angles for this frame (Record<string, number>)
 * @param frame       - PoseFrame containing named keypoints
 * @param formRules   - Array of FormRule constraints to evaluate
 * @param options     - Optional frameIndex and minVisibility
 * @returns           - Array of triggered FormFlag violations (empty array if form is valid)
 */
export function analyzeForm(
  angles: Record<string, number> | null | undefined,
  frame: PoseFrame | null | undefined,
  formRules: FormRule[] | null | undefined,
  options?: FormAnalysisOptions
): FormFlag[] {
  if (!formRules || !Array.isArray(formRules) || formRules.length === 0) {
    return [];
  }

  const safeAngles = angles ?? {};
  const safeFrame = frame ?? { landmarks: [] };
  const minVisibility = options?.minVisibility ?? 0.5;
  const frameIndex = options?.frameIndex;

  // Build landmark map once for this frame if any rule needs on-the-fly joint triplet calculation
  let landmarkMap: LandmarkMap | null = null;

  const flags: FormFlag[] = [];

  for (const rule of formRules) {
    // 1. Validate rule structure
    if (!rule || typeof rule !== 'object' || !rule.id || !rule.flag) {
      continue;
    }

    // 2. Resolve measured angle for this rule
    let measuredAngle: number | null = null;

    if (rule.angle_name) {
      // Lookup pre-computed angle
      const val = safeAngles[rule.angle_name];
      if (val !== undefined && Number.isFinite(val) && !Number.isNaN(val)) {
        // Angle of 0 from calculateJointAngle usually denotes missing/degenerate landmarks.
        // We only evaluate if angle > 0 to avoid false positives when landmarks were absent.
        if (val > 0) {
          measuredAngle = val;
        }
      }
    } else if (rule.joint_triplet && Array.isArray(rule.joint_triplet) && rule.joint_triplet.length === 3) {
      // Calculate on-the-fly joint angle from frame landmarks
      if (!landmarkMap) {
        landmarkMap = frameToLandmarkMap(safeFrame);
      }

      const [pName, vName, dName] = rule.joint_triplet;
      const a = getVisibleLandmark(landmarkMap, pName, minVisibility);
      const b = getVisibleLandmark(landmarkMap, vName, minVisibility);
      const c = getVisibleLandmark(landmarkMap, dName, minVisibility);

      // If any landmark is missing or low-visibility, calculateJointAngle should not evaluate
      if (a && b && c) {
        const computed = calculateJointAngle(a, b, c);
        if (Number.isFinite(computed) && !Number.isNaN(computed) && computed > 0) {
          measuredAngle = computed;
        }
      }
    }

    // If angle could not be safely resolved from available data, skip rule (no false alarm)
    if (measuredAngle === null || !Number.isFinite(measuredAngle)) {
      continue;
    }

    // 3. Evaluate rule condition
    const isViolated = evaluateCondition(measuredAngle, rule.condition, rule.threshold, rule.range);

    if (isViolated) {
      flags.push({
        flag: rule.flag,
        description: rule.description,
        severity: rule.severity ?? 'medium',
        measured_angle: Number(measuredAngle.toFixed(1)),
        frame_index: frameIndex,
      });
    }
  }

  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-private helpers — pure, no I/O, no side effects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate a comparison operator against a measured angle.
 */
function evaluateCondition(
  angle: number,
  condition: FormRuleCondition,
  threshold?: number,
  range?: [number, number]
): boolean {
  switch (condition) {
    case 'lt':
      return threshold !== undefined && Number.isFinite(threshold) && angle < threshold;

    case 'lte':
      return threshold !== undefined && Number.isFinite(threshold) && angle <= threshold;

    case 'gt':
      return threshold !== undefined && Number.isFinite(threshold) && angle > threshold;

    case 'gte':
      return threshold !== undefined && Number.isFinite(threshold) && angle >= threshold;

    case 'outside_range':
      if (Array.isArray(range) && range.length === 2 && Number.isFinite(range[0]) && Number.isFinite(range[1])) {
        return angle < range[0] || angle > range[1];
      }
      return false;

    case 'inside_range':
      if (Array.isArray(range) && range.length === 2 && Number.isFinite(range[0]) && Number.isFinite(range[1])) {
        return angle >= range[0] && angle <= range[1];
      }
      return false;

    default:
      // Unknown or invalid condition — safely ignore
      return false;
  }
}

/**
 * Convert a PoseFrame (named array) into a LandmarkMap (keyed record).
 */
function frameToLandmarkMap(frame: PoseFrame): LandmarkMap {
  const map: LandmarkMap = {};
  if (!Array.isArray(frame.landmarks)) return map;
  for (const lm of frame.landmarks) {
    if (lm && typeof lm.name === 'string') {
      map[lm.name] = {
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      };
    }
  }
  return map;
}

/**
 * Return the named landmark only if it passes the visibility threshold.
 */
function getVisibleLandmark(
  map: LandmarkMap,
  name: string,
  minVisibility: number
): LandmarkPoint | null {
  const lm = map[name];
  if (!lm) return null;
  if (lm.visibility !== undefined && lm.visibility < minVisibility) return null;
  // If coordinates are NaN or Infinite, consider invalid
  if (!Number.isFinite(lm.x) || !Number.isFinite(lm.y)) return null;
  return lm;
}
