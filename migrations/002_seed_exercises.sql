-- ==============================================================================
-- Kinetra Exercise Seed Data - Migration 002: Seed Exercises
-- Curated exercises across muscle groups, equipment, and difficulties
-- Includes deterministic IDs matching the mobile fallback catalog
-- ==============================================================================

INSERT INTO exercises (id, name, description, muscle_group, equipment, difficulty, pose_landmarks, demo_video_url)
VALUES
  -- Foundational Mobile Fallback Catalog (Deterministic UUIDs)
  (
    '11111111-4444-4444-8888-000000000001',
    'Barbell Back Squat',
    'Primary lower-body compound movement targeting quadriceps, glutes, and hamstrings.',
    'quadriceps',
    'barbell',
    'hard',
    '{"keypoints": ["left_hip", "left_knee", "left_ankle", "right_hip", "right_knee", "right_ankle"], "target_angle": 90, "plane": "sagittal"}'::jsonb,
    'https://assets.kinetra.app/videos/squat_demo.mp4'
  ),
  (
    '11111111-4444-4444-8888-000000000002',
    'Overhead Press',
    'Standing overhead barbell/dumbbell press developing deltoids, clavicular head, and core stability.',
    'shoulders',
    'barbell',
    'medium',
    '{"keypoints": ["left_elbow", "left_shoulder", "left_hip", "right_elbow", "right_shoulder", "right_hip"], "lockout_angle": 175, "plane": "frontal"}'::jsonb,
    'https://assets.kinetra.app/videos/shoulder_press_demo.mp4'
  ),
  (
    '11111111-4444-4444-8888-000000000003',
    'Romanian Deadlift',
    'Hip-hinge posterior chain exercise loading the hamstrings and gluteus maximus.',
    'hamstrings',
    'barbell',
    'medium',
    '{"keypoints": ["left_shoulder", "left_hip", "left_knee", "left_ankle"], "hip_hinge_depth": 75, "plane": "sagittal"}'::jsonb,
    'https://assets.kinetra.app/videos/rdl_demo.mp4'
  ),
  (
    '11111111-4444-4444-8888-000000000004',
    'Barbell Bench Press',
    'Horizontal compound press for the pectoralis major, anterior deltoids, and triceps.',
    'chest',
    'barbell',
    'medium',
    '{"keypoints": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist"], "touch_chest": true, "plane": "sagittal"}'::jsonb,
    'https://assets.kinetra.app/videos/bench_press_demo.mp4'
  ),
  (
    '11111111-4444-4444-8888-000000000005',
    'Weighted Pull-Ups',
    'Vertical pull-up with additional load for high-intensity latissimus and biceps development.',
    'back',
    'bodyweight',
    'hard',
    '{"keypoints": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist", "nose"], "chin_over_bar": true, "plane": "frontal"}'::jsonb,
    'https://assets.kinetra.app/videos/pullup_demo.mp4'
  ),

  -- Additional Curated Catalog
  (
    'a0000000-0000-0000-0000-000000000001',
    'Barbell Squat',
    'Compound lower-body exercise targeting the quadriceps, hamstrings, and glutes with barbell across upper traps.',
    'quadriceps',
    'barbell',
    'hard',
    '{"keypoints": ["left_hip", "left_knee", "left_ankle", "right_hip", "right_knee", "right_ankle"], "target_angle": 90, "plane": "sagittal"}'::jsonb,
    'https://assets.kinetra.app/videos/squat_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'Push-Up',
    'Classic bodyweight upper body exercise targeting the pectoralis major, anterior deltoids, and triceps.',
    'chest',
    'bodyweight',
    'easy',
    '{"keypoints": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist", "left_hip"], "target_angle": 90, "plane": "transverse"}'::jsonb,
    'https://assets.kinetra.app/videos/pushup_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'Deadlift',
    'Posterior chain compound exercise building strength in the lower back, glutes, hamstrings, and traps.',
    'back',
    'barbell',
    'hard',
    '{"keypoints": ["left_shoulder", "left_hip", "left_knee", "left_ankle", "right_shoulder", "right_hip"], "spine_alignment_check": true, "plane": "sagittal"}'::jsonb,
    'https://assets.kinetra.app/videos/deadlift_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'Dumbbell Bicep Curl',
    'Isolation movement focusing on the biceps brachii with supination at the top of the contraction.',
    'biceps',
    'dumbbell',
    'easy',
    '{"keypoints": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist"], "target_angle_range": [35, 160], "plane": "sagittal"}'::jsonb,
    'https://assets.kinetra.app/videos/bicep_curl_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    'Overhead Dumbbell Shoulder Press',
    'Vertical pressing movement developing the deltoids, upper chest, and triceps stability.',
    'shoulders',
    'dumbbell',
    'medium',
    '{"keypoints": ["left_elbow", "left_shoulder", "left_hip", "right_elbow", "right_shoulder", "right_hip"], "lockout_angle": 175, "plane": "frontal"}'::jsonb,
    'https://assets.kinetra.app/videos/shoulder_press_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000006',
    'Pull-Up',
    'Upper body pulling exercise targeting the latissimus dorsi, rhomboids, and biceps.',
    'back',
    'bodyweight',
    'hard',
    '{"keypoints": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist", "nose"], "chin_over_bar": true, "plane": "frontal"}'::jsonb,
    'https://assets.kinetra.app/videos/pullup_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000007',
    'Plank',
    'Isometric core exercise strengthening abdominal muscles, lower back, and shoulder stabilizers.',
    'core',
    'bodyweight',
    'easy',
    '{"keypoints": ["left_shoulder", "left_hip", "left_ankle", "right_shoulder", "right_hip", "right_ankle"], "straight_line_tolerance_deg": 10, "plane": "sagittal"}'::jsonb,
    'https://assets.kinetra.app/videos/plank_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000008',
    'Dumbbell Lunges',
    'Unilateral leg movement enhancing balance, quadriceps, gluteal activation, and hip stability.',
    'quadriceps',
    'dumbbell',
    'medium',
    '{"keypoints": ["left_hip", "left_knee", "left_ankle", "right_hip", "right_knee", "right_ankle"], "knee_angle_target": 90, "plane": "sagittal"}'::jsonb,
    'https://assets.kinetra.app/videos/lunge_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000009',
    'Bench Press',
    'Foundational upper body compound pressing exercise for chest mass and pushing strength.',
    'chest',
    'barbell',
    'medium',
    '{"keypoints": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist"], "touch_chest": true, "plane": "sagittal"}'::jsonb,
    'https://assets.kinetra.app/videos/bench_press_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000010',
    'Lateral Dumbbell Raise',
    'Isolation movement building width and definition in the lateral head of the deltoid.',
    'shoulders',
    'dumbbell',
    'easy',
    '{"keypoints": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist"], "arm_abduction_max_deg": 90, "plane": "frontal"}'::jsonb,
    'https://assets.kinetra.app/videos/lateral_raise_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000011',
    'Tricep Dips',
    'Bodyweight movement targeting the triceps brachii, anterior deltoids, and lower chest.',
    'triceps',
    'bodyweight',
    'medium',
    '{"keypoints": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist"], "elbow_flexion_target": 90, "plane": "sagittal"}'::jsonb,
    'https://assets.kinetra.app/videos/dips_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000012',
    'Russian Twist',
    'Rotational core exercise developing rotational torque, obliques, and midsection endurance.',
    'core',
    'bodyweight',
    'easy',
    '{"keypoints": ["left_shoulder", "right_shoulder", "left_hip", "right_hip", "left_knee"], "rotation_angle_min": 45, "plane": "transverse"}'::jsonb,
    'https://assets.kinetra.app/videos/russian_twist_demo.mp4'
  ),
  (
    'a0000000-0000-0000-0000-000000000013',
    'Leg Press',
    'Machine-based compound leg exercise allowing heavy quad and glute loading with reduced spinal fatigue.',
    'quadriceps',
    'machine',
    'medium',
    '{"keypoints": ["left_hip", "left_knee", "left_ankle", "right_hip", "right_knee", "right_ankle"], "knee_flexion_target": 90, "plane": "sagittal"}'::jsonb,
    'https://assets.kinetra.app/videos/leg_press_demo.mp4'
  )
ON CONFLICT (name) DO NOTHING;
