/**
 * Kinetra Mobile Pose Types
 */

import { LandmarkPoint, LandmarkMap, RepStage, RepCounterConfig } from './geometry';

export type { LandmarkPoint, LandmarkMap, RepStage, RepCounterConfig };

export interface PoseLandmark {
  name: string;
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseFrame {
  landmarks: PoseLandmark[];
  timestamp_ms?: number;
}

export interface AngleRule {
  name: string;
  proximal: string;
  vertex: string;
  distal: string;
}

export interface RepRule {
  angle_name: string;
  rest_angle: number;
  target_angle: number;
  threshold_tolerance?: number;
}

export type FormRuleCondition = 'lt' | 'gt' | 'between';

export interface FormRule {
  id: string;
  flag: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  angle_name?: string;
  joint_triplet?: [string, string, string];
  condition: FormRuleCondition;
  threshold?: number;
  threshold_min?: number;
  threshold_max?: number;
}

export interface ExerciseAnalysisConfig {
  exercise_id: string;
  exercise_name: string;
  required_landmarks: string[];
  angle_rules: AngleRule[];
  rep_rule: RepRule;
  min_visibility?: number;
  form_rules?: FormRule[];
}

export interface FormFlag {
  rule_id: string;
  flag: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  observed_value?: number;
  frame_index?: number;
}

export interface PoseAnalysisResult {
  exercise_id: string;
  rep_count: number;
  average_form_score: number;
  rep_scores: number[];
  flags: FormFlag[];
  average_visibility: number;
  duration_ms?: number;
  last_angles?: Record<string, number>;
  last_stage?: RepStage;
}
