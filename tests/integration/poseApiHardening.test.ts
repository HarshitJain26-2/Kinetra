/**
 * Phase 24 — Pose -> API Integration Hardening: Integration Tests
 *
 * Validates the complete pipeline from MediaPipe frames to validated API payloads
 * and PoseAnalysisService/HTTP submission.
 */

import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import { adaptMediaPipeSequence } from '../../src/engine/pose/adapters/mediapipeAdapter.js';
import type { MediaPipeRawFrame } from '../../src/engine/pose/adapters/types.js';
import { PoseEngine } from '../../src/engine/pose/PoseEngine.js';
import { SQUAT_ANALYSIS_CONFIG, PUSHUP_ANALYSIS_CONFIG } from '../../src/engine/pose/configs.js';
import {
  mapPoseResultToApiPayload,
  validatePoseAnalysisPayload,
  extractFlaggedBodyParts,
  type PoseSessionMetadata,
} from '../../src/engine/pose/apiMapper.js';
import { PoseAnalysisService } from '../../src/services/poseAnalysis.service.js';
import { supabaseAnon, supabaseAdmin } from '../../src/config/supabase.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createMediaPipeSquat(angleDeg: number, timestamp: number, options?: { torsoAngleDeg?: number }): MediaPipeRawFrame {
  const θ = (angleDeg * Math.PI) / 180;
  const θTorso = ((options?.torsoAngleDeg ?? 160) * Math.PI) / 180;

  const kneeX = 0.5;
  const kneeY = 0.6;
  const hipX  = 0.5;
  const hipY  = 0.3;
  const ankleX = kneeX + 0.3 * Math.sin(θ);
  const ankleY = kneeY - 0.3 * Math.cos(θ);
  const shoulderX = hipX + 0.25 * Math.sin(θTorso);
  const shoulderY = hipY + 0.25 * Math.cos(θTorso);

  return {
    timestamp_ms: timestamp,
    landmarks: [
      { index: 11, x: shoulderX, y: shoulderY, visibility: 0.99 },
      { index: 23, x: hipX,      y: hipY,      visibility: 0.99 },
      { index: 25, x: kneeX,     y: kneeY,     visibility: 0.99 },
      { index: 27, x: ankleX,    y: ankleY,    visibility: 0.99 },
    ],
  };
}

describe('Phase 24: Pose -> API Integration Hardening', () => {

  const testSessionMetadata: PoseSessionMetadata = {
    session_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    exercise_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    set_number: 1,
    weight_kg: 80,
    duration_sec: 45,
  };

  // ── SECTION 1: Pipeline Transformation & Mapping ──────────────────────────

  it('TEST 1: Clean squat set transforms into valid API DTO', () => {
    const rawFrames: MediaPipeRawFrame[] = [165, 135, 90, 120, 160].map((deg, i) =>
      createMediaPipeSquat(deg, i * 100)
    );

    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const engineResult = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    const apiPayload = mapPoseResultToApiPayload(engineResult, testSessionMetadata);

    assert.equal(apiPayload.reps, 1);
    assert.equal(apiPayload.form_score, 100);
    assert.equal(apiPayload.injury_flag, false);
    assert.deepEqual(apiPayload.flagged_body_parts, []);
    assert.equal(apiPayload.weight_kg, 80);
    assert.equal(apiPayload.session_id, testSessionMetadata.session_id);

    const validation = validatePoseAnalysisPayload(apiPayload);
    assert.equal(validation.valid, true);
    assert.equal(validation.errors.length, 0);
  });

  it('TEST 2: Squat with form violations maps flagged body parts and injury flag to API DTO', () => {
    // Over-deep squat with acute torso angle
    const deepFrames: MediaPipeRawFrame[] = [
      createMediaPipeSquat(165, 0,   { torsoAngleDeg: 160 }),
      createMediaPipeSquat(120, 100, { torsoAngleDeg: 120 }),
      createMediaPipeSquat(45,  200, { torsoAngleDeg: 30 }), // both over-flexion and forward lean
      createMediaPipeSquat(120, 300, { torsoAngleDeg: 120 }),
      createMediaPipeSquat(160, 400, { torsoAngleDeg: 160 }),
    ];

    const canonicalFrames = adaptMediaPipeSequence(deepFrames);
    const engineResult = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    const apiPayload = mapPoseResultToApiPayload(engineResult, testSessionMetadata);

    assert.equal(apiPayload.reps, 1);
    assert.ok(apiPayload.flagged_body_parts?.includes('knee'));
    assert.ok(apiPayload.flagged_body_parts?.includes('lower_back'));
    assert.ok(apiPayload.notes && apiPayload.notes.length > 0);

    const validation = validatePoseAnalysisPayload(apiPayload);
    assert.equal(validation.valid, true);
  });

  it('TEST 3: Incomplete rep transforms safely to 0 reps in API DTO', () => {
    const shallowFrames = [165, 145, 120, 145, 165].map((deg, i) => createMediaPipeSquat(deg, i * 100));
    const canonicalFrames = adaptMediaPipeSequence(shallowFrames);
    const engineResult = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);

    const apiPayload = mapPoseResultToApiPayload(engineResult, testSessionMetadata);

    assert.equal(apiPayload.reps, 0);
    assert.equal(validatePoseAnalysisPayload(apiPayload).valid, true);
  });

  it('TEST 4: Strict validation rejects NaN, Infinity, or out-of-bounds numbers', () => {
    const invalidPayload: any = {
      ...testSessionMetadata,
      reps: NaN,
      form_score: 105,
    };
    const check1 = validatePoseAnalysisPayload(invalidPayload);
    assert.equal(check1.valid, false);
    assert.ok(check1.errors.some(e => e.includes('reps')));
    assert.ok(check1.errors.some(e => e.includes('form_score')));

    const infinitePayload: any = {
      ...testSessionMetadata,
      reps: 10,
      form_score: Infinity,
    };
    const check2 = validatePoseAnalysisPayload(infinitePayload);
    assert.equal(check2.valid, false);
  });

  // ── SECTION 2: Service & API Level Validations ───────────────────────────

  it('TEST 5: POST /api/v1/pose-analysis with full valid pipeline payload succeeds', async () => {
    const rawFrames: MediaPipeRawFrame[] = [165, 135, 90, 120, 160].map((deg, i) =>
      createMediaPipeSquat(deg, i * 100)
    );
    const canonicalFrames = adaptMediaPipeSequence(rawFrames);
    const engineResult = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonicalFrames);
    const apiPayload = mapPoseResultToApiPayload(engineResult, {
      session_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      exercise_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      set_number: 1,
      weight_kg: 100,
      duration_sec: 40,
    });

    const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    mock.method(supabaseAnon.auth, 'getUser', async () => ({
      data: { user: { id: testUserId, email: 'tester@kinetra.app', role: 'authenticated' } },
      error: null,
    }));

    mock.method(supabaseAdmin, 'from', (table: string) => {
      if (table === 'sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { user_id: testUserId, status: 'active' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'exercises') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { name: 'Barbell Squat' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'session_exercises') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: { id: 'se-uuid-123', ...apiPayload },
                error: null,
              }),
            }),
          }),
        };
      }
      return (supabaseAdmin as any).from(table);
    });

    try {
      const res = await request(app)
        .post('/api/v1/pose-analysis')
        .set('Authorization', 'Bearer valid-test-token')
        .send(apiPayload);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.session_exercise_id, 'se-uuid-123');
      assert.equal(res.body.data.form_score, 100);
    } finally {
      mock.restoreAll();
    }
  });

  // ── SECTION 3: Performance Sanity ─────────────────────────────────────────

  it('TEST 6: Complete transformation benchmark (30, 60, 300, 600 frames)', () => {
    const frameCounts = [30, 60, 300, 600];

    for (const count of frameCounts) {
      const rawFrames = Array.from({ length: count }).map((_, i) =>
        createMediaPipeSquat(160 - (70 * (i % 20)) / 20, i * 33)
      );

      const start = performance.now();
      const canonical = adaptMediaPipeSequence(rawFrames);
      const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, canonical);
      const payload = mapPoseResultToApiPayload(result, testSessionMetadata);
      const validation = validatePoseAnalysisPayload(payload);
      const duration = performance.now() - start;

      assert.equal(validation.valid, true);
      assert.ok(duration < 25, `Transformation for ${count} frames took ${duration.toFixed(2)}ms (< 25ms)`);
    }
  });

});
