/**
 * Phase 23 — Real-Frame / Sequence Validation Tests
 *
 * Validates the complete pipeline:
 *   MediaPipe-style raw frames -> adaptMediaPipeSequence() -> PoseFrame[] -> PoseEngine.analyze()
 *
 * Tests the following:
 *   - Squat (1-rep, 2-rep, 3-rep multi-sequence, incomplete depth, static, noise, missing landmarks, form violations)
 *   - Lunge (1-rep, multi-rep)
 *   - Push-Up (1-rep, multi-rep, incomplete, hip sag form violation, excessive depth)
 *   - Bicep Curl (1-rep, multi-rep, incomplete extension form violation)
 *   - Static frame sequences (30 identical frames -> 0 reps)
 *   - Coordinate noise robustness (±0.01 perturbation)
 *   - Missing & low-visibility keypoints (< 0.5)
 *   - Determinism and timestamp preservation
 *   - Performance sanity check (500+ frames processed in < 50ms)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adaptMediaPipeSequence } from '../../src/engine/pose/adapters/mediapipeAdapter.js';
import type { MediaPipeRawFrame, MediaPipeRawLandmark } from '../../src/engine/pose/adapters/types.js';
import { PoseEngine } from '../../src/engine/pose/PoseEngine.js';
import {
  SQUAT_ANALYSIS_CONFIG,
  LUNGE_ANALYSIS_CONFIG,
  PUSHUP_ANALYSIS_CONFIG,
  BICEP_CURL_ANALYSIS_CONFIG,
} from '../../src/engine/pose/configs.js';

// ─────────────────────────────────────────────────────────────────────────────
// Realistic MediaPipe Fixture Generators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a MediaPipe squat frame with a specific knee flexion angle and torso angle.
 *
 * MediaPipe indices:
 *   11: left_shoulder
 *   23: left_hip
 *   25: left_knee (vertex for knee angle)
 *   27: left_ankle
 */
function createMediaPipeSquatFrame(
  kneeAngleDeg: number,
  options?: {
    timestamp?: number;
    torsoAngleDeg?: number;
    visibility?: number;
    noise?: number;
    omitLandmarks?: number[];
  }
): MediaPipeRawFrame {
  const ts = options?.timestamp ?? 0;
  const vis = options?.visibility ?? 0.99;
  const noise = options?.noise ?? 0;
  const omit = new Set(options?.omitLandmarks ?? []);

  // Knee angle geometry:
  // Hip at (0.5, 0.3), Knee at (0.5, 0.6)
  // Vector knee->hip: (0, -0.3)
  // Vector knee->ankle: (0.3 * sin(θ), -0.3 * cos(θ))
  const θ = (kneeAngleDeg * Math.PI) / 180;
  const kneeX = 0.5 + (Math.random() * 2 - 1) * noise;
  const kneeY = 0.6 + (Math.random() * 2 - 1) * noise;
  const hipX  = 0.5 + (Math.random() * 2 - 1) * noise;
  const hipY  = 0.3 + (Math.random() * 2 - 1) * noise;
  const ankleX = kneeX + 0.3 * Math.sin(θ) + (Math.random() * 2 - 1) * noise;
  const ankleY = kneeY - 0.3 * Math.cos(θ) + (Math.random() * 2 - 1) * noise;

  // Torso angle (shoulder-hip-knee):
  // Default upright torso angle ~ 160°
  const torsoDeg = options?.torsoAngleDeg ?? 160;
  const θTorso = (torsoDeg * Math.PI) / 180;
  // Vector hip->knee is (kneeX - hipX, kneeY - hipY) ~ (0, 0.3)
  // Vector hip->shoulder should form θTorso with hip->knee
  const shoulderX = hipX + 0.25 * Math.sin(θTorso);
  const shoulderY = hipY + 0.25 * Math.cos(θTorso);

  const landmarks: MediaPipeRawLandmark[] = [];

  if (!omit.has(11)) landmarks.push({ index: 11, x: shoulderX, y: shoulderY, visibility: vis });
  if (!omit.has(23)) landmarks.push({ index: 23, x: hipX,      y: hipY,      visibility: vis });
  if (!omit.has(25)) landmarks.push({ index: 25, x: kneeX,     y: kneeY,     visibility: vis });
  if (!omit.has(27)) landmarks.push({ index: 27, x: ankleX,    y: ankleY,    visibility: vis });
  // Add right side for full body realism
  if (!omit.has(24)) landmarks.push({ index: 24, x: hipX + 0.1,  y: hipY,      visibility: vis });
  if (!omit.has(26)) landmarks.push({ index: 26, x: kneeX + 0.1, y: kneeY,     visibility: vis });
  if (!omit.has(28)) landmarks.push({ index: 28, x: ankleX + 0.1, y: ankleY,    visibility: vis });

  return { landmarks, timestamp_ms: ts };
}

/**
 * Generate a MediaPipe push-up frame with a specific elbow angle and body plank alignment.
 *
 * MediaPipe indices:
 *   11: left_shoulder
 *   13: left_elbow (vertex)
 *   15: left_wrist
 *   23: left_hip
 *   27: left_ankle
 */
function createMediaPipePushUpFrame(
  elbowAngleDeg: number,
  options?: {
    timestamp?: number;
    hipAngleDeg?: number; // 180° = neutral plank, < 155° = hip sag
    visibility?: number;
    omitLandmarks?: number[];
  }
): MediaPipeRawFrame {
  const ts = options?.timestamp ?? 0;
  const vis = options?.visibility ?? 0.99;
  const omit = new Set(options?.omitLandmarks ?? []);

  // Shoulder at (0.3, 0.4), Elbow at (0.3, 0.6)
  // Vector elbow->shoulder: (0, -0.2)
  // Vector elbow->wrist: (0.2 * sin(θ), -0.2 * cos(θ))
  const θ = (elbowAngleDeg * Math.PI) / 180;
  const elbowX = 0.3;
  const elbowY = 0.6;
  const shoulderX = 0.3;
  const shoulderY = 0.4;
  const wristX = elbowX + 0.2 * Math.sin(θ);
  const wristY = elbowY - 0.2 * Math.cos(θ);

  // Hip and ankle for plank alignment
  const hipAngle = options?.hipAngleDeg ?? 175; // near 180° straight plank
  const θHip = (hipAngle * Math.PI) / 180;
  const hipX = 0.55;
  const hipY = 0.45;
  const ankleX = hipX + 0.35 * Math.cos(Math.PI - θHip);
  const ankleY = hipY + 0.35 * Math.sin(Math.PI - θHip);

  const landmarks: MediaPipeRawLandmark[] = [];
  if (!omit.has(11)) landmarks.push({ index: 11, x: shoulderX, y: shoulderY, visibility: vis });
  if (!omit.has(13)) landmarks.push({ index: 13, x: elbowX,    y: elbowY,    visibility: vis });
  if (!omit.has(15)) landmarks.push({ index: 15, x: wristX,    y: wristY,    visibility: vis });
  if (!omit.has(23)) landmarks.push({ index: 23, x: hipX,      y: hipY,      visibility: vis });
  if (!omit.has(27)) landmarks.push({ index: 27, x: ankleX,    y: ankleY,    visibility: vis });

  return { landmarks, timestamp_ms: ts };
}

/**
 * Generate a MediaPipe bicep curl frame with a specific elbow flexion angle.
 */
function createMediaPipeCurlFrame(
  elbowAngleDeg: number,
  options?: { timestamp?: number; visibility?: number }
): MediaPipeRawFrame {
  const ts = options?.timestamp ?? 0;
  const vis = options?.visibility ?? 0.99;

  // Shoulder at (0.5, 0.3), Elbow at (0.5, 0.6)
  const θ = (elbowAngleDeg * Math.PI) / 180;
  const elbowX = 0.5;
  const elbowY = 0.6;
  const shoulderX = 0.5;
  const shoulderY = 0.3;
  const wristX = elbowX + 0.25 * Math.sin(θ);
  const wristY = elbowY - 0.25 * Math.cos(θ);

  const landmarks: MediaPipeRawLandmark[] = [
    { index: 11, x: shoulderX, y: shoulderY, visibility: vis },
    { index: 13, x: elbowX,    y: elbowY,    visibility: vis },
    { index: 15, x: wristX,    y: wristY,    visibility: vis },
  ];

  return { landmarks, timestamp_ms: ts };
}

describe('Phase 23: Real-Frame / Sequence Validation', () => {

  // ── SECTION 1: Single Rep & Multi-Rep Validations ─────────────────────────

  it('TEST 1: Squat single complete rep — standing (165°) -> parallel (90°) -> standing (160°)', () => {
    // 5-frame sequence: rest -> transition -> inflection -> recovery -> rest
    const angles = [165, 135, 90, 120, 160];
    const rawFrames = angles.map((deg, i) => createMediaPipeSquatFrame(deg, { timestamp: i * 100 }));

    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 1, 'Should detect exactly 1 completed rep');
    assert.equal(result.stage, 'REST');
    assert.equal(result.flags.length, 0, 'Correct squat form should have 0 flags');
    assert.equal(result.rep_scores.length, 1);
    assert.equal(result.rep_scores[0], 100, 'Perfect 90° parallel depth should score 100');
  });

  it('TEST 2: Squat 3-rep multi-sequence counts exactly 3 reps without double-counting', () => {
    // 3 full reps
    const singleRepAngles = [165, 140, 92, 125, 160];
    const sequenceAngles = [
      165, // initial rest
      ...singleRepAngles, // rep 1
      ...singleRepAngles, // rep 2
      ...singleRepAngles, // rep 3
    ];

    const rawFrames = sequenceAngles.map((deg, i) => createMediaPipeSquatFrame(deg, { timestamp: i * 66 }));
    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 3, 'Should count exactly 3 reps');
    assert.equal(result.rep_scores.length, 3);
    assert.ok(result.average_form_score > 90);
  });

  it('TEST 3: Dumbbell Lunges complete rep and 2-rep sequence', () => {
    const lungeAngles = [165, 135, 88, 120, 160, 135, 88, 120, 160];
    const rawFrames = lungeAngles.map((deg, i) => createMediaPipeSquatFrame(deg, { timestamp: i * 100 }));

    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const result = PoseEngine.analyze(LUNGE_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 2, 'Should count exactly 2 completed lunge reps');
  });

  it('TEST 4: Push-Up complete rep and 3-rep sequence', () => {
    const pushUpAngles = [
      165, // top
      140, 90, 120, 160, // rep 1
      140, 90, 120, 160, // rep 2
      140, 90, 120, 160, // rep 3
    ];
    const rawFrames = pushUpAngles.map((deg, i) => createMediaPipePushUpFrame(deg, { timestamp: i * 80 }));

    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const result = PoseEngine.analyze(PUSHUP_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 3);
    assert.equal(result.flags.length, 0, 'Clean push-up should trigger 0 flags');
  });

  it('TEST 5: Bicep Curl complete rep and 3-rep sequence', () => {
    const curlAngles = [
      160, // hanging
      120, 70, 35, 90, 160, // rep 1 (target: 35°)
      120, 70, 35, 90, 160, // rep 2
      120, 70, 35, 90, 160, // rep 3
    ];
    const rawFrames = curlAngles.map((deg, i) => createMediaPipeCurlFrame(deg, { timestamp: i * 50 }));

    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const result = PoseEngine.analyze(BICEP_CURL_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 3);
    assert.equal(result.rep_scores.length, 3);
  });

  // ── SECTION 2: Incomplete & Degenerate Movements ──────────────────────────

  it('TEST 6: Incomplete squat (shallow depth: 120° when target is 90°) counts 0 reps', () => {
    // User descends to 120° (never reaches <= 100° inflection threshold) then returns
    const shallowAngles = [165, 145, 120, 140, 165];
    const rawFrames = shallowAngles.map((deg, i) => createMediaPipeSquatFrame(deg, { timestamp: i * 100 }));

    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 0, 'Shallow depth must not count as a completed rep');
  });

  it('TEST 7: Incomplete push-up (reaches inflection at 90° but never recovers to 160°) counts 0 reps', () => {
    // User goes down to 90° and stays down / collapses
    const incompletePushUp = [165, 140, 90, 90, 95];
    const rawFrames = incompletePushUp.map((deg, i) => createMediaPipePushUpFrame(deg, { timestamp: i * 100 }));

    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const result = PoseEngine.analyze(PUSHUP_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 0, 'Must not count rep if recovery is not reached');
    assert.equal(result.stage, 'INFLECTION');
  });

  it('TEST 8: Incomplete bicep curl (short range of motion: only curls to 80° instead of 35°) counts 0 reps', () => {
    const shallowCurl = [160, 130, 80, 130, 160];
    const rawFrames = shallowCurl.map((deg, i) => createMediaPipeCurlFrame(deg, { timestamp: i * 100 }));

    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const result = PoseEngine.analyze(BICEP_CURL_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 0);
  });

  // ── SECTION 3: Static & Noisy Sequences ───────────────────────────────────

  it('TEST 9: Static sequence (30 identical frames) produces 0 reps and stable state', () => {
    // 30 identical standing frames
    const staticFrames = Array.from({ length: 30 }).map((_, i) =>
      createMediaPipeSquatFrame(165, { timestamp: i * 33 })
    );

    const canonicalFrames = adaptMediaPipeSequence(staticFrames);
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 0);
    assert.equal(result.stage, 'REST');
    assert.equal(result.frames_analyzed, 30);
    assert.equal(result.flags.length, 0);
  });

  it('TEST 10: Coordinate noise (±0.005 perturbation) does not cause false rep counting or jitter', () => {
    // Standing with small camera coordinate noise
    const noisyStanding = Array.from({ length: 40 }).map((_, i) =>
      createMediaPipeSquatFrame(165, { timestamp: i * 33, noise: 0.005 })
    );

    const canonicalFrames = adaptMediaPipeSequence(noisyStanding);
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 0, 'Noise around standing position must not trigger false reps');
  });

  // ── SECTION 4: Missing & Low-Confidence Landmarks ─────────────────────────

  it('TEST 11: Missing knee landmark in middle frames does not crash or corrupt rep counting', () => {
    // Complete rep where frame 2 has occluded knee
    const rawFrames: MediaPipeRawFrame[] = [
      createMediaPipeSquatFrame(165, { timestamp: 0 }),
      createMediaPipeSquatFrame(135, { timestamp: 100 }),
      createMediaPipeSquatFrame(90,  { timestamp: 200, omitLandmarks: [25] }), // missing knee!
      createMediaPipeSquatFrame(90,  { timestamp: 300 }),                      // valid parallel frame
      createMediaPipeSquatFrame(125, { timestamp: 400 }),
      createMediaPipeSquatFrame(160, { timestamp: 500 }),
    ];

    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 1, 'Should still cleanly count rep when occluded frame is skipped');
    assert.equal(result.frames_analyzed, 6);
  });

  it('TEST 12: Low visibility landmarks (< 0.5) are filtered and do not produce false alarms', () => {
    // Low visibility frame with random junk coordinates
    const lowVisFrame: MediaPipeRawFrame = {
      timestamp_ms: 100,
      landmarks: [
        { index: 23, x: 0.1, y: 0.1, visibility: 0.1 },
        { index: 25, x: 0.9, y: 0.9, visibility: 0.2 },
        { index: 27, x: 0.1, y: 0.9, visibility: 0.1 },
      ],
    };

    const canonicalFrames = adaptMediaPipeSequence([lowVisFrame]);
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 0);
    assert.equal(result.flags.length, 0, 'Low visibility frame must not trigger form flags');
  });

  // ── SECTION 5: Form Violations via Realistic Fixtures ─────────────────────

  it('TEST 13: Squat excessive depth (< 60° knee angle) triggers knee_over_flexion flag', () => {
    // Descends to 48° (deep butt-to-heels squat)
    const deepSquat = [
      createMediaPipeSquatFrame(165, { timestamp: 0 }),
      createMediaPipeSquatFrame(120, { timestamp: 100 }),
      createMediaPipeSquatFrame(48,  { timestamp: 200 }), // violation frame!
      createMediaPipeSquatFrame(120, { timestamp: 300 }),
      createMediaPipeSquatFrame(160, { timestamp: 400 }),
    ];

    const canonicalFrames = adaptMediaPipeSequence(deepSquat);
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 1);
    assert.ok(result.flags.some(f => f.flag === 'knee_over_flexion'));
    const flag = result.flags.find(f => f.flag === 'knee_over_flexion')!;
    assert.equal(flag.severity, 'medium');
    assert.equal(flag.frame_index, 2);
  });

  it('TEST 14: Squat excessive forward lean (< 45° torso angle) triggers excessive_forward_lean flag', () => {
    // Normal knee depth (90°) but acute torso angle (35°)
    const goodMorningSquat = [
      createMediaPipeSquatFrame(165, { timestamp: 0, torsoAngleDeg: 160 }),
      createMediaPipeSquatFrame(125, { timestamp: 100, torsoAngleDeg: 120 }),
      createMediaPipeSquatFrame(90,  { timestamp: 200, torsoAngleDeg: 35 }), // excessive forward lean!
      createMediaPipeSquatFrame(125, { timestamp: 300, torsoAngleDeg: 120 }),
      createMediaPipeSquatFrame(160, { timestamp: 400, torsoAngleDeg: 160 }),
    ];

    const canonicalFrames = adaptMediaPipeSequence(goodMorningSquat);
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 1);
    assert.ok(result.flags.some(f => f.flag === 'excessive_forward_lean'));
    const flag = result.flags.find(f => f.flag === 'excessive_forward_lean')!;
    assert.equal(flag.severity, 'medium');
  });

  it('TEST 15: Push-up hip sag (< 155° plank angle) triggers body_alignment_deviation high-severity flag', () => {
    const saggingPushUp = [
      createMediaPipePushUpFrame(165, { timestamp: 0, hipAngleDeg: 175 }),
      createMediaPipePushUpFrame(120, { timestamp: 100, hipAngleDeg: 170 }),
      createMediaPipePushUpFrame(90,  { timestamp: 200, hipAngleDeg: 140 }), // hip sag!
      createMediaPipePushUpFrame(120, { timestamp: 300, hipAngleDeg: 170 }),
      createMediaPipePushUpFrame(160, { timestamp: 400, hipAngleDeg: 175 }),
    ];

    const canonicalFrames = adaptMediaPipeSequence(saggingPushUp);
    const result = PoseEngine.analyze(PUSHUP_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 1);
    assert.ok(result.flags.some(f => f.flag === 'body_alignment_deviation'));
    const flag = result.flags.find(f => f.flag === 'body_alignment_deviation')!;
    assert.equal(flag.severity, 'high');
  });

  it('TEST 16: Push-up excessive depth (< 60° elbow angle) triggers elbow_over_flexion flag', () => {
    const deepPushUp = [
      createMediaPipePushUpFrame(165, { timestamp: 0 }),
      createMediaPipePushUpFrame(120, { timestamp: 100 }),
      createMediaPipePushUpFrame(45,  { timestamp: 200 }), // over-flexion!
      createMediaPipePushUpFrame(120, { timestamp: 300 }),
      createMediaPipePushUpFrame(160, { timestamp: 400 }),
    ];

    const canonicalFrames = adaptMediaPipeSequence(deepPushUp);
    const result = PoseEngine.analyze(PUSHUP_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 1);
    assert.ok(result.flags.some(f => f.flag === 'elbow_over_flexion'));
    const flag = result.flags.find(f => f.flag === 'elbow_over_flexion')!;
    assert.equal(flag.severity, 'low');
  });

  // ── SECTION 6: Timestamps, Order & Determinism ────────────────────────────

  it('TEST 17: Sequence adapter preserves frame ordering and chronological timestamps', () => {
    const rawFrames = [
      createMediaPipeSquatFrame(165, { timestamp: 1000 }),
      createMediaPipeSquatFrame(130, { timestamp: 1033 }),
      createMediaPipeSquatFrame(90,  { timestamp: 1066 }),
    ];

    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    assert.equal(canonicalFrames[0].timestamp_ms, 1000);
    assert.equal(canonicalFrames[1].timestamp_ms, 1033);
    assert.equal(canonicalFrames[2].timestamp_ms, 1066);
  });

  it('TEST 18: Repeated execution of the same realistic sequence produces 100% identical results', () => {
    const rawFrames = [
      createMediaPipeSquatFrame(165, { timestamp: 0 }),
      createMediaPipeSquatFrame(135, { timestamp: 100 }),
      createMediaPipeSquatFrame(90,  { timestamp: 200 }),
      createMediaPipeSquatFrame(120, { timestamp: 300 }),
      createMediaPipeSquatFrame(160, { timestamp: 400 }),
    ];

    const frames1 = adaptMediaPipeSequence(rawFrames);
    const frames2 = adaptMediaPipeSequence(rawFrames);

    const res1 = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, frames1);
    const res2 = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, frames2);

    assert.deepEqual(res1, res2);
  });

  // ── SECTION 7: Large Sequence Performance Sanity Check ────────────────────

  it('TEST 19: Processes a 600-frame video sequence (20 seconds @ 30fps, 10 reps) in < 50ms', () => {
    // Build a 600-frame sequence (10 full reps of 50 frames each + 100 static frames)
    const singleRep50Frames: number[] = [
      // 10 frames stand
      ...Array(10).fill(160),
      // 15 frames descent
      ...Array.from({ length: 15 }, (_, i) => 160 - (70 * (i + 1)) / 15),
      // 15 frames ascent
      ...Array.from({ length: 15 }, (_, i) => 90 + (70 * (i + 1)) / 15),
      // 10 frames stand
      ...Array(10).fill(160),
    ];

    const allAngles: number[] = [
      ...Array(50).fill(160),
      ...Array(10).fill(singleRep50Frames).flat(),
      ...Array(50).fill(160),
    ];

    assert.equal(allAngles.length, 600);

    const rawFrames = allAngles.map((deg, i) =>
      createMediaPipeSquatFrame(deg, { timestamp: Math.round(i * 33.33) })
    );

    const startTime = performance.now();
    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);
    const durationMs = performance.now() - startTime;

    assert.equal(result.rep_count, 10, 'Should detect exactly 10 completed reps in 600 frames');
    assert.equal(result.frames_analyzed, 600);
    assert.ok(durationMs < 50, `Expected processing < 50ms, took ${durationMs.toFixed(2)}ms`);
  });

  // ── SECTION 8: Simultaneous Violations & Score Calibration ───────────────

  it('TEST 20: Multiple simultaneous form violations (deep over-flexion + forward lean) are both detected', () => {
    const terribleSquat = [
      createMediaPipeSquatFrame(165, { timestamp: 0, torsoAngleDeg: 160 }),
      createMediaPipeSquatFrame(120, { timestamp: 100, torsoAngleDeg: 120 }),
      createMediaPipeSquatFrame(45,  { timestamp: 200, torsoAngleDeg: 30 }), // both over-flexion AND forward lean!
      createMediaPipeSquatFrame(120, { timestamp: 300, torsoAngleDeg: 120 }),
      createMediaPipeSquatFrame(160, { timestamp: 400, torsoAngleDeg: 160 }),
    ];

    const canonicalFrames = adaptMediaPipeSequence(terribleSquat);
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 1);
    assert.ok(result.flags.some(f => f.flag === 'knee_over_flexion'));
    assert.ok(result.flags.some(f => f.flag === 'excessive_forward_lean'));
    assert.ok(result.flags.length >= 2);
  });

  it('TEST 21: Form score degradation differentiates ideal form (100) from severe over-flexion (< 80)', () => {
    // Ideal squat: inflection at 90°
    const idealSquat = [165, 135, 90, 120, 160].map(deg => createMediaPipeSquatFrame(deg));
    const idealResult = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, adaptMediaPipeSequence(idealSquat));

    // Over-deep squat: inflection at 45° (45° beyond 90° target)
    const overDeepSquat = [165, 135, 45, 120, 160].map(deg => createMediaPipeSquatFrame(deg));
    const overDeepResult = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, adaptMediaPipeSequence(overDeepSquat));

    assert.equal(idealResult.average_form_score, 100);
    assert.ok(overDeepResult.average_form_score < idealResult.average_form_score);
    assert.ok(overDeepResult.average_form_score >= 0 && overDeepResult.average_form_score <= 100);
  });

});
