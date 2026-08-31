# Kinetra Mobile Pose & Live Vision Integration Architecture

## Phase 30 — Live Vision Coaching & Pose Tracking Interface

### 1. Selected Pose Model & Runtime Architecture

- **Canonical Model Topology**: MediaPipe 33-Keypoint Pose Landmarker / BlazePose standard.
- **Framework & Runtime**: Expo SDK 51 with React Native 0.74 (Managed Workflow with Camera permissions & plugin integration).
- **Core Pipeline**:
  ```
  Camera Feed (expo-camera CameraView)
  → Live Frame Ingestion (MobilePoseRunner)
  → Standard 33-Point MediaPipe Landmark Adapter (mediapipeAdapter.ts)
  → Canonical PoseFrame Keypoint Geometry (geometry.ts)
  → Joint Angle Vector Calculations (calculateJointAngle)
  → Biomechanical Repetition State Machine (ExerciseRepCounter)
  → Form Deviation Constraint Analyzer (formAnalyzer.ts)
  → Real-Time Telemetry HUD & Overlay (LiveWorkoutScreen.tsx)
  → Set Summary Local Persistence / Offline Queue (offlineQueue.ts)
  → POST /api/v1/pose-analysis Set Summary Sync
  ```

---

### 2. Camera & Frame Drop Policy

To guarantee responsive 60 FPS UI performance and avoid memory buildup:
- **Drop-If-Busy Policy**: If the analyzer is actively processing frame $T_i$, incoming frame $T_{i+1}$ is dropped immediately without queueing.
- **Monotonic Timestamp Enforcement**: Frames arriving out of chronological order ($T_{new} \le T_{last}$) are rejected.
- **Zero Unbounded Queues**: Only the latest active frame is processed; previous raw frames are released immediately.
- **Lifecycle Teardown**: Frame processing stops instantly when the workout is paused, completed, or screen is unmounted.

---

### 3. Biomechanical Repetition & Form Analysis

- **Repetition State Machine (`ExerciseRepCounter`)**:
  - `REST` → `TRANSITION` → `INFLECTION` → `RECOVERY` → `REST` (+1 Rep).
  - Hysteresis margin prevents jitter from generating false counts.
  - Zero simulated/timer-based reps: standing still produces exactly 0 reps.
- **Supported Exercise Specifications (`configs.ts`)**:
  - **Barbell Squat**: Left/right knee flexion angles (`left_knee_angle`), parallel depth inflection ($90^\circ$), forward lean monitoring (`excessive_forward_lean`).
  - **Dumbbell Lunges**: Front knee flexion, midfoot alignment monitoring.
  - **Push-Up**: Elbow flexion ($90^\circ$), torso plank sag detection (`body_alignment_deviation`).
  - **Dumbbell Bicep Curl**: Full extension and contraction ($35^\circ \leftrightarrow 160^\circ$).

---

### 4. UI States & Stitch Design Fidelity

1. **Preparing Vision Coach**: Glowing radar circle reticle, initialization state.
2. **Camera Access Required**: Luxury dark modal with gold lock button, settings deep-link, standby indicator.
3. **Live Tracking HUD**: Full camera feed, gold joint and limb stick-figure overlay (`PoseSkeletonOverlay.tsx`), floating HUD card (Reps, Stage, Form Score), bottom coaching banner (`💡 Keep your chest up`).
4. **Workout Paused**: Gold pause indicator, resume CTA, exit confirmation, elapsed metrics.
5. **Set Complete Summary**: Gold checkmark badge, Reps (12/12), Form Score (94/100) with sparkles, Duration, AI Insights bulleted feedback, `Continue to Set 2 →` CTA.
6. **Vision Coach Unavailable Error Banner**: Non-blocking warning banner with retry action while maintaining camera view.

---

### 5. Security & Privacy Boundary

- **On-Device Exclusivity**: Raw camera frames, pixel buffers, and continuous landmark streams are strictly kept on-device and never uploaded over the network.
- **No Video Upload**: Backend receives only the final aggregate set summary DTO (`reps`, `form_score`, `rep_scores`, `flags`, `duration_ms`).
- **No Secret Leaks**: Client code audited against `SUPABASE_SERVICE_ROLE_KEY`.

---

### 6. Validation & Physical Hardware Status

- **Automated Verification**: **60 / 60 Mobile Tests PASS**, **294 / 294 Root Backend Tests PASS**, **TypeScript 0 Errors**, **Expo Bundling Clean**.
- **Real Device ML Validation**: **PENDING** (Awaiting physical iOS/Android device field testing with camera sensor).
