import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ViewStyle,
  Animated,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
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
  const cardScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.982,
      useNativeDriver: true,
      speed: 40,
      bounciness: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const getCardImage = () => {
    const cat = (workout.category || '').toLowerCase();
    switch (cat) {
      case 'endurance':
      case 'conditioning':
        return images.splashBg;
      case 'strength':
      case 'hypertrophy':
      case 'power':
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
      : workout.category === 'mobility'
      ? 30
      : 45);

  const getIntensityBadge = () => {
    const diff = (workout.difficulty || '').toLowerCase();
    const cat = (workout.category || '').toLowerCase();
    if (diff === 'elite' || diff === 'advanced') {
      return 'HIGH INTENSITY';
    }
    if (cat === 'endurance' || cat === 'conditioning') {
      return 'LIVE';
    }
    return 'AI OPTIMIZED';
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Workout: ${workout.title}, Category: ${workout.category}, Duration: ${durationMin} minutes`}
    >
      <Animated.View
        style={[
          styles.card,
          style,
          {
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        {/* Top Half: Cinematic Athlete Image with Badge */}
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

        {/* Bottom Half: High-Contrast Editorial Content */}
        <View style={styles.infoContainer}>
          <Text style={styles.categoryText}>
            {workout.category
              ? workout.category.charAt(0).toUpperCase() + workout.category.slice(1)
              : 'Protocol'}
          </Text>

          <Text style={styles.titleText} numberOfLines={1}>
            {workout.title}
          </Text>

          {workout.description ? (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {workout.description}
            </Text>
          ) : null}

          {/* Footer Metadata & Play Action */}
          <View style={styles.footerRow}>
            <View style={styles.durationRow}>
              <Icon name="clock" size={13} color={colors.gold} style={styles.clockIcon} />
              <Text style={styles.durationText}>{durationMin} MIN</Text>
            </View>

            <View style={styles.playButton}>
              <Icon name="play" size={13} color={colors.gold} />
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 190,
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
    backgroundColor: 'rgba(5, 6, 7, 0.4)',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(10, 12, 14, 0.82)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeText: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 8.5,
    letterSpacing: 1.4,
    fontWeight: '800',
  },
  infoContainer: {
    padding: spacing.md,
    backgroundColor: 'rgba(18, 20, 22, 0.98)',
  },
  categoryText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10.5,
    letterSpacing: 1.5,
    fontWeight: '800',
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
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockIcon: {
    marginRight: 2,
  },
  durationText: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.6)',
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

