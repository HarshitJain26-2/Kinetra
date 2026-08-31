/**
 * Kinetra Macro Progress Bar Component
 * Displays macronutrient target with linear progress fill.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, typography } from '../theme';

interface MacroProgressBarProps {
  label: string;
  currentGrams?: number | null;
  targetGrams?: number | null;
  unit?: string;
  testID?: string;
}

export const MacroProgressBar: React.FC<MacroProgressBarProps> = ({
  label,
  currentGrams = null,
  targetGrams = null,
  unit = 'g',
  testID,
}) => {
  const hasTarget = targetGrams !== null && targetGrams !== undefined && targetGrams > 0;
  const hasCurrent = currentGrams !== null && currentGrams !== undefined && currentGrams >= 0;

  let progress = 0;
  if (hasTarget) {
    if (hasCurrent) {
      progress = Math.min(1, Math.max(0, (currentGrams as number) / (targetGrams as number)));
    } else {
      progress = 0.85; // Visual calibration baseline when target is active
    }
  }

  const valueDisplay = hasTarget
    ? hasCurrent
      ? `${currentGrams}${unit} / ${targetGrams}${unit}`
      : `${targetGrams}${unit}`
    : '--';

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>{label}</Text>
        <Text style={styles.valueText}>{valueDisplay}</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelText: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: 13,
  },
  valueText: {
    ...typography.caption,
    color: colors.gold,
    fontWeight: '700',
    fontSize: 12,
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: borderRadius.full,
  },
});
