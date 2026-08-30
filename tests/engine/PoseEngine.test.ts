/**
 * Phase 19 — Pose Analysis Core Engine: Comprehensive Unit Tests
 *
 * Tests the following components:
 *   - PoseEngine.analyze()     — orchestrator (geometry + rep counting)
 *   - PoseEngine.validateConfig() — config validation
 *   - parsePoseConfig()        — JSONB normalisation
 *
 * Geometry primitives (calculateJointAngle, ExerciseRepCounter) are tested
 * here through PoseEngine and also have dedicated tests in poseAnalysis.test.ts.
 *
 * Zero HTTP calls. Zero database calls. Zero Supabase mocks. Purely synthetic data.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PoseEngine } from '../../src/engine/pose/PoseEngine.js';
import { parsePoseConfig } from '../../src/engine/pose/configParser.js';
import type { PoseFrame, ExerciseAnalysisConfig } from '../../src/engine/pose/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixture Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimal squat configuration — does not depend on a database connection.
 *
 * Exercise: knee flexion analysis
 *   restAngle    = 160° (standing)
 *   targetAngle  = 90°  (parallel depth)
 *   tolerance    = 10°
 *
 * State machine thresholds derived from config:
 *   EXIT REST      → angle < 160 - 10 = 150°
 *   EXIT TRANSITION → angle ≤ 90 + 10 = 100°
 *   EXIT INFLECTION → angle > 90 + 10 = 100°
 *   EXIT RECOVERY  → angle ≥ 160 - 10 = 150°  (rep complete)
 *
 * min_visibility = 0.0 so test frames are always used regardless of visibility.
 */
const SQUAT_TEST_CONFIG: ExerciseAnalysisConfig = {
  exercise_id:         'test-squat',
  exercise_name:       'Test Squat',
  required_landmarks:  ['left_hip', 'left_knee', 'left_ankle'],
  angle_rules: [
    {
      name:     'knee_angle',
      proximal: 'left_hip',
      vertex:   'left_knee',
      distal:   'left_ankle',
    },
  ],
  rep_rule: {
    angle_name:          'knee_angle',
    rest_angle:          160,
    target_angle:        90,
    threshold_tolerance: 10,
  },
  min_visibility: 0.0,   // Accept all landmarks regardless of visibility in tests
};

/**
 * Create a PoseFrame where the angle at left_knee equals `kneeAngleDeg`.
 *
 * Geometry proof:
 *   hip   = (0, 0)
 *   knee  = (0, 1)  (vertex — angle measured here)
 *   ankle = (sin θ, 1 - cos θ)  where θ = kneeAngleDeg in radians
 *
 *   vA = hip - knee  = (0, -1)
 *   vC = ankle - knee = (sin θ, -cos θ)
 *
 *   dot(vA, vC) = -cos θ  |vA|=1  |vC|=1
 *   angle = acos(-cos θ) ... wait:
 *   dot(vA, vC) = 0·sin θ + (-1)·(-cos θ) = cos θ  ✓
 *   angle = acos(cos θ) = θ  ✓
 */
function makeSquatFrame(kneeAngleDeg: number, visibility = 0.99): PoseFrame {
  const θ = (kneeAngleDeg * Math.PI) / 180;
  return {
    landmarks: [
      { name: 'left_hip',   x: 0,           y: 0,            visibility },
      { name: 'left_knee',  x: 0,           y: 1,            visibility },
      { name: 'left_ankle', x: Math.sin(θ), y: 1 - Math.cos(θ), visibility },
    ],
  };
}

/** Run PoseEngine.analyze() on a sequence of knee angles. */
function runSquat(angles: number[]): ReturnType<typeof PoseEngine.analyze> {
  return PoseEngine.analyze(SQUAT_TEST_CONFIG, angles.map(a => makeSquatFrame(a)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 19: Pose Analysis Core Engine', () => {

  // ── SECTION 1: Joint Angle Calculations ───────────────────────────────────

  it('TEST 1: Engine computes 90° right-angle joint correctly', () => {
    // a = (0, 1), b = (0, 0), c = (1, 0) → vectors (0,1) and (1,0) → dot=0 → 90°
    const frame: PoseFrame = {
      landmarks: [
        { name: 'left_hip',   x: 0, y: 1 },  // A (proximal)
        { name: 'left_knee',  x: 0, y: 0 },  // B (vertex — angle here)
        { name: 'left_ankle', x: 1, y: 0 },  // C (distal)
      ],
    };
    const result = PoseEngine.analyze(SQUAT_TEST_CONFIG, [frame]);
    assert.equal(result.angles['knee_angle'], 90.0);
    assert.equal(result.frames_analyzed, 1);
  });

  it('TEST 2: Engine computes 180° straight/extended joint correctly', () => {
    // a = (-1, 0), b = (0, 0), c = (1, 0) → collinear → 180°
    const frame: PoseFrame = {
      landmarks: [
        { name: 'left_hip',   x: -1, y: 0 },
        { name: 'left_knee',  x:  0, y: 0 },
        { name: 'left_ankle', x:  1, y: 0 },
      ],
    };
    const result = PoseEngine.analyze(SQUAT_TEST_CONFIG, [frame]);
    assert.equal(result.angles['knee_angle'], 180.0);
  });

  it('TEST 3: Engine computes acute joint angle correctly (formula is general-purpose)', () => {
    // Use makeSquatFrame to produce a precisely-placed 135° angle
    const result = PoseEngine.analyze(SQUAT_TEST_CONFIG, [makeSquatFrame(135)]);
    const angle = result.angles['knee_angle'];
    assert.ok(
      Math.abs(angle - 135) < 0.2,
      `Expected ≈135°, got ${angle}°`
    );
  });

  it('TEST 4: Missing landmark produces 0° gracefully — no exception thrown', () => {
    // left_knee is intentionally absent → calculateJointAngle receives null vertex
    const frame: PoseFrame = {
      landmarks: [
        { name: 'left_hip',   x: 0, y: 1 },
        // left_knee is missing
        { name: 'left_ankle', x: 1, y: 0 },
      ],
    };
    const result = PoseEngine.analyze(SQUAT_TEST_CONFIG, [frame]);
    assert.equal(result.angles['knee_angle'], 0);
    assert.equal(result.frames_analyzed, 1);
  });

  it('TEST 5: Zero-length vector (coincident hip and knee) produces 0° — no divide-by-zero', () => {
    // hip and knee at the same coordinate → |vA| = 0 → degenerate input
    const frame: PoseFrame = {
      landmarks: [
        { name: 'left_hip',   x: 0, y: 0 },  // Same as knee ← zero-length vector BA
        { name: 'left_knee',  x: 0, y: 0 },
        { name: 'left_ankle', x: 1, y: 0 },
      ],
    };
    const result = PoseEngine.analyze(SQUAT_TEST_CONFIG, [frame]);
    assert.equal(result.angles['knee_angle'], 0);
    assert.ok(Number.isFinite(result.angles['knee_angle']));
  });

  it('TEST 6: NaN coordinate produces 0° — output is never NaN', () => {
    const frame: PoseFrame = {
      landmarks: [
        { name: 'left_hip',   x: NaN, y: 0 },
        { name: 'left_knee',  x: 0,   y: 0 },
        { name: 'left_ankle', x: 1,   y: 0 },
      ],
    };
    const result = PoseEngine.analyze(SQUAT_TEST_CONFIG, [frame]);
    assert.equal(result.angles['knee_angle'], 0, 'Angle must be 0 for NaN input');
    assert.ok(!Number.isNaN(result.angles['knee_angle']), 'Output must never be NaN');
    assert.ok(Number.isFinite(result.angles['knee_angle']));
  });

  it('TEST 7: Infinity coordinate produces 0° — output is always finite', () => {
    const frame: PoseFrame = {
      landmarks: [
        { name: 'left_hip',   x: Infinity, y: 0 },
        { name: 'left_knee',  x: 0,        y: 0 },
        { name: 'left_ankle', x: 1,        y: 0 },
      ],
    };
    const result = PoseEngine.analyze(SQUAT_TEST_CONFIG, [frame]);
    assert.equal(result.angles['knee_angle'], 0);
    assert.ok(Number.isFinite(result.angles['knee_angle']), 'Output must be finite');
    assert.ok(!Number.isNaN(result.angles['knee_angle']));
  });

  // ── SECTION 2: Rep Counter State Machine ──────────────────────────────────

  it('TEST 8: Rep counter starts at 0 in REST stage before any movement', () => {
    // One resting frame at 165° (above EXIT_REST threshold of 150°) — no stage change
    const result = runSquat([165]);
    assert.equal(result.rep_count, 0);
    assert.equal(result.stage, 'REST');
    assert.equal(result.rep_scores.length, 0);
    assert.equal(result.average_form_score, 0);
  });

  it('TEST 9: Complete repetition increments rep_count to 1 with valid form score', () => {
    // State machine trace (restAngle=160, targetAngle=90, tolerance=10):
    //   165° → REST   (165 ≥ 150; no transition)
    //   135° → TRANSITION   (135 < 150; enter transition)
    //    98° → INFLECTION   (98 ≤ 100; entered depth)
    //   110° → RECOVERY     (110 > 100; ascending)
    //   155° → REST + count (155 ≥ 150; rep complete)
    const result = runSquat([165, 135, 98, 110, 155]);

    assert.equal(result.rep_count, 1);
    assert.equal(result.stage, 'REST');
    assert.equal(result.rep_scores.length, 1);

    const score = result.rep_scores[0];
    assert.ok(score >= 0 && score <= 100, `Form score ${score} is outside [0, 100]`);

    // Score = 100 - |achievedPeak - targetAngle| * 2 = 100 - |98 - 90| * 2 = 100 - 16 = 84
    assert.equal(score, 84);
    assert.equal(result.average_form_score, 84);
  });

  it('TEST 10: Incomplete repetition (never reaches target depth) does not count a rep', () => {
    // Descends only to 130° — EXIT_TRANSITION requires ≤ 100°; never triggered
    const result = runSquat([165, 140, 130, 145, 165]);
    assert.equal(result.rep_count, 0);
  });

  it('TEST 11: Repeated identical frames at rest position do not trigger false counts', () => {
    // 30 frames at 165° — all above EXIT_REST threshold of 150° — never enters TRANSITION
    const frames = Array.from({ length: 30 }, () => makeSquatFrame(165));
    const result = PoseEngine.analyze(SQUAT_TEST_CONFIG, frames);
    assert.equal(result.rep_count, 0);
    assert.equal(result.stage, 'REST');
    assert.equal(result.frames_analyzed, 30);
  });

  it('TEST 12: Threshold hysteresis — oscillating near EXIT_REST boundary stays in REST', () => {
    // EXIT_REST fires when angle < restAngle - tolerance = 160 - 10 = 150°
    // 153° is inside the hysteresis band (153 ≥ 150) → must stay in REST
    const result = runSquat([165, 153, 158, 153, 165]);
    assert.equal(result.rep_count, 0);
    assert.equal(result.stage, 'REST');
  });

  it('TEST 13: Each PoseEngine.analyze() call starts fresh — no state leaks between calls', () => {
    // Both calls process the same full-rep sequence independently
    const sequence = [165, 135, 98, 110, 155];
    const r1 = runSquat(sequence);
    const r2 = runSquat(sequence);

    // If state leaked, r2 would show count=2. It must show count=1.
    assert.equal(r1.rep_count, 1, 'First call must count 1 rep');
    assert.equal(r2.rep_count, 1, 'Second call must also count exactly 1 rep (not 2)');
    assert.equal(r1.average_form_score, r2.average_form_score);
  });

  it('TEST 14: Multiple frames produce deterministic results — same input always yields same output', () => {
    // Two reps: stand → down → bottom → up → stand → down → bottom → up → stand
    const twoRepFrames = [165, 135, 98, 110, 155, 135, 98, 110, 155].map(makeSquatFrame);

    const resultA = PoseEngine.analyze(SQUAT_TEST_CONFIG, twoRepFrames);
    const resultB = PoseEngine.analyze(SQUAT_TEST_CONFIG, twoRepFrames);

    assert.equal(resultA.rep_count, 2, 'Expected 2 complete reps');
    assert.equal(resultA.rep_count, resultB.rep_count);
    assert.equal(resultA.stage, resultB.stage);
    assert.equal(resultA.average_form_score, resultB.average_form_score);
    assert.deepEqual(resultA.angles, resultB.angles);
    assert.deepEqual(resultA.rep_scores, resultB.rep_scores);
    assert.equal(resultA.frames_analyzed, twoRepFrames.length);
    assert.equal(resultA.frames_analyzed, resultB.frames_analyzed);
  });

  // ── SECTION 3: Exercise Configuration Validation ──────────────────────────

  it('TEST 15: Valid ExerciseAnalysisConfig passes validation with an empty errors array', () => {
    const errors = PoseEngine.validateConfig(SQUAT_TEST_CONFIG);
    assert.deepEqual(errors, []);
  });

  it('TEST 16: Config with empty exercise_id fails validation with an informative message', () => {
    const invalid: ExerciseAnalysisConfig = { ...SQUAT_TEST_CONFIG, exercise_id: '' };
    const errors = PoseEngine.validateConfig(invalid);
    assert.ok(errors.length > 0, 'Expected at least one validation error');
    assert.ok(errors.some(e => e.toLowerCase().includes('exercise_id')));
  });

  it('TEST 17: Config with rep_rule.angle_name not matching any angle_rule fails validation', () => {
    const invalid: ExerciseAnalysisConfig = {
      ...SQUAT_TEST_CONFIG,
      rep_rule: { ...SQUAT_TEST_CONFIG.rep_rule, angle_name: 'nonexistent_angle' },
    };
    const errors = PoseEngine.validateConfig(invalid);
    assert.ok(errors.length > 0, 'Expected a validation error for unresolved angle_name');
    assert.ok(
      errors.some(e => e.includes('nonexistent_angle')),
      `Expected error mentioning "nonexistent_angle", got: ${errors.join('; ')}`
    );
  });

  it('TEST 18: parsePoseConfig correctly normalises all legacy JSONB key-name variants', () => {
    // ── Variant 1: target_angle (Barbell Squat, Push-Up) ──────────────────
    const c1 = parsePoseConfig('squat', 'Barbell Squat', {
      keypoints: ['left_hip', 'left_knee', 'left_ankle'],
      target_angle: 90,
      plane: 'sagittal',
    });
    assert.equal(c1.exercise_id, 'squat');
    assert.equal(c1.rep_rule.target_angle, 90);
    assert.equal(c1.rep_rule.rest_angle, 160);  // inferred: target<120 → rest=160
    assert.equal(c1.rep_rule.angle_name, 'left_knee_angle');
    assert.deepEqual(c1.required_landmarks, ['left_hip', 'left_knee', 'left_ankle']);
    assert.deepEqual([], PoseEngine.validateConfig(c1));

    // ── Variant 2: knee_angle_target (Lunges seed data) ───────────────────
    const c2 = parsePoseConfig('lunges', 'Dumbbell Lunges', {
      keypoints: ['left_hip', 'left_knee', 'left_ankle'],
      knee_angle_target: 90,
    });
    assert.equal(c2.rep_rule.target_angle, 90);

    // ── Variant 3: elbow_flexion_target (Tricep Dips seed data) ──────────
    const c3 = parsePoseConfig('dips', 'Tricep Dips', {
      keypoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
      elbow_flexion_target: 90,
    });
    assert.equal(c3.rep_rule.target_angle, 90);
    assert.equal(c3.rep_rule.angle_name, 'left_elbow_angle');

    // ── Variant 4: knee_flexion_target (Leg Press seed data) ─────────────
    const c4 = parsePoseConfig('legpress', 'Leg Press', {
      keypoints: ['left_hip', 'left_knee', 'left_ankle'],
      knee_flexion_target: 90,
    });
    assert.equal(c4.rep_rule.target_angle, 90);

    // ── Variant 5: target_angle_range (Bicep Curl seed data) ─────────────
    const c5 = parsePoseConfig('curl', 'Bicep Curl', {
      keypoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
      target_angle_range: [35, 160],
    });
    assert.equal(c5.rep_rule.target_angle, 35);  // takes [0] from range

    // ── Variant 6: null raw → safe defaults, always produces valid config ─
    const c6 = parsePoseConfig('unknown', 'Unknown Exercise', null);
    assert.equal(c6.exercise_id, 'unknown');
    assert.ok(Number.isFinite(c6.rep_rule.target_angle));
    assert.ok(Number.isFinite(c6.rep_rule.rest_angle));
    assert.notEqual(c6.rep_rule.target_angle, c6.rep_rule.rest_angle);
    assert.deepEqual([], PoseEngine.validateConfig(c6));
  });

});
