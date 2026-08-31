import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme';

export interface InlineErrorProps {
  message?: string | null;
  style?: ViewStyle;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, style }) => {
  if (!message) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.crimsonMuted,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.borderError,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  icon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  text: {
    ...typography.bodySm,
    color: colors.error,
    flex: 1,
    fontWeight: '500',
  },
});
