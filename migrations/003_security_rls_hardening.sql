-- ==============================================================================
-- Kinetra Database Schema - Migration 003: Security & RLS Policy Hardening
-- PostgreSQL / Supabase
-- ==============================================================================
-- Objective:
-- 1. Ensure all UPDATE policies enforce WITH CHECK clauses to prevent ownership
--    transfer, user_id/creator_id spoofing, and privilege escalation.
-- 2. Add complete DELETE policies for child and user-owned resources.
-- 3. Ensure public_profiles view is strictly limited to non-sensitive fields.
-- ==============================================================================

-- 1. USERS POLICIES HARDENING
DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS users_delete_own ON users;
CREATE POLICY users_delete_own ON users
  FOR DELETE
  USING (id = auth.uid());

-- 2. WORKOUTS POLICIES HARDENING
DROP POLICY IF EXISTS workouts_update ON workouts;
CREATE POLICY workouts_update ON workouts
  FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- 3. WORKOUT_EXERCISES POLICIES HARDENING
DROP POLICY IF EXISTS we_update ON workout_exercises;
CREATE POLICY we_update ON workout_exercises
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_id AND w.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_id AND w.creator_id = auth.uid()
    )
  );

-- 4. SESSIONS POLICIES HARDENING
DROP POLICY IF EXISTS sessions_update_own ON sessions;
CREATE POLICY sessions_update_own ON sessions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS sessions_delete_own ON sessions;
CREATE POLICY sessions_delete_own ON sessions
  FOR DELETE
  USING (user_id = auth.uid());

-- 5. SESSION_EXERCISES POLICIES HARDENING
DROP POLICY IF EXISTS se_update ON session_exercises;
CREATE POLICY se_update ON session_exercises
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS se_delete ON session_exercises;
CREATE POLICY se_delete ON session_exercises
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- 6. INJURY_FLAGS POLICIES HARDENING
DROP POLICY IF EXISTS injury_update_own ON injury_flags;
CREATE POLICY injury_update_own ON injury_flags
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS injury_delete_own ON injury_flags;
CREATE POLICY injury_delete_own ON injury_flags
  FOR DELETE
  USING (user_id = auth.uid());

-- 7. NUTRITION_PROFILES POLICIES HARDENING
DROP POLICY IF EXISTS nutrition_update_own ON nutrition_profiles;
CREATE POLICY nutrition_update_own ON nutrition_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS nutrition_delete_own ON nutrition_profiles;
CREATE POLICY nutrition_delete_own ON nutrition_profiles
  FOR DELETE
  USING (user_id = auth.uid());

-- 8. CHALLENGES POLICIES HARDENING
DROP POLICY IF EXISTS challenges_update ON challenges;
CREATE POLICY challenges_update ON challenges
  FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- 9. CHALLENGE_PARTICIPANTS POLICIES HARDENING
DROP POLICY IF EXISTS cp_update ON challenge_participants;
CREATE POLICY cp_update ON challenge_participants
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS cp_delete ON challenge_participants;
CREATE POLICY cp_delete ON challenge_participants
  FOR DELETE
  USING (user_id = auth.uid());

-- 10. PUBLIC PROFILES VIEW
CREATE OR REPLACE VIEW public_profiles AS
  SELECT
    id,
    display_name,
    avatar_url,
    fitness_level
  FROM users;

GRANT SELECT ON public_profiles TO authenticated;
