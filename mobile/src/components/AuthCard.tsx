import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme';

export interface AuthCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showGoldIndicator?: boolean;
  style?: ViewStyle;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  title,
  subtitle,
  showGoldIndicator = false,
  style,
}) => {
  return (
    <View style={[styles.cardContainer, style]}>
      {showGoldIndicator && <View style={styles.goldIndicator} />}
      
      <View style={styles.innerContent}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#17191B',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  goldIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.goldBright,
  },
  innerContent: {
    padding: spacing.cardPadding,
  },
  title: {
    ...typography.headlineLg,
    color: colors.primaryText,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.secondaryText,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
});
