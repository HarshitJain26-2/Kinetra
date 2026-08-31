import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateJointAngle, ExerciseRepCounter } from '../src/engine/pose/geometry';
import { SQUAT_ANALYSIS_CONFIG, PUSHUP_ANALYSIS_CONFIG, BICEP_CURL_ANALYSIS_CONFIG } from '../src/engine/pose/configs';
import { adaptMediaPipeFrame, RawLandmarkInput } from '../src/engine/pose/mediapipeAdapter';
import { PoseEngine } from '../src/engine/pose/PoseEngine';
import { MobilePoseRunner } from '../src/engine/pose/mobilePoseRunner';
import { offlineSetQueue } from '../src/utils/offlineQueue';

describe('Phase 31: Real Device ML Validation & Live Vision Hardening Tests', () => {
  describe('Category A: Deterministic PoseEngine & Geometry Integration', () => {
    it('calculates 90 degree perpendicular joint angle accurately', () => {
      const hip = { x: 0.5, y: 0.2 };
      const knee = { x: 0.5, y: 0.5 };
      const ankle = { x: 0.8, y: 0.5 };
      const angle = calculateJointAngle(hip, knee, ankle);
      assert.equal(Math.round(angle), 90);
    });

    it('calculates 180 degree straight line joint angle accurately', () => {
      const shoulder = { x: 0.5, y: 0.2 };
      const elbow = { x: 0.5, y: 0.5 };
      const wrist = { x: 0.5, y: 0.8 };
      const angle = calculateJointAngle(shoulder, elbow, wrist);
      assert.equal(Math.round(angle), 180);
    });

    it('handles degenerate / NaN coordinates safely by returning 0', () => {
      const angle = calculateJointAngle(null, { x: 0.5, y: 0.5 }, { x: NaN, y: 0.8 });
      assert.equal(angle, 0);
    });

    it('correctly tracks a full Barbell Squat rep through state machine', () => {
      const counter = new ExerciseRepCounter({
        restAngle: 160,
        targetAngle: 90,
        thresholdTolerance: 10,
      });

      assert.equal(counter.getCount(), 0);
      assert.equal(counter.getStage(), 'REST');

      // Descending
      counter.processSample(145);
      assert.equal(counter.getStage(), 'TRANSITION');

      // Deep squat inflection
      counter.processSample(88);
      assert.equal(counter.getStage(), 'INFLECTION');

      // Ascending
      counter.processSample(110);
      assert.equal(counter.getStage(), 'RECOVERY');

      // Stand back up at rest
      const result = counter.processSample(158);
      assert.equal(result.count, 1);
      assert.equal(counter.getStage(), 'REST');
      assert.ok(result.completedRepScore && result.completedRepScore >= 90);
    });

    it('accurately counts exact sequences: 3 reps -> 3, 5 reps -> 5, 10 reps -> 10', () => {
      const counter = new ExerciseRepCounter({
        restAngle: 160,
        targetAngle: 90,
        thresholdTolerance: 10,
      });

      const performRep = () => {
        counter.processSample(160); // REST
        counter.processSample(135); // TRANSITION
        counter.processSample(85);  // INFLECTION
        counter.processSample(135); // RECOVERY
        counter.processSample(160); // REST (+1)
      };

      // 3 reps
      for (let i = 0; i < 3; i++) performRep();
      assert.equal(counter.getCount(), 3);

      // 2 more reps -> 5 reps total
      for (let i = 0; i < 2; i++) performRep();
      assert.equal(counter.getCount(), 5);

      // 5 more reps -> 10 reps total
      for (let i = 0; i < 5; i++) performRep();
      assert.equal(counter.getCount(), 10);
    });

    it('does NOT increment rep count when athlete is standing still', () => {
      const counter = new ExerciseRepCounter({
        restAngle: 160,
        targetAngle: 90,
        thresholdTolerance: 10,
      });

      for (let i = 0; i < 20; i++) {
        counter.processSample(160 + (i % 2));
      }

      assert.equal(counter.getCount(), 0);
      assert.equal(counter.getStage(), 'REST');
    });

    it('triggers form flag when squat depth has excessive forward lean', () => {
      const frames = [
        {
          landmarks: [
            { name: 'left_shoulder', x: 0.52, y: 0.78, visibility: 0.9 },
            { name: 'left_hip', x: 0.5, y: 0.5, visibility: 0.9 },
            { name: 'left_knee', x: 0.5, y: 0.8, visibility: 0.9 },
            { name: 'left_ankle', x: 0.5, y: 1.0, visibility: 0.9 },
          ],
          timestamp_ms: 100,
        },
      ];

      const result = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, frames);
      assert.ok(result.flags.some((f) => f.flag === 'excessive_forward_lean'));
    });

    it('evaluates Push-Up and Bicep Curl configurations correctly', () => {
      assert.equal(PUSHUP_ANALYSIS_CONFIG.rep_rule.angle_name, 'left_elbow_angle');
      assert.equal(BICEP_CURL_ANALYSIS_CONFIG.rep_rule.target_angle, 35);
    });
  });

  describe('Category B: Real-time Frame Processor & Drop Policy', () => {
    it('adapts standard 33 MediaPipe raw landmarks into canonical PoseFrame', () => {
      const rawLandmarks: RawLandmarkInput[] = [
        { index: 0, x: 0.5, y: 0.1, visibility: 0.95 },
        { index: 11, x: 0.4, y: 0.3, visibility: 0.92 },
        { index: 12, x: 0.6, y: 0.3, visibility: 0.91 },
        { index: 23, x: 0.45, y: 0.6, visibility: 0.88 },
        { index: 24, x: 0.55, y: 0.6, visibility: 0.89 },
        { index: 25, x: 0.45, y: 0.8, visibility: 0.85 },
        { index: 26, x: 0.55, y: 0.8, visibility: 0.84 },
        { index: 27, x: 0.45, y: 0.95, visibility: 0.82 },
        { index: 28, x: 0.55, y: 0.95, visibility: 0.81 },
      ];

      const frame = adaptMediaPipeFrame(rawLandmarks, 1000, 0.5);
      assert.ok(frame.landmarks.length > 0);
      const knee = frame.landmarks.find((l) => l.name === 'left_knee');
      assert.ok(knee);
      assert.equal(knee?.x, 0.45);
    });

    it('filters out low-confidence landmarks below min_visibility', () => {
      const rawLandmarks: RawLandmarkInput[] = [
        { index: 25, x: 0.45, y: 0.8, visibility: 0.2 }, // low confidence
      ];

      const frame = adaptMediaPipeFrame(rawLandmarks, 1000, 0.5);
      assert.equal(frame.landmarks.length, 0);
    });

    it('enforces monotonic timestamps in MobilePoseRunner', () => {
      const runner = new MobilePoseRunner(SQUAT_ANALYSIS_CONFIG);
      const rawSample: RawLandmarkInput[] = [
        { index: 11, x: 0.4, y: 0.3, visibility: 0.9 },
        { index: 23, x: 0.45, y: 0.6, visibility: 0.9 },
        { index: 25, x: 0.45, y: 0.8, visibility: 0.9 },
        { index: 27, x: 0.45, y: 0.95, visibility: 0.9 },
      ];

      const accepted1 = runner.processRawLandmarks(rawSample, 1000);
      assert.equal(accepted1, true);

      // Stale / out of order timestamp rejected
      const rejectedStale = runner.processRawLandmarks(rawSample, 950);
      assert.equal(rejectedStale, false);

      // Equal timestamp rejected
      const rejectedEqual = runner.processRawLandmarks(rawSample, 1000);
      assert.equal(rejectedEqual, false);

      // Newer timestamp accepted
      const accepted2 = runner.processRawLandmarks(rawSample, 1050);
      assert.equal(accepted2, true);
    });

    it('pauses and resumes frame processing without losing state', () => {
      const runner = new MobilePoseRunner(SQUAT_ANALYSIS_CONFIG);
      const rawSample: RawLandmarkInput[] = [
        { index: 11, x: 0.4, y: 0.3, visibility: 0.9 },
        { index: 23, x: 0.45, y: 0.6, visibility: 0.9 },
        { index: 25, x: 0.45, y: 0.8, visibility: 0.9 },
        { index: 27, x: 0.45, y: 0.95, visibility: 0.9 },
      ];

      runner.processRawLandmarks(rawSample, 1000);
      runner.pause();

      const processedWhilePaused = runner.processRawLandmarks(rawSample, 1050);
      assert.equal(processedWhilePaused, false);

      runner.resume();
      const processedAfterResume = runner.processRawLandmarks(rawSample, 1100);
      assert.equal(processedAfterResume, true);
    });

    it('collects diagnostic metrics without leaking raw coordinate streams', () => {
      const runner = new MobilePoseRunner(SQUAT_ANALYSIS_CONFIG);
      const rawSample: RawLandmarkInput[] = [
        { index: 11, x: 0.4, y: 0.3, visibility: 0.9 },
        { index: 23, x: 0.45, y: 0.6, visibility: 0.9 },
        { index: 25, x: 0.45, y: 0.8, visibility: 0.9 },
        { index: 27, x: 0.45, y: 0.95, visibility: 0.9 },
      ];

      runner.processRawLandmarks(rawSample, 1000);
      const diag = runner.getDiagnostics();
      assert.ok(typeof diag.droppedFrameCount === 'number');
      assert.ok(typeof diag.processedFrameCount === 'number');
      assert.equal(diag.processedFrameCount, 1);
    });
  });

  describe('Category C: Offline Set Summary Queue', () => {
    it('enqueues completed workout set locally when offline', () => {
      offlineSetQueue.clearQueue();

      const mockResult = {
        exercise_id: 'barbell-squat',
        rep_count: 12,
        average_form_score: 94,
        rep_scores: [95, 94, 93],
        flags: [],
        average_visibility: 0.92,
        duration_ms: 75000,
      };

      const queued = offlineSetQueue.enqueueSet(mockResult, {
        workoutId: 'w-123',
        exerciseName: 'Barbell Squat',
        durationMs: 75000,
      });

      assert.equal(queued.reps, 12);
      assert.equal(queued.formScore, 94);
      assert.equal(queued.status, 'pending');
      assert.equal(offlineSetQueue.getPendingSets().length, 1);
    });
  });

  describe('Category D: Mobile Security & Zero Leakage', () => {
    it('verifies that no raw video frames are queued for network upload', () => {
      const allQueued = offlineSetQueue.getAllSets();
      for (const item of allQueued) {
        assert.equal((item as any).rawVideo, undefined);
        assert.equal((item as any).cameraFrames, undefined);
      }
    });
  });
});
