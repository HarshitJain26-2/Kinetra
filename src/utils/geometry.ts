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
 *
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

  // Handle zero-length vectors safely
  if (magA === 0 || magC === 0) return 0;

  const dot = vA.x * vC.x + vA.y * vC.y;
  const cosTheta = Math.max(-1, Math.min(1, dot / (magA * magC)));

  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180) / Math.PI;

  return Number.isFinite(angleDeg) ? Number(angleDeg.toFixed(1)) : 0;
}

/**
 * State machine for robust repetition counting across frames
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

  /**
   * Process a single joint angle sample in chronological order
   */
  public processSample(angle: number): { count: number; stage: RepStage; completedRepScore?: number } {
    if (!Number.isFinite(angle) || angle <= 0) {
      return { count: this.count, stage: this.stage };
    }

    const { restAngle, targetAngle, thresholdTolerance } = this.config;
    const isDecreasing = targetAngle < restAngle; // e.g. Squat: 160° down to 90°

    let completedRepScore: number | undefined;

    if (isDecreasing) {
      // e.g. Squat / Push-Up: Rest is high angle (~160°), Target is low angle (~90°)
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
          // Rep completed
          this.count += 1;
          const score = this.calculateRepScore(this.currentRepMinAngle);
          this.repScores.push(score);
          completedRepScore = score;
          this.stage = 'REST';
          this.currentRepMinAngle = Infinity;
        }
      }
    } else {
      // e.g. Leg extension / press: Rest is low angle, Target is high angle
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
          this.count += 1;
          const score = this.calculateRepScore(this.currentRepMaxAngle);
          this.repScores.push(score);
          completedRepScore = score;
          this.stage = 'REST';
          this.currentRepMaxAngle = -Infinity;
        }
      }
    }

    return {
      count: this.count,
      stage: this.stage,
      completedRepScore,
    };
  }

  private calculateRepScore(achievedPeakAngle: number): number {
    const { targetAngle } = this.config;
    const diff = Math.abs(achievedPeakAngle - targetAngle);
    // Score decays 2 points per degree deviation from optimal target angle
    const rawScore = 100 - diff * 2;
    return Math.max(0, Math.min(100, Number(rawScore.toFixed(1))));
  }

  public getCount(): number {
    return this.count;
  }

  public getRepScores(): number[] {
    return [...this.repScores];
  }

  public getAverageFormScore(): number {
    if (this.repScores.length === 0) return 0;
    const total = this.repScores.reduce((sum, s) => sum + s, 0);
    return Number((total / this.repScores.length).toFixed(1));
  }
}
