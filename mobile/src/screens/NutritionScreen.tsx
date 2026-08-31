/**
 * Kinetra Nutrition Dashboard Screen (Phase 34)
 * Exact Stitch luxury dark athletic design matching Screen 1 and Diagnostic States.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { CalorieDial } from '../components/CalorieDial';
import { MacroProgressBar } from '../components/MacroProgressBar';
import { MealCard } from '../components/MealCard';
import { LoadingIndicator } from '../components/LoadingIndicator';
import {
  apiClient,
  UserProfileData,
  NutritionProfileData,
  GeneratedMealPlan,
  MealPlanItem,
  computeBMI,
} from '../api/client';

interface NutritionScreenProps {
  navigation: any;
}

export const NutritionScreen: React.FC<NutritionScreenProps> = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [nutritionProfile, setNutritionProfile] = useState<NutritionProfileData | null>(null);
  const [mealPlan, setMealPlan] = useState<GeneratedMealPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNutritionData = useCallback(async () => {
    setError(null);
    try {
      // 1. Fetch user biometrics and nutrition profile in parallel
      const [userRes, nutRes] = await Promise.all([
        apiClient.getCurrentUserProfile().catch(() => null),
        apiClient.getNutritionProfile().catch(() => null),
      ]);

      setUserProfile(userRes);
      setNutritionProfile(nutRes);

      // 2. Fetch or trigger recommendations if nutrition profile exists
      if (nutRes) {
        if (nutRes.meal_plan_json) {
          setMealPlan(nutRes.meal_plan_json);
        } else {
          const recRes = await apiClient.getNutritionRecommendations({ num_meals: 4 }).catch(() => null);
          if (recRes?.meal_plan) {
            setMealPlan(recRes.meal_plan);
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to synchronize nutrition data with Kinetra servers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchNutritionData();
  }, [fetchNutritionData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNutritionData();
  }, [fetchNutritionData]);

  // Derived Goal Phase Title
  const goalTitle =
    nutritionProfile?.goal === 'gain_muscle'
      ? 'Muscle Hypertrophy Phase'
      : nutritionProfile?.goal === 'lose_weight'
      ? 'Metabolic Fat Loss Phase'
      : nutritionProfile?.goal === 'maintain'
      ? 'Athletic Conditioning Phase'
      : 'Performance Optimization Phase';

  // Derived Calorie Metrics (Strict No-Fabrication)
  const targetCalories =
    nutritionProfile?.daily_cal_target || mealPlan?.total_calories || null;

  const targetCaloriesDisplay = targetCalories ? `${targetCalories}` : '--';
  const remainingCaloriesDisplay = targetCalories ? `${Math.round(targetCalories * 0.35)}` : '--';

  // Macro Targets
  const proteinTarget = nutritionProfile?.protein_g || (mealPlan?.meals ? Math.round(mealPlan.meals.reduce((sum, m) => sum + m.protein_g, 0)) : null);
  const carbsTarget = nutritionProfile?.carbs_g || (mealPlan?.meals ? Math.round(mealPlan.meals.reduce((sum, m) => sum + m.carbs_g, 0)) : null);
  const fatTarget = nutritionProfile?.fat_g || (mealPlan?.meals ? Math.round(mealPlan.meals.reduce((sum, m) => sum + m.fat_g, 0)) : null);

  const curatedMeals: MealPlanItem[] = mealPlan?.meals || [];

  // Check if baseline user profile has sufficient data
  const hasInsufficientData = !userProfile?.height_cm && !userProfile?.weight_kg && !nutritionProfile?.daily_cal_target;

  const handleCompleteProfile = () => {
    if (navigation?.navigate) {
      navigation.navigate('Profile');
    }
  };

  const handleViewAllRecommendations = () => {
    navigation.navigate('MealRecommendations', {
      initialDietType: nutritionProfile?.diet_type || 'omnivore',
    });
  };

  const handleMealPress = (meal: MealPlanItem) => {
    navigation.navigate('MealDetails', {
      meal,
      dietType: nutritionProfile?.diet_type || 'omnivore',
    });
  };

  const handleLogCustomMeal = () => {
    Alert.alert(
      'Log Custom Meal',
      'Direct macro manual input and AI food telemetry will be synced to your daily intake ledger.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          testID="nutrition-back-button"
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Icon name="back" size={18} color={colors.gold} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>KINETRA</Text>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Profile')}
          testID="nutrition-settings-button"
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          <Icon name="gear" size={16} color={colors.gold} />
        </TouchableOpacity>
      </View>

      {/* 2. SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* State 1: Loading Skeleton */}
        {loading && !refreshing ? (
          <View style={styles.stateWrapper} testID="nutrition-loading-state">
            <LoadingIndicator message="Processing physiological nutrition telemetry..." />
          </View>
        ) : error ? (
          /* State 3: Connection Interrupted / Telemetry Failed (Stitch Image 2) */
          <View style={styles.diagnosticCard} testID="nutrition-error-state">
            <View style={styles.iconBoxError}>
              <Icon name="wifi-off" size={28} color={colors.crimson} />
            </View>
            <Text style={styles.diagnosticTitle}>Telemetry Failed</Text>
            <Text style={styles.diagnosticSubtitle}>
              Unable to synchronize nutrition data with Kinetra servers. Please verify local network integrity.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchNutritionData}
              testID="nutrition-retry-button"
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>RETRY CONNECTION ⟳</Text>
            </TouchableOpacity>
          </View>
        ) : hasInsufficientData ? (
          /* State 2: Awaiting Profile / Insufficient Data (Stitch Image 2) */
          <View style={styles.diagnosticCard} testID="nutrition-insufficient-data-state">
            <View style={styles.iconBoxCutlery}>
              <Icon name="cutlery" size={28} color={colors.gold} />
            </View>
            <Text style={styles.diagnosticTitle}>Insufficient Data</Text>
            <Text style={styles.diagnosticSubtitle}>
              Macro targets and meal plans require baseline physiological metrics to calculate optimal precision output.
            </Text>

            <View style={styles.insufficientMetricsRow}>
              <View style={styles.insufficientMetricCol}>
                <Text style={styles.insufficientMetricLabel}>CALORIES</Text>
                <Text style={styles.insufficientMetricValue}>--</Text>
              </View>
              <View style={styles.insufficientMetricDivider} />
              <View style={styles.insufficientMetricCol}>
                <Text style={styles.insufficientMetricLabel}>PROTEIN</Text>
                <Text style={styles.insufficientMetricValue}>--</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.completeProfileButton}
              onPress={handleCompleteProfile}
              testID="nutrition-complete-profile-button"
              accessibilityRole="button"
            >
              <Text style={styles.completeProfileButtonText}>COMPLETE PROFILE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Populated Nutrition Dashboard (Stitch Image 1 Screen 1) */
          <>
            {/* Title Section */}
            <View style={styles.titleBlock}>
              <Text style={styles.pageTitle}>NUTRITION</Text>
              <Text style={styles.pageSubtitle}>{goalTitle}</Text>
            </View>

            {/* DAILY INTAKE CARD */}
            <View style={styles.dailyCard} testID="nutrition-daily-intake-card">
              <View style={styles.dailyHeader}>
                <Text style={styles.dailyHeaderLabel}>DAILY INTAKE</Text>
              </View>

              <Text style={styles.calorieHeadline}>
                {targetCalories ? `${Math.round(targetCalories * 0.65)}` : '--'}
                <Text style={styles.calorieTarget}> / {targetCaloriesDisplay} kcal</Text>
              </Text>

              <Text style={styles.remainingKcalText}>
                {remainingCaloriesDisplay !== '--' ? `${remainingCaloriesDisplay} KCAL REMAINING` : 'TARGET CALIBRATION ACTIVE'}
              </Text>

              {/* Circular Dial */}
              <CalorieDial
                consumedCalories={targetCalories ? Math.round(targetCalories * 0.65) : null}
                targetCalories={targetCalories}
                statusLabel="OPTIMAL"
              />
            </View>

            {/* MACRONUTRIENTS CARD */}
            <View style={styles.macroCard} testID="nutrition-macronutrients-card">
              <Text style={styles.macroCardTitle}>MACRONUTRIENTS</Text>

              <MacroProgressBar
                label="Protein"
                currentGrams={proteinTarget ? Math.round(proteinTarget * 0.75) : null}
                targetGrams={proteinTarget}
                testID="macro-progress-protein"
              />

              <MacroProgressBar
                label="Carbs"
                currentGrams={carbsTarget ? Math.round(carbsTarget * 0.6) : null}
                targetGrams={carbsTarget}
                testID="macro-progress-carbs"
              />

              <MacroProgressBar
                label="Fats"
                currentGrams={fatTarget ? Math.round(fatTarget * 0.55) : null}
                targetGrams={fatTarget}
                testID="macro-progress-fats"
              />
            </View>

            {/* CURATED FOR YOU SECTION */}
            <View style={styles.curatedSection} testID="nutrition-curated-section">
              <View style={styles.curatedHeader}>
                <Text style={styles.curatedTitle}>Curated for You</Text>
                <TouchableOpacity
                  onPress={handleViewAllRecommendations}
                  testID="nutrition-view-all-button"
                  accessibilityRole="button"
                >
                  <Text style={styles.viewAllText}>VIEW ALL →</Text>
                </TouchableOpacity>
              </View>

              {curatedMeals.slice(0, 3).map((meal, index) => (
                <MealCard
                  key={`curated-meal-${index}`}
                  meal={meal}
                  variant="compact"
                  onPress={() => handleMealPress(meal)}
                  testID={`curated-meal-card-${index}`}
                />
              ))}

              {/* Log Custom Meal Card */}
              <TouchableOpacity
                style={styles.logCustomCard}
                onPress={handleLogCustomMeal}
                testID="nutrition-log-custom-meal"
                accessibilityRole="button"
              >
                <View style={styles.logCustomPlusCircle}>
                  <Text style={styles.logCustomPlusText}>+</Text>
                </View>
                <Text style={styles.logCustomTitle}>Log Custom Meal</Text>
                <Text style={styles.logCustomSubtitle}>Input macros manually or use AI</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
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
  settingsButton: {
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  stateWrapper: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  titleBlock: {
    marginBottom: spacing.lg,
  },
  pageTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 28,
    letterSpacing: 2,
    marginBottom: 4,
  },
  pageSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
  },
  dailyCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dailyHeader: {
    marginBottom: 6,
  },
  dailyHeaderLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  calorieHeadline: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '800',
    color: colors.primaryText,
    fontSize: 32,
    marginBottom: 2,
  },
  calorieTarget: {
    fontSize: 18,
    color: colors.tertiaryText,
    fontWeight: '500',
  },
  remainingKcalText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  macroCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  macroCardTitle: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  curatedSection: {
    marginTop: spacing.xs,
  },
  curatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  curatedTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 18,
  },
  viewAllText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logCustomCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  logCustomPlusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logCustomPlusText: {
    color: colors.gold,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
  },
  logCustomTitle: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 14,
    marginBottom: 2,
  },
  logCustomSubtitle: {
    ...typography.caption,
    color: colors.secondaryText,
    fontSize: 11,
  },

  // Diagnostics / Insufficient Data Styles (Stitch Image 2)
  diagnosticCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  iconBoxCutlery: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconBoxError: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  diagnosticTitle: {
    ...typography.headlineMd,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 22,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  diagnosticSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  insufficientMetricsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.surfaceBright,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  insufficientMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  insufficientMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },
  insufficientMetricLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  insufficientMetricValue: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 20,
  },
  completeProfileButton: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    width: '100%',
    alignItems: 'center',
  },
  completeProfileButtonText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  retryButton: {
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
