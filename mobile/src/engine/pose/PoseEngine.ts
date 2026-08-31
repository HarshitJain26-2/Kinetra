/**
 * Kinetra Mobile PoseEngine
 */

import { calculateJointAngle, ExerciseRepCounter, LandmarkMap } from './geometry';
import { analyzeForm, frameToLandmarkMap } from './formAnalyzer';
import { PoseFrame, ExerciseAnalysisConfig, PoseAnalysisResult, FormFlag } from './types';

export class PoseEngine {
  static analyze(
    config: ExerciseAnalysisConfig,
    frames: PoseFrame[]
  ): PoseAnalysisResult {
    const { rep_rule, angle_rules, min_visibility = 0.5, form_rules = [] } = config;

    const counter = new ExerciseRepCounter({
      restAngle:          rep_rule.rest_angle,
      targetAngle:        rep_rule.target_angle,
      thresholdTolerance: rep_rule.threshold_tolerance,
    });

    let lastAngles: Record<string, number> = {};
    let lastStage = counter.getStage();
    let totalVisibility = 0;
    let visibilitySamples = 0;
    const flags: FormFlag[] = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (!frame || !frame.landmarks || frame.landmarks.length === 0) {
        continue;
      }

      const landmarkMap: LandmarkMap = frameToLandmarkMap(frame);

      for (const lm of frame.landmarks) {
        if (lm.visibility !== undefined) {
          totalVisibility += lm.visibility;
          visibilitySamples++;
        }
      }

      const frameAngles: Record<string, number> = {};
      for (const rule of angle_rules) {
        const p = landmarkMap[rule.proximal];
        const v = landmarkMap[rule.vertex];
        const d = landmarkMap[rule.distal];

        const pVis = p?.visibility ?? 1;
        const vVis = v?.visibility ?? 1;
        const dVis = d?.visibility ?? 1;

        if (pVis >= min_visibility && vVis >= min_visibility && dVis >= min_visibility) {
          const angle = calculateJointAngle(p, v, d);
          if (angle > 0) {
            frameAngles[rule.name] = angle;
          }
        }
      }

      lastAngles = frameAngles;

      const primaryAngle = frameAngles[rep_rule.angle_name];
      if (primaryAngle !== undefined && primaryAngle > 0) {
        const stepResult = counter.processSample(primaryAngle);
        lastStage = stepResult.stage;
      }

      if (form_rules.length > 0) {
        const frameFlags = analyzeForm(frameAngles, frame, form_rules, {
          frameIndex: i,
          minVisibility: min_visibility,
        });

        for (const flag of frameFlags) {
          const alreadyLogged = flags.some(
            (f) => f.flag === flag.flag && f.rule_id === flag.rule_id
          );
          if (!alreadyLogged) {
            flags.push(flag);
          }
        }
      }
    }

    const repScores = counter.getRepScores();
    const repCount = counter.getCount();

    let averageFormScore = 100;
    if (repScores.length > 0) {
      const sum = repScores.reduce((acc, s) => acc + s, 0);
      averageFormScore = Math.round(sum / repScores.length);
    }

    for (const flag of flags) {
      if (flag.severity === 'high') averageFormScore -= 10;
      else if (flag.severity === 'medium') averageFormScore -= 5;
      else if (flag.severity === 'low') averageFormScore -= 2;
    }
    averageFormScore = Math.max(0, Math.min(100, averageFormScore));

    const averageVisibility =
      visibilitySamples > 0
        ? Number((totalVisibility / visibilitySamples).toFixed(2))
        : 1.0;

    let durationMs: number | undefined;
    if (frames.length >= 2) {
      const firstTs = frames[0]?.timestamp_ms;
      const lastTs = frames[frames.length - 1]?.timestamp_ms;
      if (firstTs !== undefined && lastTs !== undefined && lastTs >= firstTs) {
        durationMs = lastTs - firstTs;
      }
    }

    return {
      exercise_id: config.exercise_id,
      rep_count: repCount,
      average_form_score: averageFormScore,
      rep_scores: repScores,
      flags,
      average_visibility: averageVisibility,
      duration_ms: durationMs,
      last_angles: lastAngles,
      last_stage: lastStage,
    };
  }
}
