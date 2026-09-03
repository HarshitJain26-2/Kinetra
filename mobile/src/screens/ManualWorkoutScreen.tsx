/**
 * Kinetra Manual Workout Session Screen (Section 21: Manual Workout Session Refinement)
 * Exact Stitch luxury dark athletic controlled training mode.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Animated,
  Easing,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { apiClient, WorkoutItem, WorkoutExerciseItem } from '../api/client';

interface ManualWorkoutScreenProps {
  route: any;
  navigation: any;
}

export const ManualWorkoutScreen: React.FC<ManualWorkoutScreenProps> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { workoutId, workout } = route?.params || {};

  const workoutData: WorkoutItem = workout || {
    id: workoutId || 'manual-routine',
    creator_id: '',
    title: 'Strength Conditioning Protocol',
    category: 'strength',
    difficulty: 'medium',
    is_public: false,
    exercises: [
      { exercise_id: 'ex-1', order_index: 0, target_sets: 4, target_reps: 8, target_weight_kg: 100, name: 'Barbell Back Squat' },
      { exercise_id: 'ex-2', order_index: 1, target_sets: 3, target_reps: 10, target_weight_kg: 60, name: 'Overhead Press' },
    ],
  };

  const exercises = workoutData.exercises && workoutData.exercises.length > 0
    ? workoutData.exercises
    : [
        { exercise_id: 'ex-1', order_index: 0, target_sets: 4, target_reps: 8, target_weight_kg: 100, name: 'Barbell Back Squat' },
      ];

  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const activeExercise: WorkoutExerciseItem =
    exercises[currentExIndex] || exercises[0];

  const exerciseName = activeExercise.name || activeExercise.exercise?.name || 'Barbell Back Squat';
  const exerciseMuscle = activeExercise.exercise?.target_muscle_group || activeExercise.exercise?.category || activeExercise.category || 'Compound Movement';
  const totalSets = activeExercise.target_sets || 4;

  const [weightLbs, setWeightLbs] = useState(
    activeExercise.target_weight_kg ? Math.round(activeExercise.target_weight_kg * 2.20462) : 315
  );
  const [reps, setReps] = useState(activeExercise.target_reps || 8);
  const [completedSets, setCompletedSets] = useState<{ set: number; weight: number; reps: number }[]>([]);

  // Rest Timer State
  const [isResting, setIsResting] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(75);
  const restTimerRef = useRef<any>(null);

  // 4-Phase Staggered Entrance Animation Values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const identityOpacity = useRef(new Animated.Value(0)).current;
  const identityTranslateY = useRef(new Animated.Value(10)).current;
  const exerciseOpacity = useRef(new Animated.Value(0)).current;
  const exerciseTranslateY = useRef(new Animated.Value(12)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const controlsTranslateY = useRef(new Animated.Value(14)).current;

  // Tactile Spring Scales
  const backBtnScale = useRef(new Animated.Value(1)).current;
  const menuBtnScale = useRef(new Animated.Value(1)).current;
  const completeBtnScale = useRef(new Animated.Value(1)).current;
  const weightMinusScale = useRef(new Animated.Value(1)).current;
  const weightPlusScale = useRef(new Animated.Value(1)).current;
  const repsMinusScale = useRef(new Animated.Value(1)).current;
  const repsPlusScale = useRef(new Animated.Value(1)).current;
  const skipRestScale = useRef(new Animated.Value(1)).current;

  const createSpring = (val: Animated.Value, down = 0.92, back = 1) => ({
    onPressIn: () => {
      Animated.spring(val, {
        toValue: down,
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

  const backBtnSpring = createSpring(backBtnScale, 0.90, 1);
  const menuBtnSpring = createSpring(menuBtnScale, 0.90, 1);
  const completeBtnSpring = createSpring(completeBtnScale, 0.96, 1);
  const weightMinusSpring = createSpring(weightMinusScale, 0.88, 1);
  const weightPlusSpring = createSpring(weightPlusScale, 0.88, 1);
  const repsMinusSpring = createSpring(repsMinusScale, 0.88, 1);
  const repsPlusSpring = createSpring(repsPlusScale, 0.88, 1);
  const skipRestSpring = createSpring(skipRestScale, 0.94, 1);

  // Staggered Entrance
  useEffect(() => {
    let isMounted = true;
    let entranceAnim: Animated.CompositeAnimation | null = null;

    const runEntrance = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (!isMounted) return;

      if (reduceMotion) {
        headerOpacity.setValue(1);
        headerTranslateY.setValue(0);
        identityOpacity.setValue(1);
        identityTranslateY.setValue(0);
        exerciseOpacity.setValue(1);
        exerciseTranslateY.setValue(0);
        controlsOpacity.setValue(1);
        controlsTranslateY.setValue(0);
        return;
      }

      entranceAnim = Animated.stagger(65, [
        // Phase 1: Header
        Animated.parallel([
          Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 2: Protocol Identity & Session Progress
        Animated.parallel([
          Animated.timing(identityOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(identityTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 3: Current Exercise & Movement Card
        Animated.parallel([
          Animated.timing(exerciseOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(exerciseTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Set & Rep Controls, CTA
        Animated.parallel([
          Animated.timing(controlsOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(controlsTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      entranceAnim.start();
    };

    runEntrance();

    return () => {
      isMounted = false;
      if (entranceAnim) entranceAnim.stop();
    };
  }, []);

  // Update target values when exercise changes
  useEffect(() => {
    if (activeExercise) {
      if (activeExercise.target_weight_kg) {
        setWeightLbs(Math.round(activeExercise.target_weight_kg * 2.20462));
      }
      if (activeExercise.target_reps) {
        setReps(activeExercise.target_reps);
      }
    }
  }, [currentExIndex]);

  // Initialize Session
  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionRes = await apiClient.startSession(workoutId || null);
        if (sessionRes?.id) {
          setSessionId(sessionRes.id);
        }
      } catch {
        setSessionId(`local-session-${Date.now()}`);
      }
    };
    initSession();
  }, [workoutId]);

  // Rest Timer Interval
  useEffect(() => {
    if (isResting && restSecondsRemaining > 0) {
      restTimerRef.current = setInterval(() => {
        setRestSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            if (restTimerRef.current) clearInterval(restTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isResting, restSecondsRemaining]);

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSet = async () => {
    const setEntry = {
      set: currentSetNumber,
      weight: weightLbs,
      reps: reps,
    };
    setCompletedSets((prev) => [...prev, setEntry]);

    // Log to API
    if (sessionId) {
      try {
        await apiClient.logSessionExercise(sessionId, {
          exercise_id: activeExercise.exercise_id,
          sets: currentSetNumber,
          reps: reps,
          duration_seconds: 45,
        });
      } catch {
        // Continue seamlessly
      }
    }

    if (currentSetNumber < totalSets) {
      setCurrentSetNumber((prev) => prev + 1);
      setRestSecondsRemaining(75);
      setIsResting(true);
    } else {
      // Exercise sets complete -> Move to next exercise or finish
      if (currentExIndex + 1 < exercises.length) {
        Alert.alert('Exercise Complete', `Moving to next movement: ${exercises[currentExIndex + 1].name || 'Next'}`);
        setCurrentExIndex((prev) => prev + 1);
        setCurrentSetNumber(1);
        setCompletedSets([]);
        setIsResting(false);
      } else {
        handleFinishWorkout();
      }
    }
  };

  const handleFinishWorkout = async () => {
    if (sessionId) {
      try {
        await apiClient.endSession(sessionId, 'Manual session completed successfully.');
      } catch {
        // Fallback
      }
    }
    Alert.alert('Protocol Complete', 'Your manual training session has been securely recorded to your performance ledger.');
    navigation.goBack();
  };

  const handleConfirmExit = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this manual training protocol?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Protocol', style: 'destructive', onPress: handleFinishWorkout },
      ]
    );
  };

  const handlePrevExercise = () => {
    if (currentExIndex > 0) {
      setCurrentExIndex((prev) => prev - 1);
      setCurrentSetNumber(1);
      setCompletedSets([]);
      setIsResting(false);
    }
  };

  const handleNextExercise = () => {
    if (currentExIndex + 1 < exercises.length) {
      setCurrentExIndex((prev) => prev + 1);
      setCurrentSetNumber(1);
      setCompletedSets([]);
      setIsResting(false);
    }
  };

  // Progress calculations
  const totalExercisesCount = Math.max(1, exercises.length);
  const exerciseProgressPct = ((currentExIndex + (currentSetNumber - 1) / totalSets) / totalExercisesCount) * 100;
  const exerciseOrderLabel = `A${currentExIndex + 1}`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP SESSION HEADER */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <TouchableWithoutFeedback
          {...backBtnSpring}
          onPress={handleConfirmExit}
          accessibilityRole="button"
          accessibilityLabel="Exit Manual Workout Session"
        >
          <Animated.View
            style={[
              styles.navCircleButton,
              { transform: [{ scale: backBtnScale }] },
            ]}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </Animated.View>
        </TouchableWithoutFeedback>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerBrand}>KINETRA</Text>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>MANUAL MODE // CONTROLLED</Text>
          </View>
        </View>

        <TouchableWithoutFeedback
          {...menuBtnSpring}
          onPress={handleFinishWorkout}
          accessibilityRole="button"
          accessibilityLabel="Finish Protocol Early"
        >
          <Animated.View
            style={[
              styles.navCircleButton,
              { transform: [{ scale: menuBtnScale }] },
            ]}
          >
            <Icon name="check" size={16} color={colors.gold} />
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.xxl + Math.max(insets.bottom, 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. PROTOCOL IDENTITY & PROGRESS */}
        <Animated.View
          style={[
            styles.identitySection,
            {
              opacity: identityOpacity,
              transform: [{ translateY: identityTranslateY }],
            },
          ]}
        >
          <View style={styles.protocolHeaderRow}>
            <View>
              <Text style={styles.protocolEyebrow}>
                {(workoutData.category || 'STRENGTH').toUpperCase()} PROTOCOL
              </Text>
              <Text style={styles.workoutTitle} numberOfLines={1}>
                {workoutData.title || 'Strength Conditioning Protocol'}
              </Text>
            </View>
            <View style={styles.movementCounterBadge}>
              <Text style={styles.movementCounterText}>
                MOVEMENT {String(currentExIndex + 1).padStart(2, '0')} / {String(totalExercisesCount).padStart(2, '0')}
              </Text>
            </View>
          </View>

          {/* Linear Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(8, exerciseProgressPct))}%` },
              ]}
            />
          </View>
        </Animated.View>

        {/* 3. CURRENT EXERCISE CARD */}
        <Animated.View
          style={[
            styles.exerciseCard,
            {
              opacity: exerciseOpacity,
              transform: [{ translateY: exerciseTranslateY }],
            },
          ]}
        >
          <View style={styles.exerciseCardHeader}>
            <View style={styles.exerciseIndexBadge}>
              <Text style={styles.exerciseIndexText}>{exerciseOrderLabel}</Text>
            </View>
            <View style={styles.exerciseHeaderInfo}>
              <Text style={styles.exerciseHeadline}>{exerciseName}</Text>
              <Text style={styles.exerciseMuscleLabel}>{exerciseMuscle.toUpperCase()}</Text>
            </View>
          </View>

          {/* Exercise Navigation Steppers if multiple */}
          {exercises.length > 1 ? (
            <View style={styles.exerciseNavRow}>
              <TouchableOpacity
                onPress={handlePrevExercise}
                disabled={currentExIndex === 0}
                style={[styles.exNavBtn, currentExIndex === 0 && styles.exNavBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Previous exercise"
              >
                <Text style={[styles.exNavBtnText, currentExIndex === 0 && styles.exNavBtnTextDisabled]}>
                  ← PREV MOVEMENT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextExercise}
                disabled={currentExIndex + 1 >= exercises.length}
                style={[styles.exNavBtn, currentExIndex + 1 >= exercises.length && styles.exNavBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Next exercise"
              >
                <Text style={[styles.exNavBtnText, currentExIndex + 1 >= exercises.length && styles.exNavBtnTextDisabled]}>
                  NEXT MOVEMENT →
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </Animated.View>

        {/* 4. SET TELEMETRY & REST STATUS */}
        <Animated.View
          style={[
            styles.setTelemetryRow,
            {
              opacity: controlsOpacity,
              transform: [{ translateY: controlsTranslateY }],
            },
          ]}
        >
          <View style={styles.setCountBox}>
            <Text style={styles.setCountLabel}>ACTIVE SET</Text>
            <Text style={styles.setCountValue}>
              {currentSetNumber} <Text style={styles.setCountDivider}>/</Text> {totalSets}
            </Text>
          </View>

          <View style={styles.restTimerBox}>
            <Text style={styles.restTimerLabel}>
              {isResting ? 'REST PROTOCOL' : 'REST TARGET'}
            </Text>
            <Text style={[styles.restTimerVal, isResting && styles.restTimerValActive]}>
              {isResting ? formatRestTime(restSecondsRemaining) : '75S'}
            </Text>
          </View>
        </Animated.View>

        {/* REST ACTIVE RECOVERY BANNER */}
        {isResting ? (
          <Animated.View style={styles.restRecoveryBanner}>
            <View style={styles.restRecoveryLeft}>
              <View style={styles.restPulseIndicator} />
              <View>
                <Text style={styles.restRecoveryTitle}>RECOVERY PHASE ACTIVE</Text>
                <Text style={styles.restRecoverySub}>Breathe deeply. Prepare for Set {currentSetNumber}.</Text>
              </View>
            </View>
            <TouchableWithoutFeedback
              {...skipRestSpring}
              onPress={() => setIsResting(false)}
              accessibilityRole="button"
              accessibilityLabel="Skip rest period"
            >
              <Animated.View
                style={[
                  styles.skipRestBtn,
                  { transform: [{ scale: skipRestScale }] },
                ]}
              >
                <Text style={styles.skipRestText}>SKIP REST →</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        ) : null}

        {/* 5. LOAD (WEIGHT) ADJUSTER CARD */}
        <Animated.View
          style={[
            styles.adjusterCard,
            {
              opacity: controlsOpacity,
              transform: [{ translateY: controlsTranslateY }],
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderLabel}>LOAD (LBS)</Text>
            <Text style={styles.cardHeaderSub}>PRECISION RESISTANCE</Text>
          </View>

          <View style={styles.numberRow}>
            <Text style={styles.largeGoldNumber} testID="manual-weight-value">
              {weightLbs}
            </Text>
            <Text style={styles.unitSuffix}>LBS</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableWithoutFeedback
              {...weightMinusSpring}
              onPress={() => setWeightLbs((w) => Math.max(0, w - 5))}
              testID="manual-weight-minus"
              accessibilityRole="button"
              accessibilityLabel="Decrease weight by 5 pounds"
            >
              <Animated.View
                style={[
                  styles.adjustBtn,
                  { transform: [{ scale: weightMinusScale }] },
                ]}
              >
                <Text style={styles.adjustBtnText}>−</Text>
              </Animated.View>
            </TouchableWithoutFeedback>

            <View style={styles.stepHint}>
              <Text style={styles.stepHintText}>± 5 LBS</Text>
            </View>

            <TouchableWithoutFeedback
              {...weightPlusSpring}
              onPress={() => setWeightLbs((w) => w + 5)}
              testID="manual-weight-plus"
              accessibilityRole="button"
              accessibilityLabel="Increase weight by 5 pounds"
            >
              <Animated.View
                style={[
                  styles.adjustBtn,
                  { transform: [{ scale: weightPlusScale }] },
                ]}
              >
                <Text style={styles.adjustBtnText}>+</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </Animated.View>

        {/* 6. TARGET REPETITIONS ADJUSTER CARD */}
        <Animated.View
          style={[
            styles.adjusterCard,
            {
              opacity: controlsOpacity,
              transform: [{ translateY: controlsTranslateY }],
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderLabel}>TARGET REPETITIONS</Text>
            <Text style={styles.cardHeaderSub}>EXECUTION COUNT</Text>
          </View>

          <View style={styles.numberRow}>
            <Text style={styles.largeGoldNumber} testID="manual-reps-value">
              {reps}
            </Text>
            <Text style={styles.unitSuffix}>REPS</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableWithoutFeedback
              {...repsMinusSpring}
              onPress={() => setReps((r) => Math.max(1, r - 1))}
              testID="manual-reps-minus"
              accessibilityRole="button"
              accessibilityLabel="Decrease reps by 1"
            >
              <Animated.View
                style={[
                  styles.adjustBtn,
                  { transform: [{ scale: repsMinusScale }] },
                ]}
              >
                <Text style={styles.adjustBtnText}>−</Text>
              </Animated.View>
            </TouchableWithoutFeedback>

            <View style={styles.stepHint}>
              <Text style={styles.stepHintText}>± 1 REP</Text>
            </View>

            <TouchableWithoutFeedback
              {...repsPlusSpring}
              onPress={() => setReps((r) => r + 1)}
              testID="manual-reps-plus"
              accessibilityRole="button"
              accessibilityLabel="Increase reps by 1"
            >
              <Animated.View
                style={[
                  styles.adjustBtn,
                  { transform: [{ scale: repsPlusScale }] },
                ]}
              >
                <Text style={styles.adjustBtnText}>+</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </Animated.View>

        {/* 7. PREVIOUS SETS HISTORY */}
        <Animated.View
          style={[
            styles.previousSetsSection,
            {
              opacity: controlsOpacity,
              transform: [{ translateY: controlsTranslateY }],
            },
          ]}
        >
          <Text style={styles.previousHeader}>SESSION SET HISTORY</Text>
          <View style={styles.prevSetsRow}>
            {[1, 2, 3, 4].slice(0, Math.max(3, totalSets)).map((s) => {
              const found = completedSets.find((c) => c.set === s);
              const isCurrent = s === currentSetNumber;

              return (
                <View
                  key={s}
                  style={[
                    styles.prevSetBox,
                    isCurrent && styles.prevSetBoxCurrent,
                    found && styles.prevSetBoxCompleted,
                  ]}
                >
                  <Text style={[styles.prevSetTitle, isCurrent && styles.prevSetTitleCurrent]}>
                    SET {s}
                  </Text>
                  <Text style={[styles.prevSetVal, found && styles.prevSetValCompleted]}>
                    {found ? `${found.weight} × ${found.reps}` : isCurrent ? 'ACTIVE' : '--'}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* 8. PRIMARY SET COMPLETION ACTION */}
        <Animated.View
          style={{
            opacity: controlsOpacity,
            transform: [{ translateY: controlsTranslateY }],
          }}
        >
          <TouchableWithoutFeedback
            {...completeBtnSpring}
            onPress={handleCompleteSet}
            testID="manual-complete-set-btn"
            accessibilityRole="button"
            accessibilityLabel={`Complete set ${currentSetNumber}`}
          >
            <Animated.View
              style={[
                styles.completeSetBtn,
                { transform: [{ scale: completeBtnScale }] },
              ]}
            >
              <Text style={styles.completeSetBtnText}>
                {currentSetNumber >= totalSets && currentExIndex + 1 >= exercises.length
                  ? 'FINISH PROTOCOL SESSION →'
                  : `COMPLETE SET ${currentSetNumber} →`}
              </Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050607',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  navCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerBrand: {
    ...typography.brandWordmarkSmall,
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 4,
    fontWeight: '800',
    marginBottom: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 184, 63, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.25)',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gold,
    marginRight: 5,
  },
  activeBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // ── Protocol Identity ──
  identitySection: {
    marginBottom: spacing.md,
  },
  protocolHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  protocolEyebrow: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  workoutTitle: {
    ...typography.headlineMd,
    fontFamily: 'serif',
    color: colors.primaryText,
    fontSize: 20,
    fontWeight: '700',
  },
  movementCounterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  movementCounterText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 1.5,
  },

  // ── Current Exercise Card ──
  exerciseCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIndexBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.xs,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseIndexText: {
    fontFamily: 'serif',
    color: colors.gold,
    fontSize: 16,
    fontWeight: '800',
  },
  exerciseHeaderInfo: {
    flex: 1,
  },
  exerciseHeadline: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.primaryText,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 2,
  },
  exerciseMuscleLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  exerciseNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  exNavBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  exNavBtnDisabled: {
    opacity: 0.3,
  },
  exNavBtnText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  exNavBtnTextDisabled: {
    color: colors.tertiaryText,
  },

  // ── Set Telemetry Row ──
  setTelemetryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  setCountBox: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  setCountLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 2,
  },
  setCountValue: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.primaryText,
    fontSize: 20,
    fontWeight: '700',
  },
  setCountDivider: {
    color: colors.tertiaryText,
    fontSize: 16,
  },
  restTimerBox: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  restTimerLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 2,
  },
  restTimerVal: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.primaryText,
    fontSize: 20,
    fontWeight: '700',
  },
  restTimerValActive: {
    color: colors.gold,
  },

  // ── Rest Recovery Banner ──
  restRecoveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(217, 184, 63, 0.1)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  restRecoveryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  restPulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginRight: 10,
  },
  restRecoveryTitle: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9.5,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 2,
  },
  restRecoverySub: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 11,
  },
  skipRestBtn: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.4)',
  },
  skipRestText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '800',
  },

  // ── Adjuster Cards ──
  adjusterCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  cardHeaderLabel: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  cardHeaderSub: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    letterSpacing: 1,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    backgroundColor: 'rgba(25, 27, 30, 0.95)',
    width: '100%',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  largeGoldNumber: {
    fontFamily: 'serif',
    color: colors.gold,
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 48,
  },
  unitSuffix: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginLeft: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  adjustBtn: {
    width: 68,
    height: 44,
    borderRadius: borderRadius.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnText: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  stepHint: {
    alignItems: 'center',
  },
  stepHintText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },

  // ── Previous Sets ──
  previousSetsSection: {
    marginBottom: spacing.lg,
  },
  previousHeader: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: 8,
  },
  prevSetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prevSetBox: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  prevSetBoxCurrent: {
    borderColor: 'rgba(217, 184, 63, 0.4)',
    backgroundColor: 'rgba(217, 184, 63, 0.08)',
  },
  prevSetBoxCompleted: {
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  prevSetTitle: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 2,
  },
  prevSetTitleCurrent: {
    color: colors.gold,
    fontWeight: '800',
  },
  prevSetVal: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.tertiaryText,
    fontSize: 11,
  },
  prevSetValCompleted: {
    color: colors.primaryText,
  },

  // ── Primary CTA ──
  completeSetBtn: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.xs,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  completeSetBtnText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
