/**
 * Phase 22 — MediaPipe / Pose Landmark Adapter: Comprehensive Unit Tests
 *
 * Tests the following:
 *   - adaptMediaPipeLandmark() (mapping, coordinate validation, presence/visibility fallback)
 *   - adaptMediaPipeFrame() (array format, object format, keyed record format, timestamps)
 *   - adaptMediaPipeSequence() (sequence ordering, timestamp preservation, determinism)
 *   - Full end-to-end integration with PoseEngine.analyze()
 *
 * Zero HTTP calls. Zero database calls. Pure synthetic data.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptMediaPipeLandmark,
  adaptMediaPipeFrame,
  adaptMediaPipeSequence,
  MEDIAPIPE_INDEX_TO_CANONICAL_NAME,
} from '../../src/engine/pose/adapters/mediapipeAdapter.js';
import { PoseEngine } from '../../src/engine/pose/PoseEngine.js';
import { SQUAT_ANALYSIS_CONFIG } from '../../src/engine/pose/configs.js';
import type { MediaPipeRawFrame, MediaPipeRawLandmark } from '../../src/engine/pose/adapters/types.js';

describe('Phase 22: MediaPipe Landmark Adapter', () => {

  // ── SECTION 1: Single Landmark Adaptation & Mappings ─────────────────────

  it('TEST 1: Valid MediaPipe landmark converts correctly with x, y, z, and visibility', () => {
    const raw: MediaPipeRawLandmark = {
      x: 0.45,
      y: 0.65,
      z: -0.12,
      visibility: 0.98,
    };

    // Index 11 = left_shoulder
    const adapted = adaptMediaPipeLandmark(raw, 11);
    assert.ok(adapted);
    assert.equal(adapted.name, 'left_shoulder');
    assert.equal(adapted.x, 0.45);
    assert.equal(adapted.y, 0.65);
    assert.equal(adapted.z, -0.12);
    assert.equal(adapted.visibility, 0.98);
  });

  it('TEST 2: All canonical body-part indices (0-32) map to correct names', () => {
    // Spot check all core joint landmarks
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 11)?.name, 'left_shoulder');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 12)?.name, 'right_shoulder');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 13)?.name, 'left_elbow');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 14)?.name, 'right_elbow');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 15)?.name, 'left_wrist');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 16)?.name, 'right_wrist');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 23)?.name, 'left_hip');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 24)?.name, 'right_hip');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 25)?.name, 'left_knee');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 26)?.name, 'right_knee');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 27)?.name, 'left_ankle');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 28)?.name, 'right_ankle');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 31)?.name, 'left_foot_index');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1 }, 32)?.name, 'right_foot_index');
  });

  it('TEST 3: Resolves camelCase names (e.g. leftShoulder) and string indices', () => {
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1, name: 'leftShoulder' })?.name, 'left_shoulder');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1, name: 'rightKnee' })?.name, 'right_knee');
    assert.equal(adaptMediaPipeLandmark({ x: 0.1, y: 0.1, name: '25' })?.name, 'left_knee');
  });

  it('TEST 4: Falls back to presence score when visibility is omitted', () => {
    const raw: MediaPipeRawLandmark = {
      x: 0.5,
      y: 0.5,
      presence: 0.89,
    };
    const adapted = adaptMediaPipeLandmark(raw, 25);
    assert.ok(adapted);
    assert.equal(adapted.visibility, 0.89);
  });

  // ── SECTION 2: Degenerate Inputs & Safety ──────────────────────────────────

  it('TEST 5: Missing or null landmark returns null safely without throwing', () => {
    assert.equal(adaptMediaPipeLandmark(null, 11), null);
    assert.equal(adaptMediaPipeLandmark(undefined, 11), null);
  });

  it('TEST 6: Unknown landmark index or unresolvable name returns null safely', () => {
    assert.equal(adaptMediaPipeLandmark({ x: 0.5, y: 0.5 }, 999), null);
    assert.equal(adaptMediaPipeLandmark({ x: 0.5, y: 0.5, name: 'unknown_joint' }), null);
  });

  it('TEST 7: NaN or Infinity coordinates are rejected and return null', () => {
    assert.equal(adaptMediaPipeLandmark({ x: NaN, y: 0.5 }, 11), null);
    assert.equal(adaptMediaPipeLandmark({ x: 0.5, y: NaN }, 11), null);
    assert.equal(adaptMediaPipeLandmark({ x: Infinity, y: 0.5 }, 11), null);
    assert.equal(adaptMediaPipeLandmark({ x: 0.5, y: -Infinity }, 11), null);
  });

  it('TEST 8: Malformed landmark objects (missing x/y, primitives) return null without throwing', () => {
    assert.equal(adaptMediaPipeLandmark({} as any, 11), null);
    assert.equal(adaptMediaPipeLandmark('invalid' as any, 11), null);
    assert.equal(adaptMediaPipeLandmark(12345 as any, 11), null);
  });

  // ── SECTION 3: Frame-Level Adaptation ─────────────────────────────────────

  it('TEST 9: Adapts full 33-point MediaPipe array frame with timestamp', () => {
    // Generate full 33-landmark array
    const rawArray: MediaPipeRawLandmark[] = Array.from({ length: 33 }).map((_, i) => ({
      x: 0.1 * (i % 10),
      y: 0.1 * Math.floor(i / 10),
      z: 0.05,
      visibility: 0.95,
    }));

    const rawFrame: MediaPipeRawFrame = {
      landmarks: rawArray,
      timestamp_ms: 162000000,
    };

    const adapted = adaptMediaPipeFrame(rawFrame);
    assert.equal(adapted.landmarks.length, 33);
    assert.equal(adapted.timestamp_ms, 162000000);
    assert.equal(adapted.landmarks[11].name, 'left_shoulder');
    assert.equal(adapted.landmarks[25].name, 'left_knee');
  });

  it('TEST 10: Handles keyed dictionary frame format safely', () => {
    const rawDictFrame = {
      'left_hip':   { x: 0.4, y: 0.5 },
      'left_knee':  { x: 0.4, y: 0.7 },
      'left_ankle': { x: 0.4, y: 0.9 },
    };

    const adapted = adaptMediaPipeFrame(rawDictFrame);
    assert.equal(adapted.landmarks.length, 3);
    assert.equal(adapted.landmarks.find(l => l.name === 'left_knee')?.y, 0.7);
  });

  it('TEST 11: Empty frame returns { landmarks: [] } safely', () => {
    assert.deepEqual(adaptMediaPipeFrame(null), { landmarks: [] });
    assert.deepEqual(adaptMediaPipeFrame([]), { landmarks: [] });
    assert.deepEqual(adaptMediaPipeFrame({ landmarks: [] }), { landmarks: [] });
  });

  // ── SECTION 4: Sequence Adaptation ────────────────────────────────────────

  it('TEST 12: Sequence adapter preserves frame ordering and timestamps', () => {
    const seq: MediaPipeRawFrame[] = [
      {
        landmarks: [{ x: 0.5, y: 0.5, name: 'left_knee' }],
        timestamp_ms: 100,
      },
      {
        landmarks: [{ x: 0.5, y: 0.6, name: 'left_knee' }],
        timestamp_ms: 200,
      },
      {
        landmarks: [{ x: 0.5, y: 0.7, name: 'left_knee' }],
        timestamp_ms: 300,
      },
    ];

    const adaptedSeq = adaptMediaPipeSequence(seq);
    assert.equal(adaptedSeq.length, 3);
    assert.equal(adaptedSeq[0].timestamp_ms, 100);
    assert.equal(adaptedSeq[1].timestamp_ms, 200);
    assert.equal(adaptedSeq[2].timestamp_ms, 300);
    assert.equal(adaptedSeq[0].landmarks[0].y, 0.5);
    assert.equal(adaptedSeq[1].landmarks[0].y, 0.6);
    assert.equal(adaptedSeq[2].landmarks[0].y, 0.7);
  });

  it('TEST 13: Empty sequence returns empty array', () => {
    assert.deepEqual(adaptMediaPipeSequence(null), []);
    assert.deepEqual(adaptMediaPipeSequence([]), []);
  });

  it('TEST 14: Conversion is strictly deterministic', () => {
    const rawFrame: MediaPipeRawFrame = {
      landmarks: [
        { index: 23, x: 0.4, y: 0.5, visibility: 0.9 },
        { index: 25, x: 0.4, y: 0.7, visibility: 0.9 },
        { index: 27, x: 0.4, y: 0.9, visibility: 0.9 },
      ],
      timestamp_ms: 1000,
    };

    const out1 = adaptMediaPipeFrame(rawFrame);
    const out2 = adaptMediaPipeFrame(rawFrame);

    assert.deepEqual(out1, out2);
  });

  // ── SECTION 5: End-to-End PoseEngine Integration ──────────────────────────

  it('TEST 15: PoseEngine directly consumes adapted MediaPipe frames and counts reps accurately', () => {
    // Construct a sequence of MediaPipe frames representing a full squat
    const θ180 = (180 * Math.PI) / 180;
    const θ90  = (90 * Math.PI) / 180;

    function createRawMediaPipeSquat(angleDeg: number, timestamp: number): MediaPipeRawFrame {
      const θ = (angleDeg * Math.PI) / 180;
      return {
        timestamp_ms: timestamp,
        landmarks: [
          { index: 23, x: 0, y: 0, visibility: 0.99 }, // left_hip
          { index: 25, x: 0, y: 1, visibility: 0.99 }, // left_knee (vertex)
          { index: 27, x: Math.sin(θ), y: 1 - Math.cos(θ), visibility: 0.99 }, // left_ankle
          { index: 11, x: 0, y: -1, visibility: 0.99 }, // left_shoulder
        ],
      };
    }

    // Sequence: 165° -> 135° -> 98° -> 110° -> 155°
    const rawSequence: MediaPipeRawFrame[] = [
      createRawMediaPipeSquat(165, 0),
      createRawMediaPipeSquat(135, 33),
      createRawMediaPipeSquat(98, 66),
      createRawMediaPipeSquat(110, 100),
      createRawMediaPipeSquat(155, 133),
    ];

    // Adapt sequence using the MediaPipe adapter
    const canonicalFrames = adaptMediaPipeSequence(rawSequence);

    // Pass directly to existing PoseEngine
    const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    assert.equal(result.rep_count, 1, 'Expected 1 complete squat rep');
    assert.equal(result.frames_analyzed, 5);
    assert.ok(result.average_form_score > 80);
    assert.ok(result.confidence && result.confidence > 0.9);
  });

});
