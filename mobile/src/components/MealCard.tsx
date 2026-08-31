/**
 * Kinetra Meal Card Component
 * Reusable recommendation card matching Stitch luxury dark athletic design.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from './Icon';
import { MealPlanItem } from '../api/client';

interface MealCardProps {
  meal: MealPlanItem;
  variant?: 'compact' | 'full';
  onPress?: () => void;
  testID?: string;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  variant = 'compact',
  onPress,
  testID = 'meal-card',
}) => {
  const timingLabel = meal.name.toUpperCase();
  const calories = meal.calories ? `${meal.calories}` : '--';
  const prepTime = meal.prep_time_min || (meal.calories > 600 ? 25 : 15);
  const itemsSummary = meal.items && meal.items.length > 0 ? meal.items.join(', ') : 'Curated whole food athletic nutrition';

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={0.8}
        testID={testID}
        accessibilityRole="button"
      >
        <View style={styles.compactHeader}>
          <View style={styles.timingBadge}>
            <Text style={styles.timingBadgeText}>{timingLabel}</Text>
          </View>
          <View style={styles.calorieBadge}>
            <Icon name="bolt" size={11} color={colors.gold} style={{ marginRight: 3 }} />
            <Text style={styles.calorieBadgeText}>{calories} kcal</Text>
          </View>
        </View>

        <Text style={styles.compactTitle} numberOfLines={1}>
          {meal.items && meal.items.length > 0 ? meal.items[0] : meal.name}
        </Text>

        <View style={styles.compactMetaRow}>
          <View style={styles.metaItem}>
            <Icon name="clock" size={12} color={colors.tertiaryText} style={{ marginRight: 4 }} />
            <Text style={styles.metaText}>{prepTime} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.macroMetaText}>
              P: {meal.protein_g}g • C: {meal.carbs_g}g • F: {meal.fat_g}g
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Full Variant (Recommendations Screen)
  return (
    <TouchableOpacity
      style={styles.fullCard}
      onPress={onPress}
      activeOpacity={0.8}
      testID={testID}
      accessibilityRole="button"
    >
      {/* Thumbnail artwork frame */}
      <View style={styles.thumbnailFrame}>
        <View style={styles.thumbnailInner}>
          <Icon name="cutlery" size={28} color={colors.gold} />
        </View>
        <View style={styles.timingTagFloating}>
          <Text style={styles.timingTagFloatingText}>{timingLabel}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.fullContent}>
        <View style={styles.fullTitleRow}>
          <Text style={styles.fullTitle} numberOfLines={2}>
            {meal.items && meal.items.length > 0 ? meal.items[0] : meal.name}
          </Text>
          <View style={styles.fullCalorieBox}>
            <Text style={styles.fullCalorieNum}>{calories}</Text>
            <Text style={styles.fullCalorieUnit}>KCAL</Text>
          </View>
        </View>

        <Text style={styles.itemsDescription} numberOfLines={2}>
          {itemsSummary}
        </Text>

        {/* 3-Macro Tag Badges */}
        <View style={styles.macroPillRow}>
          <View style={styles.macroPill}>
            <Text style={styles.macroPillLabel}>PROTEIN</Text>
            <Text style={styles.macroPillVal}>{meal.protein_g}g</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroPillLabel}>CARBS</Text>
            <Text style={styles.macroPillVal}>{meal.carbs_g}g</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroPillLabel}>FATS</Text>
            <Text style={styles.macroPillVal}>{meal.fat_g}g</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  compactCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timingBadge: {
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: borderRadius.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timingBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieBadgeText: {
    ...typography.caption,
    color: colors.gold,
    fontWeight: '700',
    fontSize: 11,
  },
  compactTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 16,
    marginBottom: 8,
  },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 11,
  },
  macroMetaText: {
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 11,
    fontWeight: '600',
  },

  // Full Card
  fullCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  thumbnailFrame: {
    height: 140,
    backgroundColor: colors.surfaceBright,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbnailInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceDim,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timingTagFloating: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(5, 6, 7, 0.85)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: borderRadius.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timingTagFloatingText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  fullContent: {
    padding: spacing.md,
  },
  fullTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fullTitle: {
    ...typography.headlineMd,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 18,
    flex: 1,
    marginRight: 12,
  },
  fullCalorieBox: {
    alignItems: 'flex-end',
  },
  fullCalorieNum: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '800',
    color: colors.gold,
    fontSize: 18,
    lineHeight: 20,
  },
  fullCalorieUnit: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    letterSpacing: 1,
  },
  itemsDescription: {
    ...typography.bodySm,
    color: colors.secondaryText,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  macroPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    backgroundColor: colors.surfaceBright,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  macroPillLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 2,
  },
  macroPillVal: {
    ...typography.caption,
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 11,
  },
});
