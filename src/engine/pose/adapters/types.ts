/**
 * Kinetra Pose Analysis Adapter — MediaPipe Types
 *
 * Framework-independent external model types.
 * No imports from Express, Supabase, HTTP, or database libraries.
 */

import type { PoseFrame, PoseLandmark } from '../types.js';

/**
 * A single raw landmark produced by a MediaPipe or TFLite pose detector.
 * All fields are optional to tolerate partial or omitted detector outputs.
 */
export interface MediaPipeRawLandmark {
  /** Normalized horizontal position [0.0–1.0] */
  x?: number | null;
  /** Normalized vertical position [0.0–1.0] */
  y?: number | null;
  /** Normalized depth relative to hip midpoint (optional) */
  z?: number | null;
  /** Detector confidence/visibility score [0.0–1.0] */
  visibility?: number | null;
  /** Landmark presence probability [0.0–1.0] */
  presence?: number | null;
  /** Optional landmark name (if supplied by detector) */
  name?: string | null;
  /** Optional landmark index [0–32] (if supplied explicitly) */
  index?: number | null;
}

/**
 * A single raw frame from a MediaPipe pose detection stream.
 * Can be represented as an array of landmarks or keyed record.
 */
export interface MediaPipeRawFrame {
  /** Landmarks detected in this frame */
  landmarks?: (MediaPipeRawLandmark | null | undefined)[] | Record<string | number, MediaPipeRawLandmark | null | undefined> | null;
  /** Video/capture timestamp in milliseconds */
  timestamp_ms?: number | null;
  /** Zero-based frame index */
  frame_index?: number | null;
}

/**
 * Adapter options for MediaPipe frame/sequence conversion.
 */
export interface MediaPipeAdapterOptions {
  /**
   * If true, landmarks with visibility below this threshold are omitted from the PoseFrame.
   * Default: undefined (preserves all valid coordinates with their visibility score).
   */
  minVisibility?: number;
}

export type { PoseFrame, PoseLandmark };
