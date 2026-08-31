import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { apiClient, UserProfileData, WorkoutItem, UserDashboardMetrics } from '../api/client';
import { Icon } from '../components/Icon';
import { MetricCard } from '../components/MetricCard';
import { WorkoutCard } from '../components/WorkoutCard';
import { KinetraButton } from '../components/KinetraButton';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { InlineError } from '../components/InlineError';
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

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getAthleteName = () => {
    if (profile?.display_name && profile.display_name.trim().length > 0) {
      return profile.display_name;
    }
    if (user?.user_metadata?.full_name && user.user_metadata.full_name.trim().length > 0) {
      return user.user_metadata.full_name;
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

  const primaryWorkout: WorkoutItem | null = workouts.length > 0 ? workouts[0] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
        {/* 1. TOP HEADER & BRANDING */}
        <View style={styles.topHeader}>
          <Text style={styles.brandTitle}>KINETRA</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Icon name="bell" size={18} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        {/* 2. PERSONALIZED GREETING */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingTimeText}>{getGreetingTime().split(' ')[0]}</Text>
              <View style={styles.greetingNameRow}>
                <Text style={styles.greetingNameText}>
                  {getGreetingTime().split(' ')[1]}, {getAthleteName()}
                </Text>
                <TouchableOpacity
                  style={styles.avatarMiniButton}
                  onPress={handleProfilePress}
                  accessibilityLabel="View Profile"
                >
                  <Icon name="profile" size={14} color={colors.gold} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <Text style={styles.greetingSubtext}>
            Your performance analytics are optimized and ready.
          </Text>
        </View>

        {/* 3. DAILY FOCUS HERO CARD */}
        <View style={styles.dailyFocusContainer}>
          <ImageBackground
            source={images.gymBarbell}
            style={styles.dailyFocusBackground}
            imageStyle={styles.dailyFocusImage}
          >
            <View style={styles.dailyFocusOverlay}>
              {/* Badges */}
              <View style={styles.badgeRow}>
                <View style={styles.dailyFocusBadge}>
                  <Icon name="bolt" size={12} color={colors.gold} style={styles.badgeIcon} />
                  <Text style={styles.dailyFocusBadgeText}>DAILY FOCUS</Text>
                </View>
                <View style={styles.aiOptimizedBadge}>
                  <Icon name="sparkle" size={12} color={colors.secondaryText} style={styles.badgeIcon} />
                  <Text style={styles.aiOptimizedBadgeText}>AI OPTIMIZED</Text>
                </View>
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.focusTitle}>
                {primaryWorkout?.title || 'Tactical Strength'}
              </Text>
              <Text style={styles.focusSubtitle}>
                {primaryWorkout?.description ||
                  'Focus: Lower Body Power & Core Stabilization'}
              </Text>

              {/* Meta information */}
              <View style={styles.focusMetaRow}>
                <View style={styles.metaItem}>
                  <Icon name="clock" size={13} color={colors.secondaryText} />
                  <Text style={styles.metaItemText}>
                    {primaryWorkout?.estimated_duration_min || 45} Min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="flame" size={13} color={colors.secondaryText} />
                  <Text style={styles.metaItemText}>
                    {primaryWorkout?.difficulty
                      ? `${primaryWorkout.difficulty.charAt(0).toUpperCase() + primaryWorkout.difficulty.slice(1)} Intensity`
                      : 'High Intensity'}
                  </Text>
                </View>
              </View>

              {/* CTA */}
              <KinetraButton
                title="START SESSION"
                variant="primary"
                onPress={() => handleStartSession(primaryWorkout || undefined)}
                style={styles.startSessionButton}
                textStyle={styles.startSessionButtonText}
                testID="home-start-session-button"
              />
            </View>
          </ImageBackground>
        </View>

        {/* 4. QUICK STATS (FORM SCORE, ACTIVE MINS, CALORIES) */}
        <View style={styles.statsSection}>
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
        </View>

        {/* 5. CURATED FOR YOU / WORKOUT CAROUSEL */}
        <View style={styles.curatedSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Curated For You</Text>
            <TouchableOpacity onPress={handleViewAllWorkouts} testID="home-view-all-workouts">
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          {loadingWorkouts ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator message="Loading curated programs..." />
            </View>
          ) : workoutError ? (
            <View style={styles.errorContainer}>
              <InlineError message={workoutError} />
              <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
                <Text style={styles.retryButtonText}>RETRY</Text>
              </TouchableOpacity>
            </View>
          ) : workouts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No curated workouts available yet.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
                <Text style={styles.retryButtonText}>REFRESH</Text>
              </TouchableOpacity>
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
        </View>

        {/* 6. NUTRITION COMMAND CARD */}
        <View style={styles.nutritionShortcutSection}>
          <TouchableOpacity
            style={styles.nutritionShortcutCard}
            onPress={() => navigation?.navigate && navigation.navigate('Nutrition')}
            testID="home-nutrition-shortcut-card"
            accessibilityRole="button"
          >
            <View style={styles.nutritionShortcutLeft}>
              <View style={styles.nutritionIconCircle}>
                <Icon name="cutlery" size={18} color={colors.gold} />
              </View>
              <View style={styles.nutritionShortcutText}>
                <Text style={styles.nutritionShortcutTitle}>Precision Nutrition</Text>
                <Text style={styles.nutritionShortcutSubtitle}>
                  Caloric Targets • Biometrics • Curated Fuel
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={18} color={colors.gold} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  greetingSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingTimeText: {
    ...typography.headlineLg,
    fontSize: 34,
    lineHeight: 40,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
  },
  greetingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  greetingNameText: {
    ...typography.headlineLg,
    fontSize: 34,
    lineHeight: 40,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
  },
  avatarMiniButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  greetingSubtext: {
    ...typography.bodyMd,
    color: colors.secondaryText,
    marginTop: spacing.xs,
    fontSize: 13,
  },
  dailyFocusContainer: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  dailyFocusBackground: {
    width: '100%',
  },
  dailyFocusImage: {
    resizeMode: 'cover',
  },
  dailyFocusOverlay: {
    backgroundColor: 'rgba(5, 6, 7, 0.78)',
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
    borderColor: 'rgba(217, 184, 63, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dailyFocusBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1,
  },
  aiOptimizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  aiOptimizedBadgeText: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 10,
    letterSpacing: 1,
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
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  focusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItemText: {
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 12,
  },
  startSessionButton: {
    backgroundColor: colors.gold,
    height: 48,
  },
  startSessionButtonText: {
    color: colors.inverseText,
    fontSize: 13,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  statsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  curatedSection: {
    paddingTop: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
    fontSize: 11,
    letterSpacing: 1.2,
  },
  carouselContainer: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.secondaryText,
    marginBottom: spacing.sm,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceBright,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.xs,
  },
  retryButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
  },
  nutritionShortcutSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  nutritionShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  nutritionShortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceBright,
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
