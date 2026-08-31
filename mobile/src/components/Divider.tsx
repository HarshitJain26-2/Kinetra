import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme';

export interface DividerProps {
  text?: string;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({ text, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.line} />
      {text && <Text style={styles.text}>{text}</Text>}
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  text: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    marginHorizontal: spacing.md,
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
