/**
 * Kinetra Mobile Form Analyzer
 */

import { calculateJointAngle, LandmarkPoint, LandmarkMap } from './geometry';
import { PoseFrame, FormRule, FormFlag } from './types';

export interface FormAnalysisOptions {
  frameIndex?: number;
  minVisibility?: number;
}

export function frameToLandmarkMap(frame: PoseFrame): LandmarkMap {
  const map: LandmarkMap = {};
  if (!frame || !frame.landmarks || !Array.isArray(frame.landmarks)) {
    return map;
  }

  for (const lm of frame.landmarks) {
    if (lm && lm.name) {
      map[lm.name] = {
        x: lm.x,
        y: lm.y,
        ...(lm.z !== undefined ? { z: lm.z } : {}),
        ...(lm.visibility !== undefined ? { visibility: lm.visibility } : {}),
      };
    }
  }

  return map;
}

export function analyzeForm(
  angles: Record<string, number> | null | undefined,
  frame: PoseFrame | null | undefined,
  formRules: FormRule[] | null | undefined,
  options?: FormAnalysisOptions
): FormFlag[] {
  if (!formRules || !Array.isArray(formRules) || formRules.length === 0) {
    return [];
  }

  const safeAngles = angles ?? {};
  const safeFrame = frame ?? { landmarks: [] };
  const minVisibility = options?.minVisibility ?? 0.5;
  const frameIndex = options?.frameIndex;

  let landmarkMap: LandmarkMap | null = null;
  const flags: FormFlag[] = [];

  for (const rule of formRules) {
    if (!rule || typeof rule !== 'object' || !rule.id || !rule.flag) {
      continue;
    }

    let measuredAngle: number | null = null;

    if (rule.angle_name) {
      const val = safeAngles[rule.angle_name];
      if (val !== undefined && Number.isFinite(val) && !Number.isNaN(val)) {
        if (val > 0) {
          measuredAngle = val;
        }
      }
    } else if (rule.joint_triplet && Array.isArray(rule.joint_triplet) && rule.joint_triplet.length === 3) {
      if (!landmarkMap) {
        landmarkMap = frameToLandmarkMap(safeFrame);
      }

      const [pName, vName, dName] = rule.joint_triplet;
      const p = landmarkMap[pName];
      const v = landmarkMap[vName];
      const d = landmarkMap[dName];

      const pVis = p?.visibility ?? 1;
      const vVis = v?.visibility ?? 1;
      const dVis = d?.visibility ?? 1;

      if (pVis >= minVisibility && vVis >= minVisibility && dVis >= minVisibility) {
        const computed = calculateJointAngle(p, v, d);
        if (computed > 0) {
          measuredAngle = computed;
        }
      }
    }

    if (measuredAngle === null) {
      continue;
    }

    let violated = false;
    switch (rule.condition) {
      case 'lt':
        if (rule.threshold !== undefined && measuredAngle < rule.threshold) {
          violated = true;
        }
        break;
      case 'gt':
        if (rule.threshold !== undefined && measuredAngle > rule.threshold) {
          violated = true;
        }
        break;
      case 'between':
        if (
          rule.threshold_min !== undefined &&
          rule.threshold_max !== undefined &&
          measuredAngle >= rule.threshold_min &&
          measuredAngle <= rule.threshold_max
        ) {
          violated = true;
        }
        break;
    }

    if (violated) {
      flags.push({
        rule_id: rule.id,
        flag: rule.flag,
        description: rule.description,
        severity: rule.severity,
        observed_value: measuredAngle,
        ...(frameIndex !== undefined ? { frame_index: frameIndex } : {}),
      });
    }
  }

  return flags;
}
