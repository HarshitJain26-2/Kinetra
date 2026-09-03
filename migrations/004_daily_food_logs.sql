-- ==============================================================================
-- Kinetra Database Schema - Migration 004: Daily Food Logs
-- PostgreSQL / Supabase
-- ==============================================================================

CREATE TABLE IF NOT EXISTS daily_food_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date    date        NOT NULL DEFAULT CURRENT_DATE,
  meal_name   text        NOT NULL,
  timing      text        CHECK (timing IN ('breakfast','lunch','dinner','snack','pre_workout','post_workout'))
                          DEFAULT 'lunch',
  calories    numeric(6,1) NOT NULL CHECK (calories >= 0),
  protein_g   numeric(5,1) NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g     numeric(5,1) NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g       numeric(5,1) NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON daily_food_logs (user_id, log_date DESC);

-- Enable Row-Level Security
ALTER TABLE daily_food_logs ENABLE ROW LEVEL SECURITY;

-- 1. SELECT OWN
DROP POLICY IF EXISTS food_logs_select_own ON daily_food_logs;
CREATE POLICY food_logs_select_own ON daily_food_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- 2. INSERT OWN
DROP POLICY IF EXISTS food_logs_insert_own ON daily_food_logs;
CREATE POLICY food_logs_insert_own ON daily_food_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 3. UPDATE OWN
DROP POLICY IF EXISTS food_logs_update_own ON daily_food_logs;
CREATE POLICY food_logs_update_own ON daily_food_logs
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. DELETE OWN
DROP POLICY IF EXISTS food_logs_delete_own ON daily_food_logs;
CREATE POLICY food_logs_delete_own ON daily_food_logs
  FOR DELETE
  USING (user_id = auth.uid());
