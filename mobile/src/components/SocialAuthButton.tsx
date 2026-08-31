import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme';

export interface SocialAuthButtonProps {
  provider: 'apple' | 'google';
  onPress: () => void;
  style?: ViewStyle;
}

export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({
  provider,
  onPress,
  style,
}) => {
  const isApple = provider === 'apple';
  const label = isApple ? 'Apple' : 'Google';
  const icon = isApple ? '' : 'G';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, style]}
      accessibilityRole="button"
      accessibilityLabel={`Continue with ${label}`}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 48,
    backgroundColor: '#111315',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: borderRadius.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
  },
  icon: {
    fontSize: 18,
    color: colors.primaryText,
    marginRight: spacing.sm,
    fontWeight: '700',
  },
  label: {
    ...typography.button,
    color: colors.primaryText,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'none',
  },
});
