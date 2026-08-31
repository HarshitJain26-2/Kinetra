/**
 * Kinetra Manual Workout Session Screen (Phase 35)
 * Exact Stitch luxury dark athletic design matching Screen 4 (Manual Workout).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const exercises = workoutData.exercises || [];
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const activeExercise: WorkoutExerciseItem =
    exercises[currentExIndex] || {
      exercise_id: 'default-ex',
      order_index: 0,
      target_sets: 4,
      target_reps: 8,
      target_weight_kg: 100,
      name: 'Barbell Back Squat',
    };

  const exerciseName = activeExercise.name || activeExercise.exercise?.name || 'Barbell Back Squat';
  const totalSets = activeExercise.target_sets || 4;

  const [weightLbs, setWeightLbs] = useState(
    activeExercise.target_weight_kg ? Math.round(activeExercise.target_weight_kg * 2.20462) : 315
  );
  const [reps, setReps] = useState(activeExercise.target_reps || 8);
  const [completedSets, setCompletedSets] = useState<{ set: number; weight: number; reps: number }[]>([]);

  // Rest Timer State
  const [isResting, setIsResting] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(75);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

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
            clearInterval(restTimerRef.current as any);
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
        Alert.alert('Exercise Complete', `Moving to next exercise: ${exercises[currentExIndex + 1].name || 'Next'}`);
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
    Alert.alert('Protocol Complete', 'Your manual session metrics have been logged into your training ledger.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBadgeText}>SESSION ACTIVE</Text>
        </View>

        <TouchableOpacity onPress={handleFinishWorkout} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. SUB HEADER */}
        <View style={styles.subHeaderRow}>
          <Text style={styles.setCountLabel}>
            SET {currentSetNumber} OF {totalSets}
          </Text>
          <View style={styles.restTimerRow}>
            <Text style={styles.restTimerLabel}>REST TIMER</Text>
            <Text style={styles.restTimerVal}>{formatRestTime(restSecondsRemaining)}</Text>
          </View>
        </View>

        {/* 3. EXERCISE TITLE */}
        <Text style={styles.exerciseHeadline}>{exerciseName}</Text>

        {/* 4. WEIGHT CARD */}
        <Text style={styles.cardHeaderLabel}>WEIGHT (LBS)</Text>
        <View style={styles.adjusterCard}>
          <View style={styles.numberRow}>
            <Text style={styles.largeGoldNumber} testID="manual-weight-value">
              {weightLbs}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => setWeightLbs((w) => Math.max(0, w - 5))}
              testID="manual-weight-minus"
            >
              <Text style={styles.adjustBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => setWeightLbs((w) => w + 5)}
              testID="manual-weight-plus"
            >
              <Text style={styles.adjustBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. REPS CARD */}
        <Text style={styles.cardHeaderLabel}>REPS</Text>
        <View style={styles.adjusterCard}>
          <View style={styles.numberRow}>
            <Text style={styles.largeGoldNumber} testID="manual-reps-value">
              {reps}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => setReps((r) => Math.max(1, r - 1))}
              testID="manual-reps-minus"
            >
              <Text style={styles.adjustBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => setReps((r) => r + 1)}
              testID="manual-reps-plus"
            >
              <Text style={styles.adjustBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. PREVIOUS SETS */}
        <Text style={styles.previousHeader}>PREVIOUS SETS</Text>
        <View style={styles.prevSetsRow}>
          {[1, 2, 3].map((s) => {
            const found = completedSets.find((c) => c.set === s);
            return (
              <View key={s} style={styles.prevSetBox}>
                <Text style={styles.prevSetTitle}>Set {s}</Text>
                <Text style={styles.prevSetVal}>
                  {found ? `${found.weight} × ${found.reps}` : '--'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 7. COMPLETE SET BUTTON */}
        <TouchableOpacity
          style={styles.completeSetBtn}
          onPress={handleCompleteSet}
          testID="manual-complete-set-btn"
        >
          <Text style={styles.completeSetBtnText}>✔ COMPLETE SET</Text>
        </TouchableOpacity>
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
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.primaryText,
    fontSize: 16,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginRight: 6,
  },
  activeBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    color: colors.primaryText,
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  setCountLabel: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  restTimerRow: {
    alignItems: 'flex-end',
  },
  restTimerLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    letterSpacing: 1,
  },
  restTimerVal: {
    fontFamily: 'serif',
    color: colors.gold,
    fontWeight: '800',
    fontSize: 18,
  },
  exerciseHeadline: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '800',
    color: colors.primaryText,
    fontSize: 32,
    lineHeight: 38,
    marginBottom: spacing.lg,
  },
  cardHeaderLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  adjusterCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  numberRow: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: borderRadius.sm,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  largeGoldNumber: {
    fontFamily: 'serif',
    color: colors.gold,
    fontSize: 48,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  adjustBtn: {
    width: 60,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnText: {
    color: colors.primaryText,
    fontSize: 24,
    fontWeight: '700',
  },
  previousHeader: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: spacing.xs,
    marginBottom: 8,
  },
  prevSetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xl,
  },
  prevSetBox: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 10,
    alignItems: 'center',
  },
  prevSetTitle: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 10,
    marginBottom: 2,
  },
  prevSetVal: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 12,
  },
  completeSetBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  completeSetBtnText: {
    ...typography.labelCaps,
    color: '#050607',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
