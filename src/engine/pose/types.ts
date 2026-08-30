/**
 * Kinetra Pose Analysis Core Engine — Type Definitions
 *
 * This file is framework-independent.
 * No imports from Express, Supabase, HTTP, or database libraries.
 *
 * Geometry primitives (LandmarkPoint, LandmarkMap, RepStage, RepCounterConfig)
 * are re-exported from src/utils/geometry.ts — the single source of truth.
 * Do NOT redeclare those types here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports — geometry.ts is the authoritative definition
// ─────────────────────────────────────────────────────────────────────────────
export type {
  LandmarkPoint,
  LandmarkMap,
  RepStage,
  RepCounterConfig,
} from '../../utils/geometry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Landmark Input Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single detected body keypoint from any pose detector.
 *
 * Named variant of LandmarkPoint — suitable as the public input type.
 * Structurally identical to MediaPipe NormalizedLandmark.
 * Intentionally detector-agnostic.
 */
export interface PoseLandmark {
  /** Landmark name (e.g. "left_knee", "right_shoulder") */
  name: string;
  /** Normalised horizontal position [0.0–1.0] left → right */
  x: number;
  /** Normalised vertical position [0.0–1.0] top → bottom */
  y: number;
  /** Depth relative to the hip midpoint — optional, negative = closer to camera */
  z?: number;
  /** Detector confidence score [0.0–1.0] */
  visibility?: number;
}

/**
 * A complete set of named pose landmarks captured in one video frame.
 */
export interface PoseFrame {
  /** All landmarks detected in this frame */
  landmarks: PoseLandmark[];
  /** Wall-clock or video-relative timestamp in milliseconds */
  timestamp_ms?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise Configuration Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Defines how to compute a single joint angle.
 * The angle is measured at the vertex landmark.
 *
 * Example — elbow angle:
 *   proximal = "left_shoulder"
 *   vertex   = "left_elbow"     ← angle is measured here
 *   distal   = "left_wrist"
 */
export interface AngleRule {
  /** Unique name for this measurement within an ExerciseAnalysisConfig (e.g. "knee_angle") */
  name: string;
  /** Name of the proximal landmark (farther from hand/foot) */
  proximal: string;
  /** Name of the vertex landmark — joint angle measured here */
  vertex: string;
  /** Name of the distal landmark (closer to hand/foot) */
  distal: string;
}

/**
 * Defines how to count repetitions from a specific angle measurement.
 *
 * The state machine direction is inferred automatically:
 *   target_angle < rest_angle  → decreasing motion (e.g. squat, push-up)
 *   target_angle > rest_angle  → increasing motion (e.g. leg extension)
 */
export interface RepRule {
  /** References an AngleRule.name within the same ExerciseAnalysisConfig */
  angle_name: string;
  /** Joint angle at the resting / starting position in degrees (e.g. 160° standing squat) */
  rest_angle: number;
  /** Target joint angle at maximum depth or contraction in degrees (e.g. 90° parallel squat) */
  target_angle: number;
  /**
   * Hysteresis margin in degrees — prevents jitter-induced double counting.
   * Default: 10°
   */
  threshold_tolerance?: number;
}

/**
 * Complete, normalised configuration for analysing a specific exercise.
 *
 * Obtained either from parsePoseConfig() (DB-derived) or constructed directly.
 * This is the single object Harshit passes to PoseEngine.analyze().
 */
export interface ExerciseAnalysisConfig {
  /** Exercise catalog UUID or a stable test identifier */
  exercise_id: string;
  /** Human-readable exercise name — used in feedback and error messages */
  exercise_name: string;
  /** All landmark names required for this exercise's analysis */
  required_landmarks: string[];
  /**
   * One or more joint-angle measurement rules.
   * At minimum one rule must exist and be referenced by rep_rule.angle_name.
   */
  angle_rules: AngleRule[];
  /** Single repetition-counting rule */
  rep_rule: RepRule;
  /**
   * Minimum landmark visibility score [0.0–1.0].
   * Landmarks whose visibility is below this threshold are treated as absent.
   * Default: 0.5
   */
  min_visibility?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Output Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A triggered form-quality alert.
 * Currently populated by Phase 20 (Form Analysis).
 * Defined here so the output contract is stable before Phase 20 ships.
 */
export interface FormFlag {
  /** Short machine-readable violation code (e.g. "knee_valgus", "hip_drop") */
  flag: string;
  /** Human-readable explanation of the violation */
  description: string;
  /** Clinical risk level */
  severity: 'low' | 'medium' | 'high';
  /** Joint angle measured when this violation was detected */
  measured_angle?: number;
  /** Zero-based index within the frames array that triggered this flag */
  frame_index?: number;
}

/**
 * Complete analysis result from PoseEngine.analyze().
 *
 * Field mapping to PoseAnalysisSetSummaryInput (Phase 10 DB persistence):
 *   rep_count           → reps
 *   average_form_score  → form_score
 *   rep_scores          → rep_scores
 *   flags (high sev.)   → injury_flag = true
 *   flags (body parts)  → flagged_body_parts
 */
export interface PoseAnalysisResult {
  /** Number of fully completed repetitions detected across all analysed frames */
  rep_count: number;
  /**
   * Final state-machine stage after processing all frames.
   * Values: 'REST' | 'TRANSITION' | 'INFLECTION' | 'RECOVERY'
   */
  stage: string;
  /**
   * Named joint-angle measurements from the last analysed frame (degrees).
   * Keys match AngleRule.name values in the exercise config.
   * Empty object if frames array was empty.
   */
  angles: Record<string, number>;
  /**
   * Estimated landmark-detection quality [0.0–1.0].
   * Average of visibility scores across all required landmarks in all frames.
   * undefined if no visibility data was provided by the detector.
   */
  confidence?: number;
  /** All triggered form-quality alerts (populated by Phase 20 Form Analysis) */
  flags: FormFlag[];
  /** Per-rep form quality scores [0.0–100.0] */
  rep_scores: number[];
  /**
   * Average form quality score [0.0–100.0].
   * 0 if no reps were completed during this analysis.
   */
  average_form_score: number;
  /** Total frames successfully processed */
  frames_analyzed: number;
}
