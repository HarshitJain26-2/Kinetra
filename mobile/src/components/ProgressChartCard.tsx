/**
 * Kinetra Progress Chart Card
 * Polished SVG trend chart for Reps, Form Score, Duration, and Calories.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, spacing, borderRadius, typography } from '../theme';
import { ChartDataPoint } from '../api/client';
import { Icon } from './Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProgressChartCardProps {
  title: string;
  metricLabel: string;
  data: ChartDataPoint[];
  unit?: string;
  maxScale?: number;
  testID?: string;
}

export const ProgressChartCard: React.FC<ProgressChartCardProps> = ({
  title,
  metricLabel,
  data,
  unit = '',
  maxScale,
  testID = 'progress-chart-card',
}) => {
  const chartWidth = SCREEN_WIDTH - spacing.lg * 2 - spacing.md * 2;
  const chartHeight = 120;
  const paddingX = 16;
  const paddingY = 16;

  const hasData = data && data.length > 0;
  const latestValue = hasData ? data[data.length - 1].value : null;

  // Calculate scaling
  const values = data.map((d) => d.value);
  const minVal = hasData ? Math.min(0, Math.min(...values)) : 0;
  const maxVal = hasData
    ? maxScale !== undefined
      ? maxScale
      : Math.max(10, Math.max(...values) * 1.15)
    : 100;

  const getX = (index: number) => {
    if (data.length <= 1) return chartWidth / 2;
    return paddingX + (index / (data.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    const range = maxVal - minVal || 1;
    const norm = (val - minVal) / range;
    return chartHeight - paddingY - norm * (chartHeight - paddingY * 2);
  };

  // Build SVG Path
  let pathD = '';
  let areaD = '';

  if (hasData) {
    const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));
    if (points.length === 1) {
      pathD = `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`;
    } else {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cx = (prev.x + curr.x) / 2;
        pathD += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
      }

      areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
    }
  }

  return (
    <View style={styles.card} testID={testID}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.metricLabelText}>{metricLabel}</Text>
        </View>

        {latestValue !== null ? (
          <View style={styles.currentValueBadge}>
            <Text style={styles.currentValueText}>
              {latestValue}
              {unit ? <Text style={styles.unitText}> {unit}</Text> : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Chart Body */}
      {hasData ? (
        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.gold} stopOpacity="0.35" />
                <Stop offset="100%" stopColor={colors.gold} stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Subtle Grid Lines */}
            <Line
              x1={paddingX}
              y1={paddingY}
              x2={chartWidth - paddingX}
              y2={paddingY}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeDasharray="4, 4"
            />
            <Line
              x1={paddingX}
              y1={chartHeight / 2}
              x2={chartWidth - paddingX}
              y2={chartHeight / 2}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeDasharray="4, 4"
            />
            <Line
              x1={paddingX}
              y1={chartHeight - paddingY}
              x2={chartWidth - paddingX}
              y2={chartHeight - paddingY}
              stroke="rgba(255, 255, 255, 0.1)"
            />

            {/* Area Fill */}
            {areaD ? <Path d={areaD} fill="url(#goldGradient)" /> : null}

            {/* Main Gold Line */}
            {pathD ? (
              <Path
                d={pathD}
                fill="none"
                stroke={colors.gold}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            ) : null}

            {/* Point Markers */}
            {data.map((d, i) => (
              <Circle
                key={`dot-${d.id || i}`}
                cx={getX(i)}
                cy={getY(d.value)}
                r={4}
                fill={colors.gold}
                stroke="#050607"
                strokeWidth={2}
              />
            ))}
          </Svg>

          {/* X-Axis Date Labels */}
          <View style={styles.xAxisRow}>
            {data.map((d, i) => (
              <Text key={`label-${d.id || i}`} style={styles.xAxisText}>
                {d.label}
              </Text>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer} testID={`${testID}-empty`}>
          <Icon name="stats" size={24} color={colors.tertiaryText} style={{ marginBottom: 6 }} />
          <Text style={styles.emptyTitle}>No Data In This Range</Text>
          <Text style={styles.emptySubtitle}>
            Complete training sessions to populate real progression analytics.
          </Text>
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
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  headerRow: {
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
  metricLabelText: {
    ...typography.headlineSm,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 17,
  },
  currentValueBadge: {
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currentValueText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 10,
    color: colors.secondaryText,
  },
  chartContainer: {
    alignItems: 'center',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 6,
  },
  xAxisText: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 10,
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.tertiaryText,
    textAlign: 'center',
    fontSize: 11,
  },
});
