/**
 * Kinetra Profile Screen (Phase 33)
 * Exact Stitch luxury dark athletic visual matching Screen 1 (Elite) and Screen 2 (Empty State).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const fetchProfileAndSessions = useCallback(async () => {
    try {
      // 1. Fetch user profile from backend (if available)
      const profilePromise = apiClient.getCurrentUserProfile().catch(() => null);
      // 2. Fetch session history to compute truthful metrics
      const sessionsPromise = apiClient.getUserSessions({ limit: 100 }).catch(() => []);

      const [fetchedProfile, fetchedSessions] = await Promise.all([
        profilePromise,
        sessionsPromise,
      ]);

      if (fetchedProfile) {
        setProfileData(fetchedProfile);
      }

      const rawSessions = Array.isArray(fetchedSessions) ? (fetchedSessions as SessionItem[]) : [];
      const computed = computeAnalyticsFromSessions(rawSessions, 'ALL');
      setAnalytics(computed);
    } catch {
      // Graceful fallback with null state (no fabricated data)
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
      'Tier: Elite Founding Member\nHardware Sync: Vision Coach Active\nTelemetry Protocol: 30 FPS On-Device'
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
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setIsSettingsOpen(true)}
          testID="profile-settings-button"
          accessibilityLabel="Open Settings"
          accessibilityRole="button"
        >
          <Icon name="gear" size={18} color={colors.gold} />
        </TouchableOpacity>
      </View>

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
        {/* AVATAR & IDENTITY SECTION */}
        <View style={styles.identityCard} testID="profile-identity-card">
          {/* Avatar Picture Frame */}
          <View style={styles.avatarFrame}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{initialLetter}</Text>
            </View>
          </View>

          {/* User Name */}
          <Text style={styles.displayName} testID="profile-display-name">
            {displayName.toUpperCase()}
          </Text>

          {/* Elite Member Badge */}
          <View style={styles.tierBadge} testID="profile-tier-badge">
            <Icon name="sparkle" size={12} color={colors.gold} style={{ marginRight: 5 }} />
            <Text style={styles.tierBadgeText}>ELITE MEMBER</Text>
          </View>

          {/* Athletic Motto */}
          <Text style={styles.bioText}>
            Pursuing peak performance. Focused on strength, precision, and longevity.
          </Text>
        </View>

        {/* 3. METRICS OVERVIEW OR EMPTY STATE */}
        {hasSessions ? (
          /* POPULATED METRICS GRID (Screen 1) */
          <>
            <View style={styles.metricsRow} testID="profile-metrics-populated">
              {/* Form Score Card */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>FORM SCORE</Text>
                  <Icon name="sparkle" size={12} color={colors.gold} />
                </View>
                <Text style={styles.metricValue}>
                  {formScoreDisplay}
                  {formScoreDisplay !== '--' ? <Text style={styles.metricUnit}> /100</Text> : ''}
                </Text>
              </View>

              {/* Sessions Card */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>SESSIONS</Text>
                  <Icon name="calendar" size={12} color={colors.gold} />
                </View>
                <Text style={styles.metricValue}>
                  {sessionsDisplay}
                  {sessionsDisplay !== '--' ? <Text style={styles.metricUnit}> TOTAL</Text> : ''}
                </Text>
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
                {streakDisplay !== '--' ? <Text style={styles.streakUnit}> DAYS</Text> : ''}
              </Text>
            </View>

            {/* MENU ROWS */}
            <View style={styles.menuContainer} testID="profile-menu-container">
              {/* Personal Best Records */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handlePersonalBests}
                testID="menu-personal-bests"
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconCircle}>
                    <Icon name="trophy" size={16} color={colors.gold} />
                  </View>
                  <Text style={styles.menuItemTitle}>Personal Best Records</Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.tertiaryText} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Activity History */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleActivityHistory}
                testID="menu-activity-history"
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconCircle}>
                    <Icon name="history" size={16} color={colors.gold} />
                  </View>
                  <Text style={styles.menuItemTitle}>Activity History</Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.tertiaryText} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Kinetra Gear */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleKinetraGear}
                testID="menu-kinetra-gear"
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconCircle}>
                    <Icon name="diamond" size={16} color={colors.gold} />
                  </View>
                  <Text style={styles.menuItemTitle}>Kinetra Gear</Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.tertiaryText} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* EMPTY STATE (Screen 2) */
          <>
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
                <Text style={styles.chipValue}>--</Text>
                <Text style={styles.chipUnit}>CAL</Text>
              </View>
            </View>

            {/* Activity History Empty State Card */}
            <View style={styles.emptyHistoryCard} testID="profile-empty-history-card">
              <Text style={styles.emptySectionTitle}>Activity History</Text>

              <View style={styles.emptyContent}>
                <View style={styles.emptyIconCircle}>
                  <Icon name="history" size={24} color={colors.tertiaryText} />
                </View>

                <Text style={styles.emptyPromptTitle}>NO RECENT ACTIVITY.</Text>
                <Text style={styles.emptyPromptSubtitle}>START YOUR ELITE JOURNEY.</Text>

                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={handleExploreWorkouts}
                  testID="profile-explore-workouts-button"
                  accessibilityRole="button"
                >
                  <Text style={styles.exploreButtonText}>EXPLORE WORKOUTS →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
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
  headerTitle: {
    ...typography.headlineMd,
    fontSize: 18,
    lineHeight: 24,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    letterSpacing: 3,
  },
  settingsButton: {
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  identityCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarFrame: {
    width: 104,
    height: 104,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceDim,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.gold,
    fontSize: 34,
  },
  displayName: {
    ...typography.headlineMd,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: 1.8,
    fontSize: 22,
    marginBottom: 6,
    textAlign: 'center',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  tierBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  bioText: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    minHeight: 88,
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
    letterSpacing: 1.2,
  },
  metricValue: {
    ...typography.headlineMd,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 24,
  },
  metricUnit: {
    fontSize: 11,
    color: colors.tertiaryText,
    fontWeight: '500',
  },
  streakBanner: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.lg,
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
    letterSpacing: 1.2,
  },
  streakValue: {
    ...typography.headlineMd,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 24,
  },
  streakUnit: {
    fontSize: 11,
    color: colors.tertiaryText,
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemTitle: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 56,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  chipCard: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
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
  emptyHistoryCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  emptySectionTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceBright,
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  exploreButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
