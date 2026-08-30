# Kinetra — REST API Contract & Specification

> **Version**: `1.0.0`  
> **Base URL**: `/api/v1`  
> **Protocol**: HTTPS / REST  
> **Content-Type**: `application/json`

---

## 1. Architectural Overview & Conventions

### 1.1 Authentication & Authorization
- All protected endpoints require a valid Supabase Auth JWT provided in the HTTP `Authorization` header:
  ```http
  Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
  ```
- The backend authentication middleware (`requireAuth`) verifies the token via Supabase Auth `getUser()`, validating signature, expiry, and extracting user identity claims (`id`, `email`, `role`).
- Missing, expired, or malformed authorization headers reject with HTTP `401` (`INVALID_TOKEN`).
- User ownership and tenant isolation are enforced at both the API/Service layer and database Row Level Security (RLS) layer.

### 1.2 Standard Response Envelopes

#### Success Response Envelope (`ApiSuccessResponse<T>`)
Every successful API response (HTTP 200, 201) returns a standardized JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 58
  }
}
```
*(Note: `meta` is present on all paginated listing endpoints).*

#### Error Response Envelope (`ApiErrorResponse`)
Every error response (HTTP 4xx, 5xx) returns a standardized JSON envelope:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description of the error",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```
*(Note: `details` is present on HTTP 422 `VALIDATION_ERROR` responses).*

---

## 2. Health Check API

### `GET /health`

Public service liveness & environment probe.

- **METHOD**: `GET`
- **PATH**: `/health`
- **AUTH**: None (Public)
- **REQUEST**: None
- **RESPONSE `200`**:
  ```json
  {
    "status": "ok",
    "environment": "development | production | test",
    "timestamp": "2026-08-30T10:00:00.000Z",
    "version": "1.0.0"
  }
  ```
- **ERRORS**: None
- **SIDE EFFECTS**: None

---

## 3. Authentication & User Profile APIs

### `GET /api/v1/auth/me`

Verify the caller's JWT and return linked core user profile and onboarding status.

- **METHOD**: `GET`
- **PATH**: `/api/v1/auth/me`
- **AUTH**: Required (`Bearer <token>`)
- **REQUEST**: None
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "user@kinetra.app",
      "display_name": "Harshit",
      "avatar_url": "https://assets.kinetra.app/avatars/user.png",
      "fitness_level": "intermediate",
      "onboarding_done": true
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing, malformed, or expired JWT |
  | `404` | `PROFILE_NOT_FOUND` | User authenticated in Supabase but no row exists in `users` table |
- **SIDE EFFECTS**: None
- **PRIVACY**: Returns profile belonging strictly to the authenticated caller.

---

### `GET /api/v1/users/me`

Retrieve the full, private profile of the authenticated user (including body measurements and health metrics).

- **METHOD**: `GET`
- **PATH**: `/api/v1/users/me`
- **AUTH**: Required (`Bearer <token>`)
- **REQUEST**: None
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "user@kinetra.app",
      "display_name": "Harshit",
      "avatar_url": "https://assets.kinetra.app/avatars/user.png",
      "date_of_birth": "1998-05-15",
      "gender": "male",
      "height_cm": 178.5,
      "weight_kg": 74.0,
      "fitness_level": "intermediate",
      "onboarding_done": true,
      "created_at": "2026-08-20T10:00:00.000Z",
      "updated_at": "2026-08-20T10:00:00.000Z"
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `404` | `PROFILE_NOT_FOUND` | Profile record not found |
- **SIDE EFFECTS**: None
- **PRIVACY**: Contains private health, biometric, and contact information. Accessible only by profile owner.

---

### `PUT /api/v1/users/me`

Update the authenticated user's profile information. Strict schema rejects mass assignment of system/privileged fields.

- **METHOD**: `PUT`
- **PATH**: `/api/v1/users/me`
- **AUTH**: Required (`Bearer <token>`)
- **REQUEST BODY**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `display_name` | `string` | No | `trim()`, min 1, max 100 chars |
  | `avatar_url` | `string` | No | Valid URL, max 500 chars, or `null` |
  | `date_of_birth` | `string` | No | `YYYY-MM-DD`, valid calendar date, or `null` |
  | `gender` | `enum` | No | One of: `'male'`, `'female'`, `'other'`, `'prefer_not_to_say'`, or `null` |
  | `height_cm` | `number` | No | 50.0 to 300.0 cm, or `null` |
  | `weight_kg` | `number` | No | 20.0 to 500.0 kg, or `null` |
  | `fitness_level` | `enum` | No | One of: `'beginner'`, `'intermediate'`, `'advanced'`, or `null` |
  | `onboarding_done` | `boolean` | No | Boolean flag |
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "user@kinetra.app",
      "display_name": "Harshit Updated",
      "avatar_url": "https://assets.kinetra.app/avatars/user.png",
      "date_of_birth": "1998-05-15",
      "gender": "male",
      "height_cm": 178.5,
      "weight_kg": 75.0,
      "fitness_level": "advanced",
      "onboarding_done": true,
      "created_at": "2026-08-20T10:00:00.000Z",
      "updated_at": "2026-08-30T10:00:00.000Z"
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `422` | `VALIDATION_ERROR` | Validation constraint failure or mass assignment attempt |
- **SIDE EFFECTS**: Updates `users` table row and refreshes `updated_at` timestamp.
- **PRIVACY**: Mutates only the caller's row; cannot modify `id`, `email`, `role`, `is_admin`, or `created_at`.

---

### `GET /api/v1/users/:id`

Retrieve another user's public profile. Reads from the sanitized `public_profiles` view.

- **METHOD**: `GET`
- **PATH**: `/api/v1/users/:id`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      "display_name": "AthleteB",
      "avatar_url": "https://assets.kinetra.app/avatars/b.png",
      "fitness_level": "intermediate"
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `404` | `USER_NOT_FOUND` | Specified user UUID does not exist |
  | `422` | `VALIDATION_ERROR` | Malformed UUID parameter |
- **SIDE EFFECTS**: None
- **PRIVACY**: Excludes private metrics (`email`, `height_cm`, `weight_kg`, `date_of_birth`, `gender`).

---

## 4. Exercise Catalog APIs (Read-Only)

### `GET /api/v1/exercises`

List and filter the master exercise catalog.

- **METHOD**: `GET`
- **PATH**: `/api/v1/exercises`
- **AUTH**: Required (`Bearer <token>`)
- **QUERY PARAMETERS**:
  | Parameter | Type | Default | Validation |
  |---|---|---|---|
  | `muscle_group` | `string` | - | Case-insensitive filter (e.g. `quadriceps`, `chest`) |
  | `difficulty` | `enum` | - | One of: `'easy'`, `'medium'`, `'hard'` |
  | `page` | `integer` | `1` | Min 1 |
  | `limit` | `integer` | `20` | Min 1, Max 100 |
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
        "name": "Barbell Squat",
        "muscle_group": "quadriceps",
        "equipment": "barbell",
        "difficulty": "hard",
        "demo_video_url": "https://assets.kinetra.app/videos/squat.mp4"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 14
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `422` | `VALIDATION_ERROR` | Invalid query parameter (e.g., negative page) |
- **SIDE EFFECTS**: None

---

### `GET /api/v1/exercises/:id`

Retrieve complete exercise details including instructions and landmark tracking configuration.

- **METHOD**: `GET`
- **PATH**: `/api/v1/exercises/:id`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
      "name": "Barbell Squat",
      "description": "Compound lower body exercise targeting quadriceps, glutes, and core.",
      "muscle_group": "quadriceps",
      "equipment": "barbell",
      "difficulty": "hard",
      "demo_video_url": "https://assets.kinetra.app/videos/squat.mp4",
      "pose_landmarks": {
        "primary_joints": ["left_hip", "left_knee", "left_ankle"],
        "target_angle": 90,
        "rest_angle": 160
      },
      "created_at": "2026-08-20T10:00:00.000Z"
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `404` | `EXERCISE_NOT_FOUND` | Exercise ID does not exist in catalog |
  | `422` | `VALIDATION_ERROR` | Malformed UUID parameter |
- **SIDE EFFECTS**: None

---

## 5. Workout Template APIs

### `POST /api/v1/workouts`

Create a new workout routine template with optional nested exercise ordering.

- **METHOD**: `POST`
- **PATH**: `/api/v1/workouts`
- **AUTH**: Required (`Bearer <token>`)
- **REQUEST BODY**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `title` | `string` | Yes | `trim()`, min 1, max 150 chars |
  | `description` | `string` | No | Max 1000 chars, or `null` |
  | `category` | `string` | No | Max 50 chars, or `null` |
  | `difficulty` | `enum` | No | `'easy'`, `'medium'`, `'hard'` (default `'medium'`) |
  | `is_public` | `boolean` | No | Default `false` |
  | `exercises` | `array` | No | Array of nested exercise objects (max 50) |
  | `exercises[].exercise_id` | `string` | Yes | Valid UUID of an existing exercise |
  | `exercises[].order_index` | `integer` | Yes | Min 0, must be unique within workout |
  | `exercises[].target_sets` | `integer` | No | Min 1, Max 100 (default 3) |
  | `exercises[].target_reps` | `integer` | No | Min 1, Max 1000, or `null` |
  | `exercises[].target_weight_kg` | `number` | No | 0.0 to 1000.0 kg, or `null` |
- **RESPONSE `201`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "11111111-9c0b-4ef8-bb6d-6bb9bd380a11",
      "creator_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "title": "Leg Day Hypertrophy",
      "description": "High volume quad and glute workout",
      "category": "strength",
      "difficulty": "hard",
      "is_public": false,
      "exercises": [
        {
          "id": "22222222-9c0b-4ef8-bb6d-6bb9bd380a22",
          "workout_id": "11111111-9c0b-4ef8-bb6d-6bb9bd380a11",
          "exercise_id": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
          "order_index": 0,
          "target_sets": 4,
          "target_reps": 10,
          "target_weight_kg": 80.0,
          "exercise": {
            "id": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
            "name": "Barbell Squat",
            "muscle_group": "quadriceps"
          }
        }
      ],
      "created_at": "2026-08-30T10:00:00.000Z",
      "updated_at": "2026-08-30T10:00:00.000Z"
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `422` | `VALIDATION_ERROR` | Missing title, duplicate `order_index`, invalid fields, or non-existent referenced exercise UUIDs |
- **SIDE EFFECTS**: Inserts workout row with `creator_id` set to authenticated user; inserts associated `workout_exercises` rows.

---

### `GET /api/v1/workouts`

List workouts available to the user (all own workouts + public community workouts).

- **METHOD**: `GET`
- **PATH**: `/api/v1/workouts`
- **AUTH**: Required (`Bearer <token>`)
- **QUERY PARAMETERS**:
  | Parameter | Type | Default | Validation |
  |---|---|---|---|
  | `category` | `string` | - | Partial match filter |
  | `difficulty` | `enum` | - | One of: `'easy'`, `'medium'`, `'hard'` |
  | `mine` | `boolean` | `false` | When `true`, filters strictly to `creator_id = req.user.id` |
  | `page` | `integer` | `1` | Min 1 |
  | `limit` | `integer` | `20` | Min 1, Max 100 |
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "11111111-9c0b-4ef8-bb6d-6bb9bd380a11",
        "creator_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "title": "Leg Day Hypertrophy",
        "description": "High volume quad and glute workout",
        "category": "strength",
        "difficulty": "hard",
        "is_public": false,
        "exercises": [ ... ],
        "created_at": "2026-08-30T10:00:00.000Z",
        "updated_at": "2026-08-30T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `422` | `VALIDATION_ERROR` | Invalid query parameter formatting |
- **SIDE EFFECTS**: None

---

### `GET /api/v1/workouts/:id`

Retrieve single workout template with nested exercise details.

- **METHOD**: `GET`
- **PATH**: `/api/v1/workouts/:id`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **RESPONSE `200`**: Single workout object with nested `exercises[]` list (see `POST /api/v1/workouts`).
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `403` | `FORBIDDEN` | Target workout is private and belongs to another user |
  | `404` | `WORKOUT_NOT_FOUND` | Workout UUID not found |
  | `422` | `VALIDATION_ERROR` | Malformed UUID parameter |
- **SIDE EFFECTS**: None

---

### `PUT /api/v1/workouts/:id`

Update workout template metadata and/or replace attached exercises.

- **METHOD**: `PUT`
- **PATH**: `/api/v1/workouts/:id`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **REQUEST BODY**: Same fields as `POST /api/v1/workouts`, all optional. If `exercises` array is provided, it executes a complete replace of previous exercises.
- **RESPONSE `200`**: Full updated workout object with refreshed `exercises[]`.
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `403` | `FORBIDDEN` | Caller is not the creator of the workout |
  | `404` | `WORKOUT_NOT_FOUND` | Workout UUID not found |
  | `422` | `VALIDATION_ERROR` | Invalid fields or non-existent exercise IDs |
- **SIDE EFFECTS**: Updates `workouts` table; replaces rows in `workout_exercises` when `exercises` is provided.

---

### `DELETE /api/v1/workouts/:id`

Delete a workout template.

- **METHOD**: `DELETE`
- **PATH**: `/api/v1/workouts/:id`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **RESPONSE `204`**: No Content (empty body).
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `403` | `FORBIDDEN` | Caller is not the creator of the workout |
  | `404` | `WORKOUT_NOT_FOUND` | Workout UUID not found |
  | `422` | `VALIDATION_ERROR` | Malformed UUID parameter |
- **SIDE EFFECTS**: Deletes row in `workouts` table; database cascades deletion of attached `workout_exercises`.

---

## 6. Workout Session APIs

### `POST /api/v1/sessions/start`

Start an active workout execution session.

- **METHOD**: `POST`
- **PATH**: `/api/v1/sessions/start`
- **AUTH**: Required (`Bearer <token>`)
- **REQUEST BODY**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `workout_id` | `string` | No | Valid UUID of existing workout template, or `null` for freestyle |
- **RESPONSE `201`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
      "user_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "workout_id": "11111111-9c0b-4ef8-bb6d-6bb9bd380a11",
      "status": "active",
      "started_at": "2026-08-30T10:00:00.000Z",
      "ended_at": null,
      "duration_sec": null,
      "calories_est": null,
      "notes": null
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `400` | `SESSION_ALREADY_ACTIVE` | User already has an active session in progress |
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `403` | `FORBIDDEN` | Referenced `workout_id` is private and owned by another user |
  | `404` | `WORKOUT_NOT_FOUND` | Referenced `workout_id` does not exist |
  | `422` | `VALIDATION_ERROR` | Malformed body or UUID |
- **SIDE EFFECTS**: Creates active row in `sessions` table.

---

### `POST /api/v1/sessions/:id/log-exercise`

Manually log an exercise set into an active session (for exercises performed without real-time AI camera tracking).

- **METHOD**: `POST`
- **PATH**: `/api/v1/sessions/:id/log-exercise`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format of active session |
- **REQUEST BODY**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `exercise_id` | `string` | Yes | Valid UUID of existing exercise |
  | `set_number` | `integer` | No | Min 1 (default 1) |
  | `reps` | `integer` | No | 0 to 1000, or `null` |
  | `weight_kg` | `number` | No | 0.0 to 1000.0, or `null` |
  | `duration_sec` | `integer` | No | 0 to 86400, or `null` |
  | `form_score` | `number` | No | 0.0 to 100.0, or `null` |
  | `injury_flag` | `boolean` | No | Default `false` |
  | `feedback` | `string` | No | Max 1000 chars, or `null` |
- **RESPONSE `201`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "33333333-9c0b-4ef8-bb6d-6bb9bd380a33",
      "session_id": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
      "exercise_id": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
      "set_number": 1,
      "reps": 12,
      "weight_kg": 50.0,
      "duration_sec": null,
      "form_score": null,
      "injury_flag": false,
      "feedback": null,
      "recorded_at": "2026-08-30T10:15:00.000Z"
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `400` | `SESSION_NOT_ACTIVE` | Target session is already completed or cancelled |
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `403` | `FORBIDDEN` | Caller does not own target session |
  | `404` | `SESSION_NOT_FOUND` | Session UUID not found |
  | `404` | `EXERCISE_NOT_FOUND` | Exercise UUID not found in catalog |
  | `422` | `VALIDATION_ERROR` | Validation constraint violation |
- **SIDE EFFECTS**: Inserts set record into `session_exercises`.

---

### `POST /api/v1/sessions/:id/end`

Complete an active workout session, computing total duration, estimated calorie burn, and aggregate summary metrics.

- **METHOD**: `POST`
- **PATH**: `/api/v1/sessions/:id/end`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **REQUEST BODY**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `notes` | `string` | No | Max 2000 chars, or `null` |
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
      "user_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "workout_id": "11111111-9c0b-4ef8-bb6d-6bb9bd380a11",
      "status": "completed",
      "started_at": "2026-08-30T10:00:00.000Z",
      "ended_at": "2026-08-30T10:45:00.000Z",
      "duration_sec": 2700,
      "calories_est": 247.5,
      "notes": "Solid workout today",
      "summary": {
        "total_sets": 6,
        "total_reps": 68,
        "avg_form_score": 88.5,
        "injury_flags_raised": 0
      }
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `400` | `SESSION_NOT_ACTIVE` | Session is already completed or cancelled |
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `403` | `FORBIDDEN` | Caller does not own target session |
  | `404` | `SESSION_NOT_FOUND` | Session UUID not found |
  | `422` | `VALIDATION_ERROR` | Malformed UUID parameter or oversized notes |
- **SIDE EFFECTS**: Updates `sessions` record (`status = 'completed'`, `ended_at`, `duration_sec`, `calories_est`, `notes`).

---

### `GET /api/v1/sessions`

List past workout execution sessions for the authenticated user.

- **METHOD**: `GET`
- **PATH**: `/api/v1/sessions`
- **AUTH**: Required (`Bearer <token>`)
- **QUERY PARAMETERS**:
  | Parameter | Type | Default | Validation |
  |---|---|---|---|
  | `status` | `enum` | - | One of: `'active'`, `'completed'`, `'cancelled'` |
  | `page` | `integer` | `1` | Min 1 |
  | `limit` | `integer` | `20` | Min 1, Max 100 |
- **RESPONSE `200`**: Paginated array of user's session rows.
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `422` | `VALIDATION_ERROR` | Invalid query parameter format |
- **SIDE EFFECTS**: None
- **PRIVACY**: Enforces strict database-level filtering (`user_id = req.user.id`).

---

### `GET /api/v1/sessions/:id`

Retrieve complete session details including all logged exercise sets.

- **METHOD**: `GET`
- **PATH**: `/api/v1/sessions/:id`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **RESPONSE `200`**: Full session object with nested `exercises[]` list.
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `403` | `FORBIDDEN` | Session belongs to another user |
  | `404` | `SESSION_NOT_FOUND` | Session UUID not found |
  | `422` | `VALIDATION_ERROR` | Malformed UUID parameter |
- **SIDE EFFECTS**: None

---

## 7. AI Pose Analysis & Rep Scoring API

### `POST /api/v1/pose-analysis`

Ingest a completed set analysis payload from on-device AI pose tracking. Creates session exercise log and automatically raises injury flag if joint vulnerability or form breakdown is detected.

- **METHOD**: `POST`
- **PATH**: `/api/v1/pose-analysis`
- **AUTH**: Required (`Bearer <token>`)
- **REQUEST BODY**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `session_id` | `string` | Yes | Valid UUID of caller's active session |
  | `exercise_id` | `string` | Yes | Valid UUID of existing catalog exercise |
  | `set_number` | `integer` | No | Min 1 (default 1) |
  | `reps` | `integer` | Yes | Non-negative integer (0 to 1000) |
  | `weight_kg` | `number` | No | 0.0 to 1000.0, or `null` |
  | `duration_sec` | `integer` | No | 0 to 86400, or `null` |
  | `form_score` | `number` | Yes | Float between 0.0 and 100.0 |
  | `injury_flag` | `boolean` | No | Default `false` |
  | `flagged_body_parts` | `array` | No | Array of strings (e.g. `["left_knee", "lower_back"]`) |
  | `rep_scores` | `array` | No | Array of per-rep scores (each 0.0 to 100.0) |
  | `notes` | `string` | No | Max 1000 chars, or `null` |
- **RESPONSE `201`**:
  ```json
  {
    "success": true,
    "data": {
      "session_exercise_id": "55555555-9c0b-4ef8-bb6d-6bb9bd380a55",
      "form_score": 92.5,
      "injury_flag": false,
      "feedback": "Outstanding form on Barbell Squat! Consistent depth and biomechanics.",
      "flagged_body_parts": [],
      "injury_flag_id": null
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `400` | `SESSION_NOT_ACTIVE` | Target session is not in active status |
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `403` | `FORBIDDEN` | Session belongs to another user |
  | `404` | `SESSION_NOT_FOUND` | Session UUID not found |
  | `404` | `EXERCISE_NOT_FOUND` | Exercise UUID not found in catalog |
  | `422` | `VALIDATION_ERROR` | Invalid numeric ranges or malformed arrays |
- **SIDE EFFECTS**:
  1. Inserts row into `session_exercises` with biomechanical metrics and feedback.
  2. If `injury_flag = true` or `flagged_body_parts` is non-empty, auto-inserts record into `injury_flags` with calculated severity (`high` when `form_score < 60`, `medium` when `< 75`, `low` otherwise).

---

## 8. Injury Flag APIs

### `GET /api/v1/injuries`

List injury flags raised for the authenticated user.

- **METHOD**: `GET`
- **PATH**: `/api/v1/injuries`
- **AUTH**: Required (`Bearer <token>`)
- **QUERY PARAMETERS**:
  | Parameter | Type | Default | Validation |
  |---|---|---|---|
  | `resolved` | `boolean` | - | Filter by resolution status (`true` / `false`) |
  | `severity` | `enum` | - | One of: `'low'`, `'medium'`, `'high'` |
  | `page` | `integer` | `1` | Min 1 |
  | `limit` | `integer` | `20` | Min 1, Max 100 |
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
        "user_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "session_exercise_id": "55555555-9c0b-4ef8-bb6d-6bb9bd380a55",
        "body_part": "left_knee",
        "severity": "medium",
        "description": "AI detected excessive torque on left_knee during Barbell Squat",
        "source": "ai",
        "resolved": false,
        "flagged_at": "2026-08-29T10:00:00.000Z",
        "resolved_at": null
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `422` | `VALIDATION_ERROR` | Invalid query parameter format |
- **SIDE EFFECTS**: None
- **PRIVACY**: Enforces strict user isolation (`user_id = req.user.id`).

---

### `GET /api/v1/injuries/:id`

Retrieve single injury flag details.

- **METHOD**: `GET`
- **PATH**: `/api/v1/injuries/:id`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **RESPONSE `200`**: Single injury flag object.
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `403` | `FORBIDDEN` | Injury flag belongs to another user |
  | `404` | `INJURY_NOT_FOUND` | Injury flag UUID not found |
  | `422` | `VALIDATION_ERROR` | Malformed UUID parameter |
- **SIDE EFFECTS**: None

---

### `PATCH /api/v1/injuries/:id`

Update injury flag resolution state or severity.

- **METHOD**: `PATCH`
- **PATH**: `/api/v1/injuries/:id`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **REQUEST BODY**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `resolved` | `boolean` | No | Boolean flag |
  | `severity` | `enum` | No | One of: `'low'`, `'medium'`, `'high'` |
  *(Note: At least one field must be provided).*
- **RESPONSE `200`**: Full updated injury flag object.
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `403` | `FORBIDDEN` | Caller does not own target injury flag |
  | `404` | `INJURY_NOT_FOUND` | Injury flag UUID not found |
  | `422` | `VALIDATION_ERROR` | Empty body, invalid enum, or mass assignment attempt |
- **SIDE EFFECTS**: Updates `injury_flags` row. If `resolved` changes to `true`, sets `resolved_at = ISO-8601`.

---

## 9. Nutrition APIs

### `GET /api/v1/nutrition/profile`

Retrieve the authenticated user's nutrition and dietary target profile.

- **METHOD**: `GET`
- **PATH**: `/api/v1/nutrition/profile`
- **AUTH**: Required (`Bearer <token>`)
- **REQUEST**: None
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "77777777-9c0b-4ef8-bb6d-6bb9bd380a77",
      "user_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "goal": "gain_muscle",
      "diet_type": "vegetarian",
      "allergies": ["gluten"],
      "daily_cal_target": 2800,
      "protein_g": 180,
      "carbs_g": 320,
      "fat_g": 78,
      "meal_plan_json": null,
      "created_at": "2026-08-28T10:00:00.000Z",
      "updated_at": "2026-08-28T10:00:00.000Z"
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `404` | `NUTRITION_PROFILE_NOT_FOUND` | Nutrition profile has not yet been initialized |
- **SIDE EFFECTS**: None
- **PRIVACY**: Bound strictly to authenticated caller (`user_id = req.user.id`).

---

### `PUT /api/v1/nutrition/profile`

Initialize or update user's nutrition targets (upsert operation).

- **METHOD**: `PUT`
- **PATH**: `/api/v1/nutrition/profile`
- **AUTH**: Required (`Bearer <token>`)
- **REQUEST BODY**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `goal` | `enum` | No | `'lose_weight'`, `'maintain'`, `'gain_muscle'`, `'general_health'` |
  | `diet_type` | `enum` | No | `'omnivore'`, `'vegetarian'`, `'vegan'`, `'keto'`, `'paleo'`, `'custom'` |
  | `allergies` | `array` | No | Array of strings (max 50 items, each max 50 chars) |
  | `daily_cal_target` | `number` | No | Positive number <= 10000 |
  | `protein_g` | `number` | No | Non-negative number <= 1000 |
  | `carbs_g` | `number` | No | Non-negative number <= 1000 |
  | `fat_g` | `number` | No | Non-negative number <= 1000 |
- **RESPONSE `200`**: Full updated/created nutrition profile object.
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `422` | `VALIDATION_ERROR` | Validation constraint violation or mass assignment attempt |
- **SIDE EFFECTS**: Upserts `nutrition_profiles` row on `user_id` conflict; updates `updated_at`.

---

### `POST /api/v1/nutrition/recommend`

Generate and persist daily meal plan recommendations based on user's target macros and dietary restrictions.

- **METHOD**: `POST`
- **PATH**: `/api/v1/nutrition/recommend`
- **AUTH**: Required (`Bearer <token>`)
- **REQUEST BODY**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `num_meals` | `integer` | No | Min 1, Max 8 (default 4) |
  | `date` | `string` | No | `YYYY-MM-DD` calendar date |
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": {
      "meal_plan": {
        "date": "2026-08-30",
        "total_calories": 2800,
        "diet_type": "vegetarian",
        "goal": "gain_muscle",
        "meals": [
          {
            "name": "Breakfast",
            "calories": 700,
            "protein_g": 45,
            "carbs_g": 80,
            "fat_g": 20,
            "items": ["Paneer paratha", "Greek yogurt", "Banana shake"]
          }
        ]
      },
      "saved": true
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `404` | `NUTRITION_PROFILE_NOT_FOUND` | Profile must be initialized before generating recommendations |
  | `422` | `VALIDATION_ERROR` | Invalid date or number of meals |
- **SIDE EFFECTS**: Updates `meal_plan_json` on the user's `nutrition_profiles` record.

---

## 10. Challenge APIs

### `POST /api/v1/challenges`

Create a new community fitness challenge.

- **METHOD**: `POST`
- **PATH**: `/api/v1/challenges`
- **AUTH**: Required (`Bearer <token>`)
- **REQUEST BODY**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `title` | `string` | Yes | `trim()`, min 1, max 150 chars |
  | `description` | `string` | No | Max 1000 chars, or `null` |
  | `type` | `enum` | No | `'streak'`, `'volume'`, `'time'`, `'custom'` (default `'custom'`) |
  | `metric_key` | `string` | No | Max 50 chars, or `null` (default `'total_reps'`) |
  | `target_value` | `number` | No | Positive number <= 1000000, or `null` |
  | `start_date` | `string` | Yes | `YYYY-MM-DD` calendar date |
  | `end_date` | `string` | Yes | `YYYY-MM-DD` calendar date, must be on or after `start_date` |
- **RESPONSE `201`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "88888888-9c0b-4ef8-bb6d-6bb9bd380a88",
      "creator_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "title": "September 500 Rep Challenge",
      "description": "Complete 500 squats in September",
      "type": "volume",
      "metric_key": "total_reps",
      "target_value": 500,
      "start_date": "2026-09-01",
      "end_date": "2026-09-30",
      "is_active": true,
      "created_at": "2026-08-30T10:00:00.000Z"
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `422` | `VALIDATION_ERROR` | Missing title, invalid dates, or `end_date < start_date` |
- **SIDE EFFECTS**: Inserts challenge row with `creator_id` set to authenticated caller.

---

### `GET /api/v1/challenges`

List active challenges with optional filtering.

- **METHOD**: `GET`
- **PATH**: `/api/v1/challenges`
- **AUTH**: Required (`Bearer <token>`)
- **QUERY PARAMETERS**:
  | Parameter | Type | Default | Validation |
  |---|---|---|---|
  | `type` | `enum` | - | One of: `'streak'`, `'volume'`, `'time'`, `'custom'` |
  | `mine` | `boolean` | `false` | When `true`, filters to challenges created by caller |
  | `page` | `integer` | `1` | Min 1 |
  | `limit` | `integer` | `20` | Min 1, Max 100 |
- **RESPONSE `200`**: Paginated array of challenge objects.
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `422` | `VALIDATION_ERROR` | Invalid query parameters |
- **SIDE EFFECTS**: None

---

### `GET /api/v1/challenges/:id`

Retrieve single challenge details along with aggregated participant count.

- **METHOD**: `GET`
- **PATH**: `/api/v1/challenges/:id`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "88888888-9c0b-4ef8-bb6d-6bb9bd380a88",
      "creator_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "title": "September 500 Rep Challenge",
      "description": "Complete 500 squats in September",
      "type": "volume",
      "metric_key": "total_reps",
      "target_value": 500,
      "start_date": "2026-09-01",
      "end_date": "2026-09-30",
      "is_active": true,
      "participant_count": 24,
      "created_at": "2026-08-30T10:00:00.000Z"
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `404` | `CHALLENGE_NOT_FOUND` | Challenge UUID not found |
  | `422` | `VALIDATION_ERROR` | Malformed UUID parameter |
- **SIDE EFFECTS**: None

---

### `POST /api/v1/challenges/:id/join`

Join an active community challenge.

- **METHOD**: `POST`
- **PATH**: `/api/v1/challenges/:id/join`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **REQUEST**: None (Caller identity extracted from JWT)
- **RESPONSE `201`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "99999999-9c0b-4ef8-bb6d-6bb9bd380a99",
      "challenge_id": "88888888-9c0b-4ef8-bb6d-6bb9bd380a88",
      "user_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "current_value": 0,
      "joined_at": "2026-08-30T10:00:00.000Z"
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `400` | `ALREADY_JOINED` | User has already joined this challenge |
  | `400` | `CHALLENGE_ENDED` | Challenge `end_date` is in the past |
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `404` | `CHALLENGE_NOT_FOUND` | Challenge UUID not found |
  | `422` | `VALIDATION_ERROR` | Malformed UUID parameter |
- **SIDE EFFECTS**: Inserts row into `challenge_participants`.

---

### `GET /api/v1/challenges/:id/participants`

List ranked participants and their progress for a specific challenge.

- **METHOD**: `GET`
- **PATH**: `/api/v1/challenges/:id/participants`
- **AUTH**: Required (`Bearer <token>`)
- **PATH PARAMETERS**:
  | Parameter | Type | Validation |
  |---|---|---|
  | `id` | `string` | Required, valid UUID v4 format |
- **QUERY PARAMETERS**:
  | Parameter | Type | Default | Validation |
  |---|---|---|---|
  | `page` | `integer` | `1` | Min 1 |
  | `limit` | `integer` | `50` | Min 1, Max 100 |
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "rank": 1,
        "user": {
          "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          "display_name": "Harshit",
          "avatar_url": "https://assets.kinetra.app/avatars/user.png"
        },
        "value": 340,
        "metric": "current_value"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 50,
      "total": 24
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `404` | `CHALLENGE_NOT_FOUND` | Challenge UUID not found |
  | `422` | `VALIDATION_ERROR` | Malformed UUID or query parameters |
- **SIDE EFFECTS**: None
- **PRIVACY**: Joins with `public_profiles` view; protects participant emails and biometrics.

---

## 11. Leaderboard APIs

### `GET /api/v1/leaderboard`

Retrieve global community leaderboard or challenge-specific rankings.

- **METHOD**: `GET`
- **PATH**: `/api/v1/leaderboard`
- **AUTH**: Required (`Bearer <token>`)
- **QUERY PARAMETERS**:
  | Parameter | Type | Default | Validation |
  |---|---|---|---|
  | `challenge_id` | `string` | - | Optional challenge UUID for challenge rankings |
  | `metric` | `string` | `'total_reps'` | Metric key, max 50 chars |
  | `page` | `integer` | `1` | Min 1 |
  | `limit` | `integer` | `50` | Min 1, Max 100 |
- **RESPONSE `200`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "rank": 1,
        "user": {
          "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          "display_name": "Harshit",
          "avatar_url": "https://assets.kinetra.app/avatars/user.png"
        },
        "value": 1520,
        "metric": "total_reps"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 50,
      "total": 200
    }
  }
  ```
- **ERRORS**:
  | Status | Code | Condition |
  |---|---|---|
  | `401` | `INVALID_TOKEN` | Missing or invalid authentication token |
  | `404` | `CHALLENGE_NOT_FOUND` | If `challenge_id` provided and does not exist |
  | `422` | `VALIDATION_ERROR` | Malformed challenge UUID or query bounds |
- **SIDE EFFECTS**: None
- **PRIVACY**: Returns public profile data only (`id`, `display_name`, `avatar_url`).

---

## 12. Complete Endpoint Summary

| # | Method | Path | Auth | Description |
|---|---|---|---|---|
| 1 | `GET` | `/health` | No | Service health and liveness probe |
| 2 | `GET` | `/api/v1/auth/me` | Yes | Verify JWT & return user profile |
| 3 | `GET` | `/api/v1/users/me` | Yes | Full private profile of authenticated user |
| 4 | `PUT` | `/api/v1/users/me` | Yes | Update authenticated user profile |
| 5 | `GET` | `/api/v1/users/:id` | Yes | Public user profile (sanitized) |
| 6 | `GET` | `/api/v1/exercises` | Yes | List / filter exercise catalog |
| 7 | `GET` | `/api/v1/exercises/:id` | Yes | Single exercise catalog detail |
| 8 | `POST` | `/api/v1/workouts` | Yes | Create workout routine template |
| 9 | `GET` | `/api/v1/workouts` | Yes | List workouts (own private + public) |
| 10 | `GET` | `/api/v1/workouts/:id` | Yes | Single workout detail with exercises |
| 11 | `PUT` | `/api/v1/workouts/:id` | Yes | Update workout & replace exercises |
| 12 | `DELETE` | `/api/v1/workouts/:id` | Yes | Delete workout template |
| 13 | `POST` | `/api/v1/sessions/start` | Yes | Start workout session |
| 14 | `POST` | `/api/v1/sessions/:id/log-exercise` | Yes | Log manual exercise set |
| 15 | `POST` | `/api/v1/sessions/:id/end` | Yes | Complete active session with metrics |
| 16 | `GET` | `/api/v1/sessions` | Yes | List user's past workout sessions |
| 17 | `GET` | `/api/v1/sessions/:id` | Yes | Single session detail with sets |
| 18 | `POST` | `/api/v1/pose-analysis` | Yes | Ingest on-device AI set summary |
| 19 | `GET` | `/api/v1/injuries` | Yes | List user's injury flags |
| 20 | `GET` | `/api/v1/injuries/:id` | Yes | Single injury flag detail |
| 21 | `PATCH` | `/api/v1/injuries/:id` | Yes | Resolve / update injury flag |
| 22 | `GET` | `/api/v1/nutrition/profile` | Yes | Get user nutrition targets |
| 23 | `PUT` | `/api/v1/nutrition/profile` | Yes | Upsert user nutrition targets |
| 24 | `POST` | `/api/v1/nutrition/recommend` | Yes | Generate AI daily meal plan |
| 25 | `POST` | `/api/v1/challenges` | Yes | Create fitness challenge |
| 26 | `GET` | `/api/v1/challenges` | Yes | List active fitness challenges |
| 27 | `GET` | `/api/v1/challenges/:id` | Yes | Challenge detail with participant count |
| 28 | `POST` | `/api/v1/challenges/:id/join` | Yes | Join active challenge |
| 29 | `GET` | `/api/v1/challenges/:id/participants` | Yes | List ranked challenge participants |
| 30 | `GET` | `/api/v1/leaderboard` | Yes | Global or per-challenge leaderboard |

---

## 13. HTTP Status Codes & Error Taxonomy

| Status Code | Code String | Description |
|---|---|---|
| `200 OK` | - | Successful synchronous request |
| `201 Created` | - | Resource successfully created |
| `204 No Content` | - | Resource successfully deleted |
| `400 Bad Request` | `BAD_REQUEST`, `SESSION_NOT_ACTIVE`, `SESSION_ALREADY_ACTIVE`, `ALREADY_JOINED`, `CHALLENGE_ENDED` | Business logic or state transition violation |
| `401 Unauthorized` | `INVALID_TOKEN` | Missing, malformed, or expired JWT |
| `403 Forbidden` | `FORBIDDEN` | Access denied due to tenant or ownership boundaries |
| `404 Not Found` | `NOT_FOUND`, `USER_NOT_FOUND`, `PROFILE_NOT_FOUND`, `EXERCISE_NOT_FOUND`, `WORKOUT_NOT_FOUND`, `SESSION_NOT_FOUND`, `INJURY_NOT_FOUND`, `NUTRITION_PROFILE_NOT_FOUND`, `CHALLENGE_NOT_FOUND` | Resource does not exist |
| `409 Conflict` | `DUPLICATE_RECORD`, `CONFLICT` | Unique key violation |
| `422 Unprocessable Entity` | `VALIDATION_ERROR` | Request body, query, or path param schema validation failed |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR`, `DATABASE_ERROR` | Unexpected server or database exception (sanitized in production) |
