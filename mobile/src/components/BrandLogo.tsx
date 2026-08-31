import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

export interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  taglineText?: string;
  showEmblem?: boolean;
  style?: ViewStyle;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'medium',
  showTagline = false,
  taglineText = 'ELITE INTELLIGENCE. REFINED PERFORMANCE.',
  showEmblem = false,
  style,
}) => {
  const getWordmarkStyle = () => {
    switch (size) {
      case 'small':
        return typography.brandWordmarkSmall;
      case 'large':
        return [typography.brandWordmark, { fontSize: 34, letterSpacing: 8 }];
      default:
        return typography.brandWordmark;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {showEmblem && (
        <View style={styles.emblemContainer}>
          <View style={styles.emblemCard}>
            <Text style={styles.emblemLetter}>K</Text>
            <Text style={styles.emblemSubtitle}>KINETRA</Text>
            <Text style={styles.emblemSubtag}>FITNESS</Text>
          </View>
        </View>
      )}

      <Text style={[styles.wordmark, getWordmarkStyle()]}>KINETRA</Text>

      {showTagline && (
        <Text style={styles.tagline}>{taglineText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  emblemContainer: {
    marginBottom: spacing.lg,
  },
  emblemCard: {
    width: 140,
    height: 140,
    backgroundColor: '#111415',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  emblemLetter: {
    fontFamily: typography.brandWordmark.fontFamily,
    fontSize: 54,
    fontWeight: '800',
    color: colors.goldBright,
    letterSpacing: 2,
  },
  emblemSubtitle: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 10,
    letterSpacing: 3,
    marginTop: 2,
  },
  emblemSubtag: {
    ...typography.caption,
    color: colors.gold,
    fontSize: 8,
    letterSpacing: 2,
    marginTop: 1,
  },
  wordmark: {
    color: colors.primaryText,
    textAlign: 'center',
  },
  tagline: {
    ...typography.tagline,
    color: colors.secondaryText,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
