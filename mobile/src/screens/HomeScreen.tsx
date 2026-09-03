import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ImageBackground,
  Alert,
  Animated,
  Easing,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { apiClient, UserProfileData, WorkoutItem, UserDashboardMetrics } from '../api/client';
import { Icon } from '../components/Icon';
import { MetricCard } from '../components/MetricCard';
import { WorkoutCard } from '../components/WorkoutCard';
import { images } from '../assets';

interface HomeScreenProps {
  navigation?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [metrics, setMetrics] = useState<UserDashboardMetrics>({
    formScore: null,
    formScoreDelta: null,
    activeMins: null,
    activeMinsPeriod: null,
    caloriesBurned: null,
  });

  const [loadingWorkouts, setLoadingWorkouts] = useState<boolean>(true);
  const [workoutError, setWorkoutError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Animation values for cinematic entrance sequence
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(14)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(18)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsTranslateY = useRef(new Animated.Value(14)).current;
  const curatedOpacity = useRef(new Animated.Value(0)).current;
  const curatedTranslateY = useRef(new Animated.Value(14)).current;
  const nutritionOpacity = useRef(new Animated.Value(0)).current;

  // Tactile button scales
  const startSessionScale = useRef(new Animated.Value(1)).current;
  const nutritionCardScale = useRef(new Animated.Value(1)).current;
  const bellScale = useRef(new Animated.Value(1)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const getAthleteName = () => {
    if (profile?.display_name && profile.display_name.trim().length > 0) {
      return profile.display_name.trim();
    }
    if (user?.user_metadata?.full_name && user.user_metadata.full_name.trim().length > 0) {
      return user.user_metadata.full_name.trim();
    }
    if (user?.email) {
      const namePart = user.email.split('@')[0];
      if (namePart && namePart.length > 0) {
        return namePart.charAt(0).toUpperCase() + namePart.slice(1);
      }
    }
    return 'Elite';
  };

  const loadDashboardData = useCallback(async () => {
    setWorkoutError(null);
    try {
      // 1. Fetch user profile from backend
      try {
        const userProfile = await apiClient.getCurrentUserProfile();
        if (userProfile) {
          setProfile(userProfile);
        }
      } catch {
        // Fallback gracefully without breaking dashboard
      }

      // 2. Fetch curated workouts from backend
      setLoadingWorkouts(true);
      try {
        const workoutList = await apiClient.getWorkouts({ limit: 10 });
        setWorkouts(Array.isArray(workoutList) ? workoutList : []);
      } catch (err: any) {
        setWorkoutError('Unable to load workouts. Tap to retry.');
      } finally {
        setLoadingWorkouts(false);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Entrance animation runner
  useEffect(() => {
    let isMounted = true;
    let animComposite: Animated.CompositeAnimation | null = null;

    const runEntrance = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(
        () => false
      );

      if (!isMounted) return;

      if (reduceMotion) {
        bgOpacity.setValue(1);
        headerOpacity.setValue(1);
        headerTranslateY.setValue(0);
        heroOpacity.setValue(1);
        heroTranslateY.setValue(0);
        ctaOpacity.setValue(1);
        statsOpacity.setValue(1);
        statsTranslateY.setValue(0);
        curatedOpacity.setValue(1);
        curatedTranslateY.setValue(0);
        nutritionOpacity.setValue(1);
        return;
      }

      // Cinematic staggered entrance sequence
      animComposite = Animated.sequence([
        // 1. Canvas fade
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // 2. Header & Greeting
        Animated.parallel([
          Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // 3. Daily Focus Hero Card
        Animated.parallel([
          Animated.timing(heroOpacity, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(heroTranslateY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ctaOpacity, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // 4. Quick Stats Metrics Section
        Animated.parallel([
          Animated.timing(statsOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(statsTranslateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // 5. Curated Workouts Carousel
        Animated.parallel([
          Animated.timing(curatedOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(curatedTranslateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // 6. Precision Nutrition Shortcut
        Animated.timing(nutritionOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

      animComposite.start();
    };

    runEntrance();

    return () => {
      isMounted = false;
      if (animComposite) {
        animComposite.stop();
      }
    };
  }, [
    bgOpacity,
    headerOpacity,
    headerTranslateY,
    heroOpacity,
    heroTranslateY,
    ctaOpacity,
    statsOpacity,
    statsTranslateY,
    curatedOpacity,
    curatedTranslateY,
    nutritionOpacity,
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  const handleStartSession = (workout?: WorkoutItem) => {
    if (workout && navigation?.navigate) {
      navigation.navigate('WorkoutDetails', {
        workoutId: workout.id,
        initialWorkout: workout,
      });
    } else if (navigation?.navigate) {
      navigation.navigate('Explore');
    }
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'All performance alerts and telemetry are up to date.');
  };

  const handleProfilePress = () => {
    if (navigation?.navigate) {
      navigation.navigate('Profile');
    }
  };

  const handleViewAllWorkouts = () => {
    if (navigation?.navigate) {
      navigation.navigate('Explore');
    }
  };

  // Tactile spring feedback helper
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

  const sessionBtnSpring = createSpring(startSessionScale, 0.965, 1);
  const nutritionCardSpring = createSpring(nutritionCardScale, 0.98, 1);
  const bellSpring = createSpring(bellScale, 0.92, 1);
  const avatarSpring = createSpring(avatarScale, 0.92, 1);

  const primaryWorkout: WorkoutItem | null = workouts.length > 0 ? workouts[0] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Animated.View style={[styles.canvas, { opacity: bgOpacity }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
              colors={[colors.gold]}
            />
          }
        >
          {/* 1. TOP EDITORIAL HEADER */}
          <Animated.View
            style={[
              styles.topHeader,
              {
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
          >
            <View>
              <Text style={styles.brandTitle}>KINETRA</Text>
              <Text style={styles.brandSubtitle}>PERFORMANCE OS</Text>
            </View>

            <View style={styles.headerRightRow}>
              {/* Notification Bell */}
              <TouchableWithoutFeedback
                {...bellSpring}
                onPress={handleNotificationPress}
                accessibilityLabel="Notifications"
                accessibilityRole="button"
              >
                <Animated.View
                  style={[
                    styles.headerIconButton,
                    { transform: [{ scale: bellScale }] },
                  ]}
                >
                  <Icon name="bell" size={17} color={colors.primaryText} />
                  <View style={styles.notificationLiveDot} />
                </Animated.View>
              </TouchableWithoutFeedback>

              {/* Profile Avatar Trigger */}
              <TouchableWithoutFeedback
                {...avatarSpring}
                onPress={handleProfilePress}
                accessibilityLabel="View Athlete Profile"
                accessibilityRole="button"
              >
                <Animated.View
                  style={[
                    styles.avatarBadgeButton,
                    { transform: [{ scale: avatarScale }] },
                  ]}
                >
                  <Icon name="profile" size={15} color={colors.gold} />
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </Animated.View>

          {/* 2. ATHLETE CONTEXTUAL GREETING */}
          <Animated.View
            style={[
              styles.greetingSection,
              {
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
          >
            <Text style={styles.greetingTimeLabel}>{getGreetingTime()}</Text>
            <Text style={styles.athleteDisplayName} numberOfLines={1}>
              {getAthleteName()}
            </Text>
            <View style={styles.telemetryStatusRow}>
              <View style={styles.telemetryLiveDot} />
              <Text style={styles.greetingSubtext}>
                ON-DEVICE AI TELEMETRY SYNCHRONIZED
              </Text>
            </View>
          </Animated.View>

          {/* 3. DAILY FOCUS HERO CARD */}
          <Animated.View
            style={[
              styles.dailyFocusContainer,
              {
                opacity: heroOpacity,
                transform: [{ translateY: heroTranslateY }],
              },
            ]}
          >
            <ImageBackground
              source={images.gymBarbell}
              style={styles.dailyFocusBackground}
              imageStyle={styles.dailyFocusImage}
            >
              <View style={styles.dailyFocusOverlay}>
                {/* Status Badges */}
                <View style={styles.badgeRow}>
                  <View style={styles.dailyFocusBadge}>
                    <Icon name="bolt" size={11} color={colors.gold} style={styles.badgeIcon} />
                    <Text style={styles.dailyFocusBadgeText}>DAILY FOCUS</Text>
                  </View>
                  <View style={styles.aiOptimizedBadge}>
                    <Icon name="sparkle" size={11} color={colors.secondaryText} style={styles.badgeIcon} />
                    <Text style={styles.aiOptimizedBadgeText}>AI OPTIMIZED</Text>
                  </View>
                </View>

                {/* Workout Title & Focus Description */}
                <Text style={styles.focusTitle}>
                  {primaryWorkout?.title || 'Tactical Strength'}
                </Text>
                <Text style={styles.focusSubtitle} numberOfLines={2}>
                  {primaryWorkout?.description ||
                    'Focus: Lower Body Power & Core Stabilization'}
                </Text>

                {/* Duration & Intensity Meta Chips */}
                <View style={styles.focusMetaRow}>
                  <View style={styles.metaChip}>
                    <Icon name="clock" size={12} color={colors.gold} />
                    <Text style={styles.metaChipText}>
                      {primaryWorkout?.estimated_duration_min || 45} MIN
                    </Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Icon name="flame" size={12} color={colors.crimson} />
                    <Text style={styles.metaChipText}>
                      {primaryWorkout?.difficulty
                        ? `${primaryWorkout.difficulty.toUpperCase()} INTENSITY`
                        : 'HIGH INTENSITY'}
                    </Text>
                  </View>
                </View>

                {/* Dominant Primary CTA */}
                <Animated.View style={{ opacity: ctaOpacity }}>
                  <TouchableWithoutFeedback
                    {...sessionBtnSpring}
                    onPress={() => handleStartSession(primaryWorkout || undefined)}
                    testID="home-start-session-button"
                    accessibilityRole="button"
                    accessibilityLabel="Start Session"
                  >
                    <Animated.View
                      style={[
                        styles.startSessionButton,
                        { transform: [{ scale: startSessionScale }] },
                      ]}
                    >
                      <Text style={styles.startSessionButtonText}>START SESSION</Text>
                      <Text style={styles.startSessionArrow}>→</Text>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                </Animated.View>
              </View>
            </ImageBackground>
          </Animated.View>

          {/* 4. PERFORMANCE STATS SECTION (FORM SCORE, ACTIVE MINS, CALORIES) */}
          <Animated.View
            style={[
              styles.statsSection,
              {
                opacity: statsOpacity,
                transform: [{ translateY: statsTranslateY }],
              },
            ]}
          >
            <View style={styles.sectionHeaderCompact}>
              <Text style={styles.sectionEyebrow}>TELEMETRY SNAPSHOT</Text>
            </View>

            <MetricCard
              label="FORM SCORE"
              value={metrics.formScore}
              deltaOrSubtitle={metrics.formScoreDelta}
              iconName="shield"
              iconColor={colors.gold}
              progressPercent={metrics.formScore || 0}
              indicatorType="solid"
              indicatorColor={colors.gold}
              testID="metric-form-score"
            />

            <MetricCard
              label="ACTIVE MINS"
              value={metrics.activeMins}
              deltaOrSubtitle={metrics.activeMinsPeriod || (metrics.activeMins !== null ? 'This Week' : null)}
              iconName="pulse"
              iconColor={colors.secondaryText}
              progressPercent={metrics.activeMins ? Math.min(100, (metrics.activeMins / 150) * 100) : 0}
              indicatorType="segmented"
              indicatorColor={colors.primaryText}
              testID="metric-active-mins"
            />

            <MetricCard
              label="CALORIES"
              value={metrics.caloriesBurned}
              deltaOrSubtitle={metrics.caloriesBurned !== null ? 'kcal burned' : null}
              iconName="flame"
              iconColor={colors.crimson}
              progressPercent={metrics.caloriesBurned ? Math.min(100, (metrics.caloriesBurned / 1000) * 100) : 0}
              indicatorType="segmented"
              indicatorColor={colors.crimson}
              testID="metric-calories"
            />
          </Animated.View>

          {/* 5. CURATED FOR YOU / WORKOUT PROTOCOLS CAROUSEL */}
          <Animated.View
            style={[
              styles.curatedSection,
              {
                opacity: curatedOpacity,
                transform: [{ translateY: curatedTranslateY }],
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionEyebrow}>CURATED PROTOCOLS</Text>
                <Text style={styles.sectionTitle}>Curated For You</Text>
              </View>
              <TouchableOpacity
                onPress={handleViewAllWorkouts}
                testID="home-view-all-workouts"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="View All Curated Workouts"
              >
                <Text style={styles.viewAllText}>VIEW ALL →</Text>
              </TouchableOpacity>
            </View>

            {loadingWorkouts ? (
              <View style={styles.loadingContainer}>
                <View style={styles.skeletonCarouselRow}>
                  {[1, 2].map((skIdx) => (
                    <View key={`sk-${skIdx}`} style={styles.skeletonCard}>
                      <View style={styles.skeletonBadge} />
                      <View style={styles.skeletonTitle} />
                      <View style={styles.skeletonSubtitle} />
                    </View>
                  ))}
                </View>
              </View>
            ) : workoutError ? (
              <View style={styles.errorContainer}>
                <View style={styles.errorCard}>
                  <Icon name="warning" size={18} color={colors.crimson} style={{ marginBottom: 6 }} />
                  <Text style={styles.errorCardTitle}>TELEMETRY INTERRUPTED</Text>
                  <Text style={styles.errorCardBody}>{workoutError}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadDashboardData}
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading workouts"
                  >
                    <Text style={styles.retryButtonText}>RETRY CONNECTION ⟳</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : workouts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyCard}>
                  <Icon name="explore" size={24} color={colors.tertiaryText} style={{ marginBottom: 6 }} />
                  <Text style={styles.emptyTitle}>No Curated Protocols</Text>
                  <Text style={styles.emptySubtitle}>No workout protocols assigned to this training phase.</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadDashboardData}
                    accessibilityRole="button"
                    accessibilityLabel="Refresh protocols"
                  >
                    <Text style={styles.retryButtonText}>REFRESH PROTOCOLS ⟳</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContainer}
              >
                {workouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onPress={() => handleStartSession(workout)}
                    testID={`workout-card-${workout.id}`}
                  />
                ))}
              </ScrollView>
            )}
          </Animated.View>

          {/* 6. PRECISION NUTRITION SHORTCUT */}
          <Animated.View
            style={[
              styles.nutritionShortcutSection,
              { opacity: nutritionOpacity },
            ]}
          >
            <TouchableWithoutFeedback
              {...nutritionCardSpring}
              onPress={() => navigation?.navigate && navigation.navigate('Nutrition')}
              testID="home-nutrition-shortcut-card"
              accessibilityRole="button"
              accessibilityLabel="Open Precision Nutrition"
            >
              <Animated.View
                style={[
                  styles.nutritionShortcutCard,
                  { transform: [{ scale: nutritionCardScale }] },
                ]}
              >
                <View style={styles.nutritionGoldAccent} />
                <View style={styles.nutritionShortcutLeft}>
                  <View style={styles.nutritionIconCircle}>
                    <Icon name="cutlery" size={17} color={colors.goldBright} />
                  </View>
                  <View style={styles.nutritionShortcutText}>
                    <Text style={styles.nutritionShortcutTitle}>Precision Nutrition</Text>
                    <Text style={styles.nutritionShortcutSubtitle}>
                      Caloric Targets • Biometrics • Curated Fuel
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={16} color={colors.gold} />
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  canvas: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  brandTitle: {
    ...typography.brandWordmarkSmall,
    color: colors.primaryText,
    fontSize: 16,
    letterSpacing: 4,
  },
  brandSubtitle: {
    ...typography.caption,
    color: colors.gold,
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  notificationLiveDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  avatarBadgeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  greetingTimeLabel: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 2,
  },
  athleteDisplayName: {
    ...typography.headlineLg,
    fontSize: 32,
    lineHeight: 38,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
  },
  telemetryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  telemetryLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gold,
    marginRight: 6,
  },
  greetingSubtext: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  dailyFocusContainer: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceDim,
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dailyFocusBackground: {
    width: '100%',
  },
  dailyFocusImage: {
    resizeMode: 'cover',
  },
  dailyFocusOverlay: {
    backgroundColor: 'rgba(5, 6, 7, 0.82)',
    padding: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 8,
  },
  dailyFocusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 184, 63, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  dailyFocusBadgeText: {
    ...typography.labelCaps,
    color: colors.goldBright,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '800',
  },
  aiOptimizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  aiOptimizedBadgeText: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },
  badgeIcon: {
    marginRight: 4,
  },
  focusTitle: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'serif',
    fontWeight: '700',
    marginBottom: 4,
  },
  focusSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  focusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.lg,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 17, 19, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaChipText: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  startSessionButton: {
    backgroundColor: colors.goldBright,
    height: spacing.buttonHeight,
    borderRadius: borderRadius.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  startSessionButtonText: {
    ...typography.button,
    color: colors.inverseText,
    fontSize: 13,
    letterSpacing: 1.8,
    fontWeight: '800',
    marginRight: 6,
  },
  startSessionArrow: {
    color: colors.inverseText,
    fontSize: 15,
    fontWeight: '800',
  },
  statsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeaderCompact: {
    marginBottom: spacing.xs,
  },
  sectionEyebrow: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  curatedSection: {
    paddingTop: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.headlineSm,
    color: colors.primaryText,
    fontSize: 20,
    fontFamily: 'serif',
    fontWeight: '700',
  },
  viewAllText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  carouselContainer: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  loadingContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  skeletonCarouselRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonCard: {
    width: 220,
    height: 150,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceDim,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  skeletonBadge: {
    width: 50,
    height: 16,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignSelf: 'flex-end',
  },
  skeletonTitle: {
    width: 140,
    height: 18,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 6,
  },
  skeletonSubtitle: {
    width: 90,
    height: 12,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  errorCard: {
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.3)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  errorCardTitle: {
    ...typography.labelCaps,
    color: colors.crimson,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 2,
  },
  errorCardBody: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.surfaceDim,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontSize: 16,
    color: colors.primaryText,
    marginBottom: 2,
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.surfaceBright,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  retryButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  nutritionShortcutSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  nutritionShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  nutritionGoldAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.goldBright,
  },
  nutritionShortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nutritionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nutritionShortcutText: {
    flex: 1,
  },
  nutritionShortcutTitle: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 14,
    marginBottom: 2,
  },
  nutritionShortcutSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 11,
  },
});

