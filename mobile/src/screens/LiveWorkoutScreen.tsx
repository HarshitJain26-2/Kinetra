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
  ScrollView,
  ImageBackground,
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
import { images } from '../assets';

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

  // Dedicated Set Complete Entrance Animations
  const summaryBgOpacity = useRef(new Animated.Value(0)).current;
  const summaryCheckScale = useRef(new Animated.Value(0.7)).current;
  const summaryCheckOpacity = useRef(new Animated.Value(0)).current;
  const summaryTitleTranslateY = useRef(new Animated.Value(14)).current;
  const summaryTitleOpacity = useRef(new Animated.Value(0)).current;
  const summaryMetricsTranslateY = useRef(new Animated.Value(14)).current;
  const summaryMetricsOpacity = useRef(new Animated.Value(0)).current;
  const summaryInsightsTranslateY = useRef(new Animated.Value(14)).current;
  const summaryInsightsOpacity = useRef(new Animated.Value(0)).current;
  const summaryCtaTranslateY = useRef(new Animated.Value(14)).current;
  const summaryCtaOpacity = useRef(new Animated.Value(0)).current;
  const summaryPulseAnim = useRef(new Animated.Value(1)).current;

  // Tactile button scales
  const stopButtonScale = useRef(new Animated.Value(1)).current;
  const pauseButtonScale = useRef(new Animated.Value(1)).current;
  const closeButtonScale = useRef(new Animated.Value(1)).current;
  const flipButtonScale = useRef(new Animated.Value(1)).current;
  const resumeButtonScale = useRef(new Animated.Value(1)).current;
  const continueButtonScale = useRef(new Animated.Value(1)).current;
  const editButtonScale = useRef(new Animated.Value(1)).current;

  // Live telemetry micro-interaction animations
  const repScaleAnim = useRef(new Animated.Value(1)).current;
  const coachingFadeAnim = useRef(new Animated.Value(1)).current;

  // Dedicated Initializing Screen Animations
  const initBgOpacity = useRef(new Animated.Value(0)).current;
  const initBrandingOpacity = useRef(new Animated.Value(0)).current;
  const initBrandingTranslateY = useRef(new Animated.Value(12)).current;
  const initRadarOpacity = useRef(new Animated.Value(0)).current;
  const initRadarScale = useRef(new Animated.Value(0.92)).current;
  const initStatusOpacity = useRef(new Animated.Value(0)).current;
  const initStatusTranslateY = useRef(new Animated.Value(10)).current;
  const initTechRowOpacity = useRef(new Animated.Value(0)).current;
  const initPulseAnim = useRef(new Animated.Value(1)).current;

  // Dedicated Error / Connection Interrupted Animations
  const errorBgOpacity = useRef(new Animated.Value(0)).current;
  const errorCardOpacity = useRef(new Animated.Value(0)).current;
  const errorCardScale = useRef(new Animated.Value(0.96)).current;
  const errorTextOpacity = useRef(new Animated.Value(0)).current;
  const errorTextTranslateY = useRef(new Animated.Value(10)).current;
  const errorCtaOpacity = useRef(new Animated.Value(0)).current;
  const errorCtaTranslateY = useRef(new Animated.Value(12)).current;
  const errorPulseAnim = useRef(new Animated.Value(1)).current;
  const retryButtonScale = useRef(new Animated.Value(1)).current;



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

  // 3a. Initializing Vision Coach Entrance Sequence
  useEffect(() => {
    let isMounted = true;
    let entranceAnim: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;

    const runInitEntrance = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (!isMounted) return;

      if (reduceMotion) {
        initBgOpacity.setValue(1);
        initBrandingOpacity.setValue(1);
        initBrandingTranslateY.setValue(0);
        initRadarOpacity.setValue(1);
        initRadarScale.setValue(1);
        initStatusOpacity.setValue(1);
        initStatusTranslateY.setValue(0);
        initTechRowOpacity.setValue(1);
        return;
      }

      entranceAnim = Animated.stagger(70, [
        Animated.timing(initBgOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(initBrandingOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(initBrandingTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(initRadarOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(initRadarScale, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(initStatusOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(initStatusTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(initTechRowOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      entranceAnim.start();

      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(initPulseAnim, {
            toValue: 1.06,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(initPulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    };

    runInitEntrance();

    return () => {
      isMounted = false;
      if (entranceAnim) entranceAnim.stop();
      if (pulseLoop) pulseLoop.stop();
    };
  }, []);

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
  const editBtnSpring = createSpring(editButtonScale, 0.95, 1);
  const retryBtnSpring = createSpring(retryButtonScale, 0.94, 1);

  // Live rep count pop animation
  useEffect(() => {
    if (reps > 0) {
      Animated.sequence([
        Animated.timing(repScaleAnim, {
          toValue: 1.10,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(repScaleAnim, {
          toValue: 1,
          duration: 160,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [reps]);

  // Live coaching message transition
  useEffect(() => {
    Animated.sequence([
      Animated.timing(coachingFadeAnim, {
        toValue: 0.25,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(coachingFadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [coachingMessage]);

  // 3b. Dedicated Error / Connection Interrupted Entrance Sequence
  useEffect(() => {
    if (sessionState !== 'ERROR' && !errorMessage) return;

    let isMounted = true;
    let entranceAnim: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;

    const runErrorEntrance = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (!isMounted) return;

      if (reduceMotion) {
        errorBgOpacity.setValue(1);
        errorCardOpacity.setValue(1);
        errorCardScale.setValue(1);
        errorTextOpacity.setValue(1);
        errorTextTranslateY.setValue(0);
        errorCtaOpacity.setValue(1);
        errorCtaTranslateY.setValue(0);
        return;
      }

      entranceAnim = Animated.stagger(60, [
        // Phase 1: Background
        Animated.timing(errorBgOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Phase 2: Error icon/card
        Animated.parallel([
          Animated.timing(errorCardOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(errorCardScale, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.back(1.1)),
            useNativeDriver: true,
          }),
        ]),
        // Phase 3: Heading/message
        Animated.parallel([
          Animated.timing(errorTextOpacity, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(errorTextTranslateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Retry CTA
        Animated.parallel([
          Animated.timing(errorCtaOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(errorCtaTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      entranceAnim.start();

      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(errorPulseAnim, {
            toValue: 1.08,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(errorPulseAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    };

    runErrorEntrance();

    return () => {
      isMounted = false;
      if (entranceAnim) entranceAnim.stop();
      if (pulseLoop) pulseLoop.stop();
    };
  }, [sessionState, errorMessage]);

  // 4. Dedicated Set Complete Entrance Sequence
  useEffect(() => {
    if (sessionState !== 'COMPLETED') return;


    let isMounted = true;
    let entranceAnim: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;

    const runSummarySequence = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(
        () => false
      );

      if (!isMounted) return;

      if (reduceMotion) {
        summaryBgOpacity.setValue(1);
        summaryCheckScale.setValue(1);
        summaryCheckOpacity.setValue(1);
        summaryTitleTranslateY.setValue(0);
        summaryTitleOpacity.setValue(1);
        summaryMetricsTranslateY.setValue(0);
        summaryMetricsOpacity.setValue(1);
        summaryInsightsTranslateY.setValue(0);
        summaryInsightsOpacity.setValue(1);
        summaryCtaTranslateY.setValue(0);
        summaryCtaOpacity.setValue(1);
        return;
      }

      entranceAnim = Animated.stagger(80, [
        // Phase 1: Background Scrim
        Animated.timing(summaryBgOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Phase 2: Gold Completion Indicator
        Animated.parallel([
          Animated.timing(summaryCheckOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(summaryCheckScale, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
        ]),
        // Phase 3: Title & Context
        Animated.parallel([
          Animated.timing(summaryTitleOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(summaryTitleTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Primary & Secondary Metrics
        Animated.parallel([
          Animated.timing(summaryMetricsOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(summaryMetricsTranslateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 5: AI Insights Card
        Animated.parallel([
          Animated.timing(summaryInsightsOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(summaryInsightsTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 6: Actions CTA Block
        Animated.parallel([
          Animated.timing(summaryCtaOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(summaryCtaTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      entranceAnim.start();

      // Subtle breathing pulse on the gold completion badge
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(summaryPulseAnim, {
            toValue: 1.05,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(summaryPulseAnim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    };

    runSummarySequence();

    return () => {
      isMounted = false;
      if (entranceAnim) entranceAnim.stop();
      if (pulseLoop) pulseLoop.stop();
    };
  }, [sessionState]);

  // 5. User Controls
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
  // RENDER STATE 1: INITIALIZING VISION COACH (Stitch Laboratory Loading)
  // ─────────────────────────────────────────────────────────────────────────────
  if (sessionState === 'INITIALIZING') {
    return (
      <View style={styles.initRoot}>
        {/* Background Atmosphere */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: initBgOpacity }]}>
          <ImageBackground
            source={images.gymBarbell}
            style={StyleSheet.absoluteFillObject}
            imageStyle={styles.initBgImageStyle}
          >
            <View style={styles.initBackdropOverlay} />
          </ImageBackground>
        </Animated.View>

        <SafeAreaView style={styles.initSafeContainer} edges={['top', 'bottom']}>
          {/* Top Branding Block */}
          <Animated.View
            style={[
              styles.initBrandingBlock,
              {
                opacity: initBrandingOpacity,
                transform: [{ translateY: initBrandingTranslateY }],
              },
            ]}
          >
            <Text style={styles.initBrandTitle}>KINETRA</Text>
            <View style={styles.initBrandEyebrowRow}>
              <View style={styles.initBrandDot} />
              <Text style={styles.initBrandSubtitle}>VISION COACH PROTOCOL</Text>
            </View>
          </Animated.View>

          {/* Central AI Radar Visual */}
          <Animated.View
            style={[
              styles.initCentralArea,
              {
                opacity: initRadarOpacity,
                transform: [
                  { scale: initRadarScale },
                  { scale: initPulseAnim },
                ],
              },
            ]}
          >
            <View style={styles.initRadarOuterRing}>
              <View style={styles.initRadarMiddleRing}>
                <View style={styles.initRadarCore}>
                  <Icon name="pulse" size={30} color={colors.gold} />
                </View>
              </View>
              {/* Technical Corner Markers */}
              <View style={[styles.radarMarker, styles.markerTL]} />
              <View style={[styles.radarMarker, styles.markerTR]} />
              <View style={[styles.radarMarker, styles.markerBL]} />
              <View style={[styles.radarMarker, styles.markerBR]} />
            </View>
          </Animated.View>

          {/* Primary Status & Heading */}
          <Animated.View
            style={[
              styles.initStatusBlock,
              {
                opacity: initStatusOpacity,
                transform: [{ translateY: initStatusTranslateY }],
              },
            ]}
          >
            <Text style={styles.initMainHeading}>PREPARING{'\n'}VISION COACH</Text>
            <Text style={styles.initSubCopy}>
              INITIALIZING ON-DEVICE PERFORMANCE ANALYSIS
            </Text>
          </Animated.View>

          {/* Technical Subsystems Status Grid */}
          <Animated.View
            style={[
              styles.initTechStatusGrid,
              { opacity: initTechRowOpacity },
            ]}
          >
            <View style={styles.techStatusCard}>
              <View style={styles.techStatusDotActive} />
              <Text style={styles.techStatusLabel}>VISION ENGINE</Text>
              <Text style={styles.techStatusValue}>STARTING</Text>
            </View>
            <View style={styles.techStatusCard}>
              <View style={styles.techStatusDotPending} />
              <Text style={styles.techStatusLabel}>CAMERA FEED</Text>
              <Text style={styles.techStatusValue}>CALIBRATING</Text>
            </View>
            <View style={styles.techStatusCard}>
              <View style={styles.techStatusDotPending} />
              <Text style={styles.techStatusLabel}>BIOMECHANICS</Text>
              <Text style={styles.techStatusValue}>STANDBY</Text>
            </View>
          </Animated.View>

          {/* Live System Standby Indicator */}
          <View style={styles.initBottomSignalRow}>
            <View style={styles.initSignalDot} />
            <Text style={styles.initSignalText}>SYSTEM INITIALIZING • ON-DEVICE LOCAL ML</Text>
          </View>
        </SafeAreaView>
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
  // RENDER STATE 4: SET COMPLETE SUMMARY (Stitch Luxury Result Screen)
  // ─────────────────────────────────────────────────────────────────────────────
  if (sessionState === 'COMPLETED') {
    const finalScore = setResult?.average_form_score ?? formScore;
    const finalReps = setResult?.rep_count ?? reps;

    return (
      <View style={styles.summaryRoot}>
        {/* Background Canvas with subtle athletic asset & dark scrim */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: summaryBgOpacity }]}>
          <ImageBackground
            source={images.gymBarbell}
            style={styles.summaryBackgroundImage}
            imageStyle={styles.summaryBgImageStyle}
          >
            <View style={styles.summaryBackdropOverlay} />
          </ImageBackground>
        </Animated.View>

        <SafeAreaView style={styles.summarySafeContainer} edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={styles.summaryScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Status & Exercise Context */}
            <Animated.View
              style={[
                styles.summaryHeaderBlock,
                {
                  opacity: summaryTitleOpacity,
                  transform: [{ translateY: summaryTitleTranslateY }],
                },
              ]}
            >
              <Text style={styles.summaryStatusEyebrow}>
                SET {setNumber} PROTOCOL COMPLETE
              </Text>
              <Text style={styles.summarySetTitle}>{exerciseName}</Text>
            </Animated.View>

            {/* Gold Geometric Completion Indicator with dual ring & subtle idle pulse */}
            <Animated.View
              style={[
                styles.summaryCheckWrapper,
                {
                  opacity: summaryCheckOpacity,
                  transform: [
                    { scale: summaryCheckScale },
                    { scale: summaryPulseAnim },
                  ],
                },
              ]}
            >
              <View style={styles.summaryCheckOuterRing}>
                <View style={styles.summaryCheckCircle}>
                  <Text style={styles.summaryCheckIcon}>✓</Text>
                </View>
              </View>
            </Animated.View>

            {/* 2-Column Primary Metrics Grid (REPS & FORM SCORE) */}
            <Animated.View
              style={[
                styles.summaryMetricsRow,
                {
                  opacity: summaryMetricsOpacity,
                  transform: [{ translateY: summaryMetricsTranslateY }],
                },
              ]}
            >
              <View style={styles.summaryMetricCard}>
                <Text style={styles.summaryMetricLabel}>REPS COMPLETED</Text>
                <Text style={styles.summaryMetricValue}>
                  {finalReps} <Text style={styles.summaryMetricMuted}>/ {targetReps}</Text>
                </Text>
                <View style={styles.metricProgressTrack}>
                  <View
                    style={[
                      styles.metricProgressFill,
                      {
                        width: `${Math.min(100, (finalReps / targetReps) * 100)}%`,
                        backgroundColor: colors.primaryText,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.summaryMetricCard}>
                <View style={styles.formScoreHeader}>
                  <Text style={styles.summaryMetricLabel}>FORM ACCURACY</Text>
                  <Icon name="sparkle" size={13} color={colors.gold} />
                </View>
                <Text style={[styles.summaryMetricValue, { color: colors.gold }]}>
                  {finalScore} <Text style={styles.summaryMetricMuted}>/ 100</Text>
                </Text>
                <View style={styles.metricProgressTrack}>
                  <View
                    style={[
                      styles.metricProgressFill,
                      {
                        width: `${Math.min(100, finalScore)}%`,
                        backgroundColor: colors.gold,
                      },
                    ]}
                  />
                </View>
              </View>
            </Animated.View>

            {/* Secondary Metrics Row (DURATION & AVERAGE INTENSITY) */}
            <Animated.View
              style={[
                styles.summarySecondaryRow,
                {
                  opacity: summaryMetricsOpacity,
                  transform: [{ translateY: summaryMetricsTranslateY }],
                },
              ]}
            >
              <View style={styles.summarySubCard}>
                <View style={styles.subCardHeader}>
                  <Icon name="clock" size={13} color={colors.secondaryText} />
                  <Text style={styles.subCardLabel}>ACTIVE DURATION</Text>
                </View>
                <Text style={styles.subCardValue}>{formatDuration(elapsedSeconds)}</Text>
              </View>

              <View style={styles.summarySubCard}>
                <View style={styles.subCardHeader}>
                  <Icon name="pulse" size={13} color={colors.crimson} />
                  <Text style={styles.subCardLabel}>AVERAGE INTENSITY</Text>
                </View>
                <Text style={styles.subCardValue}>142 BPM</Text>
              </View>
            </Animated.View>

            {/* AI Performance Telemetry Card */}
            <Animated.View
              style={[
                styles.insightsCard,
                {
                  opacity: summaryInsightsOpacity,
                  transform: [{ translateY: summaryInsightsTranslateY }],
                },
              ]}
            >
              <View style={styles.insightsHeader}>
                <Icon name="sparkle" size={14} color={colors.gold} />
                <Text style={styles.insightsTitle}>AI PERFORMANCE TELEMETRY</Text>
              </View>

              <View style={styles.insightBulletRow}>
                <Text style={styles.insightBulletIcon}>▲</Text>
                <Text style={styles.insightBulletText}>
                  {setResult && setResult.flags.length === 0
                    ? 'Optimal Biomechanical Depth achieved across all repetitions.'
                    : setResult?.flags[0]?.description || 'Form maintained through range of motion.'}
                </Text>
              </View>

              <View style={styles.insightBulletRow}>
                <Text style={styles.insightBulletIcon}>⏱</Text>
                <Text style={styles.insightBulletText}>
                  Consistent 2-second eccentric cadence maintained throughout set.
                </Text>
              </View>
            </Animated.View>

            {/* Actions Block */}
            <Animated.View
              style={[
                styles.summaryActionsBlock,
                {
                  opacity: summaryCtaOpacity,
                  transform: [{ translateY: summaryCtaTranslateY }],
                },
              ]}
            >
              {/* Primary CTA */}
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

              {/* Secondary CTA: Edit Set */}
              <TouchableWithoutFeedback
                {...editBtnSpring}
                onPress={() => setSessionState('TRACKING')}
                testID="edit-set-button"
                accessibilityRole="button"
                accessibilityLabel="Edit Set"
              >
                <Animated.View
                  style={[
                    styles.editSetButton,
                    { transform: [{ scale: editButtonScale }] },
                  ]}
                >
                  <Text style={styles.editSetText}>EDIT SET DETAILS</Text>
                </Animated.View>
              </TouchableWithoutFeedback>

              {/* Tertiary Action: Exit Workout */}
              <TouchableOpacity
                onPress={handleExitWorkout}
                style={styles.summaryExitLink}
                accessibilityRole="button"
                accessibilityLabel="Exit Workout"
              >
                <Text style={styles.summaryExitText}>Exit Workout Session</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }


  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER STATE: VISION COACH UNAVAILABLE / CONNECTION ERROR (Stitch Luxury)
  // ─────────────────────────────────────────────────────────────────────────────
  if (sessionState === 'ERROR') {
    return (
      <View style={styles.errorRoot}>
        {/* Atmospheric Dark Obsidian Scrim Background */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: errorBgOpacity }]}>
          <ImageBackground
            source={images.gymBarbell}
            style={StyleSheet.absoluteFillObject}
            imageStyle={styles.errorBgImageStyle}
          >
            <View style={styles.errorBackdropOverlay} />
          </ImageBackground>
        </Animated.View>

        <SafeAreaView style={styles.errorSafeContainer} edges={['top', 'bottom']}>
          {/* Top Branding & Navigation */}
          <View style={styles.errorTopHeader}>
            <TouchableOpacity
              style={styles.errorCloseButton}
              onPress={handleExitWorkout}
              accessibilityRole="button"
              accessibilityLabel="Exit Workout"
            >
              <Text style={styles.errorCloseIconText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.errorBrandingCenter}>
              <Text style={styles.errorBrandTitle}>KINETRA</Text>
              <Text style={styles.errorBrandSubtitle}>VISION COACH / SYSTEM STATUS</Text>
            </View>

            <View style={{ width: 42 }} />
          </View>

          {/* Central Error Card */}
          <Animated.View
            style={[
              styles.centralErrorCard,
              {
                opacity: errorCardOpacity,
                transform: [{ scale: errorCardScale }],
              },
            ]}
          >
            {/* Warning Icon with Crimson Accent Circle */}
            <View style={styles.errorIconCircle}>
              <Icon name="warning" size={32} color={colors.crimson} />
            </View>

            {/* Heading & Supporting Message */}
            <Animated.View
              style={{
                opacity: errorTextOpacity,
                transform: [{ translateY: errorTextTranslateY }],
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Text style={styles.errorMainHeading}>VISION COACH UNAVAILABLE</Text>
              <Text style={styles.errorSupportingText}>
                {errorMessage || 'Connection to the on-device AI vision pipeline was interrupted.'}
              </Text>

              {/* Status Indicator */}
              <View style={styles.errorStatusIndicatorRow}>
                <Animated.View
                  style={[
                    styles.errorStatusDot,
                    { transform: [{ scale: errorPulseAnim }] },
                  ]}
                />
                <Text style={styles.errorStatusText}>CONNECTION INTERRUPTED</Text>
              </View>
            </Animated.View>

            {/* Actions: Primary RETRY + Secondary EXIT */}
            <Animated.View
              style={[
                styles.errorActionBlock,
                {
                  opacity: errorCtaOpacity,
                  transform: [{ translateY: errorCtaTranslateY }],
                },
              ]}
            >
              <TouchableWithoutFeedback
                {...retryBtnSpring}
                onPress={handleRetryInference}
                testID="vision-coach-retry-button"
                accessibilityRole="button"
                accessibilityLabel="Retry Vision Coach Inference"
              >
                <Animated.View
                  style={[
                    styles.errorRetryCta,
                    { transform: [{ scale: retryButtonScale }] },
                  ]}
                >
                  <Text style={styles.errorRetryCtaText}>RETRY</Text>
                </Animated.View>
              </TouchableWithoutFeedback>

              <TouchableOpacity
                style={styles.errorExitSecondaryButton}
                onPress={handleExitWorkout}
                accessibilityRole="button"
                accessibilityLabel="Exit Workout Session"
              >
                <Text style={styles.errorExitSecondaryText}>EXIT WORKOUT</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Bottom Standby Info */}
          <View style={styles.errorBottomFooter}>
            <Text style={styles.errorFooterText}>ON-DEVICE LOCAL ML • HIGH INTEGRITY PROTOCOL</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }


  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER STATE 5: ACTIVE LIVE TRACKING HUD (Matches Stitch screen.png)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* 1. CAMERA VIEW (Athlete camera feed remains primary background) */}
      <CameraView style={StyleSheet.absoluteFill} facing={facing} />

      {/* 2. CONTRAST SCRIMS (Subtle vignette overlays protecting HUD legibility) */}
      <View style={styles.topVignetteScrim} pointerEvents="none" />
      <View style={styles.bottomVignetteScrim} pointerEvents="none" />

      {/* 3. SKELETON & FRAMING OVERLAY */}
      <PoseSkeletonOverlay
        landmarks={currentLandmarks}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
      />

      {/* 4. TOP OVERLAY HEADER */}
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

          {/* Current Exercise Header Card with Set Info */}
          <View style={styles.currentExerciseCard}>
            <View style={styles.exerciseEyebrowRow}>
              <Text style={styles.currentExerciseLabel}>CURRENT EXERCISE</Text>
              <Text style={styles.currentSetBadge}>SET 0{setNumber}/04</Text>
            </View>
            <Text style={styles.currentExerciseTitle} numberOfLines={1}>
              {exerciseName}
            </Text>
          </View>

          {/* Right Group: Heart Rate, Signal Quality & Flip Camera */}
          <View style={styles.topRightControlsGroup}>
            <View style={styles.bpmPill}>
              <Text style={styles.bpmHeartIcon}>♡</Text>
              <Text style={styles.bpmValue}>142</Text>
              <Text style={styles.bpmUnit}>BPM</Text>
            </View>

            <View style={styles.signalQualityPill}>
              <View
                style={[
                  styles.signalQualityDot,
                  { backgroundColor: confidence >= 0.7 ? colors.gold : colors.secondaryText },
                ]}
              />
              <Text style={styles.signalQualityText}>
                {confidence >= 0.7 ? 'STABLE' : 'ALIGNING'}
              </Text>
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

      {/* 5. ERROR BANNER */}
      {errorMessage && (
        <Animated.View
          style={[
            styles.errorBanner,
            {
              opacity: errorCardOpacity,
              transform: [{ translateY: errorTextTranslateY }],
            },
          ]}
          testID="live-inference-error-banner"
        >
          <View style={styles.errorBannerLeft}>
            <View style={styles.errorBannerIconCircle}>
              <Icon name="warning" size={16} color={colors.crimson} />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <View style={styles.errorBannerTitleRow}>
                <View style={styles.errorBannerMiniDot} />
                <Text style={styles.errorBannerTitle}>VISION COACH UNAVAILABLE</Text>
              </View>
              <Text style={styles.errorBannerSubtitle} numberOfLines={2}>
                {errorMessage}
              </Text>
            </View>
          </View>
          <TouchableWithoutFeedback
            {...retryBtnSpring}
            onPress={handleRetryInference}
            testID="vision-coach-retry-button"
            accessibilityRole="button"
            accessibilityLabel="Retry Inference"
          >
            <Animated.View
              style={[
                styles.errorRetryButton,
                { transform: [{ scale: retryButtonScale }] },
              ]}
            >
              <Text style={styles.errorRetryText}>RETRY</Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      )}


      {/* 6. CENTER HERO HUD REPS DISPLAY (Live Biomechanical Focal Point) */}
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
        <Animated.Text
          style={[
            styles.centerRepsNumber,
            { transform: [{ scale: repScaleAnim }] },
          ]}
          testID="live-reps-counter"
        >
          {reps}
          <Text style={styles.centerTargetReps}>/{targetReps}</Text>
        </Animated.Text>
        <View style={styles.repsLabelRow}>
          <View style={styles.repsGoldBar} />
          <Text style={styles.repsLabelText} testID="live-stage-indicator">
            {stage === 'REST' ? 'REPS' : stage}
          </Text>
          <View style={styles.repsGoldBar} />
        </View>

        {/* Live Form Score Badge with Visual Indicator */}
        <View style={styles.liveFormScoreBadge}>
          <Icon name="shield" size={11} color={colors.gold} />
          <Text style={styles.liveFormScoreText}>{formScore}% FORM</Text>
          <View style={styles.formScoreMiniTrack}>
            <View
              style={[
                styles.formScoreMiniFill,
                { width: `${Math.min(100, Math.max(0, formScore))}%` },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      {/* 7. BOTTOM COACHING BANNER & CONTROLS ROW */}
      <SafeAreaView edges={['bottom']} style={styles.liveBottomContainer}>
        {/* Dynamic Coaching Banner with Fade Transition */}
        <Animated.View
          style={[
            styles.coachingPill,
            {
              opacity: coachingFadeAnim,
              transform: [{ translateY: bottomControlsTranslateY }],
            },
          ]}
          testID="live-coaching-banner"
        >
          <View style={styles.pulseBadge}>
            <Text style={styles.pulseBadgeText}>AI COACH</Text>
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

          {/* Middle: Secondary Pause Control [⏸] */}
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
  // ── Initializing Vision Coach State (Stitch Laboratory Loading) ──
  initRoot: {
    flex: 1,
    backgroundColor: '#050607',
  },
  initBgImageStyle: {
    opacity: 0.14,
    resizeMode: 'cover',
  },
  initBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 6, 7, 0.94)',
  },
  initSafeContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  initBrandingBlock: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  initBrandTitle: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    letterSpacing: 5,
    fontSize: 18,
  },
  initBrandEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  initBrandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gold,
  },
  initBrandSubtitle: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '800',
  },
  initCentralArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  initRadarOuterRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(217, 184, 63, 0.04)',
  },
  initRadarMiddleRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 184, 63, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 184, 63, 0.08)',
  },
  initRadarCore: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(217, 184, 63, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarMarker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: colors.gold,
  },
  markerTL: {
    top: 6,
    left: 6,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  markerTR: {
    top: 6,
    right: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
  },
  markerBL: {
    bottom: 6,
    left: 6,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  markerBR: {
    bottom: 6,
    right: 6,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  initStatusBlock: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  initMainHeading: {
    ...typography.headlineLg,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: spacing.xs,
  },
  initSubCopy: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 10,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  initTechStatusGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  techStatusCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 22, 0.85)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.sm,
    alignItems: 'center',
  },
  techStatusDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginBottom: 6,
  },
  techStatusDotPending: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.tertiaryText,
    marginBottom: 6,
  },
  techStatusLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 7.5,
    letterSpacing: 1,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  techStatusValue: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '800',
    textAlign: 'center',
  },
  initBottomSignalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.sm,
  },
  initSignalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginRight: 8,
  },
  initSignalText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '700',
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
  summaryRoot: {
    flex: 1,
    backgroundColor: '#050607',
  },
  summaryBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  summaryBgImageStyle: {
    opacity: 0.18,
    resizeMode: 'cover',
  },
  summaryBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 6, 7, 0.92)',
  },
  summarySafeContainer: {
    flex: 1,
  },
  summaryScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  summaryHeaderBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryStatusEyebrow: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 6,
  },
  summarySetTitle: {
    ...typography.headlineLg,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 28,
    textAlign: 'center',
  },
  summaryCheckWrapper: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  summaryCheckOuterRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 184, 63, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 184, 63, 0.08)',
  },
  summaryCheckCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  summaryCheckIcon: {
    color: colors.inverseText,
    fontSize: 26,
    fontWeight: '800',
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryMetricCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 6,
    fontWeight: '700',
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
    fontWeight: '400',
  },
  metricProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 1.5,
    marginTop: 10,
    overflow: 'hidden',
  },
  metricProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  summarySecondaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summarySubCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 22, 0.85)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  subCardLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '700',
  },
  subCardValue: {
    ...typography.headlineSm,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
  },
  insightsCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  insightsTitle: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  insightBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  insightBulletIcon: {
    color: colors.gold,
    fontSize: 9,
    marginRight: 8,
    marginTop: 4,
  },
  insightBulletText: {
    ...typography.bodySm,
    color: colors.primaryText,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  summaryActionsBlock: {
    gap: 10,
  },
  continueSetButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.goldBright,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueSetText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 12,
    letterSpacing: 1.8,
    fontWeight: '800',
  },
  editSetButton: {
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSetText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  summaryExitLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryExitText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 11,
    letterSpacing: 1.2,
  },


  // ── Live HUD State (Exact Stitch Reference screen.png) ──
  topVignetteScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(5, 6, 7, 0.45)',
    zIndex: 1,
  },
  bottomVignetteScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(5, 6, 7, 0.65)',
    zIndex: 1,
  },
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
  exerciseEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  currentSetBadge: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '800',
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
  signalQualityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 17, 19, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    gap: 5,
  },
  signalQualityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  signalQualityText: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '700',
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
  formScoreMiniTrack: {
    width: 28,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginLeft: 4,
  },
  formScoreMiniFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 1.5,
  },

  // ── Vision Coach Unavailable / Connection Error State (Stitch Luxury) ──
  errorRoot: {
    flex: 1,
    backgroundColor: '#050607',
  },
  errorBgImageStyle: {
    opacity: 0.12,
    resizeMode: 'cover',
  },
  errorBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 6, 7, 0.94)',
  },
  errorSafeContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  errorTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  errorCloseButton: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(15, 17, 19, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCloseIconText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  errorBrandingCenter: {
    alignItems: 'center',
  },
  errorBrandTitle: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    letterSpacing: 4,
    fontSize: 16,
  },
  errorBrandSubtitle: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8.5,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginTop: 2,
  },
  centralErrorCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.45)',
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: colors.crimson,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(230, 57, 70, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorMainHeading: {
    ...typography.headlineLg,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  errorSupportingText: {
    ...typography.bodyMd,
    color: colors.secondaryText,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  errorStatusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.3)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: spacing.xl,
    gap: 7,
  },
  errorStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.crimson,
  },
  errorStatusText: {
    ...typography.labelCaps,
    color: colors.crimson,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  errorActionBlock: {
    width: '100%',
    gap: 10,
  },
  errorRetryCta: {
    width: '100%',
    height: 52,
    backgroundColor: colors.goldBright,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRetryCtaText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 12,
    letterSpacing: 1.8,
    fontWeight: '800',
  },
  errorExitSecondaryButton: {
    width: '100%',
    height: 46,
    backgroundColor: 'rgba(15, 17, 19, 0.85)',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorExitSecondaryText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  errorBottomFooter: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  errorFooterText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1.5,
  },

  // ── Error Banner in Active Tracking HUD ──
  errorBanner: {
    position: 'absolute',
    top: 110,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(18, 20, 22, 0.96)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.55)',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 15,
    ...Platform.select({
      ios: {
        shadowColor: colors.crimson,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  errorBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  errorBannerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  errorBannerMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.crimson,
  },
  errorBannerTitle: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '800',
  },
  errorBannerSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 11,
    lineHeight: 15,
  },
  errorRetryButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.xs,
    marginLeft: 10,
  },
  errorRetryText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '800',
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

