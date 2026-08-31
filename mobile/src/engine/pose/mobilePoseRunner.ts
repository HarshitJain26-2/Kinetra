/**
 * Kinetra Mobile Pose Runner
 * Manages frame lifecycle, frame drop policy, live metric updates,
 * and diagnostic metrics (FPS, latency, dropped frames) with zero raw video logging.
 */

import { calculateJointAngle, ExerciseRepCounter, RepStage, LandmarkMap } from './geometry';
import { analyzeForm, frameToLandmarkMap } from './formAnalyzer';
import { adaptMediaPipeFrame, RawLandmarkInput } from './mediapipeAdapter';
import { PoseEngine } from './PoseEngine';
import {
  PoseFrame,
  PoseLandmark,
  ExerciseAnalysisConfig,
  PoseAnalysisResult,
  FormFlag,
} from './types';

export interface DiagnosticMetrics {
  fps: number;
  inferenceDurationMs: number;
  droppedFrameCount: number;
  processedFrameCount: number;
  averageConfidence: number;
}

export interface LiveTelemetryUpdate {
  repCount: number;
  stage: RepStage;
  formScore: number;
  activeAngle: number;
  coachingMessage: string | null;
  flags: FormFlag[];
  landmarks: PoseLandmark[];
  confidence: number;
  timestamp: number;
  diagnostics?: DiagnosticMetrics;
}

export type TelemetryCallback = (update: LiveTelemetryUpdate) => void;

export class MobilePoseRunner {
  private config: ExerciseAnalysisConfig;
  private repCounter: ExerciseRepCounter;
  private isProcessing = false;
  private isPaused = false;
  private isStopped = false;
  private lastProcessedTimestamp = 0;
  private recordedFrames: PoseFrame[] = [];
  private onTelemetryUpdate?: TelemetryCallback;
  private currentFormScore = 100;
  private liveFlags: FormFlag[] = [];
  private defaultCoachingMessage = 'Knees tracking well • Controlled tempo';

  // Diagnostic Observability Metrics
  private processedFrameCount = 0;
  private droppedFrameCount = 0;
  private lastInferenceDurationMs = 0;
  private calculatedFps = 0;
  private lastFpsCalculationTimestamp = 0;
  private framesSinceLastFpsCheck = 0;

  constructor(config: ExerciseAnalysisConfig, onTelemetryUpdate?: TelemetryCallback) {
    this.config = config;
    this.onTelemetryUpdate = onTelemetryUpdate;
    this.repCounter = new ExerciseRepCounter({
      restAngle: config.rep_rule.rest_angle,
      targetAngle: config.rep_rule.target_angle,
      thresholdTolerance: config.rep_rule.threshold_tolerance,
    });
  }

  /**
   * Process a single incoming camera frame.
   * Frame-drop policy: Discards frame if inference is busy or if timestamp is non-monotonic.
   */
  public processRawLandmarks(
    rawLandmarks: RawLandmarkInput[],
    timestampMs: number = Date.now()
  ): boolean {
    if (this.isStopped || this.isPaused) {
      return false;
    }

    // 1. Frame drop policy: drop if busy
    if (this.isProcessing) {
      this.droppedFrameCount++;
      return false;
    }

    // 2. Monotonic timestamp check
    if (timestampMs <= this.lastProcessedTimestamp) {
      this.droppedFrameCount++;
      return false;
    }

    const startTime = Date.now();
    this.isProcessing = true;
    try {
      this.lastProcessedTimestamp = timestampMs;

      // 3. Adapt raw input to canonical PoseFrame
      const frame: PoseFrame = adaptMediaPipeFrame(
        rawLandmarks,
        timestampMs,
        this.config.min_visibility ?? 0.5
      );

      if (!frame.landmarks || frame.landmarks.length === 0) {
        this.droppedFrameCount++;
        return false;
      }

      // 4. Compute angles
      const landmarkMap: LandmarkMap = frameToLandmarkMap(frame);
      const angles: Record<string, number> = {};

      for (const rule of this.config.angle_rules) {
        const p = landmarkMap[rule.proximal];
        const v = landmarkMap[rule.vertex];
        const d = landmarkMap[rule.distal];

        if (p && v && d) {
          const angle = calculateJointAngle(p, v, d);
          if (angle > 0) {
            angles[rule.name] = angle;
          }
        }
      }

      // 5. Update Rep Counter
      const primaryAngle = angles[this.config.rep_rule.angle_name] ?? 0;
      let stage: RepStage = this.repCounter.getStage();
      let repCount = this.repCounter.getCount();

      if (primaryAngle > 0) {
        const stepResult = this.repCounter.processSample(primaryAngle);
        stage = stepResult.stage;
        repCount = stepResult.count;
      }

      // 6. Live Form Flag evaluation
      let coachingMessage: string | null = this.defaultCoachingMessage;
      if (this.config.form_rules && this.config.form_rules.length > 0) {
        const flags = analyzeForm(angles, frame, this.config.form_rules, {
          minVisibility: this.config.min_visibility ?? 0.5,
        });

        if (flags.length > 0) {
          const highFlag = flags.find((f) => f.severity === 'high');
          const mediumFlag = flags.find((f) => f.severity === 'medium');
          const activeFlag = highFlag || mediumFlag || flags[0];
          coachingMessage = activeFlag.description;

          for (const flag of flags) {
            if (!this.liveFlags.some((f) => f.flag === flag.flag)) {
              this.liveFlags.push(flag);
            }
          }
        }
      }

      // 7. Calculate confidence
      let totalVis = 0;
      for (const lm of frame.landmarks) {
        totalVis += lm.visibility ?? 1.0;
      }
      const confidence = Number((totalVis / frame.landmarks.length).toFixed(2));

      // 8. Record frame for set history
      this.recordedFrames.push(frame);
      this.processedFrameCount++;

      // 9. Update Live Form Score
      let score = 100;
      const repScores = this.repCounter.getRepScores();
      if (repScores.length > 0) {
        const sum = repScores.reduce((a, b) => a + b, 0);
        score = Math.round(sum / repScores.length);
      }
      for (const f of this.liveFlags) {
        if (f.severity === 'high') score -= 10;
        else if (f.severity === 'medium') score -= 5;
        else if (f.severity === 'low') score -= 2;
      }
      this.currentFormScore = Math.max(0, Math.min(100, score));

      // 10. Compute FPS & Latency
      this.lastInferenceDurationMs = Math.max(1, Date.now() - startTime);
      this.framesSinceLastFpsCheck++;
      const now = Date.now();
      if (now - this.lastFpsCalculationTimestamp >= 1000) {
        this.calculatedFps = Math.round(
          (this.framesSinceLastFpsCheck * 1000) / (now - this.lastFpsCalculationTimestamp)
        );
        this.lastFpsCalculationTimestamp = now;
        this.framesSinceLastFpsCheck = 0;
      }

      // 11. Emit Telemetry Update
      if (this.onTelemetryUpdate) {
        this.onTelemetryUpdate({
          repCount,
          stage,
          formScore: this.currentFormScore,
          activeAngle: primaryAngle,
          coachingMessage,
          flags: this.liveFlags,
          landmarks: frame.landmarks,
          confidence,
          timestamp: timestampMs,
          diagnostics: {
            fps: this.calculatedFps,
            inferenceDurationMs: this.lastInferenceDurationMs,
            droppedFrameCount: this.droppedFrameCount,
            processedFrameCount: this.processedFrameCount,
            averageConfidence: confidence,
          },
        });
      }

      return true;
    } finally {
      this.isProcessing = false;
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public getRepCount(): number {
    return this.repCounter.getCount();
  }

  public getStage(): RepStage {
    return this.repCounter.getStage();
  }

  public getFormScore(): number {
    return this.currentFormScore;
  }

  public getDiagnostics(): DiagnosticMetrics {
    return {
      fps: this.calculatedFps,
      inferenceDurationMs: this.lastInferenceDurationMs,
      droppedFrameCount: this.droppedFrameCount,
      processedFrameCount: this.processedFrameCount,
      averageConfidence: 0.95,
    };
  }

  /**
   * Finalize the set and return complete PoseAnalysisResult.
   */
  public completeSet(): PoseAnalysisResult {
    this.isStopped = true;
    const finalResult = PoseEngine.analyze(this.config, this.recordedFrames);
    return finalResult;
  }

  public reset(): void {
    this.isStopped = false;
    this.isPaused = false;
    this.isProcessing = false;
    this.lastProcessedTimestamp = 0;
    this.recordedFrames = [];
    this.liveFlags = [];
    this.currentFormScore = 100;
    this.processedFrameCount = 0;
    this.droppedFrameCount = 0;
    this.lastInferenceDurationMs = 0;
    this.calculatedFps = 0;
    this.lastFpsCalculationTimestamp = Date.now();
    this.framesSinceLastFpsCheck = 0;
    this.repCounter.reset();
  }
}
