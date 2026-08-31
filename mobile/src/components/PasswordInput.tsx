import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { KinetraInput, KinetraInputProps } from './KinetraInput';
import { colors } from '../theme';

export interface PasswordInputProps extends Omit<KinetraInputProps, 'secureTextEntry'> {
  showToggle?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  showToggle = true,
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(true);

  const toggleSecure = () => {
    setIsSecure((prev) => !prev);
  };

  const EyeToggle = showToggle ? (
    <TouchableOpacity
      onPress={toggleSecure}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
      accessibilityRole="button"
    >
      <Text style={styles.toggleText}>{isSecure ? '👁' : '🚫'}</Text>
    </TouchableOpacity>
  ) : undefined;

  const LockIcon = <Text style={styles.lockIcon}>🔒</Text>;

  return (
    <KinetraInput
      secureTextEntry={isSecure}
      leftIcon={props.leftIcon ?? LockIcon}
      rightIcon={EyeToggle}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  lockIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  toggleText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
