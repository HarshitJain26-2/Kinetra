/**
 * Kinetra Mobile MediaPipe Adapter
 * Maps standard 33-point MediaPipe/BlazePose landmarks to canonical PoseFrame.
 */

import { PoseFrame, PoseLandmark } from './types';

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

const CANONICAL_NAMES: ReadonlySet<string> = new Set(Object.values(MEDIAPIPE_INDEX_TO_CANONICAL_NAME));

export interface RawLandmarkInput {
  name?: string;
  index?: number;
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
}

export function adaptMediaPipeLandmark(
  raw: RawLandmarkInput | null | undefined,
  fallbackIndex?: number | string,
  minVisibility?: number
): PoseLandmark | null {
  if (!raw || typeof raw !== 'object') return null;

  let canonicalName: string | null = null;
  const nameIdentifier = raw.name ?? raw.index ?? fallbackIndex;

  if (typeof nameIdentifier === 'number') {
    canonicalName = MEDIAPIPE_INDEX_TO_CANONICAL_NAME[nameIdentifier] ?? null;
  } else if (typeof nameIdentifier === 'string') {
    const trimmed = nameIdentifier.trim().toLowerCase();
    if (CANONICAL_NAMES.has(trimmed)) {
      canonicalName = trimmed;
    } else {
      const numericIndex = Number(trimmed);
      if (Number.isInteger(numericIndex) && numericIndex in MEDIAPIPE_INDEX_TO_CANONICAL_NAME) {
        canonicalName = MEDIAPIPE_INDEX_TO_CANONICAL_NAME[numericIndex];
      }
    }
  }

  if (!canonicalName) return null;

  const x = raw.x;
  const y = raw.y;
  if (!Number.isFinite(x) || Number.isNaN(x) || !Number.isFinite(y) || Number.isNaN(y)) {
    return null;
  }

  const visibility = raw.visibility ?? raw.presence ?? 1.0;
  if (minVisibility !== undefined && visibility < minVisibility) {
    return null;
  }

  return {
    name: canonicalName,
    x,
    y,
    ...(raw.z !== undefined && Number.isFinite(raw.z) ? { z: raw.z } : {}),
    visibility,
  };
}

export function adaptMediaPipeFrame(
  rawLandmarks: (RawLandmarkInput | null | undefined)[] | null | undefined,
  timestampMs?: number,
  minVisibility?: number
): PoseFrame {
  if (!rawLandmarks || !Array.isArray(rawLandmarks)) {
    return { landmarks: [], ...(timestampMs !== undefined ? { timestamp_ms: timestampMs } : {}) };
  }

  const landmarks: PoseLandmark[] = [];
  for (let i = 0; i < rawLandmarks.length; i++) {
    const adapted = adaptMediaPipeLandmark(rawLandmarks[i], i, minVisibility);
    if (adapted) {
      landmarks.push(adapted);
    }
  }

  return {
    landmarks,
    ...(timestampMs !== undefined ? { timestamp_ms: timestampMs } : {}),
  };
}
