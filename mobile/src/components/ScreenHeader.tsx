import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

export interface ScreenHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title = 'KINETRA',
  showBack = false,
  onBack,
  rightAction,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightContainer}>
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: spacing.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
    backgroundColor: 'transparent',
  },
  leftContainer: {
    width: 48,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 48,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    color: colors.primaryText,
  },
  title: {
    ...typography.brandWordmarkSmall,
    color: colors.primaryText,
    letterSpacing: 4,
  },
});
