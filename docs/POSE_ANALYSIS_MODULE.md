# Kinetra — Pose Analysis Module

> **Module path**: `src/engine/pose/`  
> **Version**: Phase 19  
> **Dependencies**: zero external dependencies — reuses `src/utils/geometry.ts` only  
> **Audience**: Mobile team, ML integration team, backend developers

---

## Overview

The Pose Analysis Module is a **standalone, framework-independent** analysis engine.

It accepts pose landmark data from any detector (MediaPipe, TFLite, synthetic) and returns deterministic movement metrics — rep count, form score, joint angles, and quality confidence.

**It does not depend on:**
- Express (no `req`/`res` objects)
- Supabase (no database calls)
- JWT / authentication
- Environment variables
- HTTP

It is designed to be used by the existing `/api/v1/pose-analysis` endpoint, mobile clients, and any future Python or TF.js service.

---

## Module Structure

```
src/engine/pose/
├── types.ts         ← All TypeScript interfaces and types (public contract)
├── configParser.ts  ← Normalises DB pose_landmarks JSONB → ExerciseAnalysisConfig
├── PoseEngine.ts    ← Core analysis class (analyze + validateConfig)
└── configs.ts       ← Pre-built configs for 4 seeded exercises (no DB needed)

src/utils/
└── geometry.ts      ← calculateJointAngle + ExerciseRepCounter (REUSED, not duplicated)
```

---

## Public Types

### `PoseLandmark`

A single detected body keypoint from any pose detector.

```typescript
interface PoseLandmark {
  name: string;         // e.g. "left_knee", "right_shoulder"
  x: number;            // Normalised [0.0–1.0] left → right
  y: number;            // Normalised [0.0–1.0] top → bottom
  z?: number;           // Depth (optional)
  visibility?: number;  // Detector confidence [0.0–1.0] (optional)
}
```

> Compatible with MediaPipe `NormalizedLandmark`. Only difference: Kinetra adds the `name` field for readability.

---

### `PoseFrame`

A complete set of landmarks for one video frame.

```typescript
interface PoseFrame {
  landmarks: PoseLandmark[];
  timestamp_ms?: number;
}
```

---

### `ExerciseAnalysisConfig`

Complete configuration for analysing a specific exercise.

```typescript
interface ExerciseAnalysisConfig {
  exercise_id: string;
  exercise_name: string;
  required_landmarks: string[];
  angle_rules: AngleRule[];   // Which joints to measure
  rep_rule: RepRule;          // How to count reps
  min_visibility?: number;    // Default: 0.5
}
```

Obtain from:
1. `parsePoseConfig(id, name, exerciseRow.pose_landmarks)` — DB-derived
2. Pre-built constants in `configs.ts` — no DB required

---

### `AngleRule`

Defines one joint-angle measurement.

```typescript
interface AngleRule {
  name: string;      // e.g. "knee_angle"
  proximal: string;  // e.g. "left_hip"
  vertex: string;    // Joint being measured (e.g. "left_knee")
  distal: string;    // e.g. "left_ankle"
}
```

---

### `RepRule`

Defines how to count reps for one angle measurement.

```typescript
interface RepRule {
  angle_name: string;         // Must match an AngleRule.name
  rest_angle: number;         // Angle at start/rest position (e.g. 160° standing)
  target_angle: number;       // Angle at depth/contraction (e.g. 90° squat)
  threshold_tolerance?: number; // Default: 10° — prevents jitter
}
```

Movement direction is **inferred automatically**:
- `target_angle < rest_angle` → decreasing motion (squat, push-up, curl)
- `target_angle > rest_angle` → increasing motion (leg extension, lateral raise)

---

### `PoseAnalysisResult`

Complete output from `PoseEngine.analyze()`.

```typescript
interface PoseAnalysisResult {
  rep_count: number;                  // Completed full repetitions
  stage: string;                      // 'REST'|'TRANSITION'|'INFLECTION'|'RECOVERY'
  angles: Record<string, number>;     // Named joint angles from last frame (degrees)
  confidence?: number;                // Average landmark visibility [0.0–1.0]
  flags: FormFlag[];                  // Form violation alerts (Phase 20)
  rep_scores: number[];               // Per-rep form quality [0.0–100.0]
  average_form_score: number;         // Mean of rep_scores (0 if no reps)
  frames_analyzed: number;            // Total frames processed
}
```

---

## PoseEngine API

### `PoseEngine.analyze(config, frames): PoseAnalysisResult`

Analyse a set's worth of frames.

```typescript
import { PoseEngine } from './engine/pose/PoseEngine.js';
import { parsePoseConfig } from './engine/pose/configParser.js';

// From DB:
const config = parsePoseConfig(
  exerciseRow.id,
  exerciseRow.name,
  exerciseRow.pose_landmarks   // Record<string, any> | null
);

// From detector (any source — MediaPipe, TFLite, synthetic):
const frames: PoseFrame[] = detector.getFrames();

const output = PoseEngine.analyze(config, frames);
// output.rep_count, output.average_form_score, output.rep_scores, ...
```

Each call creates a fresh state machine. Multiple calls with the same input always produce identical output.

---

### `PoseEngine.validateConfig(config): string[]`

Validate an `ExerciseAnalysisConfig` before use.

```typescript
const errors = PoseEngine.validateConfig(config);
if (errors.length > 0) {
  throw new Error(`Invalid config: ${errors.join('; ')}`);
}
```

Returns an empty array for valid configs.

---

### `parsePoseConfig(id, name, raw): ExerciseAnalysisConfig`

Parse `exercises.pose_landmarks` JSONB into a typed config.

```typescript
import { parsePoseConfig } from './engine/pose/configParser.js';

const config = parsePoseConfig(
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'Barbell Squat',
  exerciseRow.pose_landmarks
);
```

Handles all 7 legacy key-name variants in the current seed data. Safe to call with `null`.

---

## Integration Boundary for Harshit

### Wiring PoseEngine into the existing API

The existing `POST /api/v1/pose-analysis` endpoint and `PoseAnalysisService` are **unchanged**. PoseEngine produces the data that flows into them:

```typescript
// 1. Build config (once per exercise — can be cached)
const config = parsePoseConfig(
  exerciseRow.id,
  exerciseRow.name,
  exerciseRow.pose_landmarks
);

// 2. Analyse frames from the on-device detector
const output = PoseEngine.analyze(config, frames);

// 3. Persist via the existing Phase 10 service (unchanged)
const result = await PoseAnalysisService.submitSetAnalysis(userId, {
  session_id,
  exercise_id:        config.exercise_id,
  reps:               output.rep_count,
  form_score:         output.average_form_score,
  rep_scores:         output.rep_scores,
  injury_flag:        output.flags.some(f => f.severity === 'high'),
  flagged_body_parts: output.flags
    .filter(f => f.severity === 'high')
    .map(f => f.flag),
});
```

### Using pre-built configs (no DB)

```typescript
import { SQUAT_ANALYSIS_CONFIG, PUSHUP_ANALYSIS_CONFIG } from './engine/pose/configs.js';

// Squat
const squatResult = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, squatFrames);

// Push-Up
const pushUpResult = PoseEngine.analyze(PUSHUP_ANALYSIS_CONFIG, pushUpFrames);
```

---

## Data Flow

```
Pose Detector (any source — not required by this module)
    │
    │  PoseLandmark[] (one array per video frame)
    ▼
PoseFrame[] (ordered chronologically)
    │
    ▼
PoseEngine.analyze(config, frames)
    │
    ├─ frameToLandmarkMap()   → LandmarkMap per frame
    ├─ getVisibleLandmark()   → filters by min_visibility threshold
    ├─ calculateJointAngle()  → geometry.ts (REUSED)
    ├─ ExerciseRepCounter     → geometry.ts (REUSED, stateful per call)
    └─ computeFrameVisibility → confidence estimation
    │
    ▼
PoseAnalysisResult
  { rep_count, stage, angles, confidence, flags, rep_scores, average_form_score }
    │
    ▼  (optional — caller maps fields)
PoseAnalysisSetSummaryInput
    │
    ▼
PoseAnalysisService.submitSetAnalysis() → Supabase DB
```

---

## Rep Counter State Machine

```
         ┌──────────────────────────────────────────┐
         │                                          │
    ► REST ──────── angle < restAngle-tol ──► TRANSITION
         ▲                                          │
         │                               angle ≤ targetAngle+tol
         │                                          ▼
    count++                                    INFLECTION
         │                                          │
         │                               angle > targetAngle+tol
         │                                          ▼
    RECOVERY ◄─── angle ≥ restAngle-tol ────────────┘
```

- `restAngle = 160°`, `targetAngle = 90°`, `tolerance = 10°` (squat example)
- `EXIT_REST`: angle < 150°
- `EXIT_TRANSITION`: angle ≤ 100°
- `EXIT_INFLECTION`: angle > 100°
- `EXIT_RECOVERY`: angle ≥ 150° → **rep counted**

---

## Reused Components

> Do NOT duplicate these. They live in `src/utils/geometry.ts`.

| Component | Description |
|---|---|
| `calculateJointAngle(a, b, c)` | Computes angle at vertex `b` in degrees. Handles null, NaN, Infinity, zero-vectors. Always returns a finite number. |
| `ExerciseRepCounter` | Stateful 4-stage rep counting state machine. `processSample(angle)` returns `{ count, stage, completedRepScore? }`. |
| `LandmarkPoint` | `{ x, y, z?, visibility? }` — internal keyed format |
| `LandmarkMap` | `Record<string, LandmarkPoint>` |
| `RepStage` | `'REST' \| 'TRANSITION' \| 'INFLECTION' \| 'RECOVERY'` |

---

## Visibility Filtering

Landmarks below `config.min_visibility` (default `0.5`) are treated as absent before any angle calculation. This prevents occluded or low-confidence keypoints from corrupting the rep count.

```typescript
// Frame with an occluded knee (visibility = 0.2, below default 0.5):
{ name: 'left_knee', x: 0.5, y: 0.6, visibility: 0.2 }
// → getVisibleLandmark() returns null
// → calculateJointAngle(hip, null, ankle) returns 0
// → ExerciseRepCounter.processSample(0) is a no-op (frame skipped)
```

---

## Form Analysis Layer (Phase 20)

### Overview

The Form Analysis layer evaluates deterministic, configuration-driven rules against video frames and computed joint angles. It outputs `FormFlag[]` containing movement observations and risk severity ratings.

**Key principles**:
- **Pure and deterministic**: Given identical landmarks, the analyzer always produces identical flags.
- **Fitness observation, not medical diagnosis**: Flags describe movement quality and biomechanical positioning, not clinical diagnoses.
- **Fail-safe**: Missing keypoints, occluded landmarks, NaN/Infinity coordinates, and invalid rule configurations produce no false alarms and never throw exceptions.

---

### `FormRule` Interface

```typescript
type FormRuleCondition =
  | 'lt'             // angle < threshold
  | 'lte'            // angle <= threshold
  | 'gt'             // angle > threshold
  | 'gte'            // angle >= threshold
  | 'outside_range'  // angle < range[0] || angle > range[1]
  | 'inside_range';  // angle >= range[0] && angle <= range[1]

interface FormRule {
  id: string;                          // Unique rule ID (e.g. "squat_excessive_depth")
  flag: string;                        // Machine-readable code (e.g. "knee_over_flexion")
  description: string;                 // Human-readable coaching observation
  severity: 'low' | 'medium' | 'high'; // Movement risk significance
  angle_name?: string;                 // Evaluates pre-computed angle from AngleRule
  joint_triplet?: [string, string, string]; // Evaluates on-the-fly angle from 3 landmarks
  condition: FormRuleCondition;
  threshold?: number;                  // Angle in degrees for single-value comparisons
  range?: [number, number];            // [min, max] range in degrees
}
```

---

### `FormFlag` Output

```typescript
interface FormFlag {
  flag: string;                        // e.g. "knee_over_flexion", "excessive_forward_lean"
  description: string;                 // Coaching feedback text
  severity: 'low' | 'medium' | 'high'; // Severity rating
  measured_angle?: number;             // Joint angle at time of detection (degrees)
  frame_index?: number;                // Frame index where violation was detected
}
```

---

### Severity Classification

| Severity | Meaning | Example |
|---|---|---|
| `'low'` | Minor deviation from optimal movement; coaching tip | Elbow flared or slightly short extension |
| `'medium'` | Significant movement fault affecting repetition quality | Excessive torso forward lean during squat; knee over-flexion |
| `'high'` | Major structural misalignment; elevated joint stress | Severe hip sag / lumbar hyperextension during plank or push-up |

> **Note**: Severity reflects movement efficiency and form quality. It is **not** a clinical diagnostic indicator.

---

### Supported Built-in Rules

#### 1. Barbell Squat (`SQUAT_ANALYSIS_CONFIG`)
- **Knee Over-Flexion** (`squat_excessive_depth`): Knee angle < 60° (too acute; excessive joint compression). Severity: `medium`.
- **Excessive Forward Lean** (`squat_excessive_forward_lean`): Torso-to-thigh angle (`left_shoulder` → `left_hip` → `left_knee`) < 45°. Severity: `medium`.

#### 2. Push-Up (`PUSHUP_ANALYSIS_CONFIG`)
- **Elbow Over-Flexion** (`pushup_excessive_depth`): Elbow angle < 60° (excessive depth causing anterior shoulder strain). Severity: `low`.
- **Body Alignment / Hip Sag** (`pushup_hip_sag`): Spine/hip line (`left_shoulder` → `left_hip` → `left_ankle`) < 155° (hips sagging out of straight plank). Severity: `high`.

#### 3. Dumbbell Bicep Curl (`BICEP_CURL_ANALYSIS_CONFIG`)
- **Incomplete Extension** (`bicep_curl_incomplete_extension`): Elbow angle at bottom < 140° (shortchanging range of motion). Severity: `low`.

---

### Biomechanical Limitations & Knee-Over-Toe Analysis

In 2D camera projections (MediaPipe NormalizedLandmarks without calibrated multi-camera 3D depth):
- **Knee-over-toe calculation limitation**: A naive 2D comparison (`knee.x > ankle.x`) produces severe false positives depending on camera viewing angle, subject orientation (facing left vs right), and foot angle.
- **Architecture decision**: Kinetra intentionally avoids unreliable 2D knee-over-toe heuristics. Instead, it relies on invariant 3-point **joint-angle calculations** (such as knee flexion and torso-hip angles) which remain geometrically accurate across camera positions.

---

### Medical & Safety Boundary

Kinetra is a **fitness form observation tool**, not a medical diagnostic device.
- It does not diagnose injuries or musculoskeletal pathologies.
- Form flags are intended strictly for exercise technique feedback.
- If high-severity flags are generated, they represent biomechanical misalignment during exercise performance.

---

## MediaPipe Pose Landmark Adapter (Phase 22)

> **Module path**: `src/engine/pose/adapters/mediapipeAdapter.ts`  
> **Types path**: `src/engine/pose/adapters/types.ts`  
> **Role**: Pure transformation boundary between external MediaPipe/TFLite models and the canonical `PoseFrame` pipeline.

### Target Pipeline

```
External MediaPipe / TFLite Model
               │
               ▼
   adaptMediaPipeSequence()
               │
               ▼
        PoseFrame[]
               │
               ▼
       PoseEngine.analyze()
               │
               ▼
       PoseAnalysisResult
```

### Key Adapter Functions

1. `adaptMediaPipeLandmark(raw, fallbackIndex?, options?)`:
   - Maps 0–32 MediaPipe indices and camelCase names (e.g. `leftShoulder`) to canonical `snake_case` names (e.g. `left_shoulder`).
   - Validates coordinates: requires finite numbers for `x` and `y`.
   - Preserves `z` depth if finite.
   - Preserves `visibility` score (falling back to `presence` if visibility is absent).
   - Degenerate inputs (null, NaN, Infinity) are safely omitted without throwing exceptions.

2. `adaptMediaPipeFrame(rawFrame, options?)`:
   - Converts an array of 33 landmarks, dictionary record, or `{ landmarks, timestamp_ms }` container into a canonical `PoseFrame`.

3. `adaptMediaPipeSequence(rawSequence, options?)`:
   - Converts an array of raw MediaPipe frames into `PoseFrame[]`.
   - Preserves frame order and timestamps strictly.
   - Deterministic and fail-safe.

### Canonical Landmark Mappings (0–32)

| Index | Canonical Name | Index | Canonical Name |
|---|---|---|---|
| 0 | `nose` | 17 | `left_pinky` |
| 1 | `left_eye_inner` | 18 | `right_pinky` |
| 2 | `left_eye` | 19 | `left_index` |
| 3 | `left_eye_outer` | 20 | `right_index` |
| 4 | `right_eye_inner` | 21 | `left_thumb` |
| 5 | `right_eye` | 22 | `right_thumb` |
| 6 | `right_eye_outer` | 23 | `left_hip` |
| 7 | `left_ear` | 24 | `right_hip` |
| 8 | `right_ear` | 25 | `left_knee` |
| 9 | `mouth_left` | 26 | `right_knee` |
| 10 | `mouth_right` | 27 | `left_ankle` |
| 11 | `left_shoulder` | 28 | `right_ankle` |
| 12 | `right_shoulder` | 29 | `left_heel` |
| 13 | `left_elbow` | 30 | `right_heel` |
| 14 | `right_elbow` | 31 | `left_foot_index` |
| 15 | `left_wrist` | 32 | `right_foot_index` |
| 16 | `right_wrist` | | |

### Architectural Boundary

The adapter is strictly an input normalizer:
- **Does NOT** perform rep counting (handled by `PoseEngine` / `ExerciseRepCounter`).
- **Does NOT** perform form analysis (handled by `formAnalyzer`).
- **Does NOT** interact with Supabase or the database.
- **Does NOT** make network or external API calls.
- **Does NOT** interpolate or synthesize missing coordinates.

---

## Real-Frame & Sequence Validation (Phase 23)

### Validation Methodology & Scope Statement

> **Real-World Validation Status**:
> The pose analysis pipeline (`MediaPipe Raw Landmarks` → `adaptMediaPipeSequence()` → `PoseFrame[]` → `PoseEngine.analyze()`) has been validated against **realistic MediaPipe-style landmark fixtures** with geometrically accurate joint angles, realistic movement arcs, occlusion simulations, and temporal noise. Real-camera video pipeline validation remains pending in production client integration.

### Validated Exercise Behaviors

1. **Barbell Squat (`SQUAT_ANALYSIS_CONFIG`)**:
   - Single and multi-rep sequences count 100% accurately without double-counting.
   - Shallow squats (120° depth) correctly record 0 completed reps.
   - Excessive depth (< 60° knee angle) triggers `knee_over_flexion` (severity: `medium`).
   - Acute torso angle (< 45°) triggers `excessive_forward_lean` (severity: `medium`).

2. **Dumbbell Lunges (`LUNGE_ANALYSIS_CONFIG`)**:
   - Accurately tracks hip-knee-ankle joint angles and rep transitions across multiple reps.

3. **Push-Up (`PUSHUP_ANALYSIS_CONFIG`)**:
   - Clean 90° elbow flexion counts completed repetitions accurately.
   - Incomplete recovery (reaches bottom but never pushes up) records 0 reps in stage `INFLECTION`.
   - Sagging plank alignment (< 155°) triggers `body_alignment_deviation` (severity: `high`).
   - Elbow over-flexion (< 60°) triggers `elbow_over_flexion` (severity: `low`).

4. **Dumbbell Bicep Curl (`BICEP_CURL_ANALYSIS_CONFIG`)**:
   - 35° full curl inflection counts reps deterministically.
   - Partial curls (80° depth) record 0 reps.

### Robustness Characteristics

- **Static Sequences**: 30+ identical frames generate 0 false reps and 0 repeated alert spam.
- **Coordinate Noise**: Small landmark jitter (±0.005) is absorbed by the hysteresis threshold without creating false reps.
- **Missing / Low-Visibility Keypoints**: Missing landmarks (visibility < 0.5 or omitted arrays) are safely ignored without throwing exceptions or generating false alerts.
- **Performance**: High throughput — 600 frames (~20 seconds of video @ 30fps) process in under 10ms.



