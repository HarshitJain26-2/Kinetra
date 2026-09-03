/**
 * Kinetra Loading Indicator (Section 29)
 * Unified loading indicator component for action-level and micro-telemetry feedback.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../theme';

export interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  testID?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message,
  size = 'large',
  color = colors.gold,
  testID = 'global-loading-indicator',
}) => {
  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Loading'}
    >
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  message: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 10.5,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
