-- ==============================================================================
-- Kinetra Database Schema - Migration 001: Initial Schema
-- PostgreSQL / Supabase
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLES (Ordered by Foreign Key Dependencies)
-- ==============================================================================

-- 1.1 EXERCISES (Standalone Catalog)
CREATE TABLE IF NOT EXISTS exercises (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL UNIQUE,
  description     text,
  muscle_group    text        NOT NULL,
  equipment       text,
  difficulty      text        CHECK (difficulty IN ('easy','medium','hard'))
                              DEFAULT 'medium',
  pose_landmarks  jsonb,
  demo_video_url  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 1.2 USERS (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text        NOT NULL,
  avatar_url      text,
  date_of_birth   date,
  gender          text        CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  height_cm       numeric(5,1),
  weight_kg       numeric(5,1),
  fitness_level   text        CHECK (fitness_level IN ('beginner','intermediate','advanced'))
                              DEFAULT 'beginner',
  onboarding_done boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 1.3 WORKOUTS (User-created workout routines)
CREATE TABLE IF NOT EXISTS workouts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text,
  category        text,
  difficulty      text        CHECK (difficulty IN ('easy','medium','hard'))
                              DEFAULT 'medium',
  is_public       boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 1.4 WORKOUT_EXERCISES (Ordered exercises in a workout template)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id      uuid        NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id     uuid        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index     smallint    NOT NULL,
  target_sets     smallint    NOT NULL DEFAULT 3,
  target_reps     smallint,
  target_weight_kg numeric(5,1),

  UNIQUE (workout_id, order_index)
);

-- 1.5 SESSIONS (Active/completed user workout sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id      uuid        REFERENCES workouts(id) ON DELETE SET NULL,
  status          text        NOT NULL CHECK (status IN ('active','completed','cancelled'))
                              DEFAULT 'active',
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  duration_sec    integer,
  calories_est    numeric(7,1),
  notes           text
);

-- 1.6 SESSION_EXERCISES (Sets logged during a workout session)
CREATE TABLE IF NOT EXISTS session_exercises (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id     uuid        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number      smallint    NOT NULL DEFAULT 1,
  reps            smallint,
  weight_kg       numeric(5,1),
  duration_sec    integer,
  form_score      numeric(4,1) CHECK (form_score >= 0 AND form_score <= 100),
  injury_flag     boolean     NOT NULL DEFAULT false,
  feedback        text,
  recorded_at     timestamptz NOT NULL DEFAULT now()
);

-- 1.7 INJURY_FLAGS (Risk / strain records from AI or user)
CREATE TABLE IF NOT EXISTS injury_flags (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_exercise_id uuid    REFERENCES session_exercises(id) ON DELETE SET NULL,
  body_part       text        NOT NULL,
  severity        text        NOT NULL CHECK (severity IN ('low','medium','high'))
                              DEFAULT 'low',
  description     text,
  source          text        NOT NULL CHECK (source IN ('ai','user'))
                              DEFAULT 'ai',
  resolved        boolean     NOT NULL DEFAULT false,
  flagged_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);

-- 1.8 NUTRITION_PROFILES (User dietary goals and meal plans)
CREATE TABLE IF NOT EXISTS nutrition_profiles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  goal            text        CHECK (goal IN ('lose_weight','maintain','gain_muscle','general_health'))
                              DEFAULT 'general_health',
  diet_type       text        CHECK (diet_type IN ('omnivore','vegetarian','vegan','keto','paleo','custom'))
                              DEFAULT 'omnivore',
  allergies       text[],
  daily_cal_target numeric(6,1),
  protein_g       numeric(5,1),
  carbs_g         numeric(5,1),
  fat_g           numeric(5,1),
  meal_plan_json  jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 1.9 CHALLENGES (Community or custom fitness challenges)
CREATE TABLE IF NOT EXISTS challenges (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text,
  type            text        NOT NULL CHECK (type IN ('streak','volume','time','custom'))
                              DEFAULT 'custom',
  metric_key      text,
  target_value    numeric(10,2),
  start_date      date        NOT NULL,
  end_date        date        NOT NULL,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 1.10 CHALLENGE_PARTICIPANTS (Users in challenges + leaderboard data)
CREATE TABLE IF NOT EXISTS challenge_participants (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    uuid        NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_value   numeric(10,2) NOT NULL DEFAULT 0,
  rank            integer,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,

  UNIQUE (challenge_id, user_id)
);

-- ==============================================================================
-- 2. INDEXES
-- ==============================================================================

-- Exercises indexes
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises (muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty   ON exercises (difficulty);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_fitness_level ON users (fitness_level);

-- Workouts indexes
CREATE INDEX IF NOT EXISTS idx_workouts_creator  ON workouts (creator_id);
CREATE INDEX IF NOT EXISTS idx_workouts_category ON workouts (category);
CREATE INDEX IF NOT EXISTS idx_workouts_public   ON workouts (is_public) WHERE is_public = true;

-- Workout Exercises indexes
CREATE INDEX IF NOT EXISTS idx_we_workout  ON workout_exercises (workout_id);
CREATE INDEX IF NOT EXISTS idx_we_exercise ON workout_exercises (exercise_id);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user   ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (user_id, status);

-- Session Exercises indexes
CREATE INDEX IF NOT EXISTS idx_se_session  ON session_exercises (session_id);
CREATE INDEX IF NOT EXISTS idx_se_exercise ON session_exercises (exercise_id);
CREATE INDEX IF NOT EXISTS idx_se_injury   ON session_exercises (injury_flag) WHERE injury_flag = true;

-- Injury Flags indexes
CREATE INDEX IF NOT EXISTS idx_injury_user       ON injury_flags (user_id);
CREATE INDEX IF NOT EXISTS idx_injury_unresolved ON injury_flags (user_id, resolved) WHERE resolved = false;

-- Challenges indexes
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges (is_active, end_date);

-- Challenge Participants indexes
CREATE INDEX IF NOT EXISTS idx_cp_challenge ON challenge_participants (challenge_id);
CREATE INDEX IF NOT EXISTS idx_cp_user      ON challenge_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_cp_rank      ON challenge_participants (challenge_id, current_value DESC);

-- ==============================================================================
-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all relevant tables
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises   ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_flags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- 3.1 USERS POLICIES
CREATE POLICY users_select_own ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (id = auth.uid());

-- 3.2 WORKOUTS POLICIES
CREATE POLICY workouts_select ON workouts
  FOR SELECT USING (creator_id = auth.uid() OR is_public = true);

CREATE POLICY workouts_insert ON workouts
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY workouts_update ON workouts
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY workouts_delete ON workouts
  FOR DELETE USING (creator_id = auth.uid());

-- 3.3 WORKOUT_EXERCISES POLICIES
CREATE POLICY we_select ON workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_id AND (w.creator_id = auth.uid() OR w.is_public = true)
    )
  );

CREATE POLICY we_insert ON workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_id AND w.creator_id = auth.uid()
    )
  );

CREATE POLICY we_update ON workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_id AND w.creator_id = auth.uid()
    )
  );

CREATE POLICY we_delete ON workout_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_id AND w.creator_id = auth.uid()
    )
  );

-- 3.4 SESSIONS POLICIES
CREATE POLICY sessions_select_own ON sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY sessions_insert_own ON sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY sessions_update_own ON sessions
  FOR UPDATE USING (user_id = auth.uid());

-- 3.5 SESSION_EXERCISES POLICIES
CREATE POLICY se_select ON session_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY se_insert ON session_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- 3.6 INJURY_FLAGS POLICIES
CREATE POLICY injury_select_own ON injury_flags
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY injury_insert_own ON injury_flags
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY injury_update_own ON injury_flags
  FOR UPDATE USING (user_id = auth.uid());

-- 3.7 NUTRITION_PROFILES POLICIES
CREATE POLICY nutrition_select_own ON nutrition_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY nutrition_insert_own ON nutrition_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY nutrition_update_own ON nutrition_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- 3.8 CHALLENGES POLICIES
CREATE POLICY challenges_select ON challenges
  FOR SELECT USING (true);

CREATE POLICY challenges_insert ON challenges
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY challenges_update ON challenges
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY challenges_delete ON challenges
  FOR DELETE USING (creator_id = auth.uid());

-- 3.9 CHALLENGE_PARTICIPANTS POLICIES
CREATE POLICY cp_select ON challenge_participants
  FOR SELECT USING (true);

CREATE POLICY cp_insert ON challenge_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY cp_update ON challenge_participants
  FOR UPDATE USING (user_id = auth.uid());

-- ==============================================================================
-- 4. VIEWS & PERMISSIONS
-- ==============================================================================

-- Public user profiles view (exposes safe profile fields without leaking private health/body metrics)
CREATE OR REPLACE VIEW public_profiles AS
  SELECT
    id,
    display_name,
    avatar_url,
    fitness_level
  FROM users;

-- Grant select permission to authenticated users
GRANT SELECT ON public_profiles TO authenticated;
