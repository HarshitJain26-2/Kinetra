/**
 * Phase 20 — Form Analysis Engine: Comprehensive Unit Tests
 *
 * Tests the following:
 *   - analyzeForm() pure function
 *   - Joint-triplet on-the-fly calculation
 *   - Angle-rule lookup evaluation
 *   - Boundary conditions (exact threshold, just outside)
 *   - Degenerate inputs (missing landmarks, missing angles, NaN, Infinity)
 *   - Range operators ('outside_range', 'inside_range')
 *   - Multiple simultaneous violations
 *   - Severity mapping
 *   - Determinism
 *   - End-to-end integration with PoseEngine.analyze()
 *
 * Zero HTTP calls. Zero database calls. Pure synthetic data.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeForm } from '../../src/engine/pose/formAnalyzer.js';
import { PoseEngine } from '../../src/engine/pose/PoseEngine.js';
import type {
  PoseFrame,
  FormRule,
  ExerciseAnalysisConfig,
} from '../../src/engine/pose/types.js';
import {
  SQUAT_ANALYSIS_CONFIG,
  PUSHUP_ANALYSIS_CONFIG,
  BICEP_CURL_ANALYSIS_CONFIG,
} from '../../src/engine/pose/configs.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a synthetic PoseFrame with specified keypoint coordinates.
 */
function makeFrame(landmarks: Record<string, { x: number; y: number; visibility?: number }>): PoseFrame {
  return {
    landmarks: Object.entries(landmarks).map(([name, pt]) => ({
      name,
      x: pt.x,
      y: pt.y,
      visibility: pt.visibility ?? 0.99,
    })),
  };
}

describe('Phase 20: Form Analysis Engine', () => {

  // ── SECTION 1: Pure Form Rule Evaluation ──────────────────────────────────

  it('TEST 1: Correct form produces no form flags (empty array)', () => {
    // Normal squat depth (85° knee flexion, above 60° over-flexion threshold)
    const angles = { left_knee_angle: 85.0 };
    const frame = makeFrame({
      left_hip:   { x: 0, y: 0 },
      left_knee:  { x: 0, y: 1 },
      left_ankle: { x: 1, y: 0 },
    });

    const rule: FormRule = {
      id:          'squat_excessive_depth',
      flag:        'knee_over_flexion',
      description: 'Knee flexion angle is excessively acute (< 60°)',
      severity:    'medium',
      angle_name:  'left_knee_angle',
      condition:   'lt',
      threshold:   60,
    };

    const flags = analyzeForm(angles, frame, [rule]);
    assert.equal(flags.length, 0);
  });

  it('TEST 2: Lower-body form violation produces expected flag with correct metadata', () => {
    // Excessive squat depth (50° knee flexion, violates < 60°)
    const angles = { left_knee_angle: 50.0 };
    const frame = makeFrame({
      left_hip:   { x: 0, y: 0 },
      left_knee:  { x: 0, y: 1 },
      left_ankle: { x: 1, y: 0 },
    });

    const rule: FormRule = {
      id:          'squat_excessive_depth',
      flag:        'knee_over_flexion',
      description: 'Knee flexion angle is excessively acute (< 60°)',
      severity:    'medium',
      angle_name:  'left_knee_angle',
      condition:   'lt',
      threshold:   60,
    };

    const flags = analyzeForm(angles, frame, [rule], { frameIndex: 3 });
    assert.equal(flags.length, 1);
    assert.equal(flags[0].flag, 'knee_over_flexion');
    assert.equal(flags[0].severity, 'medium');
    assert.equal(flags[0].measured_angle, 50.0);
    assert.equal(flags[0].frame_index, 3);
    assert.ok(flags[0].description.includes('acute'));
  });

  it('TEST 3: Upper-body form violation produces expected flag with correct metadata', () => {
    // Excessive push-up depth (elbow angle 45° < 60°)
    const angles = { left_elbow_angle: 45.0 };
    const frame = makeFrame({
      left_shoulder: { x: 0, y: 0 },
      left_elbow:    { x: 0, y: 1 },
      left_wrist:    { x: 1, y: 0 },
    });

    const rule: FormRule = {
      id:          'pushup_excessive_depth',
      flag:        'elbow_over_flexion',
      description: 'Elbow flexion exceeds recommended depth (< 60°)',
      severity:    'low',
      angle_name:  'left_elbow_angle',
      condition:   'lt',
      threshold:   60,
    };

    const flags = analyzeForm(angles, frame, [rule]);
    assert.equal(flags.length, 1);
    assert.equal(flags[0].flag, 'elbow_over_flexion');
    assert.equal(flags[0].severity, 'low');
    assert.equal(flags[0].measured_angle, 45.0);
  });

  it('TEST 4: Boundary value exactly at threshold behaves deterministically (lt vs lte)', () => {
    const angles = { test_angle: 60.0 };
    const frame = makeFrame({});

    // 'lt' at 60.0 does NOT trigger for 60.0
    const ruleLt: FormRule = {
      id: 'r_lt', flag: 'f_lt', description: 'desc', severity: 'low',
      angle_name: 'test_angle', condition: 'lt', threshold: 60,
    };
    assert.equal(analyzeForm(angles, frame, [ruleLt]).length, 0);

    // 'lte' at 60.0 DOES trigger for 60.0
    const ruleLte: FormRule = {
      id: 'r_lte', flag: 'f_lte', description: 'desc', severity: 'low',
      angle_name: 'test_angle', condition: 'lte', threshold: 60,
    };
    const flagsLte = analyzeForm(angles, frame, [ruleLte]);
    assert.equal(flagsLte.length, 1);
    assert.equal(flagsLte[0].flag, 'f_lte');

    // 'gt' at 60.0 does NOT trigger for 60.0
    const ruleGt: FormRule = {
      id: 'r_gt', flag: 'f_gt', description: 'desc', severity: 'low',
      angle_name: 'test_angle', condition: 'gt', threshold: 60,
    };
    assert.equal(analyzeForm(angles, frame, [ruleGt]).length, 0);

    // 'gte' at 60.0 DOES trigger for 60.0
    const ruleGte: FormRule = {
      id: 'r_gte', flag: 'f_gte', description: 'desc', severity: 'low',
      angle_name: 'test_angle', condition: 'gte', threshold: 60,
    };
    const flagsGte = analyzeForm(angles, frame, [ruleGte]);
    assert.equal(flagsGte.length, 1);
    assert.equal(flagsGte[0].flag, 'f_gte');
  });

  it('TEST 5: Just outside acceptable threshold triggers violation', () => {
    // 59.9 is just outside the >= 60 acceptable range for 'lt' 60
    const angles = { test_angle: 59.9 };
    const frame = makeFrame({});

    const rule: FormRule = {
      id: 'r_test', flag: 'f_test', description: 'desc', severity: 'medium',
      angle_name: 'test_angle', condition: 'lt', threshold: 60,
    };

    const flags = analyzeForm(angles, frame, [rule]);
    assert.equal(flags.length, 1);
    assert.equal(flags[0].measured_angle, 59.9);
  });

  // ── SECTION 2: Degenerate Inputs & Safety ──────────────────────────────────

  it('TEST 6: Missing landmark does not throw and produces no false-positive flags', () => {
    const frame = makeFrame({
      left_hip:  { x: 0, y: 0 },
      // left_knee is missing
      left_ankle: { x: 1, y: 0 },
    });

    const rule: FormRule = {
      id: 'r_triplet', flag: 'f_triplet', description: 'desc', severity: 'medium',
      joint_triplet: ['left_hip', 'left_knee', 'left_ankle'],
      condition: 'lt', threshold: 60,
    };

    const flags = analyzeForm({}, frame, [rule]);
    assert.equal(flags.length, 0, 'Must produce no flags when landmarks are missing');
  });

  it('TEST 7: Missing angle name in angles map produces no false-positive flags', () => {
    const angles = { right_knee_angle: 50.0 }; // left_knee_angle not provided
    const frame = makeFrame({});

    const rule: FormRule = {
      id: 'r_left', flag: 'f_left', description: 'desc', severity: 'medium',
      angle_name: 'left_knee_angle', condition: 'lt', threshold: 60,
    };

    const flags = analyzeForm(angles, frame, [rule]);
    assert.equal(flags.length, 0);
  });

  it('TEST 8: NaN coordinate or NaN angle produces no false-positive flags', () => {
    const anglesNaN = { test_angle: NaN };
    const frameNaN = makeFrame({
      p: { x: NaN, y: 0 },
      v: { x: 0,   y: 0 },
      d: { x: 1,   y: 0 },
    });

    const ruleAngle: FormRule = {
      id: 'r_nan_1', flag: 'f_nan_1', description: 'desc', severity: 'low',
      angle_name: 'test_angle', condition: 'lt', threshold: 60,
    };
    const ruleTriplet: FormRule = {
      id: 'r_nan_2', flag: 'f_nan_2', description: 'desc', severity: 'low',
      joint_triplet: ['p', 'v', 'd'], condition: 'lt', threshold: 60,
    };

    assert.equal(analyzeForm(anglesNaN, frameNaN, [ruleAngle, ruleTriplet]).length, 0);
  });

  it('TEST 9: Infinity in angles or coordinates produces no false-positive flags', () => {
    const anglesInf = { test_angle: Infinity };
    const frameInf = makeFrame({
      p: { x: Infinity, y: 0 },
      v: { x: 0,        y: 0 },
      d: { x: 1,        y: 0 },
    });

    const ruleAngle: FormRule = {
      id: 'r_inf_1', flag: 'f_inf_1', description: 'desc', severity: 'low',
      angle_name: 'test_angle', condition: 'lt', threshold: 60,
    };
    const ruleTriplet: FormRule = {
      id: 'r_inf_2', flag: 'f_inf_2', description: 'desc', severity: 'low',
      joint_triplet: ['p', 'v', 'd'], condition: 'lt', threshold: 60,
    };

    assert.equal(analyzeForm(anglesInf, frameInf, [ruleAngle, ruleTriplet]).length, 0);
  });

  it('TEST 10: Multiple simultaneous violations on the same frame are all captured', () => {
    const angles = {
      left_knee_angle: 45.0,  // < 60
      left_elbow_angle: 30.0, // < 60
    };
    const frame = makeFrame({});

    const rules: FormRule[] = [
      {
        id: 'r1', flag: 'knee_over_flexion', description: 'Knee acute',
        severity: 'medium', angle_name: 'left_knee_angle', condition: 'lt', threshold: 60,
      },
      {
        id: 'r2', flag: 'elbow_over_flexion', description: 'Elbow acute',
        severity: 'low', angle_name: 'left_elbow_angle', condition: 'lt', threshold: 60,
      },
    ];

    const flags = analyzeForm(angles, frame, rules, { frameIndex: 5 });
    assert.equal(flags.length, 2);
    assert.equal(flags[0].flag, 'knee_over_flexion');
    assert.equal(flags[1].flag, 'elbow_over_flexion');
    assert.equal(flags[0].frame_index, 5);
    assert.equal(flags[1].frame_index, 5);
  });

  it('TEST 11: Output is strictly deterministic — same input produces identical flags', () => {
    const angles = { left_knee_angle: 40.0 };
    const frame = makeFrame({});
    const rules: FormRule[] = [
      {
        id: 'r1', flag: 'knee_over_flexion', description: 'desc',
        severity: 'high', angle_name: 'left_knee_angle', condition: 'lt', threshold: 60,
      },
    ];

    const run1 = analyzeForm(angles, frame, rules, { frameIndex: 1 });
    const run2 = analyzeForm(angles, frame, rules, { frameIndex: 1 });

    assert.deepEqual(run1, run2);
  });

  it('TEST 12: Invalid rule configuration is safely skipped without throwing', () => {
    const angles = { left_knee_angle: 40.0 };
    const frame = makeFrame({});

    const invalidRules: any[] = [
      null,
      undefined,
      {},
      { id: '' }, // empty id
      { id: 'valid', flag: '' }, // empty flag
      { id: 'valid2', flag: 'f', angle_name: 'left_knee_angle', condition: 'lt' }, // missing threshold
    ];

    const flags = analyzeForm(angles, frame, invalidRules as FormRule[]);
    assert.equal(flags.length, 0);
  });

  it('TEST 13: Unknown condition operator is safely skipped', () => {
    const angles = { left_knee_angle: 40.0 };
    const frame = makeFrame({});

    const unknownConditionRule: any = {
      id: 'r_unknown',
      flag: 'f_unknown',
      description: 'desc',
      severity: 'low',
      angle_name: 'left_knee_angle',
      condition: 'invalid_operator',
      threshold: 60,
    };

    const flags = analyzeForm(angles, frame, [unknownConditionRule]);
    assert.equal(flags.length, 0);
  });

  it('TEST 14: Severity levels (low, medium, high) are preserved accurately', () => {
    const angles = { a1: 10, a2: 10, a3: 10 };
    const frame = makeFrame({});

    const rules: FormRule[] = [
      { id: 'r1', flag: 'f1', description: 'd1', severity: 'low',    angle_name: 'a1', condition: 'lt', threshold: 50 },
      { id: 'r2', flag: 'f2', description: 'd2', severity: 'medium', angle_name: 'a2', condition: 'lt', threshold: 50 },
      { id: 'r3', flag: 'f3', description: 'd3', severity: 'high',   angle_name: 'a3', condition: 'lt', threshold: 50 },
    ];

    const flags = analyzeForm(angles, frame, rules);
    assert.equal(flags.length, 3);
    assert.equal(flags[0].severity, 'low');
    assert.equal(flags[1].severity, 'medium');
    assert.equal(flags[2].severity, 'high');
  });

  it('TEST 15: Range conditions (outside_range and inside_range) evaluate correctly', () => {
    const angles = { knee: 85, back: 40 };
    const frame = makeFrame({});

    // outside_range [70, 110]: 85 is inside -> no flag
    const ruleOutsidePass: FormRule = {
      id: 'r_out_pass', flag: 'f_out', description: 'desc', severity: 'medium',
      angle_name: 'knee', condition: 'outside_range', range: [70, 110],
    };
    assert.equal(analyzeForm(angles, frame, [ruleOutsidePass]).length, 0);

    // outside_range [70, 110]: back is 40 -> outside -> triggers flag
    const ruleOutsideFail: FormRule = {
      id: 'r_out_fail', flag: 'f_out_fail', description: 'desc', severity: 'medium',
      angle_name: 'back', condition: 'outside_range', range: [70, 110],
    };
    const flagsOut = analyzeForm(angles, frame, [ruleOutsideFail]);
    assert.equal(flagsOut.length, 1);
    assert.equal(flagsOut[0].measured_angle, 40.0);

    // inside_range [30, 50]: back is 40 -> inside -> triggers flag
    const ruleInsideHit: FormRule = {
      id: 'r_in_hit', flag: 'f_in_hit', description: 'desc', severity: 'high',
      angle_name: 'back', condition: 'inside_range', range: [30, 50],
    };
    const flagsIn = analyzeForm(angles, frame, [ruleInsideHit]);
    assert.equal(flagsIn.length, 1);
    assert.equal(flagsIn[0].flag, 'f_in_hit');
  });

  it('TEST 16: Joint triplet calculates angle on the fly from frame landmarks correctly', () => {
    // Right angle (90°) at left_hip: shoulder (0, 1) -> hip (0, 0) -> knee (1, 0)
    const frame = makeFrame({
      left_shoulder: { x: 0, y: 1 },
      left_hip:      { x: 0, y: 0 }, // vertex
      left_knee:     { x: 1, y: 0 },
    });

    const rule: FormRule = {
      id:          'torso_lean',
      flag:        'excessive_forward_lean',
      description: 'Torso lean angle acute (< 45°)',
      severity:    'medium',
      joint_triplet: ['left_shoulder', 'left_hip', 'left_knee'],
      condition:   'lt',
      threshold:   45,
    };

    // 90° >= 45° -> no flag
    assert.equal(analyzeForm({}, frame, [rule]).length, 0);

    // Make torso lean acute (< 45°):
    // shoulder at (0.9, 0.2), hip at (0, 0), knee at (1, 0) -> angle ~ 12.5° < 45°
    const frameLean = makeFrame({
      left_shoulder: { x: 0.9, y: 0.2 },
      left_hip:      { x: 0,   y: 0 },
      left_knee:     { x: 1,   y: 0 },
    });

    const flagsLean = analyzeForm({}, frameLean, [rule]);
    assert.equal(flagsLean.length, 1);
    assert.equal(flagsLean[0].flag, 'excessive_forward_lean');
    assert.ok(flagsLean[0].measured_angle! < 45);
  });

  // ── SECTION 3: End-to-End PoseEngine Integration ──────────────────────────

  it('TEST 17: PoseEngine.analyze() collects form flags across multi-frame sequence', () => {
    const configWithRules: ExerciseAnalysisConfig = {
      ...SQUAT_ANALYSIS_CONFIG,
      form_rules: [
        {
          id:          'squat_excessive_depth',
          flag:        'knee_over_flexion',
          description: 'Knee flexion < 60°',
          severity:    'medium',
          angle_name:  'left_knee_angle',
          condition:   'lt',
          threshold:   60,
        },
      ],
    };

    // Frame 0: Standing (160°) -> no flag
    // Frame 1: Parallel (90°) -> no flag
    // Frame 2: Butt wink / excessive deep squat (50°) -> FLAG!
    // Frame 3: Standing back up (160°) -> no flag
    const θ90 = (90 * Math.PI) / 180;
    const θ50 = (50 * Math.PI) / 180;

    const frames: PoseFrame[] = [
      makeFrame({ left_hip: { x: 0, y: 0 }, left_knee: { x: 0, y: 1 }, left_ankle: { x: 0, y: 2 } }), // 180°
      makeFrame({ left_hip: { x: 0, y: 0 }, left_knee: { x: 0, y: 1 }, left_ankle: { x: Math.sin(θ90), y: 1 - Math.cos(θ90) } }), // 90°
      makeFrame({ left_hip: { x: 0, y: 0 }, left_knee: { x: 0, y: 1 }, left_ankle: { x: Math.sin(θ50), y: 1 - Math.cos(θ50) } }), // 50°
      makeFrame({ left_hip: { x: 0, y: 0 }, left_knee: { x: 0, y: 1 }, left_ankle: { x: 0, y: 2 } }), // 180°
    ];

    const result = PoseEngine.analyze(configWithRules, frames);

    assert.equal(result.frames_analyzed, 4);
    assert.equal(result.flags.length, 1);
    assert.equal(result.flags[0].flag, 'knee_over_flexion');
    assert.equal(result.flags[0].frame_index, 2);
    assert.equal(result.flags[0].severity, 'medium');
  });

  it('TEST 18: PoseEngine.validateConfig() checks form_rules structure and rejects invalid configs', () => {
    // Valid config with form rules
    assert.deepEqual(PoseEngine.validateConfig(SQUAT_ANALYSIS_CONFIG), []);
    assert.deepEqual(PoseEngine.validateConfig(PUSHUP_ANALYSIS_CONFIG), []);
    assert.deepEqual(PoseEngine.validateConfig(BICEP_CURL_ANALYSIS_CONFIG), []);

    // Config with invalid form rule severity
    const invalidSeverityConfig: ExerciseAnalysisConfig = {
      ...SQUAT_ANALYSIS_CONFIG,
      form_rules: [
        {
          id: 'r_bad',
          flag: 'f_bad',
          description: 'desc',
          severity: 'critical' as any, // invalid severity
          angle_name: 'left_knee_angle',
          condition: 'lt',
          threshold: 60,
        },
      ],
    };
    const errors = PoseEngine.validateConfig(invalidSeverityConfig);
    assert.ok(errors.some(e => e.includes('severity')));
  });

});
