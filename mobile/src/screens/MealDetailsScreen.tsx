/**
 * Kinetra Meal Details Breakdown Screen (Phase 34)
 * Exact Stitch luxury dark athletic design matching Screen 3.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { MealPlanItem } from '../api/client';

interface MealDetailsScreenProps {
  route?: any;
  navigation?: any;
}

export const MealDetailsScreen: React.FC<MealDetailsScreenProps> = ({ route, navigation }) => {
  const meal: MealPlanItem = route?.params?.meal || {
    name: 'Curated Fuel',
    calories: 650,
    protein_g: 45,
    carbs_g: 45,
    fat_g: 20,
    items: [],
  };
  const dietType: string = route?.params?.dietType || 'omnivore';

  const mealName = meal?.items && meal.items.length > 0 ? meal.items[0] : meal?.name || 'Curated Athletic Fuel';
  const prepTime = meal?.prep_time_min || (meal?.calories > 600 ? 45 : 20);
  const timing = (meal?.timing || meal?.name || 'POST-WORKOUT').toUpperCase();

  // Approximate fiber based on carbs ratio for full 4-macro presentation
  const fiberGrams = Math.max(4, Math.round((meal?.carbs_g || 30) * 0.25));

  // Determine Elite Compatibility Badges
  const isHighProtein = (meal?.protein_g || 0) >= 35;
  const isVegan = dietType === 'vegan';
  const isKeto = dietType === 'keto';

  const compatibilityBadges: string[] = [];
  if (isHighProtein) compatibilityBadges.push('High Protein Index');
  if (isVegan) compatibilityBadges.push('100% Plant-Based');
  if (isKeto) compatibilityBadges.push('Ketogenic Macro Ratio');
  compatibilityBadges.push('Bio-Available Fuel');

  const handlePrepareMeal = () => {
    Alert.alert(
      'Prepare Meal',
      `Meal logged to daily intake.\nEnergy: ${meal.calories} kcal\nProtein: ${meal.protein_g}g\nCarbohydrates: ${meal.carbs_g}g\nFats: ${meal.fat_g}g`,
      [
        {
          text: 'Done',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          testID="meal-details-back-button"
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Icon name="back" size={18} color={colors.gold} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>KINETRA</Text>

        <View style={styles.headerRightBadge}>
          <Icon name="gear" size={16} color={colors.gold} />
        </View>
      </View>

      {/* 2. SCROLLABLE MEAL CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Artwork Frame */}
        <View style={styles.heroFrame}>
          <View style={styles.heroArtwork}>
            <Icon name="cutlery" size={48} color={colors.gold} />
          </View>

          {/* Floating Badges */}
          <View style={styles.floatingBadgeRow}>
            <View style={styles.heroTag}>
              <Icon name="sparkle" size={10} color={colors.gold} style={{ marginRight: 4 }} />
              <Text style={styles.heroTagText}>{timing}</Text>
            </View>
            <View style={styles.heroTag}>
              <Icon name="clock" size={10} color={colors.gold} style={{ marginRight: 4 }} />
              <Text style={styles.heroTagText}>{prepTime} MIN PREP</Text>
            </View>
          </View>
        </View>

        {/* Title & Calorie Highlight */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{mealName}</Text>
          <View style={styles.calorieRow}>
            <Text style={styles.calorieNum}>{meal.calories}</Text>
            <Text style={styles.calorieUnit}>KCAL</Text>
          </View>
        </View>

        {/* 4-Column Macro Grid */}
        <View style={styles.macroGrid} testID="meal-details-macros">
          <View style={styles.macroCol}>
            <Text style={styles.macroColLabel}>PROTEIN</Text>
            <Text style={styles.macroColValue}>{meal.protein_g}g</Text>
            <View style={styles.macroIndicatorGold} />
          </View>

          <View style={styles.macroCol}>
            <Text style={styles.macroColLabel}>CARBS</Text>
            <Text style={styles.macroColValue}>{meal.carbs_g}g</Text>
            <View style={styles.macroIndicatorGold} />
          </View>

          <View style={styles.macroCol}>
            <Text style={styles.macroColLabel}>FAT</Text>
            <Text style={styles.macroColValue}>{meal.fat_g}g</Text>
            <View style={styles.macroIndicatorMuted} />
          </View>

          <View style={styles.macroCol}>
            <Text style={styles.macroColLabel}>FIBER</Text>
            <Text style={styles.macroColValue}>{fiberGrams}g</Text>
            <View style={styles.macroIndicatorMuted} />
          </View>
        </View>

        {/* Technical Assembly (Ingredients) */}
        <View style={styles.sectionCard} testID="meal-details-assembly">
          <View style={styles.sectionTitleRow}>
            <Icon name="bookmark" size={14} color={colors.gold} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Technical Assembly</Text>
          </View>

          {meal.items && meal.items.length > 0 ? (
            meal.items.map((item, index) => (
              <View key={`item-${index}`} style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>{item}</Text>
                <Text style={styles.ingredientMeasure}>
                  {index === 0 ? 'PORTION A' : index === 1 ? '1 SERVING' : 'TO TASTE'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>Whole-food athletic nutritional assembly.</Text>
          )}
        </View>

        {/* Elite Compatibility */}
        <View style={styles.sectionCard} testID="meal-details-compatibility">
          <Text style={styles.compatibilityHeader}>ELITE COMPATIBILITY</Text>
          {compatibilityBadges.map((badge, idx) => (
            <View key={`badge-${idx}`} style={styles.compatBadgeRow}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkIconText}>✓</Text>
              </View>
              <Text style={styles.compatBadgeText}>{badge}</Text>
            </View>
          ))}
        </View>

        {/* Warnings Card */}
        {meal.calories >= 700 && (
          <View style={styles.warningCard} testID="meal-details-warning">
            <View style={styles.warningHeader}>
              <Icon name="warning" size={14} color={colors.crimson} style={{ marginRight: 6 }} />
              <Text style={styles.warningTitle}>CALORIC DENSITY ADVISORY</Text>
            </View>
            <Text style={styles.warningBody}>
              High caloric and nutrient density. Recommended for heavy training days, progressive volume overload, or post-workout recovery.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 3. BOTTOM PREPARE MEAL CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.prepareButton}
          onPress={handlePrepareMeal}
          testID="meal-details-prepare-button"
          accessibilityRole="button"
        >
          <Icon name="cutlery" size={16} color={colors.inverseText} style={{ marginRight: 8 }} />
          <Text style={styles.prepareButtonText}>PREPARE MEAL</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  brandTitle: {
    ...typography.brandWordmarkSmall,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 3,
  },
  headerRightBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  heroFrame: {
    height: 180,
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  heroArtwork: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceBright,
    borderWidth: 2,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 6, 7, 0.85)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: borderRadius.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroTagText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  titleSection: {
    marginBottom: spacing.lg,
  },
  mainTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 6,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calorieNum: {
    ...typography.headlineMd,
    fontFamily: 'serif',
    fontWeight: '800',
    color: colors.gold,
    fontSize: 22,
    marginRight: 4,
  },
  calorieUnit: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    letterSpacing: 1,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.xl,
  },
  macroCol: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    alignItems: 'center',
  },
  macroColLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  macroColValue: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 18,
    marginBottom: 6,
  },
  macroIndicatorGold: {
    width: '100%',
    height: 3,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.full,
  },
  macroIndicatorMuted: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.full,
  },
  sectionCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 17,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  ingredientName: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontSize: 13,
  },
  ingredientMeasure: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
  },
  noItemsText: {
    ...typography.bodySm,
    color: colors.secondaryText,
  },
  compatibilityHeader: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  compatBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(217, 184, 63, 0.15)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkIconText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
  },
  compatBadgeText: {
    ...typography.bodySm,
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '500',
  },
  warningCard: {
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.25)',
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningTitle: {
    ...typography.labelCaps,
    color: colors.crimson,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  warningBody: {
    ...typography.caption,
    color: colors.secondaryText,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  prepareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: borderRadius.sm,
  },
  prepareButtonText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
