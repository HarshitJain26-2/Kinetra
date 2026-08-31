import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { KinetraButton } from '../components/KinetraButton';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { InlineError } from '../components/InlineError';
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
          // If we had initialWorkout, keep it and just stop loading
          if (!workout) {
            setError(err?.message || 'Unable to load workout protocol details.');
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + Math.max(insets.bottom, 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={getHeroImage()}
            style={styles.heroBackground}
            imageStyle={styles.heroImage}
          >
            <View style={styles.heroOverlay}>
              {/* Top Navigation Bar Overlay */}
              <SafeAreaView edges={['top']} style={styles.topNavOverlay}>
                <TouchableOpacity
                  style={styles.navSquareButton}
                  onPress={handleBack}
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
                  testID="workout-details-back-button"
                >
                  <Icon name="back" size={20} color={colors.primaryText} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navSquareButton}
                  onPress={handleToggleBookmark}
                  accessibilityLabel="Bookmark workout"
                  accessibilityRole="button"
                  testID="workout-details-bookmark-button"
                >
                  <Icon
                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isBookmarked ? colors.gold : colors.primaryText}
                  />
                </TouchableOpacity>
              </SafeAreaView>

              {/* Title & Metadata Bottom Hero Area */}
              <View style={styles.heroBottomContent}>
                <Text style={styles.categoryLabel}>{formattedCategory}</Text>
                <Text style={styles.workoutTitle} numberOfLines={2}>
                  {workout?.title || 'Tactical Strength'}
                </Text>

                <View style={styles.metaChipsRow}>
                  <View style={styles.metaChip}>
                    <Icon name="clock" size={13} color={colors.secondaryText} />
                    <Text style={styles.metaChipText}>{durationMin} Min</Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <View style={styles.metaChip}>
                    <Icon name="bolt" size={13} color={colors.secondaryText} />
                    <Text style={styles.metaChipText}>{formattedDifficulty}</Text>
                  </View>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* LOADING & ERROR BANNER */}
        {loading && !workout ? (
          <View style={styles.loadingWrapper}>
            <LoadingIndicator message="Loading workout details..." />
          </View>
        ) : error && !workout ? (
          <View style={styles.errorWrapper}>
            <InlineError message={error} />
          </View>
        ) : (
          <View style={styles.detailsBody}>
            {/* DESCRIPTION CARD */}
            {workout?.description ? (
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>{workout.description}</Text>
              </View>
            ) : null}

            {/* CIRCUIT PROTOCOL EXERCISES */}
            <View style={styles.circuitSection}>
              <Text style={styles.circuitTitle}>Circuit Protocol</Text>

              {workout?.exercises && workout.exercises.length > 0 ? (
                workout.exercises.map((item, index) => {
                  const exerciseName =
                    item.exercise?.name || item.name || `Exercise ${index + 1}`;
                  const targetMuscle =
                    item.exercise?.target_muscle_group ||
                    item.exercise?.category ||
                    item.category ||
                    'Compound Movement';
                  const setsCount = item.target_sets || 3;
                  const repsCount = item.target_reps || 10;

                  return (
                    <View
                      key={item.id || item.exercise_id || index}
                      style={styles.exerciseCard}
                      testID={`exercise-item-${index}`}
                    >
                      {/* Exercise Thumbnail */}
                      <View style={styles.exerciseThumb}>
                        <Icon name="train" size={20} color={colors.gold} />
                      </View>

                      {/* Exercise Info */}
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseNameText} numberOfLines={1}>
                          {exerciseName}
                        </Text>
                        <Text style={styles.exerciseMuscleText} numberOfLines={1}>
                          {targetMuscle}
                        </Text>
                      </View>

                      {/* Sets & Reps Details */}
                      <View style={styles.exerciseTargetContainer}>
                        <View style={styles.setsBadge}>
                          <Text style={styles.setsText}>{setsCount} Sets</Text>
                        </View>
                        <Text style={styles.repsText}>
                          {repsCount} {item.target_reps ? 'Reps' : 'Sec'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyExercisesCard}>
                  <Text style={styles.emptyExercisesText}>
                    Full biomechanical exercise protocol will be loaded during session initialization.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* STICKY BOTTOM ACTION CTA */}
      <View
        style={[
          styles.stickyFooter,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <KinetraButton
          title="START WORKOUT ▶"
          variant="primary"
          onPress={handleStartWorkout}
          style={styles.startWorkoutButton}
          textStyle={styles.startWorkoutText}
          testID="workout-details-start-button"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
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
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 7, 0.65)',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  topNavOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  navSquareButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(15, 17, 19, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottomContent: {
    justifyContent: 'flex-end',
  },
  categoryLabel: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  workoutTitle: {
    ...typography.headlineLg,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 38,
    marginBottom: spacing.sm,
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
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 12,
  },
  metaDot: {
    color: colors.tertiaryText,
    fontSize: 12,
  },
  loadingWrapper: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  errorWrapper: {
    padding: spacing.lg,
  },
  detailsBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  descriptionCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.xl,
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
  circuitTitle: {
    ...typography.headlineSm,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 22,
    marginBottom: spacing.md,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseThumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseNameText: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  exerciseMuscleText: {
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 11,
  },
  exerciseTargetContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  setsBadge: {
    backgroundColor: 'rgba(217, 184, 63, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    marginBottom: 4,
  },
  setsText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
  },
  repsText: {
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 11,
  },
  emptyExercisesCard: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  emptyExercisesText: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5, 6, 7, 0.94)',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  startWorkoutButton: {
    backgroundColor: colors.gold,
    height: 52,
  },
  startWorkoutText: {
    color: colors.inverseText,
    fontSize: 13,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
});
