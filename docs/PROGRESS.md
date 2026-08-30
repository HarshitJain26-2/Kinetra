# AI-Powered Fitness & Sports Ecosystem — Kinetra

| Field        | Value                                  |
|--------------|----------------------------------------|
| **Project**  | AI-Powered Fitness & Sports Ecosystem  |
| **Codename** | Kinetra                                |
| **Role**     | Harshit — Backend + AI-Integration Lead|
| **Team Size**| 4                                      |
| **Date**     | 2026-08-28                             |

---

## Phase Log

### Phase 1: Backend Architecture & Repository Audit
- **Repository Baseline**: Node.js + Express + TypeScript configured with target ES2022 and NodeNext module resolution.
- **Dependencies Audit**: Confirmed presence of `@supabase/supabase-js`, `dotenv`, `cors`, `helmet`, `express`, and devDependencies (`typescript`, `@types/*`, `ts-node-dev`).
- **Database & Schema**: Migration files `001_initial_schema.sql` (10 tables, RLS, custom `public_profiles` view) and `002_seed_exercises.sql` (14 seed exercises) verified against `docs/SCHEMA.md`.
- **API Contract**: Standardized 27 REST endpoints, error envelope formats, and set-summary pose analysis payload in `docs/API_CONTRACT.md`.
- **Security Check**: Verified `.env` and `node_modules` are excluded in `.gitignore`. `.env.example` provides template keys.

### Phase 2: Production Backend Architecture & Structure
- **Modular Directory Structure**: Organized backend cleanly into `config/`, `middleware/`, `routes/`, `controllers/`, `services/`, `validators/`, `types/`, and `utils/`.
- **Config & Environment**: Validated environment configuration loader (`src/config/env.ts`) and Supabase client setup (`src/config/supabase.ts`).
- **Middleware Infrastructure**: Auth, Zod validation, Central error handler, and 404 handler.
- **Service Layer Architecture**: Users, Exercises, Workouts, Sessions, Pose Analysis, Injuries, Nutrition, Challenges, and Leaderboard services.
- **Validation**: Strict Zod schemas implemented across all request params, queries, and bodies.
- **Build Verification**: TypeScript compilation passed with 0 errors; Express server verified responding to `GET /health`.

### Phase 3: Supabase Authentication Middleware & Integration
- **JWT Verification Engine**: Implemented `requireAuth` in `src/middleware/auth.ts` enforcing `Authorization: Bearer <token>`, validating against Supabase `getUser()`, and injecting typed `req.user` (`id`, `email`, `role`).
- **Security Safeguards**: Rejection of missing, malformed, or expired tokens with standard `401 INVALID_TOKEN`. Zero token logging. Service role key isolated.
- **Automated Test Suite**: Added `tests/auth.test.ts` (6 test cases).

### Phase 4: Standardize API Responses & Error Handling
- **Response Format Standardization**: All 27 endpoints follow uniform envelopes:
  - Success: `{ "success": true, "data": {...}, "meta"?: {...} }` with HTTP 200/201/204.
  - Error: `{ "success": false, "error": { "code": "...", "message": "...", "details"?: [...] } }`.
- **Status & Error Code Alignment**: Aligned exact codes from `docs/API_CONTRACT.md`:
  - `400` (`BAD_REQUEST`, `SESSION_NOT_ACTIVE`, `SESSION_ALREADY_ACTIVE`, `ALREADY_JOINED`, `CHALLENGE_ENDED`).
  - `401` (`INVALID_TOKEN`).
  - `403` (`FORBIDDEN`).
  - `404` (`NOT_FOUND`, `USER_NOT_FOUND`, `PROFILE_NOT_FOUND`, `EXERCISE_NOT_FOUND`, `WORKOUT_NOT_FOUND`, `SESSION_NOT_FOUND`, `INJURY_NOT_FOUND`, `NUTRITION_PROFILE_NOT_FOUND`, `CHALLENGE_NOT_FOUND`).
  - `422` (`VALIDATION_ERROR` with field details).
  - `500` (`INTERNAL_SERVER_ERROR` with stack trace suppression in production).
- **Automated Test Suite**: Added `tests/response_error.test.ts` (8 test cases, 14 total suite tests passing).

### Phase 5: Request Validation Hardening
- **Validation Audit**: Completed comprehensive endpoint-by-endpoint audit across all 27 API Contract routes + 2 profile convenience routes.
- **Route Parameters Validation**: All UUID route parameters (`:id`, `:user_id`, `:workout_id`, `:session_id`, `:exercise_id`, `:challenge_id`, `:injury_id`) strictly validated before reaching controllers and database layers; invalid UUIDs immediately return HTTP 422 `VALIDATION_ERROR`.
- **Query Bounds Hardening**: Pagination queries bounded (`page >= 1`, `1 <= limit <= 100`, default 20); added query validator to `GET /challenges/:id/participants`; validated enums and string lengths for filters.
- **Workout Validation Hardening**: Enforced non-negative `order_index`, positive `target_sets`, positive `target_reps`, non-negative `target_weight_kg`, and strictly checked for duplicate `order_index` entries in nested exercises via custom Zod refinement.
- **Fitness Metrics Protection**: Non-negative constraints enforced on reps, weight, duration, and bounded 0–100 form scores across manual logging and AI pose analysis.
- **AI Pose Analysis Hardening**: Enforced 0–100 range on `form_score` and `rep_scores` array, bounded array lengths (`rep_scores` <= 500, `flagged_body_parts` <= 50), and prevented raw landmark/video payload ingestion.
- **Mass Assignment & Ownership Security**: Enforced `.strict()` on sensitive mutation bodies; user ownership strictly derived from authenticated `req.user.id` rather than request bodies.
- **Real Calendar Date Validation**: Added UTC-based calendar date validation helper checking genuine Gregorian calendar validity (e.g. rejecting Feb 30) and enforced `end_date >= start_date` on challenges.
- **Early Validation Verification**: Proved through service/database spies that invalid requests are rejected at middleware level before any controller, service, or Supabase database execution.
- **Automated Tests**: Added `tests/validation.test.ts` (19 validation tests). Full test suite now passes 33 tests across 3 suites with 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).

### Phase 6: User Profile APIs & Privacy Boundary
- **Endpoint Implementation & Alignment**:
  - `GET /api/v1/auth/me`: Authenticated profile extraction linking Supabase auth identity with user profile row.
  - `GET /api/v1/users/me`: Authenticated user's private profile retrieval with user claims.
  - `PUT /api/v1/users/me`: Authenticated user profile updates with explicit allowlist filtering.
  - `GET /api/v1/users/:id`: Public profile retrieval strictly querying the `public_profiles` view.
- **Authorization & Ownership Integrity**: All user-specific operations derive caller identity strictly from `req.user.id` (JWT-verified). Zero reliance on client-supplied body/query/route IDs for ownership.
- **Privacy Boundary & Leakage Protection**: Enforced strict isolation between private profile metrics (`weight_kg`, `height_cm`, `date_of_birth`, `gender`, `onboarding_done`, `email`) and public profile fields (`id`, `display_name`, `avatar_url`, `fitness_level`).
- **Mass Assignment Defense**: Implemented strict Zod schema validation combined with service-level allowlist filtering (`ALLOWED_PROFILE_UPDATE_FIELDS`), preventing unauthorized modification of sensitive attributes (`role`, `is_admin`, `email`, `created_at`, `id`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).

### Phase 7: Exercise APIs (Read-Only Master Catalog)

- **Endpoint Implementation & Alignment**:
  - `GET /api/v1/exercises`: Authenticated listing of exercise catalog supporting filtered queries (`muscle_group`, `difficulty`, `equipment`, `search`) and paginated response envelopes (`data[]` + `meta { page, limit, total }`).
  - `GET /api/v1/exercises/:id`: Authenticated single exercise details retrieval including `description`, `pose_landmarks`, and `demo_video_url`.
- **Read-Only Master Catalog Guard**: Verified exercises are system/seed data (14 master exercises in Migration 002) with no user-level write endpoints (`POST`, `PUT`, `DELETE` routes return HTTP 404).
- **Query Parameter Validation & SQL Injection Protection**:
  - Bounded pagination (`page >= 1`, `1 <= limit <= 100`, default 20).
  - Validated `difficulty` enum (`easy`, `medium`, `hard`) and bounded string lengths (`muscle_group`, `equipment`, `search`).
  - Parameterized Supabase query builder `.ilike()` / `.eq()` / `.order()` / `.range()` preventing SQL injection.
- **Downstream Compatibility**: Verified `ExerciseRow` structure provides stable UUIDs and MediaPipe `pose_landmarks` compatible with downstream workouts, session tracking, and pose-analysis modules.
- **Automated Test Suite**: Added `tests/exercises.test.ts` (10 test cases covering authentication, listing, filters, validation, detail retrieval, 404 handling, and read-only protection). Full test suite now passes 59 tests across 5 suites with 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).

### Phase 8: Workout APIs (CRUD & Workout-Exercises Relationship)
- **Endpoint Implementation & Alignment**:
  - `POST /api/v1/workouts`: Create new workout template with caller assigned strictly as `creator_id = req.user.id`; atomic insertion and linking of nested `workout_exercises`.
  - `GET /api/v1/workouts`: List workouts with database-level ownership filtering (`creator_id = req.user.id` or `is_public = true`; or strict `creator_id` filter when `mine=true`).
  - `GET /api/v1/workouts/:id`: Retrieve single workout with nested `workout_exercises` joined with master `exercise` details; strict privacy guard (returns 403 `FORBIDDEN` for private workouts owned by other users).
  - `PUT /api/v1/workouts/:id`: Update workout metadata via strict `ALLOWED_WORKOUT_UPDATE_FIELDS` allowlist; full replace of `workout_exercises` on update; creator-only authorization guard (403 `FORBIDDEN`).
  - `DELETE /api/v1/workouts/:id`: Creator-only deletion of workout and cascading cleanup of `workout_exercises` (returns 204 No Content).
- **Ownership & Cross-User Security**: Derived workout ownership strictly from JWT claims (`req.user.id`). User A cannot view, mutate, attach exercises to, or delete User B's private workouts.
- **Referential Integrity & Catalog Protection**: Verified that all referenced `exercise_id`s in workout creation and update payloads exist in the master `exercises` table before proceeding (invalid IDs return standard 400 `VALIDATION_ERROR`).
- **Automated Test Suite**: Added `tests/workouts.test.ts` (15 test cases covering authentication, creation, ownership spoofing prevention, non-existent exercise reference rejection, database-level filtering, single retrieval privacy, update replacement, delete authorization, and UUID validation). Full test suite now passes 74 tests across 6 suites with 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).

### Phase 9: Session APIs (Execution Tracking & Performance Metrics)
- **Endpoint Implementation & Alignment**:
  - `POST /api/v1/sessions/start`: Start active workout session (freestyle or referencing an existing public/user-owned workout); guards against concurrent active sessions (400 `SESSION_ALREADY_ACTIVE`).
  - `POST /api/v1/sessions/:id/log-exercise`: Manual set recording with validation for positive set numbers, reps, weights, durations, bounded form scores (0–100), and exercise catalog existence checks.
  - `POST /api/v1/sessions/:id/end`: End active session; computes accurate elapsed `duration_sec`, estimated calories burned (`calories_est`), and aggregate summary metrics (`total_sets`, `total_reps`, `avg_form_score`, `injury_flags_raised`).
  - `GET /api/v1/sessions`: List user's past sessions with database-level `user_id` filtering and optional `status` filter.
  - `GET /api/v1/sessions/:id`: Retrieve single session with nested `session_exercises` joined with `exercises` catalog metadata; owner-only privacy guard (403 `FORBIDDEN`).
- **Ownership & Workout Relationship Integrity**: Session ownership derived strictly from JWT `req.user.id`. Starting a session referencing another user's private workout is strictly forbidden (403 `FORBIDDEN`).
- **AI Pose Analysis Pipeline Foundation**: Established relational tracking between `sessions`, `session_exercises`, and `exercises` ensuring downstream AI pose analysis (`POST /pose-analysis`) seamlessly logs into `session_exercises`.
- **Automated Test Suite**: Added `tests/sessions.test.ts` (13 test cases covering authentication, session lifecycle, concurrent active session guard, private workout reference checks, manual exercise logging, end-session computation, list filtering, detail retrieval, and authorization boundaries). Full test suite now passes 87 tests across 7 suites with 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).

### Phase 10: Pose Analysis, Rep Counting & Form Scoring
- **Endpoint Implementation & Alignment**:
  - `POST /api/v1/pose-analysis`: Ingestion of completed AI set summaries from on-device MediaPipe landmark tracking. Creates `session_exercises` row and automatically raises `injury_flags` entries with severity ratings on flagged joint deviations.
- **Computer Vision & Geometry Foundation**:
  - Implemented `calculateJointAngle` in `src/utils/geometry.ts` for deterministic joint angle calculation (0°–180°) handling zero-length vectors and floating-point edge cases safely.
  - Implemented `ExerciseRepCounter` state machine with hysteresis-based stage transitions (`REST` → `TRANSITION` → `INFLECTION` → `RECOVERY` → `REST`) preventing jitter-induced double-counting and incomplete repetition increments.
  - Calculated bounded form scores (0–100) based on peak angle deviations from optimal exercise configurations.
- **Ownership & Session Validation**:
  - Derived session ownership from JWT claims (`req.user.id`). Reject cross-user pose submission attempts (403 `FORBIDDEN`).
  - Active session guard enforced (400 `SESSION_NOT_ACTIVE` for ended/inactive sessions).
- **Automated Test Suite**: Added `tests/poseAnalysis.test.ts` (11 test cases covering geometry angle calculations, state machine rep counting, incomplete movement rejection, static frame jitter immunity, authentication, contextual feedback generation, automatic injury flag creation, cross-user isolation, and active session guards). Full test suite now passes 98 tests across 8 suites with 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).

### Phase 11: Injury APIs (User Isolation & Resolution Tracking)
- **Endpoint Implementation & Alignment**:
  - `GET /api/v1/injuries`: List user's injury flags with database-level `user_id` filtering and optional `resolved` / `severity` query filters.
  - `GET /api/v1/injuries/:id`: Retrieve single injury flag detail; owner-only privacy guard (403 `FORBIDDEN`).
  - `PATCH /api/v1/injuries/:id`: Update injury flag status (marking `resolved: true` sets `resolved_at = now()`, `resolved: false` sets `resolved_at = null`) and/or update severity rating (`low`, `medium`, `high`); owner-only guard (403 `FORBIDDEN`).
- **Ownership & IDOR Protection**: All operations derive user identity strictly from JWT `req.user.id`. Strict allowlist `ALLOWED_INJURY_UPDATE_FIELDS` (`resolved`, `severity`) prevents mass assignment or tampering with `user_id`, `session_exercise_id`, `source`, `body_part`, and `flagged_at`.
- **Automated Test Suite**: Added `tests/injuries.test.ts` (13 test cases covering authentication, listing, filtering, detail retrieval, resolution timestamp management, severity mutation, cross-user isolation, IDOR prevention, empty body validation, and UUID format checks). Full test suite now passes 111 tests across 9 suites with 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).

### Phase 12: Remaining APIs (Nutrition, Challenges & Leaderboard)
- **Endpoint Implementation & Alignment**:
  - `GET /api/v1/nutrition/profile`: Authenticated retrieval of personal nutrition targets.
  - `PUT /api/v1/nutrition/profile`: Upsert user nutrition targets using strict `ALLOWED_NUTRITION_UPDATE_FIELDS` allowlist.
  - `POST /api/v1/nutrition/recommend`: Contract-compliant meal plan recommendation using `INutritionRecommendationProvider` interface (clean abstraction ready for future pluggable AI integration without external LLM dependencies).
  - `POST /api/v1/challenges`: Challenge creation with authenticated creator ownership (`creator_id = req.user.id`).
  - `GET /api/v1/challenges`: Active challenge listing with filters (`type`, `mine=true`) and bounded pagination.
  - `GET /api/v1/challenges/:id`: Single challenge details with participant count aggregation.
  - `POST /api/v1/challenges/:id/join`: Join active challenge with duplicate prevention (`ALREADY_JOINED`) and expired challenge rejection (`CHALLENGE_ENDED`).
  - `GET /api/v1/challenges/:id/participants`: Ranked leaderboard of challenge participants.
  - `GET /api/v1/leaderboard`: Global or challenge-specific leaderboard exposing public profile data only (`id`, `display_name`, `avatar_url`) protecting private health/body metrics.
- **Privacy & Security Boundaries**: Enforced database-level user isolation, IDOR protection across all remaining domains, and parameter preprocessing.
- **Automated Test Suite**: Added `tests/nutrition.test.ts` (8 test cases), `tests/challenges.test.ts` (9 test cases), and `tests/leaderboard.test.ts` (2 test cases). Full test suite now passes 130 tests across 12 suites with 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).

### Phase 13: Database Safety & RLS Security Audit
- **Security Audit & RLS Hardening**:
  - Audited all PostgreSQL tables and views: `users`, `workouts`, `workout_exercises`, `sessions`, `session_exercises`, `injury_flags`, `nutrition_profiles`, `challenges`, `challenge_participants`, `public_profiles`.
  - Created migration `migrations/003_security_rls_hardening.sql` enforcing `WITH CHECK` clauses on all UPDATE policies to prevent ownership reassignment, creator/user spoofing, and privilege escalation.
  - Added complete DELETE policies across all user-owned and child entities.
  - Verified `public_profiles` view exposes only non-sensitive fields (`id`, `display_name`, `avatar_url`, `fitness_level`) protecting private health/body metrics.
  - Confirmed server-side `SUPABASE_SERVICE_ROLE_KEY` usage is strictly confined to trusted backend initialization and never exposed to clients, logs, or response payloads.
- **Automated Test Suite**: Added `tests/security.test.ts` (7 comprehensive security tests covering public profile privacy, workout IDOR isolation, workout modification/deletion boundaries, session & pose analysis access controls, injury flag isolation, payload spoofing rejection, and secret key leakage protection). Full test suite now passes 137 tests across 13 suites with 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).
- **Live RLS Verification Status**: Schema/Migration audited (live test NOT AVAILABLE without live Supabase instance).

### Phase 14: Centralized Error Handling & Sanitization
- **Centralized Error Handling Architecture**:
  - Enhanced `errorHandler` in `src/middleware/errorHandler.ts` to intercept and safely map database/system errors to standardized API envelopes.
  - Mapped PostgreSQL error codes: `23505` (unique violation) -> 409 `DUPLICATE_RECORD`, `23503` (foreign key violation) -> 400 `BAD_REQUEST`, `23502` (not null violation) -> 422 `VALIDATION_ERROR`, `22P02` (invalid syntax/uuid) -> 422 `VALIDATION_ERROR`, and PostgREST `PGRST116` -> 404 `NOT_FOUND`.
  - Expanded `AppError` taxonomy in `src/utils/errors.ts` with `DuplicateRecordError` and `DatabaseError`.
  - Enforced production error sanitization preventing leakage of stack traces, SQL queries, internal filesystem paths, and environment secrets.
- **Automated Test Suite**: Added `tests/errors.test.ts` (9 test cases covering 404 unknown routes, 401 unauthenticated requests, 422 validation rejections, PostgreSQL error code mappings, and 500 runtime error sanitization). Full test suite now passes 146 tests across 14 suites with 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).

### Phase 15: Comprehensive Backend Testing & QA
- **Pre-phase Audit**: Inspected all routes, controllers, services, validators, middleware, and existing test files. Verified Phase 14 error handler is correctly mounted in `src/app.ts` (post-router, post-notFound). Confirmed 146 tests passing as baseline.
- **Gaps Identified**:
  - No test for logging to completed/cancelled sessions
  - No test for ending a session owned by another user
  - Missing mass assignment tests for `id`, `created_at`, `updated_at`, `user_id` across nutrition, injuries, session exercises, challenges, and pose analysis
  - No privilege escalation coverage for challenge join and nutrition profile ownership
  - No data leakage assertion across leaderboard and challenge participants
  - No error envelope consistency test across all 401-returning endpoints
  - No explicit PostgreSQL error code-to-HTTP-status mapping regression tests
  - No RLS static audit (migration file structure verification)
  - No source-code audit confirming services never use `supabaseAnon` for writes
- **Phase 15 Test Suite** (`tests/phase15_comprehensive.test.ts`): 48 new tests across 9 sections:
  - **Section 1 (Session Business Logic)**: completed/cancelled session rejects, non-owner session end (403), user isolation assertion on list, public workout start by another owner, strict schema rejection of unknown fields.
  - **Section 2 (Mass Assignment — All Domains)**: Rejected injection of `id`, `created_at`, `updated_at`, `user_id`, `creator_id`, `is_active`, `is_admin`, `role`, `email`, `session_id`, `session_exercise_id`, `resolved_at` across all 8 protected endpoints.
  - **Section 3 (Privilege Escalation)**: Nutrition profile ownership via JWT only; challenge `creator_id` always from JWT; join challenge `user_id` always from JWT.
  - **Section 4 (Data Leakage)**: `/health` endpoint clean; 500 response has no stack/env fields; 23505 error never leaks raw SQL; leaderboard never exposes private body metrics; challenge participants response exposes only public fields.
  - **Section 5 (Error Envelope Consistency)**: All 8 authenticated endpoints return `{ success: false, error: { code, message } }` on 401; validation errors include `details[]` array with field+message; 404 unknown route envelope; PostgreSQL error codes to HTTP status regression.
  - **Section 6 (API Contract Regression)**: `GET /auth/me` returns identity; `POST /workouts` returns 201 with nested exercises; `GET /sessions` returns paginated `meta`; `DELETE /workouts/:id` returns 204 no-body; `POST /pose-analysis` returns required contract fields.
  - **Section 7 (Validation Boundary)**: `set_number=0`, negative reps, negative `target_value`, negative `protein_g`, unknown severity enum, notes >2000 chars, whitespace-only title, invalid difficulty enum.
  - **Section 8 (RLS Static Audit)**: Migration 003 existence; USING+WITH CHECK clause counts; all critical tables covered; public_profiles view private field exclusion; service-role key not hardcoded; `/health` clean; all service files use only `supabaseAdmin` (never `supabaseAnon`).
  - **Section 9 (IDOR)**: Cross-user session exercise log (403); cross-user injury read (403); cross-user workout delete (403); non-existent resource returns 404 not 403.
- **Automated Test Suite**: 194 tests across 23 suites — all passing, 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).
- **RLS Static Audit Result**: PASS (live test NOT AVAILABLE without live Supabase instance; migration 003 fully audited statically).
- **Security Testing Result**: PASS — IDOR, mass assignment, privilege escalation, data leakage, credential leakage, error sanitization all verified.

### Phase 16: API Documentation & Contract Sync
- **Source-of-Truth Audit**: Cross-checked all 30 implemented routes across routes, controllers, services, Zod schemas, error middleware, and the 194 automated test assertions.
- **Contract Synchronization**:
  - Reconciled response envelope documentation to consistently include `{ success: true, data, meta }` and `{ success: false, error: { code, message, details } }`.
  - Added full specification for `GET /api/v1/users/me` (private full user profile) and `GET /health` (public liveness probe).
  - Clarified HTTP 422 `VALIDATION_ERROR` for all Zod schema validation failures.
  - Documented exact validation bounds, nullable field semantics, and strict object restrictions across all request payloads.
  - Documented all business logic side effects and privacy/tenant isolation rules.
- **Automated Test Suite**: 194 tests across 23 suites — all passing, 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).

### Phase 17: Mobile Team Integration
- **Environment Configuration**:
  - Verified `.env.example` contains clean placeholders for `PORT`, `NODE_ENV`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
  - Confirmed `.env` is gitignored and protected against accidental credential check-ins.
  - Service-role key remains strictly backend-only and is never exposed to mobile/client environments.
- **Mobile Integration Specification**:
  - Created `docs/MOBILE_INTEGRATION.md` detailing single `API_BASE_URL` configuration (`http://localhost:5000/api/v1` for local, `https://<deployed-domain>/api/v1` for production placeholder).
  - Documented Supabase Auth JWT header flow (`Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`).
  - Documented public vs protected endpoints, standard success/error response envelopes, token refresh strategy on `401 INVALID_TOKEN`, and on-device MediaPipe set-summary integration pattern.
  - Provided copy-paste TypeScript/React Native and Dart/Flutter client examples.
- **Automated Test Suite**: 194 tests across 23 suites — all passing, 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).
### Phase 18: Health Check
- **Health Check Audit & Implementation**:
  - Verified lightweight `GET /health` process probe hosted at root level in `src/app.ts` (outside `/api/v1`).
  - Returns `200 OK` with `{ status: "ok", environment, timestamp, version: "1.0.0" }`.
  - Does not execute unnecessary database queries or external API calls.
  - Exposes no secrets, tokens, database credentials, internal paths, or full `process.env` structures.
- **Automated Test Suite**: Added `tests/health.test.ts` (5 comprehensive test cases verifying status 200, valid JSON response, unauthenticated accessibility, credential leakage protection, token non-reflection, and root-level URL isolation vs `/api/v1/health` 404). Full test suite now passes 199 tests across 24 suites with 0 failures (`npm test`).
- **Build Verification**: TypeScript compilation passed with 0 errors (`npm run build`).
- **Runtime Verification**: Verified `GET http://localhost:5000/health` returns `200 OK` with `{ status: "ok" }`.

---

## Phase 19 — Pose Analysis Core Engine

**Status**: Complete

### Objective
Create a standalone, framework-independent Pose Analysis Core Engine that accepts exercise configuration and pose landmark frames and returns deterministic movement metrics (rep count, form score, joint angles).

### Architecture Decision — Reuse over Rewrite
Inspection of Phase 10 (`src/utils/geometry.ts`) found two production-quality, zero-dependency implementations already in place:
- `calculateJointAngle(a, b, c)` — pure math, handles null/NaN/Infinity/zero-vectors
- `ExerciseRepCounter` — stateful 4-stage state machine (REST → TRANSITION → INFLECTION → RECOVERY)

**Neither was duplicated.** Both are imported by the new `PoseEngine` from `src/utils/geometry.ts`.

### New Files Created

**`src/engine/pose/types.ts`**
- `PoseLandmark` — named landmark interface (structurally compatible with MediaPipe `NormalizedLandmark`)
- `PoseFrame` — one frame of named landmarks with optional timestamp
- `AngleRule` — defines which joint to measure (`proximal`, `vertex`, `distal`)
- `RepRule` — defines how to count reps (`rest_angle`, `target_angle`, `threshold_tolerance`)
- `ExerciseAnalysisConfig` — complete exercise configuration
- `FormFlag` — form violation alert (defined here; populated by Phase 20)
- `PoseAnalysisResult` — output contract mapping onto `PoseAnalysisSetSummaryInput`
- Re-exports `LandmarkPoint`, `LandmarkMap`, `RepStage`, `RepCounterConfig` from `geometry.ts` (single source of truth)

**`src/engine/pose/configParser.ts`**
- `parsePoseConfig(id, name, raw)` — normalises `exercises.pose_landmarks` JSONB into `ExerciseAnalysisConfig`
- Handles all 7 legacy key-name variants in Migration 002 seed data (`target_angle`, `knee_angle_target`, `knee_flexion_target`, `elbow_flexion_target`, `hip_hinge_depth`, `lockout_angle`, `target_angle_range[0]`)
- Infers `rest_angle` (absent from all 14 seed exercises) from `target_angle` direction
- Safe to call with `null` — always returns a valid, finite config

**`src/engine/pose/PoseEngine.ts`**
- `PoseEngine.analyze(config, frames): PoseAnalysisResult` — stateless orchestrator
  - Converts `PoseFrame[]` → `LandmarkMap` per frame
  - Filters landmarks by `min_visibility` threshold (default 0.5)
  - Calls `calculateJointAngle` from `geometry.ts`
  - Feeds angles into `ExerciseRepCounter` from `geometry.ts`
  - Aggregates `rep_count`, `average_form_score`, `rep_scores`, `confidence`
  - Each call creates a fresh `ExerciseRepCounter` — no state leaks between calls
- `PoseEngine.validateConfig(config): string[]` — validates config consistency

**`src/engine/pose/configs.ts`**
- `SQUAT_ANALYSIS_CONFIG` — Barbell Squat, knee flexion, rest=160°, target=90°
- `LUNGE_ANALYSIS_CONFIG` — Dumbbell Lunges, knee flexion
- `PUSHUP_ANALYSIS_CONFIG` — Push-Up, elbow flexion, rest=160°, target=90°
- `BICEP_CURL_ANALYSIS_CONFIG` — Bicep Curl, elbow flexion, rest=160°, target=35°
- All usable without DB access

### Test File Created

**`tests/engine/PoseEngine.test.ts`** — 18 new unit tests:

| # | Test | Coverage |
|---|---|---|
| 1 | Engine computes 90° joint correctly | Angle calculation |
| 2 | Engine computes 180° straight joint | Angle calculation |
| 3 | Engine computes acute angle (135°) | Formula generality |
| 4 | Missing landmark → 0°, no exception | Null safety |
| 5 | Zero-length vector → 0°, no crash | Degenerate input |
| 6 | NaN coordinate → 0°, output never NaN | NaN safety |
| 7 | Infinity coordinate → 0°, output finite | Infinity safety |
| 8 | Counter starts at 0 in REST stage | Initial state |
| 9 | Complete rep → count=1, form score=84 | Rep completion |
| 10 | Incomplete rep → count=0 | No partial counting |
| 11 | 30 static frames → count=0 | No false triggers |
| 12 | Oscillating near threshold → count=0 | Hysteresis |
| 13 | Two calls, same input → same result | Reset / isolation |
| 14 | Same input × 2 → deterministic | Determinism |
| 15 | Valid config passes validation | Config validation |
| 16 | Empty exercise_id fails validation | Config validation |
| 17 | Mismatched angle_name fails validation | Config validation |
| 18 | All 6 JSONB key variants normalised | parsePoseConfig |

### Documentation Created
- **`docs/POSE_ANALYSIS_MODULE.md`** — full module reference for mobile/ML integration team:
  - All TypeScript interfaces with examples
  - `PoseEngine.analyze()` / `validateConfig()` / `parsePoseConfig()` API reference
  - Harshit integration example (PoseEngine → PoseAnalysisService)
  - State machine diagram
  - Visibility filtering explanation
  - MediaPipe adapter path (Phase 19C)
  - Phase 20 Form Analysis forward reference

### Existing Files — Unchanged
- `src/utils/geometry.ts` — reused as-is
- `src/services/poseAnalysis.service.ts` — unchanged
- All controllers, validators, routes, middleware
- All existing 199 tests
- Database schema and migrations
- `docs/API_CONTRACT.md`

### Constraints Respected
- No Express, Supabase, JWT, or HTTP imports inside `src/engine/`
- No duplicate `calculateJointAngle` or `ExerciseRepCounter`
- No database schema changes
- No API contract changes
- No new npm packages

### Test Results
- **New tests**: 18 (in `tests/engine/PoseEngine.test.ts`)
- **Total tests**: 217
- **Passed**: 217
- **Failed**: 0
- **Build**: TypeScript compilation 0 errors (`npm run build`)
- **Regression**: All 199 previous phase tests continue to pass

---

## Phase 20 — Form Analysis Engine

**Status**: Complete

### Objective
Implement the Form Analysis layer that evaluates deterministic, configuration-driven form rules against pose landmark frames and joint angles, outputting `FormFlag[]` integrated into `PoseAnalysisResult`.

### Key Components

**`src/engine/pose/formAnalyzer.ts`**
- `analyzeForm(angles, frame, formRules, options): FormFlag[]`
  - Evaluates both pre-computed angles (`angle_name`) and on-the-fly joint triplets (`joint_triplet`).
  - Supports condition operators: `'lt'`, `'lte'`, `'gt'`, `'gte'`, `'outside_range'`, `'inside_range'`.
  - Fail-safe against missing landmarks, NaN/Infinity coordinates, missing angles, and malformed rules (returns empty flags with zero exceptions).
  - Emits `FormFlag` objects containing `flag`, `description`, `severity` (`'low' | 'medium' | 'high'`), `measured_angle`, and `frame_index`.

**`src/engine/pose/types.ts`**
- Added `FormRuleCondition` type (`'lt' | 'lte' | 'gt' | 'gte' | 'outside_range' | 'inside_range'`).
- Added `FormRule` interface for configuration-driven constraints.
- Updated `ExerciseAnalysisConfig` to include optional `form_rules?: FormRule[]`.

**`src/engine/pose/PoseEngine.ts`**
- Integrated `analyzeForm` into `PoseEngine.analyze()` loop.
- Added `form_rules` structural validation to `PoseEngine.validateConfig()`.

**`src/engine/pose/configs.ts`**
- Added demonstrative form rules to pre-built configurations:
  - **Barbell Squat**: Knee over-flexion (`< 60°`, severity: `medium`), Excessive forward lean (`< 45°` torso-thigh angle, severity: `medium`).
  - **Push-Up**: Elbow over-flexion (`< 60°`, severity: `low`), Body alignment / hip sag (`< 155°` plank line, severity: `high`).
  - **Bicep Curl**: Incomplete extension (`< 140°` at bottom, severity: `low`).

**`src/engine/pose/configParser.ts`**
- Updated to parse `form_rules` / `formRules` from raw JSONB.
- Documented all 9 legacy target-angle key-name variants in Migration 002 seed data.

### Test File Created

**`tests/engine/formAnalyzer.test.ts`** — 18 new unit tests:
1. Correct form produces no flag.
2. Lower-body form violation produces expected flag with accurate metadata.
3. Upper-body form violation produces expected flag with accurate metadata.
4. Boundary values exactly at threshold evaluate deterministically (`lt` vs `lte`, `gt` vs `gte`).
5. Just outside acceptable threshold triggers violation.
6. Missing landmark produces no false-positive flags and throws no error.
7. Missing angle name produces no false-positive flags.
8. NaN coordinate / angle produces no false-positive flags.
9. Infinity coordinate / angle produces no false-positive flags.
10. Multiple simultaneous violations on the same frame are all captured.
11. Output is strictly deterministic.
12. Invalid rule configuration is safely skipped without throwing.
13. Unknown condition operator is safely skipped.
14. Severity levels (`'low'`, `'medium'`, `'high'`) are preserved accurately.
15. Range conditions (`'outside_range'`, `'inside_range'`) evaluate correctly.
16. Joint triplet calculates angle on the fly from frame landmarks correctly.
17. Multi-frame sequence in `PoseEngine.analyze()` collects form flags with frame indices.
18. `PoseEngine.validateConfig()` validates `form_rules` and rejects invalid rule configurations.

### Biomechanical Limitations & Medical Boundary
- Documented in `docs/POSE_ANALYSIS_MODULE.md` that 2D camera projections cannot reliably evaluate knee-over-toe without calibrated 3D depth and foot direction, so invariant 3-point joint-angle rules are used instead.
- Established that all form flags are movement/form observations, not medical diagnoses.

### Test Results
- **New tests**: 18 (in `tests/engine/formAnalyzer.test.ts`)
- **Total tests**: 235
- **Passed**: 235
- **Failed**: 0
- **Build**: TypeScript compilation 0 errors (`npm run build`)
- **Regression**: All 217 previous phase tests continue to pass
















