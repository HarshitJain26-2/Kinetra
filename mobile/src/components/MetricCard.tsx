import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon, IconName } from './Icon';

interface MetricCardProps {
  label: string;
  value?: string | number | null;
  deltaOrSubtitle?: string | null;
  iconName: IconName;
  iconColor?: string;
  progressPercent?: number; // 0 to 100
  indicatorType?: 'solid' | 'segmented';
  indicatorColor?: string;
  style?: ViewStyle;
  testID?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  deltaOrSubtitle,
  iconName,
  iconColor = colors.gold,
  progressPercent,
  indicatorType = 'solid',
  indicatorColor = colors.gold,
  style,
  testID,
}) => {
  const displayValue = value !== undefined && value !== null ? String(value) : '--';
  const hasValue = displayValue !== '--';

  return (
    <View style={[styles.card, style]} testID={testID}>
      {/* Header: Label + Icon */}
      <View style={styles.headerRow}>
        <Text style={styles.labelText}>{label.toUpperCase()}</Text>
        <Icon name={iconName} size={16} color={iconColor} />
      </View>

      {/* Main Metric + Subtitle / Delta */}
      <View style={styles.valueRow}>
        <Text style={styles.valueText}>{displayValue}</Text>
        {deltaOrSubtitle ? (
          <Text
            style={[
              styles.subtitleText,
              deltaOrSubtitle.startsWith('+') ? styles.positiveDeltaText : null,
            ]}
          >
            {deltaOrSubtitle}
          </Text>
        ) : null}
      </View>

      {/* Visual Indicator Track */}
      {indicatorType === 'solid' ? (
        <View style={styles.trackBackground}>
          {hasValue && progressPercent !== undefined && progressPercent > 0 ? (
            <View
              style={[
                styles.trackFill,
                {
                  width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                  backgroundColor: indicatorColor,
                },
              ]}
            />
          ) : (
            <View style={styles.trackEmpty} />
          )}
        </View>
      ) : (
        <View style={styles.segmentedContainer}>
          {[1, 2, 3, 4].map((segIndex) => {
            const isFilled =
              hasValue &&
              progressPercent !== undefined &&
              progressPercent >= (segIndex / 4) * 100 - 10;
            return (
              <View
                key={segIndex}
                style={[
                  styles.segment,
                  isFilled
                    ? { backgroundColor: indicatorColor }
                    : styles.segmentInactive,
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  labelText: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  valueText: {
    ...typography.headlineLg,
    fontSize: 32,
    lineHeight: 38,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  subtitleText: {
    ...typography.bodySm,
    color: colors.tertiaryText,
    fontSize: 12,
  },
  positiveDeltaText: {
    color: colors.gold,
    fontWeight: '600',
  },
  trackBackground: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  trackFill: {
    height: '100%',
    borderRadius: 2,
  },
  trackEmpty: {
    height: '100%',
    width: '0%',
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  segmentInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
