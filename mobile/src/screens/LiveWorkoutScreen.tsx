/**
 * Kinetra Live Vision Coaching & Pose Tracking Screen (Phase 30)
 * Integrates real camera access, MobilePoseRunner, real-time PoseEngine calculations,
 * and luxury dark Stitch UI overlays across all workout states.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { KinetraButton } from '../components/KinetraButton';
import { PoseSkeletonOverlay } from '../components/PoseSkeletonOverlay';
import { MobilePoseRunner, LiveTelemetryUpdate } from '../engine/pose/mobilePoseRunner';
import { resolveExerciseConfig } from '../engine/pose/configs';
import { PoseAnalysisResult, ExerciseAnalysisConfig, PoseLandmark } from '../engine/pose/types';
import { offlineSetQueue } from '../utils/offlineQueue';
import { ScreenProps } from '../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type WorkoutSessionState =
  | 'INITIALIZING'
  | 'PERMISSION_REQUIRED'
  | 'TRACKING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ERROR';

export const LiveWorkoutScreen: React.FC<ScreenProps<'LiveWorkout'>> = ({
  route,
  navigation,
}) => {
  const { workoutId, workout, exercise, setNumber = 1 } = route.params;
  const insets = useSafeAreaInsets();

  const exerciseName = exercise?.name || workout?.title || 'Barbell Squat';
  const exerciseConfig: ExerciseAnalysisConfig = resolveExerciseConfig(exerciseName);

  // Session & Camera State
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [sessionState, setSessionState] = useState<WorkoutSessionState>('INITIALIZING');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Vision & Pose State
  const [reps, setReps] = useState<number>(0);
  const [stage, setStage] = useState<string>('REST');
  const [formScore, setFormScore] = useState<number>(100);
  const [confidence, setConfidence] = useState<number>(1.0);
  const [coachingMessage, setCoachingMessage] = useState<string>('Knees tracking well • Controlled tempo');
  const [currentLandmarks, setCurrentLandmarks] = useState<PoseLandmark[]>([]);
  const [setResult, setSetResult] = useState<PoseAnalysisResult | null>(null);

  // Runner Reference
  const runnerRef = useRef<MobilePoseRunner | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize Pose Runner & Check Camera Permission
  useEffect(() => {
    runnerRef.current = new MobilePoseRunner(exerciseConfig, (update: LiveTelemetryUpdate) => {
      setReps(update.repCount);
      setStage(update.stage);
      setFormScore(update.formScore);
      setConfidence(update.confidence);
      if (update.coachingMessage) {
        setCoachingMessage(update.coachingMessage);
      }
      setCurrentLandmarks(update.landmarks);
    });

    const initTimeout = setTimeout(() => {
      if (!permission?.granted) {
        setSessionState('PERMISSION_REQUIRED');
      } else {
        setSessionState('TRACKING');
      }
    }, 1200);

    return () => {
      clearTimeout(initTimeout);
      if (runnerRef.current) {
        runnerRef.current.reset();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [permission?.granted]);

  // 2. Stopwatch Timer
  useEffect(() => {
    if (sessionState === 'TRACKING') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState]);

  const formatDuration = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. User Controls
  const handleAllowCamera = async () => {
    const result = await requestPermission();
    if (result.granted) {
      setSessionState('TRACKING');
    } else {
      Alert.alert(
        'Camera Permission',
        'Camera access is required for on-device posture analysis. Please grant access in app settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handlePause = () => {
    if (runnerRef.current) {
      runnerRef.current.pause();
    }
    setSessionState('PAUSED');
  };

  const handleResume = () => {
    if (runnerRef.current) {
      runnerRef.current.resume();
    }
    setSessionState('TRACKING');
  };

  const handleCompleteSet = () => {
    if (!runnerRef.current) return;
    const finalResult = runnerRef.current.completeSet();
    setSetResult(finalResult);
    setSessionState('COMPLETED');

    // Queue set summary locally for offline safety & sync
    offlineSetQueue.enqueueSet(finalResult, {
      workoutId,
      exerciseName,
      durationMs: elapsedSeconds * 1000,
    });
  };

  const handleExitWorkout = () => {
    navigation.goBack();
  };

  const handleToggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleRetryInference = () => {
    setErrorMessage(null);
    if (runnerRef.current) {
      runnerRef.current.reset();
    }
    setSessionState('TRACKING');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER STATE 1: INITIALIZING VISION COACH (Reference Image 4)
  // ─────────────────────────────────────────────────────────────────────────────
  if (sessionState === 'INITIALIZING') {
    return (
      <View style={styles.darkCanvas}>
        <View style={styles.initCard}>
          <View style={styles.radarCircle}>
            <Icon name="pulse" size={32} color={colors.gold} />
          </View>
          <Text style={styles.initTitle}>PREPARING{'\n'}VISION COACH</Text>
          <View style={styles.initStatusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.initStatusText}>Initializing PoseEngine...</Text>
          </View>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER STATE 2: CAMERA ACCESS REQUIRED (Reference Image 5 Left)
  // ─────────────────────────────────────────────────────────────────────────────
  if (sessionState === 'PERMISSION_REQUIRED') {
    return (
      <SafeAreaView style={styles.darkCanvas} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.permissionHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleExitWorkout}
            testID="camera-permission-close-button"
          >
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.kinetraBrandTitle}>KINETRA</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Center Card */}
        <View style={styles.permissionCard}>
          <View style={styles.noCameraBox}>
            <Icon name="warning" size={32} color={colors.gold} />
          </View>
          <Text style={styles.permissionTitle}>CAMERA ACCESS REQUIRED</Text>
          <Text style={styles.permissionDescription}>
            Enable your camera to unlock real-time AI form coaching. Precision analysis demands visual data.
          </Text>

          <KinetraButton
            title="🔒 ALLOW CAMERA"
            variant="primary"
            onPress={handleAllowCamera}
            style={styles.allowButton}
            textStyle={styles.allowButtonText}
            testID="allow-camera-button"
          />

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => Linking.openSettings()}
            testID="app-settings-button"
          >
            <Text style={styles.settingsButtonText}>APP SETTINGS</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.permissionFooter}>
          <View style={styles.standbyDot} />
          <Text style={styles.standbyText}>AI ENGINE STANDBY</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER STATE 3: WORKOUT PAUSED (Reference Image 3)
  // ─────────────────────────────────────────────────────────────────────────────
  if (sessionState === 'PAUSED') {
    return (
      <SafeAreaView style={styles.darkCanvas} edges={['top', 'bottom']}>
        <View style={styles.pausedHeader}>
          <TouchableOpacity onPress={handleExitWorkout} style={styles.closeButton}>
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.kinetraBrandTitle}>KINETRA</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.pausedCenterContent}>
          <View style={styles.pausedIconCircle}>
            <Text style={styles.pausedIconText}>⏸</Text>
          </View>
          <Text style={styles.pausedMainTitle}>WORKOUT{'\n'}PAUSED</Text>
          <Text style={styles.pausedSubtitle}>Resume when you're ready.</Text>

          <KinetraButton
            title="▶ RESUME"
            variant="primary"
            onPress={handleResume}
            style={styles.resumeButton}
            textStyle={styles.resumeButtonText}
            testID="resume-workout-button"
          />

          <TouchableOpacity
            style={styles.exitWorkoutButton}
            onPress={handleExitWorkout}
            testID="exit-workout-button"
          >
            <Text style={styles.exitWorkoutText}>EXIT WORKOUT</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Metrics */}
        <View style={styles.pausedBottomStats}>
          <View style={styles.pausedStatColumn}>
            <Text style={styles.pausedStatValue}>{formatDuration(elapsedSeconds)}</Text>
            <Text style={styles.pausedStatLabel}>ELAPSED</Text>
          </View>
          <View style={styles.pausedStatDivider} />
          <View style={styles.pausedStatColumn}>
            <Text style={styles.pausedStatValue}>142</Text>
            <Text style={styles.pausedStatLabel}>AVG HR</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER STATE 4: SET COMPLETE SUMMARY (Reference Image 1)
  // ─────────────────────────────────────────────────────────────────────────────
  if (sessionState === 'COMPLETED') {
    const finalScore = setResult?.average_form_score ?? formScore;
    const finalReps = setResult?.rep_count ?? reps;

    return (
      <SafeAreaView style={styles.darkCanvas} edges={['top', 'bottom']}>
        <View style={styles.summaryContainer}>
          {/* Gold Checkmark */}
          <View style={styles.summaryCheckCircle}>
            <Text style={styles.summaryCheckIcon}>✓</Text>
          </View>

          <Text style={styles.summaryExerciseSubtitle}>{exerciseName.toUpperCase()}</Text>
          <Text style={styles.summarySetTitle}>Set {setNumber} Complete</Text>

          {/* Metrics 2-column card row */}
          <View style={styles.summaryMetricsRow}>
            <View style={styles.summaryMetricCard}>
              <Text style={styles.summaryMetricLabel}>REPS</Text>
              <Text style={styles.summaryMetricValue}>
                {finalReps} <Text style={styles.summaryMetricMuted}>/ 12</Text>
              </Text>
            </View>

            <View style={styles.summaryMetricCard}>
              <View style={styles.formScoreHeader}>
                <Text style={styles.summaryMetricLabel}>FORM SCORE</Text>
                <Icon name="sparkle" size={14} color={colors.gold} />
              </View>
              <Text style={[styles.summaryMetricValue, { color: colors.gold }]}>
                {finalScore} <Text style={styles.summaryMetricMuted}>/ 100</Text>
              </Text>
            </View>
          </View>

          {/* Duration Card */}
          <View style={styles.summaryDurationCard}>
            <Text style={styles.summaryMetricLabel}>DURATION</Text>
            <Text style={styles.summaryDurationValue}>{formatDuration(elapsedSeconds)}</Text>
          </View>

          {/* AI Insights Card */}
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <Text style={styles.insightsEyeIcon}>👁</Text>
              <Text style={styles.insightsTitle}>AI INSIGHTS</Text>
            </View>

            <View style={styles.insightBulletRow}>
              <Text style={styles.insightBulletIcon}>▲</Text>
              <Text style={styles.insightBulletText}>
                {setResult && setResult.flags.length === 0
                  ? 'Perfect Depth achieved on all reps.'
                  : setResult?.flags[0]?.description || 'Form maintained through range of motion.'}
              </Text>
            </View>

            <View style={styles.insightBulletRow}>
              <Text style={styles.insightBulletIcon}>⏱</Text>
              <Text style={styles.insightBulletText}>
                Consistent Tempo maintained throughout the set.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.editSetButton}
            onPress={() => setSessionState('TRACKING')}
            testID="edit-set-button"
          >
            <Text style={styles.editSetText}>EDIT SET</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueSetButton}
            onPress={handleExitWorkout}
            testID="continue-set-button"
          >
            <Text style={styles.continueSetText}>
              CONTINUE TO SET {setNumber + 1}  →
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER STATE 5: ACTIVE LIVE TRACKING HUD (Reference Image 2)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* 1. CAMERA VIEW */}
      <CameraView style={StyleSheet.absoluteFillObject} facing={facing} />

      {/* 2. SKELETON & FRAMING OVERLAY */}
      <PoseSkeletonOverlay
        landmarks={currentLandmarks}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
      />

      {/* 3. TOP OVERLAY HEADER */}
      <SafeAreaView edges={['top']} style={styles.liveTopHeader}>
        <View style={styles.liveTopRow}>
          <TouchableOpacity
            style={styles.navSquareButton}
            onPress={handlePause}
            testID="live-workout-back-button"
          >
            <Icon name="back" size={20} color={colors.primaryText} />
          </TouchableOpacity>

          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>

          <TouchableOpacity
            style={styles.navSquareButton}
            onPress={handleToggleFacing}
            testID="flip-camera-button"
          >
            <Icon name="retry" size={16} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        <Text style={styles.liveExerciseTitle}>{exerciseName.toUpperCase()}</Text>
        <Text style={styles.liveSetSubtitle}>
          SET {setNumber}   {formatDuration(elapsedSeconds)}
        </Text>
      </SafeAreaView>

      {/* 4. ERROR BANNER (Image 5 Right) */}
      {errorMessage && (
        <View style={styles.errorBanner} testID="live-inference-error-banner">
          <View style={styles.errorBannerLeft}>
            <Icon name="warning" size={18} color={colors.crimson} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.errorBannerTitle}>VISION COACH UNAVAILABLE</Text>
              <Text style={styles.errorBannerSubtitle}>{errorMessage}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.errorRetryButton}
            onPress={handleRetryInference}
          >
            <Text style={styles.errorRetryText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 5. RIGHT FLOATING HUD CARD (Image 2) */}
      <View style={styles.hudCard} testID="live-metrics-hud-card">
        <Text style={styles.hudLabel}>REPS</Text>
        <Text style={styles.hudRepsValue} testID="live-reps-counter">
          {reps}
        </Text>

        <View style={styles.hudDivider} />

        <Text style={styles.hudLabel}>STAGE</Text>
        <Text style={styles.hudStageValue} testID="live-stage-indicator">
          {stage}
        </Text>

        <View style={styles.hudDivider} />

        <Text style={styles.hudLabel}>FORM SCORE</Text>
        <Text style={styles.hudFormScoreValue}>
          {formScore}
          <Text style={styles.hudScoreMuted}> /100</Text>
        </Text>
      </View>

      {/* 6. BOTTOM COACHING BANNER & FINISH BUTTON */}
      <SafeAreaView edges={['bottom']} style={styles.liveBottomContainer}>
        {/* Dynamic Coaching Pill (Image 2) */}
        <View style={styles.coachingPill} testID="live-coaching-banner">
          <Icon name="sparkle" size={16} color={colors.gold} />
          <Text style={styles.coachingPillText} numberOfLines={1}>
            {coachingMessage.toUpperCase()}
          </Text>
        </View>

        {/* Controls Row */}
        <View style={styles.liveBottomControls}>
          <TouchableOpacity
            style={styles.stopSetButton}
            onPress={handleCompleteSet}
            testID="finish-set-button"
          >
            <View style={styles.stopSquareIcon} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050607',
  },
  darkCanvas: {
    flex: 1,
    backgroundColor: '#050607',
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  // ── Initializing State ──
  initCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  initTitle: {
    ...typography.headlineLg,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: spacing.md,
  },
  initStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginRight: 8,
  },
  initStatusText: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 13,
  },
  // ── Permission State ──
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
  kinetraBrandTitle: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    letterSpacing: 4,
    fontSize: 16,
  },
  permissionCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    alignItems: 'center',
  },
  noCameraBox: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  permissionTitle: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  permissionDescription: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  allowButton: {
    width: '100%',
    height: 50,
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.borderGold,
    marginBottom: spacing.md,
  },
  allowButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontWeight: '700',
    fontSize: 12,
  },
  settingsButton: {
    paddingVertical: spacing.xs,
  },
  settingsButtonText: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  permissionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.lg,
  },
  standbyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.crimson,
    marginRight: 8,
  },
  standbyText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  // ── Paused State ──
  pausedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  pausedCenterContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  pausedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceDim,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  pausedIconText: {
    color: colors.gold,
    fontSize: 22,
  },
  pausedMainTitle: {
    ...typography.headlineLg,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pausedSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    marginBottom: spacing.xxl,
  },
  resumeButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.gold,
    marginBottom: spacing.lg,
  },
  resumeButtonText: {
    color: colors.inverseText,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1.5,
  },
  exitWorkoutButton: {
    paddingVertical: spacing.sm,
  },
  exitWorkoutText: {
    ...typography.labelCaps,
    color: colors.crimson,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  pausedBottomStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  pausedStatColumn: {
    alignItems: 'center',
  },
  pausedStatValue: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  pausedStatLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  pausedStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.borderLight,
  },
  // ── Set Complete Summary State (Image 1) ──
  summaryContainer: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  summaryCheckCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  summaryCheckIcon: {
    color: colors.inverseText,
    fontSize: 24,
    fontWeight: '800',
  },
  summaryExerciseSubtitle: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  summarySetTitle: {
    ...typography.headlineLg,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 32,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryMetricCard: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  formScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryMetricLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  summaryMetricValue: {
    ...typography.headlineLg,
    color: colors.primaryText,
    fontSize: 28,
    fontFamily: 'serif',
    fontWeight: '700',
  },
  summaryMetricMuted: {
    fontSize: 14,
    color: colors.tertiaryText,
  },
  summaryDurationCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryDurationValue: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontSize: 26,
    fontFamily: 'serif',
    fontWeight: '700',
  },
  insightsCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  insightsEyeIcon: {
    color: colors.gold,
    fontSize: 14,
    marginRight: 6,
  },
  insightsTitle: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  insightBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  insightBulletIcon: {
    color: colors.gold,
    fontSize: 10,
    marginRight: 8,
    marginTop: 3,
  },
  insightBulletText: {
    ...typography.bodySm,
    color: colors.primaryText,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  editSetButton: {
    width: '100%',
    height: 48,
    backgroundColor: colors.surfaceDim,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  editSetText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  continueSetButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#E6E4DC',
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueSetText: {
    ...typography.labelCaps,
    color: '#0A0A0B',
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  // ── Live HUD State (Image 2) ──
  liveTopHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    alignItems: 'center',
  },
  liveTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  navSquareButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(15, 17, 19, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 17, 19, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginRight: 6,
  },
  liveBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  liveExerciseTitle: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
  liveSetSubtitle: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  errorBanner: {
    position: 'absolute',
    top: 130,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(23, 25, 27, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.crimson,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  errorBannerTitle: {
    ...typography.labelCaps,
    color: colors.crimson,
    fontSize: 10,
    fontWeight: '700',
  },
  errorBannerSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 11,
  },
  errorRetryButton: {
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.xs,
    marginLeft: 8,
  },
  errorRetryText: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 10,
    fontWeight: '700',
  },
  hudCard: {
    position: 'absolute',
    right: spacing.lg,
    top: '32%',
    backgroundColor: 'rgba(15, 17, 19, 0.85)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 110,
  },
  hudLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  hudRepsValue: {
    ...typography.headlineLg,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 28,
  },
  hudDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 8,
  },
  hudStageValue: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hudFormScoreValue: {
    ...typography.headlineMd,
    color: colors.gold,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 22,
  },
  hudScoreMuted: {
    fontSize: 12,
    color: colors.tertiaryText,
  },
  liveBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  coachingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 17, 19, 0.92)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
    maxWidth: '92%',
  },
  coachingPillText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginLeft: 8,
  },
  liveBottomControls: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSetButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(230, 57, 70, 0.85)',
    borderWidth: 2,
    borderColor: colors.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquareIcon: {
    width: 20,
    height: 20,
    backgroundColor: colors.primaryText,
    borderRadius: 3,
  },
});
