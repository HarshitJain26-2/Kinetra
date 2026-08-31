/**
 * Kinetra Mobile Built-In Exercise Configurations
 */

import { ExerciseAnalysisConfig } from './types';

export const SQUAT_ANALYSIS_CONFIG: ExerciseAnalysisConfig = {
  exercise_id: 'barbell-squat',
  exercise_name: 'Barbell Squat',
  required_landmarks: [
    'left_shoulder',
    'left_hip',  'left_knee',  'left_ankle',
    'right_hip', 'right_knee', 'right_ankle',
  ],
  angle_rules: [
    {
      name:     'left_knee_angle',
      proximal: 'left_hip',
      vertex:   'left_knee',
      distal:   'left_ankle',
    },
    {
      name:     'right_knee_angle',
      proximal: 'right_hip',
      vertex:   'right_knee',
      distal:   'right_ankle',
    },
  ],
  rep_rule: {
    angle_name:          'left_knee_angle',
    rest_angle:          160,
    target_angle:        90,
    threshold_tolerance: 10,
  },
  min_visibility: 0.5,
  form_rules: [
    {
      id:          'squat_excessive_depth',
      flag:        'knee_over_flexion',
      description: 'Knee flexion angle is excessively acute (< 60°); maintain controlled parallel depth.',
      severity:    'medium',
      angle_name:  'left_knee_angle',
      condition:   'lt',
      threshold:   60,
    },
    {
      id:            'squat_excessive_forward_lean',
      flag:          'excessive_forward_lean',
      description:   'Keep your chest up throughout the movement.',
      severity:      'medium',
      joint_triplet: ['left_shoulder', 'left_hip', 'left_knee'],
      condition:     'lt',
      threshold:     45,
    },
  ],
};

export const LUNGE_ANALYSIS_CONFIG: ExerciseAnalysisConfig = {
  exercise_id: 'dumbbell-lunges',
  exercise_name: 'Dumbbell Lunges',
  required_landmarks: [
    'left_hip',  'left_knee',  'left_ankle',
    'right_hip', 'right_knee', 'right_ankle',
  ],
  angle_rules: [
    {
      name:     'left_knee_angle',
      proximal: 'left_hip',
      vertex:   'left_knee',
      distal:   'left_ankle',
    },
  ],
  rep_rule: {
    angle_name:          'left_knee_angle',
    rest_angle:          160,
    target_angle:        90,
    threshold_tolerance: 10,
  },
  min_visibility: 0.5,
  form_rules: [
    {
      id:          'lunge_overextension',
      flag:        'lunge_knee_past_toe',
      description: 'Keep front knee tracking over your midfoot.',
      severity:    'low',
      angle_name:  'left_knee_angle',
      condition:   'lt',
      threshold:   75,
    },
  ],
};

export const PUSHUP_ANALYSIS_CONFIG: ExerciseAnalysisConfig = {
  exercise_id: 'push-up',
  exercise_name: 'Push-Up',
  required_landmarks: [
    'left_shoulder',  'left_elbow',  'left_wrist',
    'right_shoulder', 'right_elbow', 'right_wrist',
    'left_hip',       'left_ankle',
  ],
  angle_rules: [
    {
      name:     'left_elbow_angle',
      proximal: 'left_shoulder',
      vertex:   'left_elbow',
      distal:   'left_wrist',
    },
    {
      name:     'right_elbow_angle',
      proximal: 'right_shoulder',
      vertex:   'right_elbow',
      distal:   'right_wrist',
    },
  ],
  rep_rule: {
    angle_name:          'left_elbow_angle',
    rest_angle:          160,
    target_angle:        90,
    threshold_tolerance: 10,
  },
  min_visibility: 0.5,
  form_rules: [
    {
      id:          'pushup_excessive_depth',
      flag:        'elbow_over_flexion',
      description: 'Elbow flexion exceeds recommended depth (< 60°); avoid anterior shoulder strain.',
      severity:    'low',
      angle_name:  'left_elbow_angle',
      condition:   'lt',
      threshold:   60,
    },
    {
      id:            'pushup_hip_sag',
      flag:          'body_alignment_deviation',
      description:   'Maintain a rigid core plank without sagging hips.',
      severity:      'high',
      joint_triplet: ['left_shoulder', 'left_hip', 'left_ankle'],
      condition:     'lt',
      threshold:     155,
    },
  ],
};

export const BICEP_CURL_ANALYSIS_CONFIG: ExerciseAnalysisConfig = {
  exercise_id: 'dumbbell-bicep-curl',
  exercise_name: 'Dumbbell Bicep Curl',
  required_landmarks: [
    'left_shoulder',  'left_elbow',  'left_wrist',
    'right_shoulder', 'right_elbow', 'right_wrist',
  ],
  angle_rules: [
    {
      name:     'left_elbow_angle',
      proximal: 'left_shoulder',
      vertex:   'left_elbow',
      distal:   'left_wrist',
    },
  ],
  rep_rule: {
    angle_name:          'left_elbow_angle',
    rest_angle:          160,
    target_angle:        35,
    threshold_tolerance: 10,
  },
  min_visibility: 0.5,
  form_rules: [
    {
      id:          'bicep_curl_incomplete_extension',
      flag:        'incomplete_extension',
      description: 'Extend fully at the bottom of each repetition.',
      severity:    'low',
      angle_name:  'left_elbow_angle',
      condition:   'lt',
      threshold:   140,
    },
  ],
};

export function resolveExerciseConfig(exerciseNameOrId?: string): ExerciseAnalysisConfig {
  if (!exerciseNameOrId) return SQUAT_ANALYSIS_CONFIG;
  const lower = exerciseNameOrId.toLowerCase();
  if (lower.includes('squat')) return SQUAT_ANALYSIS_CONFIG;
  if (lower.includes('lunge')) return LUNGE_ANALYSIS_CONFIG;
  if (lower.includes('push')) return PUSHUP_ANALYSIS_CONFIG;
  if (lower.includes('curl') || lower.includes('bicep')) return BICEP_CURL_ANALYSIS_CONFIG;
  return SQUAT_ANALYSIS_CONFIG;
}
