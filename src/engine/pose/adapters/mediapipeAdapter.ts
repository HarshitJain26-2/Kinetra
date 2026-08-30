/**
 * Kinetra Pose Analysis Adapter — MediaPipe Pose Landmark Adapter
 *
 * Converts MediaPipe/TFLite 33-point pose landmark representations into the
 * canonical PoseFrame representation consumed by PoseEngine.
 *
 * Framework-independent:
 *   - No Express / HTTP
 *   - No Supabase / DB
 *   - No external AI / LLM APIs
 *   - No filesystem / network access
 *   - No rep counting or form evaluation (delegated to PoseEngine)
 */

import type { PoseFrame, PoseLandmark } from '../types.js';
import type {
  MediaPipeRawLandmark,
  MediaPipeRawFrame,
  MediaPipeAdapterOptions,
} from './types.js';

/**
 * Standard MediaPipe 33-keypoint topology index to canonical snake_case name mapping.
 */
export const MEDIAPIPE_INDEX_TO_CANONICAL_NAME: Readonly<Record<number, string>> = Object.freeze({
  0:  'nose',
  1:  'left_eye_inner',
  2:  'left_eye',
  3:  'left_eye_outer',
  4:  'right_eye_inner',
  5:  'right_eye',
  6:  'right_eye_outer',
  7:  'left_ear',
  8:  'right_ear',
  9:  'mouth_left',
  10: 'mouth_right',
  11: 'left_shoulder',
  12: 'right_shoulder',
  13: 'left_elbow',
  14: 'right_elbow',
  15: 'left_wrist',
  16: 'right_wrist',
  17: 'left_pinky',
  18: 'right_pinky',
  19: 'left_index',
  20: 'right_index',
  21: 'left_thumb',
  22: 'right_thumb',
  23: 'left_hip',
  24: 'right_hip',
  25: 'left_knee',
  26: 'right_knee',
  27: 'left_ankle',
  28: 'right_ankle',
  29: 'left_heel',
  30: 'right_heel',
  31: 'left_foot_index',
  32: 'right_foot_index',
});

/**
 * Set of all known canonical landmark names.
 */
const CANONICAL_NAMES: ReadonlySet<string> = new Set(Object.values(MEDIAPIPE_INDEX_TO_CANONICAL_NAME));

/**
 * Normalize an arbitrary raw name string into a canonical landmark name.
 */
function resolveCanonicalName(rawNameOrIndex: string | number): string | null {
  if (typeof rawNameOrIndex === 'number') {
    return MEDIAPIPE_INDEX_TO_CANONICAL_NAME[rawNameOrIndex] ?? null;
  }

  if (typeof rawNameOrIndex !== 'string') {
    return null;
  }

  const rawTrimmed = rawNameOrIndex.trim();

  // 1. Check direct index string (e.g. "11")
  const numericIndex = Number(rawTrimmed);
  if (Number.isInteger(numericIndex) && numericIndex in MEDIAPIPE_INDEX_TO_CANONICAL_NAME) {
    return MEDIAPIPE_INDEX_TO_CANONICAL_NAME[numericIndex];
  }

  const lower = rawTrimmed.toLowerCase();

  // 2. Direct canonical name match
  if (CANONICAL_NAMES.has(lower)) {
    return lower;
  }

  // 3. camelCase or PascalCase conversion (e.g. "leftShoulder" -> "left_shoulder")
  const snake = rawTrimmed.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  if (CANONICAL_NAMES.has(snake)) {
    return snake;
  }

  return null;
}

/**
 * Adapt a single MediaPipe landmark object into a canonical PoseLandmark.
 *
 * Returns null if:
 *   - The landmark object is null/undefined or not an object.
 *   - Coordinates x or y are missing, NaN, or Infinity.
 *   - The landmark name/index cannot be resolved to a canonical name.
 *   - Visibility is below optional minVisibility threshold.
 *
 * @param raw            - Raw landmark object from detector
 * @param fallbackIndex  - Optional index if landmark does not contain an explicit name or index
 * @param options        - Conversion options (e.g. minVisibility)
 */
export function adaptMediaPipeLandmark(
  raw: MediaPipeRawLandmark | null | undefined,
  fallbackIndex?: number | string,
  options?: MediaPipeAdapterOptions
): PoseLandmark | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  // 1. Resolve canonical name
  const nameIdentifier = raw.name ?? raw.index ?? fallbackIndex;
  if (nameIdentifier === undefined || nameIdentifier === null) {
    return null;
  }

  const canonicalName = resolveCanonicalName(nameIdentifier);
  if (!canonicalName) {
    return null;
  }

  // 2. Validate coordinates
  const x = raw.x;
  const y = raw.y;

  if (x === null || x === undefined || !Number.isFinite(x) || Number.isNaN(x)) {
    return null;
  }
  if (y === null || y === undefined || !Number.isFinite(y) || Number.isNaN(y)) {
    return null;
  }

  // 3. Resolve visibility / presence score
  let visibility: number | undefined = undefined;
  if (raw.visibility !== null && raw.visibility !== undefined && Number.isFinite(raw.visibility)) {
    visibility = raw.visibility;
  } else if (raw.presence !== null && raw.presence !== undefined && Number.isFinite(raw.presence)) {
    visibility = raw.presence;
  }

  // Filter by minVisibility if requested
  if (
    options?.minVisibility !== undefined &&
    visibility !== undefined &&
    visibility < options.minVisibility
  ) {
    return null;
  }

  // 4. Resolve z coordinate
  let z: number | undefined = undefined;
  if (raw.z !== null && raw.z !== undefined && Number.isFinite(raw.z)) {
    z = raw.z;
  }

  return {
    name: canonicalName,
    x,
    y,
    ...(z !== undefined ? { z } : {}),
    ...(visibility !== undefined ? { visibility } : {}),
  };
}

/**
 * Adapt a single MediaPipe video frame into a canonical PoseFrame.
 *
 * Accepts either:
 *   - An array of MediaPipeRawLandmark objects (indexed 0–32).
 *   - A MediaPipeRawFrame object with { landmarks, timestamp_ms }.
 *   - A dictionary/Record of landmarks keyed by index or name.
 *
 * @param rawFrame - MediaPipe frame payload
 * @param options  - Adapter options
 */
export function adaptMediaPipeFrame(
  rawFrame:
    | (MediaPipeRawLandmark | null | undefined)[]
    | MediaPipeRawFrame
    | Record<string | number, MediaPipeRawLandmark | null | undefined>
    | null
    | undefined,
  options?: MediaPipeAdapterOptions
): PoseFrame {
  if (!rawFrame) {
    return { landmarks: [] };
  }

  const landmarks: PoseLandmark[] = [];
  let timestamp_ms: number | undefined = undefined;

  if (Array.isArray(rawFrame)) {
    // Array of landmarks [0..32]
    for (let i = 0; i < rawFrame.length; i++) {
      const adapted = adaptMediaPipeLandmark(rawFrame[i], i, options);
      if (adapted) {
        landmarks.push(adapted);
      }
    }
  } else if (typeof rawFrame === 'object' && rawFrame !== null) {
    // MediaPipeRawFrame container or dictionary record
    if ('timestamp_ms' in rawFrame && typeof rawFrame.timestamp_ms === 'number' && Number.isFinite(rawFrame.timestamp_ms)) {
      timestamp_ms = rawFrame.timestamp_ms;
    }

    const rawLandmarks = 'landmarks' in rawFrame && rawFrame.landmarks !== undefined ? rawFrame.landmarks : rawFrame;

    if (Array.isArray(rawLandmarks)) {
      for (let i = 0; i < rawLandmarks.length; i++) {
        const adapted = adaptMediaPipeLandmark(rawLandmarks[i], i, options);
        if (adapted) {
          landmarks.push(adapted);
        }
      }
    } else if (rawLandmarks && typeof rawLandmarks === 'object') {
      // Keyed record/dictionary
      for (const [key, rawLm] of Object.entries(rawLandmarks)) {
        const adapted = adaptMediaPipeLandmark(rawLm, key, options);
        if (adapted) {
          landmarks.push(adapted);
        }
      }
    }
  }

  return {
    landmarks,
    ...(timestamp_ms !== undefined ? { timestamp_ms } : {}),
  };
}

/**
 * Adapt a sequence of MediaPipe frames into a canonical PoseFrame[] sequence.
 *
 * Preserves frame ordering, timestamps, and structure.
 * Deterministic and fail-safe: malformed frames produce empty PoseFrames without throwing.
 *
 * @param rawSequence - Array of MediaPipe frames
 * @param options     - Adapter options
 * @returns Array of canonical PoseFrame objects ready for PoseEngine.analyze()
 */
export function adaptMediaPipeSequence(
  rawSequence:
    | (
        | (MediaPipeRawLandmark | null | undefined)[]
        | MediaPipeRawFrame
        | Record<string | number, MediaPipeRawLandmark | null | undefined>
        | null
        | undefined
      )[]
    | null
    | undefined,
  options?: MediaPipeAdapterOptions
): PoseFrame[] {
  if (!rawSequence || !Array.isArray(rawSequence) || rawSequence.length === 0) {
    return [];
  }

  const frames: PoseFrame[] = [];

  for (let i = 0; i < rawSequence.length; i++) {
    const rawFrame = rawSequence[i];
    const adapted = adaptMediaPipeFrame(rawFrame, options);
    frames.push(adapted);
  }

  return frames;
}
