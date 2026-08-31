import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { images } from '../assets';
import { WorkoutItem } from '../api/client';

interface WorkoutCardProps {
  workout: WorkoutItem;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onPress,
  style,
  testID,
}) => {
  // Select an appropriate background visual asset based on category or default
  const getCardImage = () => {
    switch (workout.category) {
      case 'endurance':
        return images.splashBg;
      case 'strength':
      case 'hypertrophy':
        return images.gymBarbell;
      default:
        return images.heroAthlete;
    }
  };

  const durationMin = workout.estimated_duration_min ?? (workout.exercises?.length ? workout.exercises.length * 5 : 30);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Workout: ${workout.title}, Category: ${workout.category}, Duration: ${durationMin} minutes`}
    >
      <ImageBackground
        source={getCardImage()}
        style={styles.imageBackground}
        imageStyle={styles.image}
      >
        <View style={styles.overlay}>
          {/* Top Row: Duration Badge */}
          <View style={styles.topRow}>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{durationMin} MIN</Text>
            </View>
          </View>

          {/* Bottom Info: Category & Title */}
          <View style={styles.bottomContent}>
            <Text style={styles.categoryText}>{workout.category.toUpperCase()}</Text>
            <Text style={styles.titleText} numberOfLines={1} ellipsizeMode="tail">
              {workout.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.difficultyText}>
                {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
              </Text>
              {workout.exercises && workout.exercises.length > 0 ? (
                <Text style={styles.exerciseCountText}>
                  • {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 160,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: spacing.md,
    backgroundColor: colors.surfaceDim,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  image: {
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 7, 0.72)',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  durationBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  durationText: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bottomContent: {
    justifyContent: 'flex-end',
  },
  categoryText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  titleText: {
    ...typography.headlineSm,
    color: colors.primaryText,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'serif',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyText: {
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 11,
  },
  exerciseCountText: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 11,
    marginLeft: 4,
  },
});
