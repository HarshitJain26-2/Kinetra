import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme';

export interface KinetraInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  headerRight?: React.ReactNode;
}

export const KinetraInput: React.FC<KinetraInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  headerRight,
  onFocus,
  onBlur,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const internalInputRef = useRef<TextInput>(null);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleContainerPress = () => {
    internalInputRef.current?.focus();
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {(label || headerRight) && (
        <View style={styles.headerRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {headerRight}
        </View>
      )}

      <Pressable
        onPress={handleContainerPress}
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}

        <TextInput
          ref={internalInputRef}
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.placeholderText}
          selectionColor={colors.gold}
          editable={true}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...restProps}
        />

        {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}
      </Pressable>

      {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.sm,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  label: {
    ...typography.labelCaps,
    color: colors.primaryText,
  },
  inputContainer: {
    height: spacing.inputHeight,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  inputError: {
    borderColor: colors.crimson,
  },
  leftIconWrapper: {
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconWrapper: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: typography.bodyMd.fontFamily,
    paddingVertical: 0,
    textAlignVertical: 'center',
    color: '#111415',
    fontWeight: '500',
  },
  errorText: {
    ...typography.caption,
    color: colors.crimson,
    marginTop: spacing.xs,
  },
});
