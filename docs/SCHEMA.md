# Kinetra — Database Schema (Postgres / Supabase)

> **Convention notes**
>
> - All tables live in the `public` schema.
> - `auth.users` is Supabase's built-in auth table — we never modify it directly.
> - Timestamps default to `now()` and use `timestamptz`.
> - Soft-delete via `deleted_at` is used where rows may need recovery.
> - `uuid_generate_v4()` (pgcrypto / uuid-ossp) is assumed available.

---

## 1. `users`

> Extended profile that mirrors Supabase `auth.users`.

```sql
CREATE TABLE users (
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

-- Indexes
CREATE INDEX idx_users_fitness_level ON users (fitness_level);
```

---

## 2. `exercises`

> Master catalog of individual exercises (e.g., "Barbell Squat").

```sql
CREATE TABLE exercises (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            text        NOT NULL UNIQUE,
  description     text,
  muscle_group    text        NOT NULL,                       -- e.g. 'quadriceps', 'chest'
  equipment       text,                                       -- e.g. 'barbell', 'bodyweight'
  difficulty      text        CHECK (difficulty IN ('easy','medium','hard'))
                              DEFAULT 'medium',
  pose_landmarks  jsonb,                                      -- MediaPipe landmark config for AI analysis
  demo_video_url  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_exercises_muscle_group ON exercises (muscle_group);
CREATE INDEX idx_exercises_difficulty   ON exercises (difficulty);
```

---

## 3. `workouts`

> A named collection / template of exercises a user can follow.

```sql
CREATE TABLE workouts (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text,
  category        text,                                       -- e.g. 'strength', 'cardio', 'flexibility'
  difficulty      text        CHECK (difficulty IN ('easy','medium','hard'))
                              DEFAULT 'medium',
  is_public       boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workouts_creator  ON workouts (creator_id);
CREATE INDEX idx_workouts_category ON workouts (category);
CREATE INDEX idx_workouts_public   ON workouts (is_public) WHERE is_public = true;
```

---

## 3b. `workout_exercises`

> Join table: ordered list of exercises within a workout template, with prescribed targets.

```sql
CREATE TABLE workout_exercises (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id      uuid        NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id     uuid        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index     smallint    NOT NULL,                       -- position in the workout (0-based)
  target_sets     smallint    NOT NULL DEFAULT 3,
  target_reps     smallint,                                   -- null for timed exercises
  target_weight_kg numeric(5,1),                              -- suggested weight (optional)

  UNIQUE (workout_id, order_index)
);

-- Indexes
CREATE INDEX idx_we_workout  ON workout_exercises (workout_id);
CREATE INDEX idx_we_exercise ON workout_exercises (exercise_id);
```

---

## 4. `sessions`

> A single real-time workout session performed by a user.

```sql
CREATE TABLE sessions (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id      uuid        REFERENCES workouts(id) ON DELETE SET NULL,
  status          text        NOT NULL CHECK (status IN ('active','completed','cancelled'))
                              DEFAULT 'active',
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  duration_sec    integer,                                    -- computed on end
  calories_est    numeric(7,1),                               -- estimated kcal
  notes           text
);

-- Indexes
CREATE INDEX idx_sessions_user   ON sessions (user_id);
CREATE INDEX idx_sessions_status ON sessions (user_id, status);
```

---

## 5. `session_exercises`

> Join table: each exercise performed within a session, with per-set metrics.

```sql
CREATE TABLE session_exercises (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      uuid        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id     uuid        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number      smallint    NOT NULL DEFAULT 1,
  reps            smallint,
  weight_kg       numeric(5,1),
  duration_sec    integer,                                    -- for timed exercises
  form_score      numeric(4,1) CHECK (form_score >= 0 AND form_score <= 100),
  injury_flag     boolean     NOT NULL DEFAULT false,
  feedback        text,                                       -- AI-generated form feedback
  recorded_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_se_session  ON session_exercises (session_id);
CREATE INDEX idx_se_exercise ON session_exercises (exercise_id);
CREATE INDEX idx_se_injury   ON session_exercises (injury_flag) WHERE injury_flag = true;
```

---

## 6. `injury_flags`

> Persistent injury/alert records raised by AI or manually by the user.

```sql
CREATE TABLE injury_flags (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_exercise_id uuid    REFERENCES session_exercises(id) ON DELETE SET NULL,
  body_part       text        NOT NULL,                       -- e.g. 'left_knee', 'lower_back'
  severity        text        NOT NULL CHECK (severity IN ('low','medium','high'))
                              DEFAULT 'low',
  description     text,
  source          text        NOT NULL CHECK (source IN ('ai','user'))
                              DEFAULT 'ai',
  resolved        boolean     NOT NULL DEFAULT false,
  flagged_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);

-- Indexes
CREATE INDEX idx_injury_user       ON injury_flags (user_id);
CREATE INDEX idx_injury_unresolved ON injury_flags (user_id, resolved) WHERE resolved = false;
```

---

## 7. `nutrition_profiles`

> Per-user nutritional targets and dietary preferences.

```sql
CREATE TABLE nutrition_profiles (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  goal            text        CHECK (goal IN ('lose_weight','maintain','gain_muscle','general_health'))
                              DEFAULT 'general_health',
  diet_type       text        CHECK (diet_type IN ('omnivore','vegetarian','vegan','keto','paleo','custom'))
                              DEFAULT 'omnivore',
  allergies       text[],                                     -- e.g. {'gluten','dairy'}
  daily_cal_target numeric(6,1),
  protein_g       numeric(5,1),
  carbs_g         numeric(5,1),
  fat_g           numeric(5,1),
  meal_plan_json  jsonb,                                      -- latest AI-generated meal plan
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes (unique on user_id is implicit via UNIQUE constraint)
```

---

## 8. `challenges`

> Community or system-created fitness challenges.

```sql
CREATE TABLE challenges (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text,
  type            text        NOT NULL CHECK (type IN ('streak','volume','time','custom'))
                              DEFAULT 'custom',
  metric_key      text,                                       -- e.g. 'total_reps', 'total_duration_sec'
  target_value    numeric(10,2),
  start_date      date        NOT NULL,
  end_date        date        NOT NULL,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_challenges_active ON challenges (is_active, end_date);
```

---

## 9. `challenge_participants`

> Join table: users enrolled in a challenge with their progress.

```sql
CREATE TABLE challenge_participants (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id    uuid        NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_value   numeric(10,2) NOT NULL DEFAULT 0,
  rank            integer,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,

  UNIQUE (challenge_id, user_id)
);

-- Indexes
CREATE INDEX idx_cp_challenge ON challenge_participants (challenge_id);
CREATE INDEX idx_cp_user      ON challenge_participants (user_id);
CREATE INDEX idx_cp_rank      ON challenge_participants (challenge_id, current_value DESC);
```

---

## Row-Level Security (RLS)

> All policies use `auth.uid()` — Supabase's built-in function that returns the
> authenticated user's UUID from the JWT.

```sql
-- ── Enable RLS ──────────────────────────────────────────────────
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises   ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_flags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- ── users ───────────────────────────────────────────────────────
-- Owner can read & update their own row
CREATE POLICY users_select_own ON users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY users_select_public ON users
  FOR SELECT USING (true);

-- ── workouts ────────────────────────────────────────────────────
-- Owner has full CRUD; anyone can read public workouts
CREATE POLICY workouts_select ON workouts
  FOR SELECT USING (creator_id = auth.uid() OR is_public = true);
CREATE POLICY workouts_insert ON workouts
  FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY workouts_update ON workouts
  FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY workouts_delete ON workouts
  FOR DELETE USING (creator_id = auth.uid());

-- ── workout_exercises ───────────────────────────────────────────
-- Follows parent workout's ownership
CREATE POLICY we_select ON workout_exercises
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workouts w
            WHERE w.id = workout_id
              AND (w.creator_id = auth.uid() OR w.is_public = true))
  );
CREATE POLICY we_insert ON workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workouts w
            WHERE w.id = workout_id AND w.creator_id = auth.uid())
  );
CREATE POLICY we_update ON workout_exercises
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM workouts w
            WHERE w.id = workout_id AND w.creator_id = auth.uid())
  );
CREATE POLICY we_delete ON workout_exercises
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM workouts w
            WHERE w.id = workout_id AND w.creator_id = auth.uid())
  );

-- ── sessions ────────────────────────────────────────────────────
CREATE POLICY sessions_select_own ON sessions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY sessions_insert_own ON sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY sessions_update_own ON sessions
  FOR UPDATE USING (user_id = auth.uid());

-- ── session_exercises ───────────────────────────────────────────
-- Follows parent session's ownership
CREATE POLICY se_select ON session_exercises
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sessions s
            WHERE s.id = session_id AND s.user_id = auth.uid())
  );
CREATE POLICY se_insert ON session_exercises
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM sessions s
            WHERE s.id = session_id AND s.user_id = auth.uid())
  );

-- ── injury_flags ────────────────────────────────────────────────
CREATE POLICY injury_select_own ON injury_flags
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY injury_insert_own ON injury_flags
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY injury_update_own ON injury_flags
  FOR UPDATE USING (user_id = auth.uid());

-- ── nutrition_profiles ──────────────────────────────────────────
CREATE POLICY nutrition_select_own ON nutrition_profiles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY nutrition_insert_own ON nutrition_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY nutrition_update_own ON nutrition_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- ── challenges ──────────────────────────────────────────────────
-- All authenticated users can view; only creator can mutate
CREATE POLICY challenges_select ON challenges
  FOR SELECT USING (true);
CREATE POLICY challenges_insert ON challenges
  FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY challenges_update ON challenges
  FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY challenges_delete ON challenges
  FOR DELETE USING (creator_id = auth.uid());

-- ── challenge_participants ──────────────────────────────────────
-- Users can see all participants (leaderboard); can only insert/update own
CREATE POLICY cp_select ON challenge_participants
  FOR SELECT USING (true);
CREATE POLICY cp_insert ON challenge_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY cp_update ON challenge_participants
  FOR UPDATE USING (user_id = auth.uid());
```

---

## Entity-Relationship Summary

```
auth.users  1──1  users
users       1──N  workouts
workouts    1──N  workout_exercises
exercises   1──N  workout_exercises
users       1──N  sessions
users       1──N  injury_flags
users       1──1  nutrition_profiles
users       1──N  challenge_participants

workouts    1──N  sessions          (optional link)
sessions    1──N  session_exercises
exercises   1──N  session_exercises

session_exercises  0..1──1  injury_flags

challenges  1──N  challenge_participants
users       1──N  challenges        (creator)
```
