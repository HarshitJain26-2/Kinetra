/**
 * Kinetra Stats, Progress & Analytics Screen (Phase 32)
 * Production-quality progress dashboard with real backend data, time range filters,
 * SVG progression curves, weekly consistency matrix, and zero fabricated numbers.
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
import { AnalyticsSummaryCards } from '../components/AnalyticsSummaryCards';
import { ConsistencySection } from '../components/ConsistencySection';
import { ProgressChartCard } from '../components/ProgressChartCard';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { StatsSkeleton } from '../components/KinetraSkeleton';
import {
  apiClient,
  SessionItem,
  ComputedAnalytics,
  computeAnalyticsFromSessions,
} from '../api/client';

type TimeRangeOption = '7D' | '30D' | '90D' | 'ALL';

const TIME_RANGES: { id: TimeRangeOption; label: string }[] = [
  { id: '7D', label: '7D' },
  { id: '30D', label: '30D' },
  { id: '90D', label: '90D' },
  { id: 'ALL', label: 'ALL' },
];

interface StatsScreenProps {
  navigation?: any;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ navigation }) => {
  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>('30D');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [analytics, setAnalytics] = useState<ComputedAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionHistory = useCallback(async () => {
    setError(null);
    try {
      const data = await apiClient.getUserSessions({ limit: 100 });
      const rawSessions = Array.isArray(data) ? data : [];
      setSessions(rawSessions);
      const computed = computeAnalyticsFromSessions(rawSessions, selectedRange);
      setAnalytics(computed);
    } catch (err: any) {
      setError(
        err?.message ||
          'Our elite servers are temporarily unreachable. Please verify your secure connection and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    setLoading(true);
    fetchSessionHistory();
  }, [fetchSessionHistory]);

  // Recalculate when time filter changes
  const handleSelectRange = (range: TimeRangeOption) => {
    setSelectedRange(range);
    const computed = computeAnalyticsFromSessions(sessions, range);
    setAnalytics(computed);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessionHistory();
  }, [fetchSessionHistory]);

  const handleProfilePress = () => {
    if (navigation?.navigate) {
      navigation.navigate('Profile');
    }
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'All progress metrics and telemetry sync are up to date.');
  };

  const handleStartFirstWorkout = () => {
    if (navigation?.navigate) {
      navigation.navigate('Explore');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={handleProfilePress}
          accessibilityLabel="Profile"
          accessibilityRole="button"
          testID="stats-header-profile-button"
        >
          <Icon name="profile" size={16} color={colors.gold} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>PROGRESS</Text>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleNotificationPress}
          accessibilityLabel="Notifications"
          accessibilityRole="button"
          testID="stats-header-notification-button"
        >
          <Icon name="bell" size={18} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* 2. TIME RANGE FILTER PILLS */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {TIME_RANGES.map((range) => {
            const isActive = selectedRange === range.id;
            return (
              <TouchableOpacity
                key={range.id}
                onPress={() => handleSelectRange(range.id)}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                testID={`filter-range-${range.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. MAIN CONTENT SCROLL */}
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
        {loading && !refreshing ? (
          <View style={styles.stateWrapper} testID="stats-loading-state">
            <StatsSkeleton testID="stats-loading-skeleton" />
          </View>
        ) : error ? (
          /* EXACT STITCH ERROR CARD */
          <View style={styles.errorCard} testID="stats-error-state">
            <View style={styles.warningCircle}>
              <Icon name="warning" size={28} color={colors.gold} />
            </View>
            <Text style={styles.errorTitle}>Connection Interrupted</Text>
            <Text style={styles.errorSubtitle}>
              Our elite servers are temporarily unreachable. Please verify your secure connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchSessionHistory}
              testID="stats-retry-button"
            >
              <Icon name="retry" size={14} color={colors.gold} style={styles.retryIcon} />
              <Text style={styles.retryButtonText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        ) : sessions.length === 0 ? (
          /* EMPTY STATE (No fake data) */
          <View style={styles.emptyCard} testID="stats-empty-state">
            <View style={styles.emptyIconCircle}>
              <Icon name="stats" size={32} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>No Progress Recorded Yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete your first training session to unlock live AI form analytics, volume progression, and streak tracking.
            </Text>
            <TouchableOpacity
              style={styles.startFirstButton}
              onPress={handleStartFirstWorkout}
              testID="stats-start-workout-button"
            >
              <Text style={styles.startFirstButtonText}>START FIRST WORKOUT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 4. OVERVIEW SUMMARY METRICS GRID */}
            <AnalyticsSummaryCards analytics={analytics} loading={loading} />

            {/* 5. CONSISTENCY & STREAK SECTION */}
            <ConsistencySection
              weeklyActiveDays={analytics?.weeklyActiveDays}
              currentStreak={analytics?.currentStreak}
              loading={loading}
            />

            {/* 6. CHARTS SECTION */}
            <View style={styles.chartsSection}>
              {/* Form Score Trend (0-100 scale) */}
              <ProgressChartCard
                title="AI BIOMECHANICAL ANALYSIS"
                metricLabel="Form Score Evolution"
                data={analytics?.formScoreTrend || []}
                maxScale={100}
                unit="/100"
                testID="chart-form-score"
              />

              {/* Rep Volume Progression */}
              <ProgressChartCard
                title="VOLUME PROGRESSION"
                metricLabel="Rep Volume Over Time"
                data={analytics?.repTrend || []}
                unit="Reps"
                testID="chart-rep-volume"
              />

              {/* Active Duration Trend */}
              <ProgressChartCard
                title="TRAINING OUTPUT"
                metricLabel="Active Duration (Minutes)"
                data={analytics?.durationTrend || []}
                unit="Min"
                testID="chart-active-duration"
              />

              {/* Calorie Trend if available */}
              {analytics?.caloriesBurned !== null && (
                <ProgressChartCard
                  title="METABOLIC OUTPUT"
                  metricLabel="Est. Calories Burned"
                  data={analytics?.calorieTrend || []}
                  unit="Kcal"
                  testID="chart-calories"
                />
              )}

              {/* 1RM Drilldown Button */}
              <TouchableOpacity
                style={styles.drilldownButton}
                onPress={() => navigation?.navigate('ExerciseProgress')}
                testID="stats-1rm-progression-button"
              >
                <View style={styles.drilldownLeft}>
                  <Icon name="sparkle" size={16} color={colors.gold} />
                  <Text style={styles.drilldownText}>1RM STRENGTH PROGRESSION</Text>
                </View>
                <Text style={styles.drilldownArrow}>→</Text>
              </TouchableOpacity>
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
  brandTitle: {
    ...typography.headlineMd,
    fontSize: 18,
    lineHeight: 24,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    letterSpacing: 3,
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
  filterContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 3,
    gap: 4,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.gold,
  },
  filterPillInactive: {
    backgroundColor: 'transparent',
  },
  filterPillText: {
    ...typography.labelCaps,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  filterPillTextActive: {
    color: colors.inverseText,
    fontWeight: '800',
  },
  filterPillTextInactive: {
    color: colors.secondaryText,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  stateWrapper: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  chartsSection: {
    marginTop: 4,
  },
  errorCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  warningCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.goldMuted,
  },
  errorTitle: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 22,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.surfaceBright,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.headlineSm,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 20,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  startFirstButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
  },
  startFirstButtonText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  drilldownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderGold,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  drilldownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drilldownText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  drilldownArrow: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
});
