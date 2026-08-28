# Kinetra — REST API Contract

> **Base URL**: `/api/v1`
>
> **Auth**: All `Auth: yes` endpoints require a valid Supabase JWT in the
> `Authorization: Bearer <token>` header.  The API verifies the token via
> Supabase's `getUser()` and extracts `user_id` from the JWT claims.
>
> **Standard error envelope** (used by every endpoint):
> ```json
> {
>   "error": {
>     "code": "ERROR_CODE",
>     "message": "Human-readable description"
>   }
> }
> ```

---

## 1. Auth Verification

### `GET /auth/me`

Verify the current JWT and return the linked user profile.

| Detail       | Value            |
|------------- |------------------|
| **Auth**     | yes              |
| **Request**  | _(none — token only)_ |

**Response `200`**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "Harshit",
  "avatar_url": "https://...",
  "fitness_level": "intermediate",
  "onboarding_done": true
}
```

| Error | Code               | When                        |
|-------|--------------------|-----------------------------|
| 401   | `INVALID_TOKEN`    | JWT missing, expired, or invalid |
| 404   | `PROFILE_NOT_FOUND`| Auth exists but no `users` row   |

---

## 2. User Profile

### `GET /users/:id`

Fetch a user's public profile (reads from the `public_profiles` view, not the full `users` table).

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Response `200`**
```json
{
  "id": "uuid",
  "display_name": "string",
  "avatar_url": "string | null",
  "fitness_level": "beginner | intermediate | advanced",
  "created_at": "ISO-8601"
}
```

| Error | Code           | When             |
|-------|----------------|------------------|
| 404   | `USER_NOT_FOUND` | No such user   |

---

### `PUT /users/me`

Update the authenticated user's profile.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request**
```json
{
  "display_name": "string?",
  "avatar_url": "string?",
  "date_of_birth": "YYYY-MM-DD?",
  "gender": "male | female | other | prefer_not_to_say?",
  "height_cm": "number?",
  "weight_kg": "number?",
  "fitness_level": "beginner | intermediate | advanced?",
  "onboarding_done": "boolean?"
}
```

**Response `200`** — full updated user object (same shape as `GET /auth/me`).

| Error | Code                | When                      |
|-------|---------------------|---------------------------|
| 400   | `VALIDATION_ERROR`  | Invalid field value       |
| 401   | `INVALID_TOKEN`     | Bad JWT                   |

---

## 3. Exercises (Read-Only Catalog)

### `GET /exercises`

List all exercises, with optional filters.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Query params**: `?muscle_group=chest&difficulty=easy&page=1&limit=20`

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Barbell Squat",
      "muscle_group": "quadriceps",
      "equipment": "barbell",
      "difficulty": "hard",
      "demo_video_url": "string | null"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 58 }
}
```

---

### `GET /exercises/:id`

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Response `200`** — single exercise object with full fields including `description` and `pose_landmarks`.

| Error | Code               | When               |
|-------|--------------------|--------------------|
| 404   | `EXERCISE_NOT_FOUND` | No such exercise |

---

## 4. Workouts CRUD

### `POST /workouts`

Create a new workout template.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request**
```json
{
  "title": "string",
  "description": "string?",
  "category": "strength | cardio | flexibility?",
  "difficulty": "easy | medium | hard?",
  "is_public": "boolean? (default false)",
  "exercises": [
    {
      "exercise_id": "uuid",
      "order_index": 0,
      "target_sets": 3,
      "target_reps": 12,
      "target_weight_kg": 40.0
    }
  ]
}
```

**Response `201`**
```json
{
  "id": "uuid",
  "creator_id": "uuid",
  "title": "string",
  "description": "string | null",
  "category": "string | null",
  "difficulty": "medium",
  "is_public": false,
  "exercises": [
    {
      "id": "uuid",
      "exercise_id": "uuid",
      "order_index": 0,
      "target_sets": 3,
      "target_reps": 12,
      "target_weight_kg": 40.0
    }
  ],
  "created_at": "ISO-8601"
}
```

| Error | Code               | When                          |
|-------|--------------------|-------------------------------|
| 400   | `VALIDATION_ERROR` | Missing title or bad exercise IDs |
| 401   | `INVALID_TOKEN`    | Bad JWT                       |

---

### `GET /workouts`

List workouts — own private + all public.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Query params**: `?category=strength&mine=true&page=1&limit=20`

**Response `200`** — paginated array (same shape as create response).

---

### `GET /workouts/:id`

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Response `200`** — single workout object with nested `exercises[]` array
(each entry includes full exercise details + `order_index`, `target_sets`,
`target_reps`, `target_weight_kg` from `workout_exercises`).

| Error | Code                | When                               |
|-------|---------------------|------------------------------------|
| 403   | `FORBIDDEN`         | Private workout owned by another user |
| 404   | `WORKOUT_NOT_FOUND` | No such workout                    |

---

### `PUT /workouts/:id`

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request** — same shape as `POST`, all fields optional. If `exercises[]` is
provided, it **replaces** the entire exercise list (delete + re-insert).

**Response `200`** — updated workout object.

| Error | Code                | When                          |
|-------|---------------------|-------------------------------|
| 403   | `FORBIDDEN`         | Not the creator               |
| 404   | `WORKOUT_NOT_FOUND` | No such workout               |

---

### `DELETE /workouts/:id`

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Response `204`** — no content.

| Error | Code                | When                |
|-------|---------------------|---------------------|
| 403   | `FORBIDDEN`         | Not the creator     |
| 404   | `WORKOUT_NOT_FOUND` | No such workout     |

---

## 5. Sessions

### `POST /sessions/start`

Start a new workout session.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request**
```json
{
  "workout_id": "uuid? (null for freestyle)"
}
```

**Response `201`**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "workout_id": "uuid | null",
  "status": "active",
  "started_at": "ISO-8601"
}
```

| Error | Code                     | When                          |
|-------|--------------------------|-------------------------------|
| 400   | `SESSION_ALREADY_ACTIVE` | User has another active session |
| 404   | `WORKOUT_NOT_FOUND`      | Invalid workout_id            |

---

### `POST /sessions/:id/log-exercise`

**Manual logging only.** Use this endpoint when the user is exercising
_without_ the AI pose-analysis camera (e.g., cardio, machines without
landmark tracking). For AI-assisted exercises, use `POST /pose-analysis`
instead — that endpoint creates the `session_exercises` row automatically.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request**
```json
{
  "exercise_id": "uuid",
  "set_number": 1,
  "reps": 12,
  "weight_kg": 40.0,
  "duration_sec": null,
  "form_score": null,
  "injury_flag": false,
  "feedback": null
}
```

**Response `201`**
```json
{
  "id": "uuid",
  "session_id": "uuid",
  "exercise_id": "uuid",
  "set_number": 1,
  "reps": 12,
  "weight_kg": 40.0,
  "form_score": null,
  "injury_flag": false,
  "feedback": null,
  "recorded_at": "ISO-8601"
}
```

| Error | Code                  | When                            |
|-------|-----------------------|---------------------------------|
| 400   | `SESSION_NOT_ACTIVE`  | Session already ended/cancelled |
| 403   | `FORBIDDEN`           | Session belongs to another user |
| 404   | `SESSION_NOT_FOUND`   | No such session                 |
| 404   | `EXERCISE_NOT_FOUND`  | Invalid exercise_id             |

---

### `POST /sessions/:id/end`

End an active session, compute duration & estimated calories.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request**
```json
{
  "notes": "string?"
}
```

**Response `200`**
```json
{
  "id": "uuid",
  "status": "completed",
  "started_at": "ISO-8601",
  "ended_at": "ISO-8601",
  "duration_sec": 2340,
  "calories_est": 312.5,
  "notes": "string | null",
  "summary": {
    "total_sets": 15,
    "total_reps": 142,
    "avg_form_score": 83.2,
    "injury_flags_raised": 1
  }
}
```

| Error | Code                 | When                         |
|-------|----------------------|------------------------------|
| 400   | `SESSION_NOT_ACTIVE` | Already ended / cancelled    |
| 403   | `FORBIDDEN`          | Not the session owner        |
| 404   | `SESSION_NOT_FOUND`  | No such session              |

---

### `GET /sessions`

List the authenticated user's past sessions.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Query params**: `?status=completed&page=1&limit=20`

**Response `200`** — paginated array of session objects.

---

### `GET /sessions/:id`

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Response `200`** — full session with nested `exercises[]` array.

| Error | Code               | When              |
|-------|--------------------|-------------------|
| 403   | `FORBIDDEN`        | Not the owner     |
| 404   | `SESSION_NOT_FOUND`| No such session   |

---

## 6. Pose Analysis Result

### `POST /pose-analysis`

Submit a **completed set summary** from the on-device AI pose-analysis pipeline.
The client runs MediaPipe frame-by-frame locally, counts reps, computes an
aggregate form score for the set, and sends the summary here.  **This is called
once per completed set, not per frame.**

> **Side effects**:
> 1. A `session_exercises` row is **created** with the submitted metrics.
> 2. If `injury_flag` is `true`, an `injury_flags` row is inserted automatically.
>
> This is the **primary path** for recording AI-assisted exercise data.
> `POST /sessions/:id/log-exercise` is for manual-only logging.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request**
```json
{
  "session_id": "uuid",
  "exercise_id": "uuid",
  "set_number": 1,
  "reps": 12,
  "weight_kg": 40.0,
  "duration_sec": 45,
  "form_score": 91.3,
  "injury_flag": false,
  "flagged_body_parts": [],
  "rep_scores": [88.0, 92.5, 94.1, 90.0, 89.7, 93.2, 91.8, 90.5, 92.0, 91.3, 88.9, 93.0],
  "notes": "string?"
}
```

| Field               | Description |
|---------------------|-------------|
| `reps`              | Total reps counted by the AI in this set |
| `form_score`        | Aggregate form score (0–100) across all reps |
| `rep_scores`        | Per-rep form scores (array length = `reps`) |
| `flagged_body_parts`| Body parts with detected injury risk (e.g. `["left_knee"]`) |
| `injury_flag`       | `true` if any body part was flagged |

**Response `201`**
```json
{
  "session_exercise_id": "uuid",
  "form_score": 91.3,
  "injury_flag": false,
  "feedback": "Good depth on squat. Keep chest upright.",
  "flagged_body_parts": [],
  "injury_flag_id": null
}
```

| Error | Code                  | When                       |
|-------|-----------------------|----------------------------|
| 400   | `VALIDATION_ERROR`    | Missing/invalid fields     |
| 400   | `SESSION_NOT_ACTIVE`  | Session not active         |
| 404   | `SESSION_NOT_FOUND`   | No such session            |
| 404   | `EXERCISE_NOT_FOUND`  | No such exercise           |

---

## 7. Injury Flags

### `GET /injuries`

List injury flags for the authenticated user.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Query params**: `?resolved=false&severity=high&page=1&limit=20`

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "body_part": "left_knee",
      "severity": "medium",
      "description": "Knee valgus detected during squat",
      "source": "ai",
      "resolved": false,
      "flagged_at": "ISO-8601"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3 }
}
```

---

### `PATCH /injuries/:id`

Mark an injury flag as resolved or update severity.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request**
```json
{
  "resolved": true,
  "severity": "low?"
}
```

**Response `200`** — updated injury flag object.

| Error | Code               | When                   |
|-------|--------------------|------------------------|
| 403   | `FORBIDDEN`        | Not the flag owner     |
| 404   | `INJURY_NOT_FOUND` | No such injury flag    |

---

## 8. Nutrition

### `GET /nutrition/profile`

Get the authenticated user's nutrition profile.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Response `200`**
```json
{
  "id": "uuid",
  "goal": "gain_muscle",
  "diet_type": "vegetarian",
  "allergies": ["gluten"],
  "daily_cal_target": 2800,
  "protein_g": 180,
  "carbs_g": 320,
  "fat_g": 78,
  "meal_plan_json": { "...AI-generated plan..." },
  "updated_at": "ISO-8601"
}
```

| Error | Code                      | When                        |
|-------|---------------------------|-----------------------------|
| 404   | `NUTRITION_PROFILE_NOT_FOUND` | Profile not yet created |

---

### `PUT /nutrition/profile`

Create or update the nutrition profile (upsert).

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request**
```json
{
  "goal": "gain_muscle?",
  "diet_type": "vegetarian?",
  "allergies": ["gluten"]?,
  "daily_cal_target": 2800?,
  "protein_g": 180?,
  "carbs_g": 320?,
  "fat_g": 78?
}
```

**Response `200`** — full updated profile object.

| Error | Code               | When                  |
|-------|--------------------|-----------------------|
| 400   | `VALIDATION_ERROR` | Invalid field values  |

---

### `POST /nutrition/recommend`

Generate an AI-powered meal plan based on the user's profile, recent workouts,
and stated goals.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request**
```json
{
  "num_meals": 4,
  "date": "YYYY-MM-DD?"
}
```

**Response `200`**
```json
{
  "meal_plan": {
    "date": "2026-08-28",
    "total_calories": 2780,
    "meals": [
      {
        "name": "Breakfast",
        "calories": 620,
        "protein_g": 38,
        "carbs_g": 72,
        "fat_g": 18,
        "items": ["Paneer paratha", "Greek yogurt", "Banana shake"]
      }
    ]
  },
  "saved": true
}
```

> **Side effect**: Updates `nutrition_profiles.meal_plan_json` with the new plan.

| Error | Code                          | When                        |
|-------|-------------------------------|-----------------------------|
| 404   | `NUTRITION_PROFILE_NOT_FOUND` | Must create profile first   |

---

## 9. Leaderboard

### `GET /leaderboard`

Global or per-challenge leaderboard.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Query params**: `?challenge_id=uuid&metric=total_reps&page=1&limit=50`

- If `challenge_id` is provided → challenge-specific rankings.
- If omitted → global leaderboard by the chosen `metric`.

**Response `200`**
```json
{
  "data": [
    {
      "rank": 1,
      "user": {
        "id": "uuid",
        "display_name": "Harshit",
        "avatar_url": "string | null"
      },
      "value": 1520,
      "metric": "total_reps"
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 200 }
}
```

---

## 10. Challenges

### `POST /challenges`

Create a new challenge.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request**
```json
{
  "title": "string",
  "description": "string?",
  "type": "streak | volume | time | custom",
  "metric_key": "total_reps?",
  "target_value": 500?,
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD"
}
```

**Response `201`**
```json
{
  "id": "uuid",
  "creator_id": "uuid",
  "title": "string",
  "type": "volume",
  "metric_key": "total_reps",
  "target_value": 500,
  "start_date": "2026-09-01",
  "end_date": "2026-09-30",
  "is_active": true,
  "created_at": "ISO-8601"
}
```

| Error | Code               | When                           |
|-------|--------------------|-------------------|
| 400   | `VALIDATION_ERROR` | Bad dates, missing title, etc. |

---

### `GET /challenges`

List active challenges.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Query params**: `?type=streak&mine=true&page=1&limit=20`

**Response `200`** — paginated array of challenge objects.

---

### `GET /challenges/:id`

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Response `200`** — single challenge with participant count.

| Error | Code                  | When              |
|-------|-----------------------|-------------------|
| 404   | `CHALLENGE_NOT_FOUND` | No such challenge |

---

### `POST /challenges/:id/join`

Join a challenge.

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Request** — _(none)_

**Response `201`**
```json
{
  "challenge_id": "uuid",
  "user_id": "uuid",
  "current_value": 0,
  "joined_at": "ISO-8601"
}
```

| Error | Code                  | When                         |
|-------|-----------------------|------------------------------|
| 400   | `ALREADY_JOINED`      | User already in challenge    |
| 400   | `CHALLENGE_ENDED`     | Challenge past end_date      |
| 404   | `CHALLENGE_NOT_FOUND` | No such challenge            |

---

### `GET /challenges/:id/participants`

| Detail   | Value |
|----------|-------|
| **Auth** | yes   |

**Query params**: `?page=1&limit=50`

**Response `200`** — ranked list of participants with `current_value`.

| Error | Code                  | When              |
|-------|-----------------------|-------------------|
| 404   | `CHALLENGE_NOT_FOUND` | No such challenge |

---

## Endpoint Summary Table

| #  | Method   | Path                              | Auth | Purpose                          |
|----|----------|-----------------------------------|------|----------------------------------|
| 1  | `GET`    | `/auth/me`                        | yes  | Verify JWT & return profile      |
| 2  | `GET`    | `/users/:id`                      | yes  | Public user profile              |
| 3  | `PUT`    | `/users/me`                       | yes  | Update own profile               |
| 4  | `GET`    | `/exercises`                      | yes  | List/filter exercises            |
| 5  | `GET`    | `/exercises/:id`                  | yes  | Exercise detail                  |
| 6  | `POST`   | `/workouts`                       | yes  | Create workout                   |
| 7  | `GET`    | `/workouts`                       | yes  | List workouts                    |
| 8  | `GET`    | `/workouts/:id`                   | yes  | Workout detail                   |
| 9  | `PUT`    | `/workouts/:id`                   | yes  | Update workout                   |
| 10 | `DELETE` | `/workouts/:id`                   | yes  | Delete workout                   |
| 11 | `POST`   | `/sessions/start`                 | yes  | Start session                    |
| 12 | `POST`   | `/sessions/:id/log-exercise`      | yes  | Log a set (manual only)          |
| 13 | `POST`   | `/sessions/:id/end`               | yes  | End session                      |
| 14 | `GET`    | `/sessions`                       | yes  | List past sessions               |
| 15 | `GET`    | `/sessions/:id`                   | yes  | Session detail                   |
| 16 | `POST`   | `/pose-analysis`                  | yes  | Submit AI set summary + create session_exercise |
| 17 | `GET`    | `/injuries`                       | yes  | List injury flags                |
| 18 | `PATCH`  | `/injuries/:id`                   | yes  | Resolve / update injury          |
| 19 | `GET`    | `/nutrition/profile`              | yes  | Get nutrition profile            |
| 20 | `PUT`    | `/nutrition/profile`              | yes  | Upsert nutrition profile         |
| 21 | `POST`   | `/nutrition/recommend`            | yes  | AI meal plan generation          |
| 22 | `GET`    | `/leaderboard`                    | yes  | Global / challenge leaderboard   |
| 23 | `POST`   | `/challenges`                     | yes  | Create challenge                 |
| 24 | `GET`    | `/challenges`                     | yes  | List challenges                  |
| 25 | `GET`    | `/challenges/:id`                 | yes  | Challenge detail                 |
| 26 | `POST`   | `/challenges/:id/join`            | yes  | Join a challenge                 |
| 27 | `GET`    | `/challenges/:id/participants`    | yes  | Challenge participants / ranking |
