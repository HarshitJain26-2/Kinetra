/**
 * Kinetra Workout Details Screen (Section 20: Workout Details / Protocol Intelligence Refinement)
 * Exact Stitch luxury dark athletic performance-lab design matching training protocol reference.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ImageBackground,
  Animated,
  Easing,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { images } from '../assets';
import { apiClient, WorkoutItem, WorkoutExerciseItem } from '../api/client';
import { ScreenProps } from '../navigation/types';

export const WorkoutDetailsScreen: React.FC<ScreenProps<'WorkoutDetails'>> = ({
  route,
  navigation,
}) => {
  const { workoutId, initialWorkout } = route.params;
  const insets = useSafeAreaInsets();

  const [workout, setWorkout] = useState<WorkoutItem | null>(initialWorkout || null);
  const [loading, setLoading] = useState<boolean>(!initialWorkout || !initialWorkout.exercises);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // 4-Phase Staggered Entrance Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const identityOpacity = useRef(new Animated.Value(0)).current;
  const identityTranslateY = useRef(new Animated.Value(10)).current;
  const metadataOpacity = useRef(new Animated.Value(0)).current;
  const metadataTranslateY = useRef(new Animated.Value(12)).current;
  const protocolOpacity = useRef(new Animated.Value(0)).current;
  const protocolTranslateY = useRef(new Animated.Value(14)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(16)).current;

  // Hero scale animation
  const heroScale = useRef(new Animated.Value(1.04)).current;
  // Skeleton shimmer pulse
  const shimmerPulse = useRef(new Animated.Value(0.4)).current;

  // Tactile button scales
  const backBtnScale = useRef(new Animated.Value(1)).current;
  const bookmarkBtnScale = useRef(new Animated.Value(1)).current;
  const startBtnScale = useRef(new Animated.Value(1)).current;
  const manualBtnScale = useRef(new Animated.Value(1)).current;

  // 1. Data Fetching with graceful initialWorkout preservation
  useEffect(() => {
    let isMounted = true;
    const fetchFullWorkout = async () => {
      try {
        const fullWorkout = await apiClient.getWorkoutById(workoutId);
        if (isMounted) {
          setWorkout(fullWorkout);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          if (!workout) {
            setError(err?.message || 'Unable to retrieve training protocol.');
          }
          setLoading(false);
        }
      }
    };

    fetchFullWorkout();
    return () => {
      isMounted = false;
    };
  }, [workoutId]);

  // 2. Staggered Entrance Animation Sequence
  useEffect(() => {
    let isMounted = true;
    let entranceSequence: Animated.CompositeAnimation | null = null;
    let shimmerLoop: Animated.CompositeAnimation | null = null;

    const runEntrance = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (!isMounted) return;

      if (reduceMotion) {
        headerOpacity.setValue(1);
        headerTranslateY.setValue(0);
        identityOpacity.setValue(1);
        identityTranslateY.setValue(0);
        metadataOpacity.setValue(1);
        metadataTranslateY.setValue(0);
        protocolOpacity.setValue(1);
        protocolTranslateY.setValue(0);
        ctaOpacity.setValue(1);
        ctaTranslateY.setValue(0);
        heroScale.setValue(1);
        return;
      }

      entranceSequence = Animated.stagger(65, [
        // Phase 1: Header Bar
        Animated.parallel([
          Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(heroScale, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 2: Hero & Protocol Identity
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
        // Phase 3: Metadata Summary & Description
        Animated.parallel([
          Animated.timing(metadataOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(metadataTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Circuit Protocol Exercises & Primary CTA
        Animated.parallel([
          Animated.timing(protocolOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(protocolTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ctaOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ctaTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      entranceSequence.start();

      shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerPulse, {
            toValue: 0.85,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerPulse, {
            toValue: 0.4,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      shimmerLoop.start();
    };

    runEntrance();

    return () => {
      isMounted = false;
      if (entranceSequence) entranceSequence.stop();
      if (shimmerLoop) shimmerLoop.stop();
    };
  }, []);

  // Tactile spring press feedback generator
  const createSpring = (val: Animated.Value, down = 0.95, back = 1) => ({
    onPressIn: () => {
      Animated.spring(val, {
        toValue: down,
        useNativeDriver: true,
        speed: 40,
        bounciness: 3,
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
  const bookmarkBtnSpring = createSpring(bookmarkBtnScale, 0.90, 1);
  const startBtnSpring = createSpring(startBtnScale, 0.965, 1);
  const manualBtnSpring = createSpring(manualBtnScale, 0.965, 1);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleToggleBookmark = () => {
    setIsBookmarked((prev) => !prev);
  };

  const handleStartWorkout = () => {
    const firstExercise =
      workout?.exercises && workout.exercises.length > 0 ? workout.exercises[0] : undefined;

    navigation.navigate('LiveWorkout', {
      workoutId,
      workout: workout || undefined,
      exercise: firstExercise
        ? {
            id: firstExercise.exercise_id,
            name: firstExercise.exercise?.name || firstExercise.name,
          }
        : undefined,
      setNumber: 1,
    });
  };

  const handleStartManualWorkout = () => {
    navigation.navigate('ManualWorkout', {
      workoutId,
      workout: workout || undefined,
    });
  };

  const getHeroImage = () => {
    if (!workout) return images.gymBarbell;
    switch (workout.category.toLowerCase()) {
      case 'endurance':
      case 'conditioning':
        return images.splashBg;
      case 'mobility':
      case 'recovery':
        return images.signUpRef;
      default:
        return images.gymBarbell;
    }
  };

  const durationMin =
    workout?.estimated_duration_min ??
    (workout?.exercises && workout.exercises.length > 0
      ? workout.exercises.length * 5
      : 45);

  const formattedCategory = workout?.category
    ? workout.category.toUpperCase().includes('STRENGTH')
      ? 'STRENGTH & POWER'
      : workout.category.toUpperCase()
    : 'TRAINING PROTOCOL';

  const formattedDifficulty = workout?.difficulty
    ? workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)
    : 'Intermediate';

  const computeIntensityBadge = (difficulty?: string, category?: string): string => {
    if (difficulty === 'elite' || difficulty === 'advanced') {
      return 'HIGH INTENSITY';
    }
    if (category === 'endurance' || category === 'conditioning') {
      return 'LIVE';
    }
    return 'AI OPTIMIZED';
  };

  const intensityBadge = computeIntensityBadge(workout?.difficulty, workout?.category);
  const exerciseCount = workout?.exercises?.length ?? 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER LOADING STATE (Luxury Obsidian Skeleton)
  // ─────────────────────────────────────────────────────────────────────────────
  if (loading && !workout) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.skeletonTopNav}>
          <TouchableOpacity
            style={styles.navSquareButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            testID="workout-details-back-button"
          >
            <Icon name="back" size={17} color={colors.gold} />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.skeletonBody}>
          <Animated.View style={[styles.skeletonHero, { opacity: shimmerPulse }]} />
          <View style={styles.skeletonDetails}>
            <Animated.View style={[styles.skeletonPill, { opacity: shimmerPulse }]} />
            <Animated.View style={[styles.skeletonTitle, { opacity: shimmerPulse }]} />
            <Animated.View style={[styles.skeletonSubTitle, { opacity: shimmerPulse }]} />

            <View style={styles.skeletonGrid}>
              <Animated.View style={[styles.skeletonCard, { opacity: shimmerPulse }]} />
              <Animated.View style={[styles.skeletonCard, { opacity: shimmerPulse }]} />
              <Animated.View style={[styles.skeletonCard, { opacity: shimmerPulse }]} />
            </View>

            <Animated.View style={[styles.skeletonExerciseRow, { opacity: shimmerPulse }]} />
            <Animated.View style={[styles.skeletonExerciseRow, { opacity: shimmerPulse }]} />
          </View>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER ERROR STATE
  // ─────────────────────────────────────────────────────────────────────────────
  if (error && !workout) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.skeletonTopNav}>
          <TouchableOpacity
            style={styles.navSquareButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            testID="workout-details-back-button"
          >
            <Icon name="back" size={17} color={colors.gold} />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Icon name="warning" size={32} color={colors.crimson} />
            <Text style={styles.errorTitle}>CONNECTION INTERRUPTED</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.errorRetryButton}
              onPress={handleBack}
              accessibilityLabel="Return to Workout Library"
              accessibilityRole="button"
            >
              <Text style={styles.errorRetryText}>RETURN TO LIBRARY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER MAIN PROTOCOL SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 130 + Math.max(insets.bottom, 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. CINEMATIC HERO SECTION */}
        <Animated.View
          style={[
            styles.heroContainer,
            { transform: [{ scale: heroScale }] },
          ]}
        >
          <ImageBackground
            source={getHeroImage()}
            style={styles.heroBackground}
            imageStyle={styles.heroImage}
          >
            {/* Dark Scrim Overlays */}
            <View style={styles.heroTopScrim} />
            <View style={styles.heroBottomScrim} />

            <View style={styles.heroInnerContent}>
              {/* Floating Top Navigation Header */}
              <Animated.View
                style={[
                  styles.topNavOverlay,
                  {
                    opacity: headerOpacity,
                    transform: [{ translateY: headerTranslateY }],
                  },
                ]}
              >
                <SafeAreaView edges={['top']} style={styles.topNavSafeArea}>
                  <TouchableWithoutFeedback
                    {...backBtnSpring}
                    onPress={handleBack}
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                    testID="workout-details-back-button"
                  >
                    <Animated.View
                      style={[
                        styles.navSquareButton,
                        { transform: [{ scale: backBtnScale }] },
                      ]}
                    >
                      <Icon name="back" size={17} color={colors.gold} />
                    </Animated.View>
                  </TouchableWithoutFeedback>

                  <Text style={styles.headerBrand}>KINETRA</Text>

                  <TouchableWithoutFeedback
                    {...bookmarkBtnSpring}
                    onPress={handleToggleBookmark}
                    accessibilityLabel="Bookmark workout"
                    accessibilityRole="button"
                    testID="workout-details-bookmark-button"
                  >
                    <Animated.View
                      style={[
                        styles.navSquareButton,
                        { transform: [{ scale: bookmarkBtnScale }] },
                      ]}
                    >
                      <Icon
                        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={17}
                        color={isBookmarked ? colors.gold : colors.primaryText}
                      />
                    </Animated.View>
                  </TouchableWithoutFeedback>
                </SafeAreaView>
              </Animated.View>

              {/* Title & Metadata Hero Bottom Content */}
              <Animated.View
                style={[
                  styles.heroBottomContent,
                  {
                    opacity: identityOpacity,
                    transform: [{ translateY: identityTranslateY }],
                  },
                ]}
              >
                <View style={styles.heroEyebrowRow}>
                  <View style={styles.heroEyebrowDot} />
                  <Text style={styles.categoryLabel}>{formattedCategory}</Text>
                  <View style={styles.intensityBadge}>
                    <Text style={styles.intensityBadgeText}>{intensityBadge}</Text>
                  </View>
                </View>

                <Text style={styles.workoutTitle} numberOfLines={2}>
                  {workout?.title || 'Tactical Strength'}
                </Text>

                <View style={styles.metaChipsRow}>
                  <View style={styles.metaChip}>
                    <Icon name="clock" size={12} color={colors.gold} />
                    <Text style={styles.metaChipText}>{durationMin} MIN</Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <View style={styles.metaChip}>
                    <Icon name="bolt" size={12} color={colors.gold} />
                    <Text style={styles.metaChipText}>{formattedDifficulty.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <View style={styles.metaChip}>
                    <Icon name="train" size={12} color={colors.gold} />
                    <Text style={styles.metaChipText}>{exerciseCount} MOVEMENTS</Text>
                  </View>
                </View>
              </Animated.View>
            </View>
          </ImageBackground>
        </Animated.View>

        {/* 2. TECHNICAL METADATA MATRIX */}
        <Animated.View
          style={[
            styles.metadataMatrixSection,
            {
              opacity: metadataOpacity,
              transform: [{ translateY: metadataTranslateY }],
            },
          ]}
        >
          <View style={styles.metadataCard}>
            <Text style={styles.metadataLabel}>DURATION</Text>
            <Text style={styles.metadataValue}>{durationMin} MIN</Text>
          </View>
          <View style={styles.metadataCard}>
            <Text style={styles.metadataLabel}>DIFFICULTY</Text>
            <Text style={styles.metadataValue}>{formattedDifficulty.toUpperCase()}</Text>
          </View>
          <View style={styles.metadataCard}>
            <Text style={styles.metadataLabel}>EXERCISES</Text>
            <Text style={styles.metadataValue}>{exerciseCount}</Text>
          </View>
          <View style={styles.metadataCard}>
            <Text style={styles.metadataLabel}>INTENSITY</Text>
            <Text style={styles.metadataValue}>{intensityBadge}</Text>
          </View>
        </Animated.View>

        {/* 3. DETAILS BODY: THE PROTOCOL & CIRCUIT EXERCISES */}
        <Animated.View
          style={[
            styles.detailsBody,
            {
              opacity: protocolOpacity,
              transform: [{ translateY: protocolTranslateY }],
            },
          ]}
        >
          {/* THE PROTOCOL DESCRIPTION */}
          {workout?.description ? (
            <View style={styles.protocolSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderIndicator} />
                <Text style={styles.sectionHeaderTitle}>THE PROTOCOL</Text>
              </View>
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>{workout.description}</Text>
              </View>
            </View>
          ) : null}

          {/* CIRCUIT PROTOCOL EXERCISES (Example Structure Matching Reference) */}
          <View style={styles.circuitSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderIndicator} />
              <Text style={styles.sectionHeaderTitle}>CIRCUIT PROTOCOL</Text>
              <View style={styles.exerciseCountBadge}>
                <Text style={styles.exerciseCountBadgeText}>
                  {exerciseCount.toString().padStart(2, '0')} MOVEMENTS
                </Text>
              </View>
            </View>

            {workout?.exercises && workout.exercises.length > 0 ? (
              workout.exercises.map((item, index) => {
                const exerciseName =
                  item.exercise?.name || item.name || `Exercise ${index + 1}`;
                const targetMuscle =
                  item.exercise?.target_muscle_group ||
                  item.exercise?.category ||
                  item.category ||
                  'Compound Movement';
                const setsCount = (item.target_sets || 3).toString().padStart(2, '0');
                const repsCount = (item.target_reps || 10).toString().padStart(2, '0');
                const restSec = item.rest_seconds ? `${item.rest_seconds}S` : '90S';
                const orderIndex = `A${index + 1}`;

                return (
                  <View
                    key={item.id || item.exercise_id || index}
                    style={styles.exerciseCard}
                    testID={`exercise-item-${index}`}
                  >
                    {/* Top Row: Index + Name + Muscle Group */}
                    <View style={styles.exerciseCardTopRow}>
                      <Text style={styles.exerciseIndexTag}>{orderIndex}</Text>
                      <View style={styles.exerciseTitleWrap}>
                        <Text style={styles.exerciseNameText} numberOfLines={1}>
                          {exerciseName.toUpperCase()}
                        </Text>
                        <Text style={styles.exerciseMuscleText} numberOfLines={1}>
                          {targetMuscle.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Row: 3-Column Metrics Grid (SETS | REPS | REST) */}
                    <View style={styles.exerciseMetricsGrid}>
                      <View style={styles.exerciseMetricCol}>
                        <Text style={styles.exerciseMetricLabel}>SETS</Text>
                        <Text style={styles.exerciseMetricValue}>{setsCount}</Text>
                      </View>
                      <View style={styles.exerciseMetricColDivider} />
                      <View style={styles.exerciseMetricCol}>
                        <Text style={styles.exerciseMetricLabel}>REPS</Text>
                        <Text style={styles.exerciseMetricValue}>{repsCount}</Text>
                      </View>
                      <View style={styles.exerciseMetricColDivider} />
                      <View style={styles.exerciseMetricCol}>
                        <Text style={styles.exerciseMetricLabel}>REST</Text>
                        <Text style={styles.exerciseMetricValue}>{restSec}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyExercisesCard}>
                <Icon name="pulse" size={24} color={colors.gold} />
                <Text style={styles.emptyExercisesText}>
                  Full biomechanical exercise protocol will be calibrated during session initialization.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* 4. STICKY BOTTOM ACTION CTA */}
      <Animated.View
        style={[
          styles.stickyFooter,
          {
            opacity: ctaOpacity,
            transform: [{ translateY: ctaTranslateY }],
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <TouchableWithoutFeedback {...startBtnSpring}>
          <Animated.View style={{ transform: [{ scale: startBtnScale }] }}>
            <TouchableOpacity
              style={styles.startWorkoutButton}
              onPress={handleStartWorkout}
              testID="workout-details-start-button"
              accessibilityRole="button"
              accessibilityLabel="Start Live Vision Workout"
            >
              <Text style={styles.startWorkoutText}>⚡ START LIVE VISION →</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback {...manualBtnSpring}>
          <Animated.View style={{ transform: [{ scale: manualBtnScale }] }}>
            <TouchableOpacity
              style={styles.startManualBtn}
              onPress={handleStartManualWorkout}
              testID="workout-details-start-manual-button"
              accessibilityRole="button"
              accessibilityLabel="Start Manual Session"
            >
              <Text style={styles.startManualText}>📋 START MANUAL SESSION</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050607',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Hero Section ──
  heroContainer: {
    width: '100%',
    height: 380,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroTopScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(5, 6, 7, 0.45)',
  },
  heroBottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(5, 6, 7, 0.9)',
  },
  heroInnerContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  topNavOverlay: {
    width: '100%',
  },
  topNavSafeArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  headerBrand: {
    ...typography.brandWordmarkSmall,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: '800',
  },
  navSquareButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottomContent: {
    justifyContent: 'flex-end',
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  heroEyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  categoryLabel: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '800',
  },
  intensityBadge: {
    backgroundColor: 'rgba(217, 184, 63, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    marginLeft: 4,
  },
  intensityBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8.5,
    letterSpacing: 1,
    fontWeight: '800',
  },
  workoutTitle: {
    ...typography.headlineLg,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 30,
    lineHeight: 36,
    marginBottom: spacing.xs,
  },
  metaChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaChipText: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 9.5,
    letterSpacing: 1,
    fontWeight: '700',
  },
  metaDot: {
    color: colors.tertiaryText,
    fontSize: 12,
  },

  // ── Technical Metadata Matrix ──
  metadataMatrixSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: 8,
  },
  metadataCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  metadataLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 7.5,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  metadataValue: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '800',
    textAlign: 'center',
  },

  // ── Details Body ──
  detailsBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  protocolSection: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  sectionHeaderIndicator: {
    width: 3,
    height: 12,
    backgroundColor: colors.gold,
    borderRadius: 1.5,
  },
  sectionHeaderTitle: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  exerciseCountBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  exerciseCountBadgeText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1,
    fontWeight: '700',
  },
  descriptionCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
  },
  descriptionText: {
    ...typography.bodyMd,
    color: colors.secondaryText,
    lineHeight: 22,
    fontSize: 13,
  },
  circuitSection: {
    marginBottom: spacing.xl,
  },
  exerciseCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    marginBottom: 10,
  },
  exerciseCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseIndexTag: {
    fontFamily: 'serif',
    color: colors.gold,
    fontSize: 15,
    fontWeight: '700',
    width: 30,
  },
  exerciseTitleWrap: {
    flex: 1,
  },
  exerciseNameText: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 13.5,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  exerciseMuscleText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },
  exerciseMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(25, 27, 30, 0.95)',
    borderRadius: borderRadius.xs,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  exerciseMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  exerciseMetricColDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  exerciseMetricLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 2,
  },
  exerciseMetricValue: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyExercisesCard: {
    padding: spacing.xl,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyExercisesText: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
  },

  // ── Sticky Footer ──
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5, 6, 7, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  startWorkoutButton: {
    backgroundColor: colors.gold,
    height: 50,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  startWorkoutText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.8,
  },
  startManualBtn: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.4)',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startManualText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.2,
  },

  // ── Skeleton Loading ──
  skeletonTopNav: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  skeletonBody: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  skeletonHero: {
    width: '100%',
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  skeletonDetails: {
    gap: 12,
  },
  skeletonPill: {
    width: 120,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.xs,
  },
  skeletonTitle: {
    width: '80%',
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.xs,
  },
  skeletonSubTitle: {
    width: '60%',
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.xs,
    marginBottom: 8,
  },
  skeletonGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  skeletonCard: {
    flex: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.sm,
  },
  skeletonExerciseRow: {
    width: '100%',
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.sm,
  },

  // ── Error State ──
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorCard: {
    width: '100%',
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.4)',
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorTitle: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontSize: 14,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  errorRetryButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xs,
  },
  errorRetryText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
});
