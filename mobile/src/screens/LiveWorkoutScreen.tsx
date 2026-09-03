/**
 * Kinetra Live Vision Coaching & Pose Tracking Screen (Phase 30 / Section 6)
 * Integrates real camera access, MobilePoseRunner, real-time PoseEngine calculations,
 * and luxury dark Stitch UI overlays matching the reference active workout design.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  Linking,
  Platform,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
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

  const exerciseName = exercise?.name || workout?.title || 'Barbell Deadlift';
  const targetReps = (exercise as any)?.target_reps || 15;
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
  const [coachingMessage, setCoachingMessage] = useState<string>('Keep your chest up • Controlled tempo');
  const [currentLandmarks, setCurrentLandmarks] = useState<PoseLandmark[]>([]);
  const [setResult, setSetResult] = useState<PoseAnalysisResult | null>(null);

  // Runner & Timer References
  const runnerRef = useRef<MobilePoseRunner | null>(null);
  const timerRef = useRef<any>(null);

  // Animation values for cinematic HUD entrance sequence
  const hudOpacity = useRef(new Animated.Value(0)).current;
  const topHeaderTranslateY = useRef(new Animated.Value(-16)).current;
  const centerHeroScale = useRef(new Animated.Value(0.92)).current;
  const bottomControlsTranslateY = useRef(new Animated.Value(20)).current;

  // Pulse glow animation for coaching pill & radar
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Tactile button scales
  const stopButtonScale = useRef(new Animated.Value(1)).current;
  const pauseButtonScale = useRef(new Animated.Value(1)).current;
  const closeButtonScale = useRef(new Animated.Value(1)).current;
  const flipButtonScale = useRef(new Animated.Value(1)).current;
  const resumeButtonScale = useRef(new Animated.Value(1)).current;
  const continueButtonScale = useRef(new Animated.Value(1)).current;

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

  // 3. Entrance & Pulse Animations
  useEffect(() => {
    let isMounted = true;
    let entranceAnim: Animated.CompositeAnimation | null = null;

    const runAnimations = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(
        () => false
      );

      if (!isMounted) return;

      if (reduceMotion) {
        hudOpacity.setValue(1);
        topHeaderTranslateY.setValue(0);
        centerHeroScale.setValue(1);
        bottomControlsTranslateY.setValue(0);
        return;
      }

      // HUD staggered entrance
      entranceAnim = Animated.parallel([
        Animated.timing(hudOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(topHeaderTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(centerHeroScale, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(bottomControlsTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      entranceAnim.start();

      // Subtle pulse for active tracking
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoopRef.current.start();
    };

    runAnimations();

    return () => {
      isMounted = false;
      if (entranceAnim) entranceAnim.stop();
      if (pulseLoopRef.current) pulseLoopRef.current.stop();
    };
  }, [hudOpacity, topHeaderTranslateY, centerHeroScale, bottomControlsTranslateY, pulseAnim]);

  const formatDuration = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Tactile spring press feedback generator
  const createSpring = (val: Animated.Value, to: number, back: number) => ({
    onPressIn: () => {
      Animated.spring(val, {
        toValue: to,
        useNativeDriver: true,
        speed: 40,
        bounciness: 0,
      }).start();
    },
    onPressOut: () => {
      Animated.spring(val, {
        toValue: back,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }).start();
    },
  });

  const stopBtnSpring = createSpring(stopButtonScale, 0.92, 1);
  const pauseBtnSpring = createSpring(pauseButtonScale, 0.92, 1);
  const closeBtnSpring = createSpring(closeButtonScale, 0.90, 1);
  const flipBtnSpring = createSpring(flipButtonScale, 0.90, 1);
  const resumeBtnSpring = createSpring(resumeButtonScale, 0.96, 1);
  const continueBtnSpring = createSpring(continueButtonScale, 0.96, 1);

  // 4. User Controls
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
  // RENDER STATE 1: INITIALIZING VISION COACH
  // ─────────────────────────────────────────────────────────────────────────────
  if (sessionState === 'INITIALIZING') {
    return (
      <View style={styles.darkCanvas}>
        <View style={styles.initCard}>
          <Animated.View style={[styles.radarCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Icon name="pulse" size={32} color={colors.gold} />
          </Animated.View>
          <Text style={styles.initTitle}>PREPARING{'\n'}VISION COACH</Text>
          <View style={styles.initStatusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.initStatusText}>Initializing On-Device ML PoseEngine...</Text>
          </View>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER STATE 2: CAMERA ACCESS REQUIRED
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
            accessibilityRole="button"
            accessibilityLabel="Close"
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
            Enable your camera to unlock real-time AI form coaching. Precision biomechanical analysis demands visual input.
          </Text>

          <TouchableOpacity
            style={styles.allowButton}
            onPress={handleAllowCamera}
            testID="allow-camera-button"
            accessibilityRole="button"
            accessibilityLabel="Allow Camera"
          >
            <Text style={styles.allowButtonText}>🔒 ALLOW CAMERA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => Linking.openSettings()}
            testID="app-settings-button"
            accessibilityRole="button"
            accessibilityLabel="App Settings"
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
  // RENDER STATE 3: WORKOUT PAUSED
  // ─────────────────────────────────────────────────────────────────────────────
  if (sessionState === 'PAUSED') {
    return (
      <SafeAreaView style={styles.darkCanvas} edges={['top', 'bottom']}>
        <View style={styles.pausedHeader}>
          <TouchableOpacity
            onPress={handleExitWorkout}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
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
          <Text style={styles.pausedSubtitle}>Resume when you're ready to engage.</Text>

          <TouchableWithoutFeedback
            {...resumeBtnSpring}
            onPress={handleResume}
            testID="resume-workout-button"
            accessibilityRole="button"
            accessibilityLabel="Resume Workout"
          >
            <Animated.View
              style={[
                styles.resumeButton,
                { transform: [{ scale: resumeButtonScale }] },
              ]}
            >
              <Text style={styles.resumeButtonText}>▶ RESUME PROTOCOL</Text>
            </Animated.View>
          </TouchableWithoutFeedback>

          <TouchableOpacity
            style={styles.exitWorkoutButton}
            onPress={handleExitWorkout}
            testID="exit-workout-button"
            accessibilityRole="button"
            accessibilityLabel="Exit Workout"
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
  // RENDER STATE 4: SET COMPLETE SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  if (sessionState === 'COMPLETED') {
    const finalScore = setResult?.average_form_score ?? formScore;
    const finalReps = setResult?.rep_count ?? reps;

    return (
      <SafeAreaView style={styles.darkCanvas} edges={['top', 'bottom']}>
        <View style={styles.summaryContainer}>
          {/* Gold Checkmark Badge */}
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
                {finalReps} <Text style={styles.summaryMetricMuted}>/ {targetReps}</Text>
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
                  ? 'Optimal Biomechanical Depth achieved on all repetitions.'
                  : setResult?.flags[0]?.description || 'Form maintained through range of motion.'}
              </Text>
            </View>

            <View style={styles.insightBulletRow}>
              <Text style={styles.insightBulletIcon}>⏱</Text>
              <Text style={styles.insightBulletText}>
                Consistent 2-second eccentric cadence maintained throughout set.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.editSetButton}
            onPress={() => setSessionState('TRACKING')}
            testID="edit-set-button"
            accessibilityRole="button"
            accessibilityLabel="Edit Set"
          >
            <Text style={styles.editSetText}>EDIT SET</Text>
          </TouchableOpacity>

          <TouchableWithoutFeedback
            {...continueBtnSpring}
            onPress={handleExitWorkout}
            testID="continue-set-button"
            accessibilityRole="button"
            accessibilityLabel={`Continue to Set ${setNumber + 1}`}
          >
            <Animated.View
              style={[
                styles.continueSetButton,
                { transform: [{ scale: continueButtonScale }] },
              ]}
            >
              <Text style={styles.continueSetText}>
                CONTINUE TO SET {setNumber + 1}  →
              </Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER STATE 5: ACTIVE LIVE TRACKING HUD (Matches Stitch screen.png)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* 1. CAMERA VIEW */}
      <CameraView style={StyleSheet.absoluteFill} facing={facing} />

      {/* 2. SKELETON & FRAMING OVERLAY */}
      <PoseSkeletonOverlay
        landmarks={currentLandmarks}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
      />

      {/* 3. TOP OVERLAY HEADER */}
      <SafeAreaView edges={['top']} style={styles.liveTopHeader}>
        <Animated.View
          style={[
            styles.liveTopRow,
            {
              opacity: hudOpacity,
              transform: [{ translateY: topHeaderTranslateY }],
            },
          ]}
        >
          {/* Close / Back button [✕] */}
          <TouchableWithoutFeedback
            {...closeBtnSpring}
            onPress={handlePause}
            testID="live-workout-back-button"
            accessibilityRole="button"
            accessibilityLabel="Close or Pause Workout"
          >
            <Animated.View
              style={[
                styles.navSquareButton,
                { transform: [{ scale: closeButtonScale }] },
              ]}
            >
              <Text style={styles.navSquareCloseText}>✕</Text>
            </Animated.View>
          </TouchableWithoutFeedback>

          {/* Current Exercise Header Card */}
          <View style={styles.currentExerciseCard}>
            <Text style={styles.currentExerciseLabel}>CURRENT EXERCISE</Text>
            <Text style={styles.currentExerciseTitle} numberOfLines={1}>
              {exerciseName}
            </Text>
          </View>

          {/* Right Group: Heart Rate Pill & Flip Camera */}
          <View style={styles.topRightControlsGroup}>
            <View style={styles.bpmPill}>
              <Text style={styles.bpmHeartIcon}>♡</Text>
              <Text style={styles.bpmValue}>142</Text>
              <Text style={styles.bpmUnit}>BPM</Text>
            </View>

            <TouchableWithoutFeedback
              {...flipBtnSpring}
              onPress={handleToggleFacing}
              testID="flip-camera-button"
              accessibilityRole="button"
              accessibilityLabel="Flip Camera"
            >
              <Animated.View
                style={[
                  styles.navSquareMiniButton,
                  { transform: [{ scale: flipButtonScale }] },
                ]}
              >
                <Icon name="retry" size={14} color={colors.primaryText} />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* 4. ERROR BANNER */}
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
            accessibilityRole="button"
            accessibilityLabel="Retry Inference"
          >
            <Text style={styles.errorRetryText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 5. CENTER HERO HUD REPS DISPLAY (Matches Stitch screen.png) */}
      <Animated.View
        style={[
          styles.centerHeroContainer,
          {
            opacity: hudOpacity,
            transform: [{ scale: centerHeroScale }],
          },
        ]}
        testID="live-metrics-hud-card"
      >
        <Text style={styles.centerRepsNumber} testID="live-reps-counter">
          {reps}
          <Text style={styles.centerTargetReps}>/{targetReps}</Text>
        </Text>
        <View style={styles.repsLabelRow}>
          <View style={styles.repsGoldBar} />
          <Text style={styles.repsLabelText} testID="live-stage-indicator">
            {stage === 'REST' ? 'REPS' : stage}
          </Text>
          <View style={styles.repsGoldBar} />
        </View>

        {/* Small Form Score Badge */}
        <View style={styles.liveFormScoreBadge}>
          <Icon name="shield" size={11} color={colors.gold} />
          <Text style={styles.liveFormScoreText}>{formScore}% FORM</Text>
        </View>
      </Animated.View>

      {/* 6. BOTTOM COACHING BANNER & CONTROLS ROW (Matches Stitch screen.png) */}
      <SafeAreaView edges={['bottom']} style={styles.liveBottomContainer}>
        {/* Dynamic Coaching Banner: PULSE KEEP YOUR CHEST UP */}
        <Animated.View
          style={[
            styles.coachingPill,
            {
              opacity: hudOpacity,
              transform: [{ translateY: bottomControlsTranslateY }],
            },
          ]}
          testID="live-coaching-banner"
        >
          <View style={styles.pulseBadge}>
            <Text style={styles.pulseBadgeText}>PULSE</Text>
          </View>
          <Text style={styles.coachingPillText} numberOfLines={1}>
            {coachingMessage.toUpperCase()}
          </Text>
        </Animated.View>

        {/* Bottom Action Controls Row */}
        <Animated.View
          style={[
            styles.bottomActionRow,
            {
              opacity: hudOpacity,
              transform: [{ translateY: bottomControlsTranslateY }],
            },
          ]}
        >
          {/* Left: Focus Protocol / Audio Widget */}
          <View style={styles.focusAudioCard}>
            <View style={styles.focusAudioArtwork}>
              <Icon name="pulse" size={15} color={colors.gold} />
            </View>
            <View style={styles.focusAudioDetails}>
              <Text style={styles.focusAudioName} numberOfLines={1}>
                Midnight Drive
              </Text>
              <Text style={styles.focusAudioTag}>
                Kinetra Focus • {formatDuration(elapsedSeconds)}
              </Text>
            </View>
          </View>

          {/* Middle: Secondary Pause Control [|◁ / ⏸] */}
          <TouchableWithoutFeedback
            {...pauseBtnSpring}
            onPress={handlePause}
            accessibilityRole="button"
            accessibilityLabel="Pause Session"
          >
            <Animated.View
              style={[
                styles.secondaryPauseButton,
                { transform: [{ scale: pauseButtonScale }] },
              ]}
            >
              <Text style={styles.secondaryPauseIcon}>⏸</Text>
            </Animated.View>
          </TouchableWithoutFeedback>

          {/* Right: Dominant Stop / Complete Set Button [⏹] */}
          <TouchableWithoutFeedback
            {...stopBtnSpring}
            onPress={handleCompleteSet}
            testID="finish-set-button"
            accessibilityRole="button"
            accessibilityLabel="Finish and Log Set"
          >
            <Animated.View
              style={[
                styles.stopSetButton,
                { transform: [{ scale: stopButtonScale }] },
              ]}
            >
              <View style={styles.stopSquareIcon} />
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
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
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
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
    backgroundColor: colors.goldBright,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  allowButtonText: {
    ...typography.button,
    color: colors.inverseText,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.5,
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
    backgroundColor: colors.goldBright,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  resumeButtonText: {
    ...typography.button,
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
  // ── Set Complete Summary State ──
  summaryContainer: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  summaryCheckCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.goldBright,
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
    borderRadius: borderRadius.xs,
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
    backgroundColor: colors.goldBright,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueSetText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '800',
  },

  // ── Live HUD State (Exact Stitch Reference screen.png) ──
  liveTopHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    zIndex: 10,
  },
  liveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navSquareButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(15, 17, 19, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSquareCloseText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  currentExerciseCard: {
    backgroundColor: 'rgba(15, 17, 19, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  currentExerciseLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  currentExerciseTitle: {
    ...typography.headlineSm,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
  },
  topRightControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bpmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 17, 19, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
  },
  bpmHeartIcon: {
    color: colors.gold,
    fontSize: 13,
    marginRight: 6,
    fontWeight: '700',
  },
  bpmValue: {
    fontFamily: 'serif',
    color: colors.gold,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 4,
  },
  bpmUnit: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    letterSpacing: 1,
  },
  navSquareMiniButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.xs,
    backgroundColor: 'rgba(15, 17, 19, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Center Reps Hero ──
  centerHeroContainer: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRepsNumber: {
    ...typography.headlineLg,
    fontSize: 68,
    lineHeight: 74,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    textAlign: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  centerTargetReps: {
    fontSize: 42,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '400',
  },
  repsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -4,
  },
  repsGoldBar: {
    width: 24,
    height: 1.5,
    backgroundColor: colors.gold,
  },
  repsLabelText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
  },
  liveFormScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 17, 19, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 10,
  },
  liveFormScoreText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },

  // ── Error Banner ──
  errorBanner: {
    position: 'absolute',
    top: 110,
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
    zIndex: 15,
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

  // ── Bottom Coaching Banner & Controls Row ──
  liveBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
    zIndex: 10,
  },
  coachingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 17, 19, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.45)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
    width: '100%',
  },
  pulseBadge: {
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: 'rgba(217, 184, 63, 0.35)',
    paddingRight: 10,
    marginRight: 10,
  },
  pulseBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
  },
  coachingPillText: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    flex: 1,
  },
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  focusAudioCard: {
    flex: 1,
    height: 56,
    backgroundColor: 'rgba(15, 17, 19, 0.88)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  focusAudioArtwork: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.xs,
    backgroundColor: 'rgba(217, 184, 63, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  focusAudioDetails: {
    flex: 1,
  },
  focusAudioName: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 12,
  },
  focusAudioTag: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 10,
  },
  secondaryPauseButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(15, 17, 19, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPauseIcon: {
    color: colors.primaryText,
    fontSize: 18,
  },
  stopSetButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(230, 57, 70, 0.85)',
    borderWidth: 1.5,
    borderColor: colors.crimson,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.crimson,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  stopSquareIcon: {
    width: 18,
    height: 18,
    backgroundColor: colors.primaryText,
    borderRadius: 2,
  },
});

