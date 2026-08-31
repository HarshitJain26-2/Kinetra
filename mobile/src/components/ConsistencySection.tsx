/**
 * Kinetra Weekly Consistency & Streak Section
 * Visualizes Mon–Sun training consistency and active streaks.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from './Icon';

interface ConsistencySectionProps {
  weeklyActiveDays?: boolean[]; // Array of 7 booleans (Mon to Sun)
  currentStreak?: number;
  loading?: boolean;
  testID?: string;
}

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const ConsistencySection: React.FC<ConsistencySectionProps> = ({
  weeklyActiveDays = [false, false, false, false, false, false, false],
  currentStreak = 0,
  loading = false,
  testID = 'consistency-section',
}) => {
  const activeCount = weeklyActiveDays.filter(Boolean).length;

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titleText}>CONSISTENCY</Text>
          <Text style={styles.subtitleText}>
            {loading
              ? 'Loading activity...'
              : activeCount > 0
              ? `${activeCount} active training days this week`
              : 'Complete your first workout this week'}
          </Text>
        </View>

        {currentStreak > 0 ? (
          <View style={styles.streakBadge} testID="streak-indicator-badge">
            <Icon name="flame" size={14} color={colors.crimson} style={{ marginRight: 4 }} />
            <Text style={styles.streakBadgeText}>{currentStreak} DAY STREAK</Text>
          </View>
        ) : null}
      </View>

      {/* 7-Day Matrix */}
      <View style={styles.daysRow}>
        {DAYS_OF_WEEK.map((dayLetter, index) => {
          const isActive = !loading && weeklyActiveDays[index];

          return (
            <View key={`day-${index}`} style={styles.dayColumn}>
              <View
                style={[
                  styles.dayCircle,
                  isActive ? styles.dayCircleActive : styles.dayCircleInactive,
                ]}
                testID={`day-circle-${index}`}
              >
                {isActive ? (
                  <Text style={styles.checkText}>✓</Text>
                ) : (
                  <View style={styles.inactiveDot} />
                )}
              </View>
              <Text
                style={[
                  styles.dayLetter,
                  isActive ? styles.dayLetterActive : styles.dayLetterInactive,
                ]}
              >
                {dayLetter}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  subtitleText: {
    ...typography.bodySm,
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: 13,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.3)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakBadgeText: {
    ...typography.labelCaps,
    color: colors.crimson,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dayCircleActive: {
    backgroundColor: colors.gold,
  },
  dayCircleInactive: {
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  checkText: {
    color: colors.inverseText,
    fontSize: 14,
    fontWeight: '900',
  },
  inactiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dayLetter: {
    ...typography.labelCaps,
    fontSize: 10,
    fontWeight: '700',
  },
  dayLetterActive: {
    color: colors.gold,
  },
  dayLetterInactive: {
    color: colors.tertiaryText,
  },
});
