import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'darkOutline' | 'text';

export interface KinetraButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconRight?: React.ReactNode;
  iconLeft?: React.ReactNode;
  testID?: string;
}

export const KinetraButton: React.FC<KinetraButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  iconRight,
  iconLeft,
  testID,
}) => {
  const isInteractive = !loading && !disabled;
  const lastPressRef = useRef<number>(0);

  const handlePress = () => {
    const now = Date.now();
    if (now - lastPressRef.current < 750) {
      return;
    }
    lastPressRef.current = now;
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return styles.primaryContainer;
      case 'secondary':
        return styles.secondaryContainer;
      case 'darkOutline':
        return styles.darkOutlineContainer;
      case 'text':
        return styles.textContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'darkOutline':
        return styles.darkOutlineText;
      case 'text':
        return styles.textOnly;
      default:
        return styles.primaryText;
    }
  };

  const getSpinnerColor = () => {
    if (variant === 'primary') return colors.inverseText;
    return colors.goldBright;
  };

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.8}
      onPress={isInteractive ? handlePress : undefined}
      disabled={!isInteractive}
      style={[
        styles.baseContainer,
        getContainerStyle(),
        disabled && styles.disabledContainer,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getSpinnerColor()} />
      ) : (
        <>
          {iconLeft}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {iconRight}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    height: spacing.buttonHeight,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  primaryContainer: {
    backgroundColor: colors.goldBright,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  darkOutlineContainer: {
    backgroundColor: 'rgba(5, 6, 7, 0.75)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  textContainer: {
    backgroundColor: 'transparent',
    height: 'auto',
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
  },
  disabledContainer: {
    opacity: 0.45,
  },
  primaryText: {
    ...typography.button,
    color: colors.inverseText,
    fontWeight: '800',
  },
  secondaryText: {
    ...typography.button,
    color: colors.gold,
    fontWeight: '700',
  },
  darkOutlineText: {
    ...typography.button,
    color: colors.goldBright,
    fontWeight: '700',
  },
  textOnly: {
    ...typography.bodyMd,
    color: colors.gold,
    fontWeight: '600',
  },
});
