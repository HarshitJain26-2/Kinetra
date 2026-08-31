/**
 * Kinetra Mobile Pose Geometry Primitives
 * Reused pure math geometry functions.
 */

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export type LandmarkMap = Record<string, LandmarkPoint>;

/**
 * Calculate the 2D joint angle at vertex B (in degrees: 0° to 180°)
 * formed by rays BA and BC.
 * Safely handles zero-length vectors, invalid coordinates, and floating-point edge cases.
 */
export function calculateJointAngle(
  a: LandmarkPoint | null | undefined,
  b: LandmarkPoint | null | undefined,
  c: LandmarkPoint | null | undefined
): number {
  if (!a || !b || !c) return 0;
  if (
    !Number.isFinite(a.x) || !Number.isFinite(a.y) ||
    !Number.isFinite(b.x) || !Number.isFinite(b.y) ||
    !Number.isFinite(c.x) || !Number.isFinite(c.y)
  ) {
    return 0;
  }

  const vA = { x: a.x - b.x, y: a.y - b.y };
  const vC = { x: c.x - b.x, y: c.y - b.y };

  const magA = Math.hypot(vA.x, vA.y);
  const magC = Math.hypot(vC.x, vC.y);

  if (magA === 0 || magC === 0) return 0;

  const dot = vA.x * vC.x + vA.y * vC.y;
  const cosTheta = Math.max(-1, Math.min(1, dot / (magA * magC)));

  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180) / Math.PI;

  return Number.isFinite(angleDeg) ? Number(angleDeg.toFixed(1)) : 0;
}

/**
 * State machine for repetition counting across frames
 */
export type RepStage = 'REST' | 'TRANSITION' | 'INFLECTION' | 'RECOVERY';

export interface RepCounterConfig {
  restAngle: number;       // Angle at resting / starting position (e.g. 160° for squat)
  targetAngle: number;     // Target inflection angle (e.g. 90° for parallel squat)
  thresholdTolerance?: number; // Hysteresis margin in degrees (default 10°)
}

export class ExerciseRepCounter {
  private count = 0;
  private stage: RepStage = 'REST';
  private repScores: number[] = [];
  private currentRepMinAngle = Infinity;
  private currentRepMaxAngle = -Infinity;
  private config: Required<RepCounterConfig>;

  constructor(config: RepCounterConfig) {
    this.config = {
      restAngle: config.restAngle,
      targetAngle: config.targetAngle,
      thresholdTolerance: config.thresholdTolerance ?? 10,
    };
  }

  public processSample(angle: number): { count: number; stage: RepStage; completedRepScore?: number } {
    if (!Number.isFinite(angle) || angle <= 0) {
      return { count: this.count, stage: this.stage };
    }

    const { restAngle, targetAngle, thresholdTolerance } = this.config;
    const isDecreasing = targetAngle < restAngle;

    let completedRepScore: number | undefined;

    if (isDecreasing) {
      if (this.stage === 'REST' && angle < restAngle - thresholdTolerance) {
        this.stage = 'TRANSITION';
        this.currentRepMinAngle = angle;
      } else if (this.stage === 'TRANSITION') {
        if (angle < this.currentRepMinAngle) this.currentRepMinAngle = angle;
        if (angle <= targetAngle + thresholdTolerance) {
          this.stage = 'INFLECTION';
        }
      } else if (this.stage === 'INFLECTION') {
        if (angle < this.currentRepMinAngle) this.currentRepMinAngle = angle;
        if (angle > targetAngle + thresholdTolerance) {
          this.stage = 'RECOVERY';
        }
      } else if (this.stage === 'RECOVERY') {
        if (angle >= restAngle - thresholdTolerance) {
          this.count++;
          this.stage = 'REST';
          completedRepScore = this.calculateRepScore(this.currentRepMinAngle);
          this.repScores.push(completedRepScore);
          this.currentRepMinAngle = Infinity;
        }
      }
    } else {
      if (this.stage === 'REST' && angle > restAngle + thresholdTolerance) {
        this.stage = 'TRANSITION';
        this.currentRepMaxAngle = angle;
      } else if (this.stage === 'TRANSITION') {
        if (angle > this.currentRepMaxAngle) this.currentRepMaxAngle = angle;
        if (angle >= targetAngle - thresholdTolerance) {
          this.stage = 'INFLECTION';
        }
      } else if (this.stage === 'INFLECTION') {
        if (angle > this.currentRepMaxAngle) this.currentRepMaxAngle = angle;
        if (angle < targetAngle - thresholdTolerance) {
          this.stage = 'RECOVERY';
        }
      } else if (this.stage === 'RECOVERY') {
        if (angle <= restAngle + thresholdTolerance) {
          this.count++;
          this.stage = 'REST';
          completedRepScore = this.calculateRepScore(this.currentRepMaxAngle);
          this.repScores.push(completedRepScore);
          this.currentRepMaxAngle = -Infinity;
        }
      }
    }

    return { count: this.count, stage: this.stage, completedRepScore };
  }

  private calculateRepScore(peakAngle: number): number {
    const { restAngle, targetAngle } = this.config;
    const totalRange = Math.abs(restAngle - targetAngle);
    if (totalRange === 0) return 100;

    const achievedRange = Math.abs(restAngle - peakAngle);
    const fraction = achievedRange / totalRange;

    const score = Math.round(Math.min(100, Math.max(0, fraction * 100)));
    return score;
  }

  public getCount(): number {
    return this.count;
  }

  public getStage(): RepStage {
    return this.stage;
  }

  public getRepScores(): number[] {
    return [...this.repScores];
  }

  public reset(): void {
    this.count = 0;
    this.stage = 'REST';
    this.repScores = [];
    this.currentRepMinAngle = Infinity;
    this.currentRepMaxAngle = -Infinity;
  }
}
