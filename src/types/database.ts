export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';
export type SessionStatus = 'active' | 'completed' | 'cancelled';
export type InjurySeverity = 'low' | 'medium' | 'high';
export type InjurySource = 'ai' | 'user';
export type NutritionGoal = 'lose_weight' | 'maintain' | 'gain_muscle' | 'general_health';
export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'custom';
export type ChallengeType = 'streak' | 'volume' | 'time' | 'custom';

export interface UserRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_level: FitnessLevel;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicProfileRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  fitness_level: FitnessLevel;
}

export interface ExerciseRow {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string;
  equipment: string | null;
  difficulty: ExerciseDifficulty;
  pose_landmarks: Record<string, any> | null;
  demo_video_url: string | null;
  created_at: string;
}

export interface WorkoutRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: ExerciseDifficulty;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExerciseRow {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  target_reps: number | null;
  target_weight_kg: number | null;
}

export interface SessionRow {
  id: string;
  user_id: string;
  workout_id: string | null;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  calories_est: number | null;
  notes: string | null;
}

export interface SessionExerciseRow {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
  form_score: number | null;
  injury_flag: boolean;
  feedback: string | null;
  recorded_at: string;
}

export interface InjuryFlagRow {
  id: string;
  user_id: string;
  session_exercise_id: string | null;
  body_part: string;
  severity: InjurySeverity;
  description: string | null;
  source: InjurySource;
  resolved: boolean;
  flagged_at: string;
  resolved_at: string | null;
}

export interface NutritionProfileRow {
  id: string;
  user_id: string;
  goal: NutritionGoal;
  diet_type: DietType;
  allergies: string[] | null;
  daily_cal_target: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  meal_plan_json: Record<string, any> | null;
  updated_at: string;
}

export interface ChallengeRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  type: ChallengeType;
  metric_key: string | null;
  target_value: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface ChallengeParticipantRow {
  id: string;
  challenge_id: string;
  user_id: string;
  current_value: number;
  rank: number | null;
  joined_at: string;
  completed_at: string | null;
}
