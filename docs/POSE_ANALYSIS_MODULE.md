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

## MediaPipe Integration (Phase 19C — not yet implemented)

The `PoseLandmark` interface is structurally compatible with MediaPipe `NormalizedLandmark`. The only adapter needed is an index→name mapping:

```typescript
// Future: src/engine/pose/adapters/mediapipe.adapter.ts
const MEDIAPIPE_NAMES: Record<number, string> = {
  23: 'left_hip', 24: 'right_hip',
  25: 'left_knee', 26: 'right_knee',
  27: 'left_ankle', 28: 'right_ankle',
  // ...
};

function mediapipeToFrame(raw: NormalizedLandmarkList): PoseFrame {
  return {
    landmarks: raw.map((lm, i) => ({
      name: MEDIAPIPE_NAMES[i] ?? `landmark_${i}`,
      x: lm.x, y: lm.y, z: lm.z,
      visibility: lm.visibility,
    })).filter(lm => lm.name in MEDIAPIPE_NAMES),
  };
}
```

`PoseEngine` and `PoseAnalysisService` do not change when this adapter is added.

---

## Phase 20 — Form Analysis (Next)

`PoseAnalysisResult.flags: FormFlag[]` is already in the output contract but always empty in Phase 19. Phase 20 populates it by evaluating deterministic `FormRule[]` against each frame's angles.

Example future form rules (not yet implemented):
```typescript
{ flag: 'knee_valgus',   severity: 'medium', ... }
{ flag: 'forward_lean',  severity: 'low',    ... }
{ flag: 'hip_drop',      severity: 'high',   ... }
```

No interface changes are needed in Phase 20 — the contract is already defined.
