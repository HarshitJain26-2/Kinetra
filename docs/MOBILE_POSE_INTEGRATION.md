# Kinetra — Mobile Real On-Device Pose Integration Guide (Phase 25)

> **Document Type**: Architecture & Integration Specification for Mobile Engineers  
> **Target Platforms**: React Native / Flutter / iOS (Swift) / Android (Kotlin)  
> **Status**: **BACKEND & ENGINE READY** — Real on-device camera ML validation pending mobile client build.

---

## 1. Executive Summary & Architectural Separation

Kinetra enforces a strict separation between on-device ML vision processing and backend data persistence:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MOBILE DEVICE LAYER                           │
│                                                                         │
│  [Camera Preview (30 FPS)]                                              │
│             │                                                           │
│             ▼                                                           │
│  [Pretrained Pose Landmarker (MediaPipe / TFLite)]                      │
│             │                                                           │
│             ▼ (33 normalized landmarks: x, y, z, visibility)            │
│  [MediaPipe Adapter (mediapipeAdapter.ts)]                              │
│             │                                                           │
│             ▼ (Canonical PoseFrame[])                                   │
│  [Kinetra PoseEngine (PoseEngine.ts + formAnalyzer.ts)]                 │
│             │                                                           │
│             ├──► [Live Mobile UI: Reps, Current Angle, Form Alerts]     │
│             │                                                           │
│             ▼ (On Set Completion)                                       │
│  [API Mapper (apiMapper.ts)]                                            │
│             │                                                           │
│             ▼ (Single HTTP POST per completed set)                      │
└─────────────┬───────────────────────────────────────────────────────────┘
              │ HTTPS (Bearer <JWT>)
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          KINETRA BACKEND LAYER                          │
│                                                                         │
│  POST /api/v1/pose-analysis                                             │
│             │                                                           │
│             ▼                                                           │
│  [PoseAnalysisService] ──► [session_exercises table]                    │
│             │                                                           │
│             ▼                                                           │
│  [Auto-Injury Detection] ──► [injury_flags table]                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Principles:
1. **Zero Video Upload**: Video frames NEVER leave the user's mobile device.
2. **Zero Backend ML Overhead**: The Node/Express server does not execute TensorFlow or MediaPipe models.
3. **One Request Per Completed Set**: The mobile client tracks reps locally and fires a single summary payload to `POST /api/v1/pose-analysis` when the user finishes a set.
4. **Deterministic Calculation**: The same movement landmarks produce identical rep counts and form evaluations across all platforms.

---

## 2. Required On-Device Pose Model

### Supported Pretrained Solutions
- **Google MediaPipe Pose Landmarker** (`pose_landmarker_lite.task` or `pose_landmarker_full.task`)
- **TFLite MoveNet (SinglePose.Thunder / Lightning)**
- **Apple Vision Framework** (mapped to 33-point keypoints)

### Model Requirements:
- Real-time performance ($\ge 20\text{ FPS}$) on mid-range devices ($< 40\text{ ms}$ inference time).
- Outputs 33 normalized landmark coordinates: $x, y \in [0.0, 1.0]$ (origin $(0,0)$ at top-left of camera frame).
- Provides estimated depth $z$ relative to hip midpoint.
- Provides confidence / visibility score $\in [0.0, 1.0]$.

---

## 3. 33-Point Landmark Topology & Canonical Mapping

The mobile client feeds raw detector outputs into `adaptMediaPipeFrame()` or `adaptMediaPipeSequence()` from `src/engine/pose/adapters/mediapipeAdapter.ts`:

| Index | MediaPipe Keypoint | Canonical Name | Core Usage |
|---|---|---|---|
| 0 | `nose` | `nose` | Head orientation |
| 11 | `left_shoulder` | `left_shoulder` | Push-ups, torso angle, curls |
| 12 | `right_shoulder` | `right_shoulder` | Push-ups, torso angle |
| 13 | `left_elbow` | `left_elbow` | Push-ups, bicep curls |
| 14 | `right_elbow` | `right_elbow` | Push-ups, bicep curls |
| 15 | `left_wrist` | `left_wrist` | Push-ups, bicep curls |
| 16 | `right_wrist` | `right_wrist` | Push-ups, bicep curls |
| 23 | `left_hip` | `left_hip` | Squats, lunges, plank alignment |
| 24 | `right_hip` | `right_hip` | Squats, lunges, plank alignment |
| 25 | `left_knee` | `left_knee` | Squats, lunges |
| 26 | `right_knee` | `right_knee` | Squats, lunges |
| 27 | `left_ankle` | `left_ankle` | Squats, lunges, push-up plank |
| 28 | `right_ankle` | `right_ankle` | Squats, lunges, push-up plank |

---

## 4. Camera → Inference → Analysis Pipeline

### Step 1: Camera Frame Throttling
Do not queue every 60 FPS camera frame if model inference takes 30ms.
- **Drop-frame policy**: If model inference is currently busy, drop incoming frames to preserve real-time responsiveness and avoid memory growth.
- **Timestamping**: Always preserve the camera frame's actual timestamp (`timestamp_ms: performance.now()`).

### Step 2: Frame Adaptation
```typescript
import { adaptMediaPipeFrame } from './engine/pose/adapters/mediapipeAdapter.js';

// Inside camera frame callback:
const rawLandmarks = await poseModel.detect(cameraFrame);
const poseFrame = adaptMediaPipeFrame({
  landmarks: rawLandmarks,
  timestamp_ms: cameraFrame.timestamp,
});
```

### Step 3: Real-Time Stateful Pose Engine Update
```typescript
import { PoseEngine } from './engine/pose/PoseEngine.js';
import { SQUAT_ANALYSIS_CONFIG } from './engine/pose/configs.js';

// Maintain frame buffer for the active set:
const setFrames: PoseFrame[] = [];
setFrames.push(poseFrame);

// Compute current set state:
const liveResult = PoseEngine.analyze(SQUAT_ANALYSIS_CONFIG, setFrames);

// Update UI in real-time:
ui.updateRepCount(liveResult.rep_count);
ui.updateCurrentAngle(liveResult.angles['left_knee_angle']);
ui.updateFormScore(liveResult.average_form_score);
if (liveResult.flags.length > 0) {
  ui.showCoachingWarning(liveResult.flags[liveResult.flags.length - 1].description);
}
```

### Step 4: Set Completion & API Submission
When the user taps "Finish Set" or set timer expires:
```typescript
import { mapPoseResultToApiPayload } from './engine/pose/apiMapper.js';
import { apiRequest } from './services/apiClient.js';

const apiPayload = mapPoseResultToApiPayload(liveResult, {
  session_id: currentSessionId,
  exercise_id: currentExerciseId,
  set_number: currentSetNumber,
  weight_kg: selectedWeightKg,
  duration_sec: elapsedSeconds,
});

// Submit single completed set summary:
const response = await apiRequest('/pose-analysis', {
  method: 'POST',
  body: JSON.stringify(apiPayload),
});
```

---

## 5. API Payload Contract

### Endpoint: `POST /api/v1/pose-analysis`
```http
POST /api/v1/pose-analysis HTTP/1.1
Host: api.kinetra.app
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "session_id": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
  "exercise_id": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
  "set_number": 1,
  "reps": 12,
  "weight_kg": 75.0,
  "duration_sec": 45,
  "form_score": 92,
  "injury_flag": false,
  "flagged_body_parts": [],
  "rep_scores": [90, 92, 95, 91, 93, 92, 90, 94, 93, 92, 91, 91],
  "notes": "Good set on Barbell Squat. Consistent depth and biomechanics."
}
```

### Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "session_exercise_id": "55555555-9c0b-4ef8-bb6d-6bb9bd380a55",
    "form_score": 92,
    "injury_flag": false,
    "feedback": "Outstanding form on Barbell Squat! Consistent depth and biomechanics.",
    "flagged_body_parts": [],
    "injury_flag_id": null
  }
}
```

---

## 6. Offline & Network Failure Resilience

- **Local Workout Continuity**: If the device loses internet connection during exercise, the pose tracker and rep counter must continue running uninterrupted.
- **Local Cache**: Cache the completed `apiPayload` in local device storage (AsyncStorage / SQLite / MMKV).
- **Background Sync**: When network connectivity is restored, replay pending set submissions to `POST /api/v1/pose-analysis`.

---

## 7. Status & Validation Summary

| Layer | Status | Validation Method |
|---|---|---|
| **Pose Geometry & Angles** | `IMPLEMENTED` | Automated unit tests (100% pass) |
| **Exercise Rep Counter State Machine** | `IMPLEMENTED` | Automated unit tests (100% pass) |
| **Form Violation Analysis** | `IMPLEMENTED` | Automated unit tests (100% pass) |
| **MediaPipe 33-Point Adapter** | `IMPLEMENTED` | Automated unit tests (100% pass) |
| **API Boundary & DTO Mapper** | `IMPLEMENTED` | Automated integration tests (100% pass) |
| **Real Camera Stream Ingestion** | `REQUIRES REAL DEVICE VALIDATION` | To be executed by Mobile Team on physical iOS/Android devices |
| **On-Device Model Inference Cadence** | `REQUIRES REAL DEVICE VALIDATION` | Device FPS & thermal benchmark pending client build |
