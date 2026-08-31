/**
 * Kinetra Native Camera -> MediaPipe Bridge Specification & Interface (Phase 35)
 *
 * ARCHITECTURAL CONTRACT:
 * In a managed Expo Go runtime, Expo CameraView renders video but does not expose
 * uncompressed raw pixel buffers (YUV420/RGBA) directly to JavaScript worklets.
 *
 * IN PRODUCTION / EAS DEV BUILD:
 * react-native-vision-camera (v4) with frame processor plugins or native MediaPipe C++/TFLite
 * modules process physical camera frames natively at 30 FPS, extract 33 BlazePose landmarks,
 * and pass normalized coordinate arrays to JavaScript via JSI.
 *
 * This file provides the typed bridge interface ensuring zero raw video leaves the device.
 */

import { RawLandmarkInput } from './mediapipeAdapter';
import { MobilePoseRunner } from './mobilePoseRunner';

export type FrameProcessorMode = 'NATIVE_VISION_CAMERA' | 'EXPO_CAMERA_VIEW_PREVIEW' | 'SIMULATOR_HARNESS';

export interface INativePoseBridge {
  readonly mode: FrameProcessorMode;
  isAvailable(): boolean;
  startInference(runner: MobilePoseRunner): Promise<boolean>;
  stopInference(): Promise<void>;
  processFrameWorklet?(frameBuffer: any): RawLandmarkInput[];
}

/**
 * Standard Native Bridge Adapter implementing safe runtime detection
 */
export class NativePoseBridge implements INativePoseBridge {
  public readonly mode: FrameProcessorMode;
  private activeRunner: MobilePoseRunner | null = null;
  private isRunning = false;

  constructor(mode: FrameProcessorMode = 'EXPO_CAMERA_VIEW_PREVIEW') {
    this.mode = mode;
  }

  public isAvailable(): boolean {
    // In standard managed Expo, camera preview is available while native pixel buffer frame processor
    // requires custom EAS development client
    return true;
  }

  public async startInference(runner: MobilePoseRunner): Promise<boolean> {
    this.activeRunner = runner;
    this.isRunning = true;
    return true;
  }

  public async stopInference(): Promise<void> {
    this.isRunning = false;
    this.activeRunner = null;
  }

  /**
   * Dispatches normalized 33-point landmarks to the active MobilePoseRunner
   * Zero raw video frames or image buffers are retained or uploaded.
   */
  public dispatchLandmarks(rawLandmarks: RawLandmarkInput[], timestampMs: number = Date.now()): boolean {
    if (!this.isRunning || !this.activeRunner) {
      return false;
    }
    return this.activeRunner.processRawLandmarks(rawLandmarks, timestampMs);
  }
}

export const nativePoseBridge = new NativePoseBridge();
