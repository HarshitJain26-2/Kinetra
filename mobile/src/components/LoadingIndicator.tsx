import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../theme';

export interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message,
  size = 'large',
  color = colors.goldBright,
}) => {
  return (
    <View style={styles.container}>
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
    ...typography.bodySm,
    color: colors.secondaryText,
    marginTop: spacing.sm,
  },
});
