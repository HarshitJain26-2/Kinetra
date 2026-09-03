/**
 * Kinetra Train Quick Start Hub (Section 23: Train Quick Start Refinement)
 * Exact Stitch luxury dark athletic design matching Train Quick Start Hub reference.
 */

import React, { useEffect, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { images } from '../assets';

interface TrainScreenProps {
  navigation?: any;
}

export const TrainScreen: React.FC<TrainScreenProps> = ({ navigation }) => {
  const hookNavigation = useNavigation<any>();
  const nav = navigation || hookNavigation;

  // 4-Phase Staggered Entrance Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const identityOpacity = useRef(new Animated.Value(0)).current;
  const identityTranslateY = useRef(new Animated.Value(10)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1TranslateY = useRef(new Animated.Value(12)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2TranslateY = useRef(new Animated.Value(14)).current;

  // Tactile Spring Scales
  const avatarBtnScale = useRef(new Animated.Value(1)).current;
  const gearBtnScale = useRef(new Animated.Value(1)).current;
  const visionCardScale = useRef(new Animated.Value(1)).current;
  const manualCardScale = useRef(new Animated.Value(1)).current;
  const visionCtaScale = useRef(new Animated.Value(1)).current;
  const manualCtaScale = useRef(new Animated.Value(1)).current;

  const createSpring = (val: Animated.Value, down = 0.96, back = 1) => ({
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

  const avatarSpring = createSpring(avatarBtnScale, 0.90, 1);
  const gearSpring = createSpring(gearBtnScale, 0.90, 1);
  const visionCardSpring = createSpring(visionCardScale, 0.98, 1);
  const manualCardSpring = createSpring(manualCardScale, 0.98, 1);
  const visionCtaSpring = createSpring(visionCtaScale, 0.94, 1);
  const manualCtaSpring = createSpring(manualCtaScale, 0.94, 1);

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
        card1Opacity.setValue(1);
        card1TranslateY.setValue(0);
        card2Opacity.setValue(1);
        card2TranslateY.setValue(0);
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
        // Phase 2: Hero Identity
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
        // Phase 3: AI Vision Training Card
        Animated.parallel([
          Animated.timing(card1Opacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(card1TranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Manual Session Card
        Animated.parallel([
          Animated.timing(card2Opacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(card2TranslateY, {
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

  const handleStartAIVision = () => {
    if (nav?.navigate) {
      nav.navigate('LiveWorkout', {
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
    if (nav?.navigate) {
      nav.navigate('ManualWorkout', {
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
      {/* 1. TOP HEADER (Stitch Reference) */}
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
          {...avatarSpring}
          onPress={() => nav?.navigate('Profile')}
          testID="train-header-avatar"
          accessibilityRole="button"
          accessibilityLabel="Open Athlete Profile"
        >
          <Animated.View
            style={[
              styles.navCircleButton,
              { transform: [{ scale: avatarBtnScale }] },
            ]}
          >
            <Icon name="profile" size={16} color={colors.gold} />
          </Animated.View>
        </TouchableWithoutFeedback>

        <Text style={styles.brandTitle}>KINETRA</Text>

        <TouchableWithoutFeedback
          {...gearSpring}
          onPress={() => nav?.navigate('Profile')}
          testID="train-header-settings"
          accessibilityRole="button"
          accessibilityLabel="Open Settings"
        >
          <Animated.View
            style={[
              styles.navCircleButton,
              { transform: [{ scale: gearBtnScale }] },
            ]}
          >
            <Icon name="gear" size={16} color={colors.gold} />
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. EDITORIAL HERO & TRAINING IDENTITY */}
        <Animated.View
          style={[
            styles.identitySection,
            {
              opacity: identityOpacity,
              transform: [{ translateY: identityTranslateY }],
            },
          ]}
        >
          <Text style={styles.eyebrowText}>TRAIN // PERFORMANCE PROTOCOL</Text>
          <Text style={styles.mainTitle}>Train Quick{'\n'}Start Hub</Text>
          <Text style={styles.subtitle}>
            Command your session. Engage AI tracking for precision metrics, or initiate a manual log for freeform performance.
          </Text>
        </Animated.View>

        {/* 3. CARD 1: START AI VISION TRAINING (Stitch Reference) */}
        <Animated.View
          style={[
            {
              opacity: card1Opacity,
              transform: [{ translateY: card1TranslateY }, { scale: visionCardScale }],
            },
          ]}
        >
          <TouchableWithoutFeedback
            {...visionCardSpring}
            onPress={handleStartAIVision}
            testID="train-quick-start-vision-card"
            accessibilityRole="button"
            accessibilityLabel="Start AI Vision Training"
          >
            <View style={styles.hubCardContainer}>
              <ImageBackground
                source={images.splashBg}
                style={styles.hubCardBg}
                imageStyle={styles.hubCardImage}
              >
                <View style={styles.hubCardOverlay}>
                  {/* LIVE TRACKING BADGE */}
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

                  {/* CTA BUTTON */}
                  <TouchableWithoutFeedback
                    {...visionCtaSpring}
                    onPress={handleStartAIVision}
                    testID="train-start-vision-button"
                    accessibilityRole="button"
                    accessibilityLabel="Initialize Vision Core"
                  >
                    <Animated.View
                      style={[
                        styles.ctaPillWhite,
                        { transform: [{ scale: visionCtaScale }] },
                      ]}
                    >
                      <Text style={styles.ctaPillTextBlack}>INITIALIZE CORE →</Text>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                </View>
              </ImageBackground>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* 4. CARD 2: START MANUAL SESSION (Stitch Reference) */}
        <Animated.View
          style={[
            {
              opacity: card2Opacity,
              transform: [{ translateY: card2TranslateY }, { scale: manualCardScale }],
            },
          ]}
        >
          <TouchableWithoutFeedback
            {...manualCardSpring}
            onPress={handleStartManualSession}
            testID="train-quick-start-manual-card"
            accessibilityRole="button"
            accessibilityLabel="Start Manual Session"
          >
            <View style={styles.hubCardContainer}>
              <ImageBackground
                source={images.gymBarbell}
                style={styles.hubCardBg}
                imageStyle={styles.hubCardImage}
              >
                <View style={styles.hubCardOverlay}>
                  <View style={styles.manualModeBadge}>
                    <Icon name="bolt" size={10} color={colors.gold} style={{ marginRight: 4 }} />
                    <Text style={styles.manualModeBadgeText}>CONTROLLED EXECUTION</Text>
                  </View>

                  <Text style={styles.hubCardTitle}>
                    START MANUAL{'\n'}SESSION
                  </Text>
                  <Text style={styles.hubCardDescription}>
                    Log your sets, reps, and load independently. Ideal for unstructured strength blocks.
                  </Text>

                  {/* CTA BUTTON */}
                  <TouchableWithoutFeedback
                    {...manualCtaSpring}
                    onPress={handleStartManualSession}
                    testID="train-start-manual-button"
                    accessibilityRole="button"
                    accessibilityLabel="Enter Session Details"
                  >
                    <Animated.View
                      style={[
                        styles.ctaPillGoldBorder,
                        { transform: [{ scale: manualCtaScale }] },
                      ]}
                    >
                      <Text style={styles.ctaPillTextGold}>ENTER DETAILS →</Text>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                </View>
              </ImageBackground>
            </View>
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
  brandTitle: {
    ...typography.brandWordmarkSmall,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + 24,
  },

  // ── Hero Section ──
  identitySection: {
    marginBottom: spacing.lg,
  },
  eyebrowText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: 6,
  },
  mainTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 6,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    lineHeight: 19,
    fontSize: 12.5,
  },

  // ── Hub Cards ──
  hubCardContainer: {
    height: 230,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  hubCardBg: {
    flex: 1,
  },
  hubCardImage: {
    resizeMode: 'cover',
  },
  hubCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 7, 0.76)',
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  liveTrackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(230, 57, 70, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.45)',
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
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  manualModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
  },
  manualModeBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  hubCardTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 21,
    lineHeight: 26,
  },
  hubCardDescription: {
    ...typography.caption,
    color: colors.secondaryText,
    lineHeight: 17,
    fontSize: 12,
    maxWidth: '92%',
  },
  ctaPillWhite: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: borderRadius.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ctaPillTextBlack: {
    ...typography.labelCaps,
    color: '#050607',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  ctaPillGoldBorder: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.5)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: borderRadius.xs,
  },
  ctaPillTextGold: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
