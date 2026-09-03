/**
 * Kinetra Profile Screen (Section 15: Basic & Elite Profile Refinement)
 * Exact Stitch luxury dark athletic visual matching Screen 1 (Elite) and Screen 2 (Basic / Empty State).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  Alert,
  Animated,
  Easing,
  AccessibilityInfo,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { images } from '../assets';
import { useAuth } from '../context/AuthContext';
import {
  apiClient,
  UserProfileData,
  SessionItem,
  ComputedAnalytics,
  computeAnalyticsFromSessions,
} from '../api/client';
import { SettingsScreen } from './SettingsScreen';

interface ProfileScreenProps {
  navigation?: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [analytics, setAnalytics] = useState<ComputedAnalytics | null>(null);
  const [dailyCalTarget, setDailyCalTarget] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Staggered Entrance Animation Values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-12)).current;
  const identityOpacity = useRef(new Animated.Value(0)).current;
  const identityTranslateY = useRef(new Animated.Value(14)).current;
  const metricsOpacity = useRef(new Animated.Value(0)).current;
  const metricsTranslateY = useRef(new Animated.Value(12)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;
  const menuTranslateY = useRef(new Animated.Value(14)).current;

  // Shimmer pulse animation for loading skeleton
  const skeletonShimmer = useRef(new Animated.Value(0.35)).current;

  // Spring Button Scales
  const settingsBtnScale = useRef(new Animated.Value(1)).current;
  const prBtnScale = useRef(new Animated.Value(1)).current;
  const historyBtnScale = useRef(new Animated.Value(1)).current;
  const gearBtnScale = useRef(new Animated.Value(1)).current;
  const exploreBtnScale = useRef(new Animated.Value(1)).current;
  const upgradeBtnScale = useRef(new Animated.Value(1)).current;
  const retryBtnScale = useRef(new Animated.Value(1)).current;

  const createSpring = (val: Animated.Value, down = 0.94, back = 1) => ({
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

  const settingsSpring = createSpring(settingsBtnScale, 0.90, 1);
  const prSpring = createSpring(prBtnScale, 0.98, 1);
  const historySpring = createSpring(historyBtnScale, 0.98, 1);
  const gearSpring = createSpring(gearBtnScale, 0.98, 1);
  const exploreSpring = createSpring(exploreBtnScale, 0.96, 1);
  const upgradeSpring = createSpring(upgradeBtnScale, 0.96, 1);
  const retrySpring = createSpring(retryBtnScale, 0.95, 1);

  // Entrance sequence & skeleton pulse
  useEffect(() => {
    let isMounted = true;
    let entranceAnim: Animated.CompositeAnimation | null = null;
    let shimmerLoop: Animated.CompositeAnimation | null = null;

    const runEntrance = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (!isMounted) return;

      if (reduceMotion) {
        headerOpacity.setValue(1);
        headerTranslateY.setValue(0);
        identityOpacity.setValue(1);
        identityTranslateY.setValue(0);
        metricsOpacity.setValue(1);
        metricsTranslateY.setValue(0);
        menuOpacity.setValue(1);
        menuTranslateY.setValue(0);
        return;
      }

      entranceAnim = Animated.stagger(75, [
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
        // Phase 2: Athlete Identity
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
        // Phase 3: Metrics Grid
        Animated.parallel([
          Animated.timing(metricsOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(metricsTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Menu Items
        Animated.parallel([
          Animated.timing(menuOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(menuTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      entranceAnim.start();

      shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonShimmer, {
            toValue: 0.85,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(skeletonShimmer, {
            toValue: 0.35,
            duration: 1000,
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
      if (entranceAnim) entranceAnim.stop();
      if (shimmerLoop) shimmerLoop.stop();
    };
  }, []);

  const fetchProfileAndSessions = useCallback(async () => {
    setError(null);
    try {
      // 1. Fetch user profile from backend (if available)
      const profilePromise = apiClient.getCurrentUserProfile().catch(() => null);
      // 2. Fetch session history to compute truthful metrics
      const sessionsPromise = apiClient.getUserSessions({ limit: 100 }).catch(() => []);
      // 3. Fetch nutrition profile for truthful target calories
      const nutritionPromise = apiClient.getNutritionProfile().catch(() => null);

      const [fetchedProfile, fetchedSessions, fetchedNutrition] = await Promise.all([
        profilePromise,
        sessionsPromise,
        nutritionPromise,
      ]);

      if (fetchedProfile) {
        setProfileData(fetchedProfile);
      }

      if (fetchedNutrition && fetchedNutrition.daily_cal_target) {
        setDailyCalTarget(fetchedNutrition.daily_cal_target);
      }

      const rawSessions = Array.isArray(fetchedSessions) ? (fetchedSessions as SessionItem[]) : [];
      const computed = computeAnalyticsFromSessions(rawSessions, 'ALL');
      setAnalytics(computed);
    } catch (err: any) {
      setError(
        err?.message ||
          'Profile telemetry is temporarily offline. Please verify connection and retry.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileAndSessions();
  }, [fetchProfileAndSessions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileAndSessions();
  }, [fetchProfileAndSessions]);

  // Derived user display name hierarchy:
  // 1. Backend profile display_name
  // 2. Auth user_metadata full_name
  // 3. Email prefix
  // 4. Fallback 'Athlete'
  const displayName =
    profileData?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'Athlete';

  const userEmail = profileData?.email || user?.email || 'athlete@kinetra.ai';
  const initialLetter = displayName.charAt(0).toUpperCase() || 'A';

  // Membership Tier Resolution (Real Data Invariant)
  // Strictly verifies real application state before labeling user as Elite.
  const isElite =
    profileData?.fitness_level === 'elite' ||
    user?.user_metadata?.tier === 'elite' ||
    user?.user_metadata?.membership === 'elite';

  // Metrics (Strict no-fabrication rule)
  const formScoreDisplay =
    analytics && analytics.avgFormScore !== null ? `${analytics.avgFormScore}` : '--';

  const sessionsDisplay =
    analytics && analytics.totalWorkouts > 0 ? `${analytics.totalWorkouts}` : '--';

  const streakDisplay =
    analytics && analytics.currentStreak > 0 ? `${analytics.currentStreak}` : '--';

  const hasSessions = analytics && analytics.totalWorkouts > 0;

  const handlePersonalBests = () => {
    if (navigation?.navigate) {
      navigation.navigate('ExerciseProgress');
    } else {
      Alert.alert(
        'Personal Best Records',
        'AI-verified PR telemetry and biomechanical milestones will update automatically following scored sets.'
      );
    }
  };

  const handleActivityHistory = () => {
    if (navigation?.navigate) {
      navigation.navigate('Stats');
    }
  };

  const handleKinetraGear = () => {
    Alert.alert(
      'Kinetra Gear & Membership',
      isElite
        ? 'Tier: Elite Founding Member\nHardware Sync: Vision Coach Active\nTelemetry Protocol: 30 FPS On-Device'
        : 'Tier: Athlete Member\nAccess: Live Workouts & Exercise Library\nUpgrade: Unlock on-device Vision Coach AI coaching'
    );
  };

  const handleExploreWorkouts = () => {
    if (navigation?.navigate) {
      navigation.navigate('Explore');
    }
  };

  // If user opened Settings, render SettingsScreen subview
  if (isSettingsOpen) {
    return <SettingsScreen onBack={() => setIsSettingsOpen(false)} navigation={navigation} />;
  }

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
        <Text style={styles.headerTitle}>PROFILE</Text>

        <TouchableWithoutFeedback
          {...settingsSpring}
          onPress={() => setIsSettingsOpen(true)}
          testID="profile-settings-button"
          accessibilityLabel="Open Settings"
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              styles.settingsButton,
              { transform: [{ scale: settingsBtnScale }] },
            ]}
          >
            <Icon name="gear" size={18} color={colors.gold} />
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* 2. SCROLL CONTENT */}
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
        {loading ? (
          /* Luxury Obsidian Skeleton Loader */
          <View style={styles.skeletonWrapper}>
            <View style={styles.skeletonAvatarBlock}>
              <Animated.View style={[styles.skeletonAvatar, { opacity: skeletonShimmer }]} />
              <Animated.View style={[styles.skeletonNameBar, { opacity: skeletonShimmer }]} />
              <Animated.View style={[styles.skeletonBadgeBar, { opacity: skeletonShimmer }]} />
            </View>
            <View style={styles.skeletonMetricsRow}>
              <Animated.View style={[styles.skeletonMetricCard, { opacity: skeletonShimmer }]} />
              <Animated.View style={[styles.skeletonMetricCard, { opacity: skeletonShimmer }]} />
            </View>
            <Animated.View style={[styles.skeletonStreakCard, { opacity: skeletonShimmer }]} />
            <Animated.View style={[styles.skeletonMenuCard, { opacity: skeletonShimmer }]} />
          </View>
        ) : error ? (
          /* Stitch Error State */
          <View style={styles.errorCard} testID="profile-error-state">
            <View style={styles.warningCircle}>
              <Icon name="warning" size={28} color={colors.crimson} />
            </View>
            <Text style={styles.errorTitle}>Connection Interrupted</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableWithoutFeedback
              {...retrySpring}
              onPress={fetchProfileAndSessions}
              testID="profile-retry-button"
              accessibilityRole="button"
              accessibilityLabel="Retry fetching profile"
            >
              <Animated.View
                style={[
                  styles.retryButton,
                  { transform: [{ scale: retryBtnScale }] },
                ]}
              >
                <Icon name="retry" size={14} color={colors.inverseText} style={styles.retryIcon} />
                <Text style={styles.retryButtonText}>RETRY</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        ) : (
          <>
            {/* AVATAR & IDENTITY SECTION (Matches Stitch Reference Screen 1 & Screen 2) */}
            <Animated.View
              style={[
                styles.identityCard,
                {
                  opacity: identityOpacity,
                  transform: [{ translateY: identityTranslateY }],
                },
              ]}
              testID="profile-identity-card"
            >
              {/* Luxury Squircle Avatar with Athlete Photo */}
              <View
                style={[
                  styles.avatarFrame,
                  isElite ? styles.avatarFrameElite : styles.avatarFrameBasic,
                ]}
              >
                <View style={styles.avatarInner}>
                  <Image
                    source={images.heroAthlete}
                    style={styles.avatarPhoto}
                    resizeMode="cover"
                  />
                  <View style={styles.avatarOverlay} />
                  {/* Subtle watermark fallback */}
                  <Text style={styles.avatarWatermark}>{initialLetter}</Text>
                </View>

                {/* Status indicator badge */}
                <View style={styles.avatarStatusBadge}>
                  <Icon
                    name={isElite ? 'sparkle' : 'profile'}
                    size={10}
                    color={colors.gold}
                  />
                </View>
              </View>

              {/* User Name */}
              <Text style={styles.displayName} testID="profile-display-name">
                {displayName.toUpperCase()}
              </Text>

              {/* Status / Membership Hierarchy (Elite vs Basic) */}
              {isElite ? (
                <>
                  {/* Elite Member Badge */}
                  <View style={styles.tierBadge} testID="profile-tier-badge">
                    <Icon name="sparkle" size={11} color={colors.gold} style={{ marginRight: 6 }} />
                    <Text style={styles.tierBadgeText}>ELITE MEMBER</Text>
                  </View>

                  {/* Athletic Motto */}
                  <Text style={styles.bioText}>
                    Pursuing peak performance. Focused on strength, precision, and longevity.
                  </Text>
                </>
              ) : (
                <>
                  {/* Basic Athlete: Displays Real Email / Identifier (Matching Column 5 Reference) */}
                  <Text style={styles.userEmailText} testID="profile-user-email">
                    {userEmail}
                  </Text>

                  {/* Basic Tier Badge */}
                  <View style={styles.basicTierBadge} testID="profile-tier-badge">
                    <Text style={styles.basicTierBadgeText}>ATHLETE MEMBER</Text>
                  </View>
                </>
              )}
            </Animated.View>

            {/* 3. METRICS OVERVIEW OR EMPTY STATE */}
            {hasSessions ? (
              /* POPULATED METRICS GRID (Stitch Reference Screen 1) */
              <>
                <Animated.View
                  style={{
                    opacity: metricsOpacity,
                    transform: [{ translateY: metricsTranslateY }],
                  }}
                >
                  <View style={styles.metricsRow} testID="profile-metrics-populated">
                    {/* Form Score Card */}
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}>
                        <Text style={styles.metricLabel}>FORM SCORE</Text>
                        <Icon name="sparkle" size={12} color={colors.gold} />
                      </View>
                      <Text style={styles.metricValue}>
                        {formScoreDisplay}
                        {formScoreDisplay !== '--' ? (
                          <Text style={styles.metricUnit}> /100</Text>
                        ) : (
                          ''
                        )}
                      </Text>
                      {/* Form score accent track */}
                      <View style={styles.miniScoreTrack}>
                        <View
                          style={[
                            styles.miniScoreFill,
                            {
                              width: `${Math.min(
                                100,
                                Math.max(10, analytics?.avgFormScore ?? 90)
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Sessions Card */}
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}>
                        <Text style={styles.metricLabel}>SESSIONS</Text>
                        <Icon name="calendar" size={12} color={colors.gold} />
                      </View>
                      <Text style={styles.metricValue}>
                        {sessionsDisplay}
                        {sessionsDisplay !== '--' ? (
                          <Text style={styles.metricUnit}> TOTAL</Text>
                        ) : (
                          ''
                        )}
                      </Text>
                      {/* Subtle baseline track */}
                      <View style={styles.miniScoreTrack}>
                        <View style={[styles.miniScoreFill, { width: '85%' }]} />
                      </View>
                    </View>
                  </View>

                  {/* Current Streak Banner */}
                  <View style={styles.streakBanner} testID="profile-streak-banner">
                    <View style={styles.streakHeader}>
                      <Text style={styles.streakLabel}>CURRENT STREAK</Text>
                      <Icon name="flame" size={14} color={colors.crimson} />
                    </View>
                    <Text style={styles.streakValue}>
                      {streakDisplay}
                      {streakDisplay !== '--' ? (
                        <Text style={styles.streakUnit}> DAYS</Text>
                      ) : (
                        ''
                      )}
                    </Text>
                  </View>
                </Animated.View>

                {/* MENU ROWS (Stitch Reference Screen 1) */}
                <Animated.View
                  style={[
                    styles.menuContainer,
                    {
                      opacity: menuOpacity,
                      transform: [{ translateY: menuTranslateY }],
                    },
                  ]}
                  testID="profile-menu-container"
                >
                  {/* Personal Best Records */}
                  <TouchableWithoutFeedback
                    {...prSpring}
                    onPress={handlePersonalBests}
                    testID="menu-personal-bests"
                    accessibilityRole="button"
                    accessibilityLabel="Personal Best Records"
                  >
                    <Animated.View
                      style={[
                        styles.menuItem,
                        { transform: [{ scale: prBtnScale }] },
                      ]}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={styles.menuIconCircle}>
                          <Icon name="trophy" size={16} color={colors.gold} />
                        </View>
                        <Text style={styles.menuItemTitle}>Personal Best Records</Text>
                      </View>
                      <Icon name="chevron-right" size={14} color={colors.tertiaryText} />
                    </Animated.View>
                  </TouchableWithoutFeedback>

                  <View style={styles.menuDivider} />

                  {/* Activity History */}
                  <TouchableWithoutFeedback
                    {...historySpring}
                    onPress={handleActivityHistory}
                    testID="menu-activity-history"
                    accessibilityRole="button"
                    accessibilityLabel="Activity History"
                  >
                    <Animated.View
                      style={[
                        styles.menuItem,
                        { transform: [{ scale: historyBtnScale }] },
                      ]}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={styles.menuIconCircle}>
                          <Icon name="history" size={16} color={colors.gold} />
                        </View>
                        <Text style={styles.menuItemTitle}>Activity History</Text>
                      </View>
                      <Icon name="chevron-right" size={14} color={colors.tertiaryText} />
                    </Animated.View>
                  </TouchableWithoutFeedback>

                  <View style={styles.menuDivider} />

                  {/* Kinetra Gear */}
                  <TouchableWithoutFeedback
                    {...gearSpring}
                    onPress={handleKinetraGear}
                    testID="menu-kinetra-gear"
                    accessibilityRole="button"
                    accessibilityLabel="Kinetra Gear"
                  >
                    <Animated.View
                      style={[
                        styles.menuItem,
                        { transform: [{ scale: gearBtnScale }] },
                      ]}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={styles.menuIconCircle}>
                          <Icon name="diamond" size={16} color={colors.gold} />
                        </View>
                        <Text style={styles.menuItemTitle}>Kinetra Gear</Text>
                      </View>
                      <Icon name="chevron-right" size={14} color={colors.tertiaryText} />
                    </Animated.View>
                  </TouchableWithoutFeedback>
                </Animated.View>
              </>
            ) : (
              /* EMPTY STATE (Matches Stitch Column 5 Reference Screen 2) */
              <Animated.View
                style={{
                  opacity: metricsOpacity,
                  transform: [{ translateY: metricsTranslateY }],
                }}
              >
                {/* 3-Column Biometrics Chip Row */}
                <View style={styles.chipsRow} testID="profile-chips-row">
                  <View style={styles.chipCard}>
                    <Text style={styles.chipLabel}>WEIGHT</Text>
                    <Text style={styles.chipValue}>
                      {profileData?.weight_kg ? `${profileData.weight_kg}` : '--'}
                    </Text>
                    <Text style={styles.chipUnit}>KG</Text>
                  </View>

                  <View style={styles.chipCard}>
                    <Text style={styles.chipLabel}>BODY FAT</Text>
                    <Text style={styles.chipValue}>--</Text>
                    <Text style={styles.chipUnit}>%</Text>
                  </View>

                  <View style={styles.chipCard}>
                    <Text style={styles.chipLabel}>TARGET</Text>
                    <Text style={styles.chipValue}>
                      {dailyCalTarget ? `${dailyCalTarget}` : '--'}
                    </Text>
                    <Text style={styles.chipUnit}>CAL</Text>
                  </View>
                </View>

                {/* Activity History Empty State Card (Column 5) */}
                <View style={styles.emptyHistoryCard} testID="profile-empty-history-card">
                  <Text style={styles.emptySectionTitle}>Activity History</Text>

                  <View style={styles.emptyContent}>
                    <View style={styles.emptyIconCircle}>
                      <Icon name="history" size={24} color={colors.tertiaryText} />
                    </View>

                    <Text style={styles.emptyPromptTitle}>NO RECENT ACTIVITY.</Text>
                    <Text style={styles.emptyPromptSubtitle}>START YOUR ELITE JOURNEY.</Text>

                    <TouchableWithoutFeedback
                      {...exploreSpring}
                      onPress={handleExploreWorkouts}
                      testID="profile-explore-workouts-button"
                      accessibilityRole="button"
                      accessibilityLabel="Explore Workouts"
                    >
                      <Animated.View
                        style={[
                          styles.exploreButton,
                          { transform: [{ scale: exploreBtnScale }] },
                        ]}
                      >
                        <Text style={styles.exploreButtonText}>EXPLORE WORKOUTS →</Text>
                      </Animated.View>
                    </TouchableWithoutFeedback>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* UPGRADE CARD FOR BASIC ATHLETES */}
            {!isElite && (
              <Animated.View
                style={{
                  opacity: menuOpacity,
                  transform: [{ translateY: menuTranslateY }],
                }}
              >
                <View style={styles.upgradeCard} testID="profile-upgrade-card">
                  <View style={styles.upgradeHeaderRow}>
                    <View style={styles.upgradeSparkleIcon}>
                      <Icon name="sparkle" size={14} color={colors.gold} />
                    </View>
                    <Text style={styles.upgradeTitle}>ELEVATE TO ELITE PROTOCOL</Text>
                  </View>
                  <Text style={styles.upgradeDescription}>
                    Unlock 30 FPS on-device computer vision biomechanical coaching, custom circuit builders, and granular performance telemetry.
                  </Text>
                  <TouchableWithoutFeedback
                    {...upgradeSpring}
                    onPress={handleKinetraGear}
                    accessibilityRole="button"
                    accessibilityLabel="View Elite Status Benefits"
                  >
                    <Animated.View
                      style={[
                        styles.upgradeButton,
                        { transform: [{ scale: upgradeBtnScale }] },
                      ]}
                    >
                      <Text style={styles.upgradeButtonText}>VIEW ELITE STATUS →</Text>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                </View>
              </Animated.View>
            )}
          </>
        )}
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
  headerTitle: {
    ...typography.headlineMd,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    letterSpacing: 3,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + 24,
  },

  // Skeleton Loader Styles
  skeletonWrapper: {
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  skeletonAvatarBlock: {
    alignItems: 'center',
    gap: 12,
  },
  skeletonAvatar: {
    width: 96,
    height: 96,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  skeletonNameBar: {
    width: 160,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  skeletonBadgeBar: {
    width: 110,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skeletonMetricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonMetricCard: {
    flex: 1,
    height: 96,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  skeletonStreakCard: {
    width: '100%',
    height: 84,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  skeletonMenuCard: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Athlete Identity Block (Stitch Reference)
  identityCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarFrame: {
    width: 96,
    height: 96,
    borderRadius: 18,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  avatarFrameElite: {
    borderWidth: 1.5,
    borderColor: 'rgba(217, 184, 63, 0.45)',
  },
  avatarFrameBasic: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(25, 27, 30, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPhoto: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 6, 7, 0.25)',
  },
  avatarWatermark: {
    position: 'absolute',
    fontFamily: 'serif',
    fontWeight: '700',
    color: 'rgba(217, 184, 63, 0.18)',
    fontSize: 48,
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 17, 19, 0.95)',
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    ...typography.headlineMd,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: 2,
    fontSize: 22,
    marginBottom: 6,
    textAlign: 'center',
  },
  userEmailText: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.45)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  tierBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  basicTierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: spacing.md,
  },
  basicTierBadgeText: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  bioText: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12.5,
    maxWidth: 290,
  },

  // Populated Metrics Overview Grid
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: '800',
  },
  metricValue: {
    ...typography.headlineMd,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 28,
  },
  metricUnit: {
    fontSize: 12,
    color: colors.tertiaryText,
    fontWeight: '500',
    fontFamily: 'System',
  },
  miniScoreTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 6,
  },
  miniScoreFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 1.5,
  },
  streakBanner: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  streakLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: '800',
  },
  streakValue: {
    ...typography.headlineMd,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 28,
  },
  streakUnit: {
    fontSize: 12,
    color: colors.tertiaryText,
    fontWeight: '500',
    fontFamily: 'System',
  },

  // Menu List Actions Block
  menuContainer: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemTitle: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginLeft: 60,
  },

  // Empty State Biometric Chips (Stitch Column 5)
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  chipCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  chipLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  chipValue: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 18,
    marginBottom: 2,
  },
  chipUnit: {
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 9,
  },

  // Empty Activity History Card (Stitch Column 5)
  emptyHistoryCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  emptySectionTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 17,
    marginBottom: spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyPromptTitle: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 11,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  emptyPromptSubtitle: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 11,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  exploreButton: {
    backgroundColor: 'rgba(217, 184, 63, 0.1)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xs,
  },
  exploreButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Upgrade Invitation Card for Basic Athletes
  upgradeCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  upgradeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  upgradeSparkleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 184, 63, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTitle: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  upgradeDescription: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  upgradeButton: {
    backgroundColor: colors.gold,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.xs,
  },
  upgradeButtonText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Error Card Styles
  errorCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.4)',
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  warningCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 57, 70, 0.5)',
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 21,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    height: 48,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.gold,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
});
