import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { images } from '../assets';
import { Icon } from './Icon';
import { WorkoutItem } from '../api/client';

interface WorkoutListCardProps {
  workout: WorkoutItem;
  onPress: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const WorkoutListCard: React.FC<WorkoutListCardProps> = ({
  workout,
  onPress,
  style,
  testID,
}) => {
  const getCardImage = () => {
    switch (workout.category.toLowerCase()) {
      case 'endurance':
      case 'conditioning':
        return images.splashBg;
      case 'strength':
      case 'hypertrophy':
        return images.gymBarbell;
      case 'mobility':
      case 'recovery':
      case 'rehab':
        return images.signUpRef;
      default:
        return images.heroAthlete;
    }
  };

  const durationMin =
    workout.estimated_duration_min ??
    (workout.exercises && workout.exercises.length > 0
      ? workout.exercises.length * 5
      : workout.category === 'mobility' ? 30 : 45);

  const getIntensityBadge = () => {
    if (workout.difficulty === 'elite' || workout.difficulty === 'advanced') {
      return 'HIGH INTENSITY';
    }
    if (workout.category === 'endurance' || workout.category === 'conditioning') {
      return 'LIVE';
    }
    return 'AI OPTIMIZED';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, style]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Workout: ${workout.title}, Category: ${workout.category}, Duration: ${durationMin} minutes`}
    >
      {/* Top Half: Image with Badge */}
      <View style={styles.imageContainer}>
        <ImageBackground
          source={getCardImage()}
          style={styles.imageBackground}
          imageStyle={styles.image}
        >
          <View style={styles.imageOverlay}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{getIntensityBadge()}</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Bottom Half: Content Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.categoryText}>
          {workout.category.charAt(0).toUpperCase() + workout.category.slice(1)}
        </Text>
        <Text style={styles.titleText} numberOfLines={1}>
          {workout.title}
        </Text>
        {workout.description ? (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {workout.description}
          </Text>
        ) : null}

        <View style={styles.footerRow}>
          <View style={styles.durationRow}>
            <Icon name="clock" size={14} color={colors.secondaryText} style={styles.clockIcon} />
            <Text style={styles.durationText}>{durationMin} MIN</Text>
          </View>
          <View style={styles.playButton}>
            <Icon name="play" size={14} color={colors.gold} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  imageContainer: {
    width: '100%',
    height: 175,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  image: {
    resizeMode: 'cover',
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 7, 0.45)',
    padding: spacing.md,
    justifyContent: 'flex-start',
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 17, 19, 0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeText: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  infoContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  categoryText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  titleText: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 21,
    lineHeight: 26,
    marginBottom: 6,
  },
  descriptionText: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    marginRight: 6,
  },
  durationText: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
