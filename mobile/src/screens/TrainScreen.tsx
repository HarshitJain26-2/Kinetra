/**
 * Kinetra Train Quick Start Hub (Phase 35)
 * Exact Stitch luxury dark athletic design matching Screen 3 (Train Quick Start Hub).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { images } from '../assets';

interface TrainScreenProps {
  navigation?: any;
}

export const TrainScreen: React.FC<TrainScreenProps> = ({ navigation }) => {
  const handleStartAIVision = () => {
    if (navigation?.navigate) {
      navigation.navigate('LiveWorkout', {
        workoutId: 'quick-squat',
        workout: {
          id: 'quick-squat',
          title: 'Barbell Squat',
          category: 'strength',
          difficulty: 'medium',
        },
        exercise: {
          id: 'ex-squat',
          name: 'Barbell Squat',
        },
        setNumber: 1,
      });
    }
  };

  const handleStartManualSession = () => {
    if (navigation?.navigate) {
      navigation.navigate('ManualWorkout', {
        workoutId: 'quick-manual',
        workout: {
          id: 'quick-manual',
          title: 'Strength Conditioning Protocol',
          category: 'strength',
          difficulty: 'medium',
          exercises: [
            {
              exercise_id: '11111111-0000-0000-0000-000000000001',
              name: 'Barbell Back Squat',
              target_sets: 4,
              target_reps: 8,
              target_weight_kg: 100,
              order_index: 0,
            },
            {
              exercise_id: '11111111-0000-0000-0000-000000000002',
              name: 'Overhead Press',
              target_sets: 3,
              target_reps: 10,
              target_weight_kg: 60,
              order_index: 1,
            },
          ],
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => navigation?.navigate('Profile')}
        >
          <Icon name="profile" size={16} color={colors.gold} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>KINETRA</Text>

        <TouchableOpacity
          style={styles.gearButton}
          onPress={() => navigation?.navigate('Profile')}
        >
          <Icon name="gear" size={16} color={colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE */}
        <Text style={styles.mainTitle}>Train Quick{'\n'}Start Hub</Text>
        <Text style={styles.subtitle}>
          Command your session. Engage AI tracking for precision metrics, or initiate a manual log for freeform performance.
        </Text>

        {/* 1. START AI VISION TRAINING CARD */}
        <TouchableOpacity
          style={styles.hubCardContainer}
          activeOpacity={0.9}
          onPress={handleStartAIVision}
          testID="train-quick-start-vision-card"
        >
          <ImageBackground
            source={images.splashBg}
            style={styles.hubCardBg}
            imageStyle={styles.hubCardImage}
          >
            <View style={styles.hubCardOverlay}>
              <View style={styles.liveTrackingBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTrackingText}>LIVE TRACKING</Text>
              </View>

              <Text style={styles.hubCardTitle}>
                START AI VISION{'\n'}TRAINING
              </Text>
              <Text style={styles.hubCardDescription}>
                Activate camera for real-time form analysis, rep counting, and biomechanical feedback.
              </Text>

              <View style={styles.ctaPillWhite}>
                <Text style={styles.ctaPillTextBlack}>INITIALIZE CORE →</Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* 2. START MANUAL SESSION CARD */}
        <TouchableOpacity
          style={styles.hubCardContainer}
          activeOpacity={0.9}
          onPress={handleStartManualSession}
          testID="train-quick-start-manual-card"
        >
          <ImageBackground
            source={images.gymBarbell}
            style={styles.hubCardBg}
            imageStyle={styles.hubCardImage}
          >
            <View style={styles.hubCardOverlay}>
              <Text style={styles.hubCardTitle}>
                START MANUAL{'\n'}SESSION
              </Text>
              <Text style={styles.hubCardDescription}>
                Log your sets, reps, and load independently. Ideal for unstructured strength blocks.
              </Text>

              <View style={styles.ctaPillGoldBorder}>
                <Text style={styles.ctaPillTextGold}>ENTER DETAILS →</Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  brandTitle: {
    ...typography.brandWordmarkSmall,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 3,
  },
  gearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  mainTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '800',
    color: colors.primaryText,
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  hubCardContainer: {
    height: 220,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  hubCardBg: {
    flex: 1,
  },
  hubCardImage: {
    resizeMode: 'cover',
  },
  hubCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 7, 0.72)',
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  liveTrackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.crimson,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.crimson,
    marginRight: 6,
  },
  liveTrackingText: {
    ...typography.labelCaps,
    color: colors.crimson,
    fontSize: 9,
    fontWeight: '800',
  },
  hubCardTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '800',
    color: colors.primaryText,
    fontSize: 20,
    lineHeight: 24,
  },
  hubCardDescription: {
    ...typography.caption,
    color: colors.secondaryText,
    lineHeight: 16,
    maxWidth: '90%',
  },
  ctaPillWhite: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
  },
  ctaPillTextBlack: {
    ...typography.labelCaps,
    color: '#050607',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  ctaPillGoldBorder: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceDim,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
  },
  ctaPillTextGold: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});
