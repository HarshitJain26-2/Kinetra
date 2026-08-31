/**
 * Kinetra Analytics Summary Cards
 * Compact 2-column grid of overview metrics with strict no-fabrication fallbacks.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from './Icon';
import { ComputedAnalytics } from '../api/client';

interface AnalyticsSummaryCardsProps {
  analytics: ComputedAnalytics | null;
  loading?: boolean;
}

export const AnalyticsSummaryCards: React.FC<AnalyticsSummaryCardsProps> = ({
  analytics,
  loading = false,
}) => {
  const workoutsDisplay =
    loading || !analytics || analytics.totalWorkouts === 0
      ? '--'
      : `${analytics.totalWorkouts}`;

  const activeMinsDisplay =
    loading || !analytics || analytics.activeMinutes === 0
      ? '--'
      : `${analytics.activeMinutes}m`;

  const caloriesDisplay =
    loading || !analytics || analytics.caloriesBurned === null
      ? '--'
      : `${analytics.caloriesBurned}`;

  const formScoreDisplay =
    loading || !analytics || analytics.avgFormScore === null
      ? '--'
      : `${analytics.avgFormScore}`;

  const repsDisplay =
    loading || !analytics || analytics.totalReps === null
      ? '--'
      : `${analytics.totalReps}`;

  const streakDisplay =
    loading || !analytics || analytics.currentStreak === 0
      ? '--'
      : `${analytics.currentStreak}d`;

  return (
    <View style={styles.container} testID="analytics-summary-grid">
      {/* ROW 1: Total Workouts & Active Minutes */}
      <View style={styles.row}>
        <View style={styles.card} testID="metric-total-workouts">
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>TOTAL WORKOUTS</Text>
            <Icon name="train" size={14} color={colors.gold} />
          </View>
          <Text style={styles.cardValue}>{workoutsDisplay}</Text>
          <Text style={styles.cardSubtitle}>
            {analytics && analytics.totalWorkouts > 0 ? 'Completed sessions' : 'No sessions recorded'}
          </Text>
        </View>

        <View style={styles.card} testID="metric-active-mins">
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>ACTIVE TIME</Text>
            <Icon name="clock" size={14} color={colors.gold} />
          </View>
          <Text style={styles.cardValue}>{activeMinsDisplay}</Text>
          <Text style={styles.cardSubtitle}>
            {analytics && analytics.activeMinutes > 0 ? 'Total training time' : 'No time logged'}
          </Text>
        </View>
      </View>

      {/* ROW 2: Form Score & Calories */}
      <View style={styles.row}>
        <View style={styles.card} testID="metric-avg-form-score">
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>AVG FORM SCORE</Text>
            <Icon name="sparkle" size={14} color={colors.gold} />
          </View>
          <Text style={[styles.cardValue, { color: colors.gold }]}>
            {formScoreDisplay}
            {formScoreDisplay !== '--' ? <Text style={styles.cardMuted}> /100</Text> : ''}
          </Text>
          <Text style={styles.cardSubtitle}>
            {analytics?.avgFormScore ? 'Biomechanical accuracy' : 'No AI score yet'}
          </Text>
        </View>

        <View style={styles.card} testID="metric-calories">
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>EST. CALORIES</Text>
            <Icon name="flame" size={14} color={colors.gold} />
          </View>
          <Text style={styles.cardValue}>{caloriesDisplay}</Text>
          <Text style={styles.cardSubtitle}>
            {analytics?.caloriesBurned ? 'Kilocalories burned' : 'No calorie data'}
          </Text>
        </View>
      </View>

      {/* ROW 3: Total Reps & Current Streak */}
      <View style={styles.row}>
        <View style={styles.card} testID="metric-total-reps">
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>TOTAL REPS</Text>
            <Icon name="bolt" size={14} color={colors.gold} />
          </View>
          <Text style={styles.cardValue}>{repsDisplay}</Text>
          <Text style={styles.cardSubtitle}>
            {analytics?.totalReps ? 'Cumulative volume' : 'No reps recorded'}
          </Text>
        </View>

        <View style={styles.card} testID="metric-current-streak">
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>CURRENT STREAK</Text>
            <Icon name="flame" size={14} color={colors.crimson} />
          </View>
          <Text style={[styles.cardValue, { color: colors.primaryText }]}>
            {streakDisplay}
          </Text>
          <Text style={styles.cardSubtitle}>
            {analytics && analytics.currentStreak > 0 ? 'Consecutive days' : 'Start your streak'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    justifyContent: 'space-between',
    minHeight: 104,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  cardValue: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 28,
  },
  cardMuted: {
    fontSize: 13,
    color: colors.tertiaryText,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 11,
    marginTop: 4,
  },
});
