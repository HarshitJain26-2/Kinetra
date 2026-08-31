/**
 * Kinetra Calorie Dial Component
 * Circular SVG dial displaying daily intake progress and status.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, typography } from '../theme';
import { Icon } from './Icon';

interface CalorieDialProps {
  consumedCalories?: number | null;
  targetCalories?: number | null;
  statusLabel?: string;
  size?: number;
  testID?: string;
}

export const CalorieDial: React.FC<CalorieDialProps> = ({
  consumedCalories = null,
  targetCalories = null,
  statusLabel = 'OPTIMAL',
  size = 140,
  testID = 'calorie-dial',
}) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute progress ratio (0 to 1)
  let progress = 0;
  if (targetCalories && targetCalories > 0) {
    if (consumedCalories !== null && consumedCalories > 0) {
      progress = Math.min(1, Math.max(0, consumedCalories / targetCalories));
    } else {
      progress = 0.75; // Default optimal arc position when showing target calibration
    }
  }

  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]} testID={testID}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="dialGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#F0C83E" />
            <Stop offset="100%" stopColor="#D9B83F" />
          </LinearGradient>
        </Defs>

        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#dialGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center Label */}
      <View style={styles.centerContent}>
        <Icon name="flame" size={18} color={colors.gold} style={{ marginBottom: 2 }} />
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
