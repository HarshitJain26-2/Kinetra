/**
 * Kinetra Pose Analysis Core Engine — Built-In Exercise Configurations
 *
 * Pre-built ExerciseAnalysisConfig objects for exercises that exist in the
 * Migration 002 seed data. Use these directly without DB access for:
 *   - Unit tests
 *   - Mobile/ML team integration prototyping
 *   - Fallback configs when pose_landmarks JSONB is missing
 *
 * Framework-independent: no Express, Supabase, or HTTP imports.
 *
 * These IDs use the exercise name as a slug — replace with actual catalog UUIDs
 * when wiring to the live database.
 */

import type { ExerciseAnalysisConfig } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Lower-Body Exercises
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Barbell Squat
 *
 * Primary angle: knee flexion (left side dominant).
 * Rep: stand (160°) → parallel depth (90°) → stand.
 * Seed data: keypoints = ["left_hip","left_knee","left_ankle",...], target_angle = 90.
 */
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
    rest_angle:          160,  // Standing — knee nearly straight
    target_angle:        90,   // Parallel depth
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
      description:   'Torso-to-thigh angle indicates excessive forward lean; keep chest upright.',
      severity:      'medium',
      joint_triplet: ['left_shoulder', 'left_hip', 'left_knee'],
      condition:     'lt',
      threshold:     45,
    },
  ],
};

/**
 * Dumbbell Lunges
 *
 * Primary angle: front knee flexion.
 * Rep: stand (160°) → knee to 90° → stand.
 */
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
};

// ─────────────────────────────────────────────────────────────────────────────
// Upper-Body Exercises
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Push-Up
 *
 * Primary angle: elbow flexion (left side dominant).
 * Rep: arms extended (160°) → chest to floor (90°) → extended.
 * Seed data: keypoints = ["left_shoulder","left_elbow","left_wrist",...], target_angle = 90.
 */
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
    rest_angle:          160,  // Arms extended at top of push-up
    target_angle:        90,   // Chest near floor
    threshold_tolerance: 10,
  },
  min_visibility: 0.5,
  form_rules: [
    {
      id:          'pushup_excessive_depth',
      flag:        'elbow_over_flexion',
      description: 'Elbow flexion exceeds recommended depth (< 60°); avoid excessive anterior shoulder strain.',
      severity:    'low',
      angle_name:  'left_elbow_angle',
      condition:   'lt',
      threshold:   60,
    },
    {
      id:            'pushup_hip_sag',
      flag:          'body_alignment_deviation',
      description:   'Torso and hips deviate from a neutral straight plank line.',
      severity:      'high',
      joint_triplet: ['left_shoulder', 'left_hip', 'left_ankle'],
      condition:     'lt',
      threshold:     155,
    },
  ],
};

/**
 * Dumbbell Bicep Curl
 *
 * Primary angle: elbow flexion.
 * Rep: arm extended (160°) → full curl (~35°) → extended.
 * Seed data: target_angle_range = [35, 160].
 */
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
    rest_angle:          160,  // Arm straight/hanging
    target_angle:        35,   // Full contraction at top
    threshold_tolerance: 10,
  },
  min_visibility: 0.5,
  form_rules: [
    {
      id:          'bicep_curl_incomplete_extension',
      flag:        'incomplete_extension',
      description: 'Elbow did not reach full extension (> 140°) at the bottom of the curl.',
      severity:    'low',
      angle_name:  'left_elbow_angle',
      condition:   'lt',
      threshold:   140,
    },
  ],
};
