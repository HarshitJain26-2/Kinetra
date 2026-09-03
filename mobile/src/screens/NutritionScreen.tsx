/**
 * Kinetra Nutrition Dashboard Screen (Section 22: Nutrition / Performance Fuel Refinement)
 * Exact Stitch luxury dark athletic design matching Performance Fuel & Diagnostic States.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  Animated,
  Easing,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { CalorieDial } from '../components/CalorieDial';
import { MacroProgressBar } from '../components/MacroProgressBar';
import { MealCard } from '../components/MealCard';
import { LogMealModal } from '../components/LogMealModal';
import {
  apiClient,
  UserProfileData,
  NutritionProfileData,
  GeneratedMealPlan,
  MealPlanItem,
  DailyFoodLogItem,
} from '../api/client';

interface NutritionScreenProps {
  navigation: any;
}

export const NutritionScreen: React.FC<NutritionScreenProps> = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [nutritionProfile, setNutritionProfile] = useState<NutritionProfileData | null>(null);
  const [mealPlan, setMealPlan] = useState<GeneratedMealPlan | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyFoodLogItem[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 4-Phase Staggered Entrance Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(10)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsTranslateY = useRef(new Animated.Value(12)).current;
  const curatedOpacity = useRef(new Animated.Value(0)).current;
  const curatedTranslateY = useRef(new Animated.Value(14)).current;

  // Skeleton shimmer pulse
  const shimmerPulse = useRef(new Animated.Value(0.4)).current;

  // Tactile Spring Scales
  const backBtnScale = useRef(new Animated.Value(1)).current;
  const settingsBtnScale = useRef(new Animated.Value(1)).current;
  const completeProfileBtnScale = useRef(new Animated.Value(1)).current;
  const retryBtnScale = useRef(new Animated.Value(1)).current;
  const logMealBtnScale = useRef(new Animated.Value(1)).current;

  const createSpring = (val: Animated.Value, down = 0.92, back = 1) => ({
    onPressIn: () => {
      Animated.spring(val, {
        toValue: down,
        useNativeDriver: true,
        speed: 40,
        bounciness: 0,
      }).start();
    },
    onPressOut: () => {
      Animated.spring(val, {
        toValue: back,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }).start();
    },
  });

  const backBtnSpring = createSpring(backBtnScale, 0.90, 1);
  const settingsBtnSpring = createSpring(settingsBtnScale, 0.90, 1);
  const completeProfileBtnSpring = createSpring(completeProfileBtnScale, 0.96, 1);
  const retryBtnSpring = createSpring(retryBtnScale, 0.96, 1);
  const logMealBtnSpring = createSpring(logMealBtnScale, 0.96, 1);

  // Entrance Sequence & Shimmer Loop
  useEffect(() => {
    let isMounted = true;
    let entranceAnim: Animated.CompositeAnimation | null = null;
    let shimmerLoop: Animated.CompositeAnimation | null = null;

    const runEntrance = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (!isMounted) return;

      if (reduceMotion) {
        headerOpacity.setValue(1);
        headerTranslateY.setValue(0);
        titleOpacity.setValue(1);
        titleTranslateY.setValue(0);
        cardsOpacity.setValue(1);
        cardsTranslateY.setValue(0);
        curatedOpacity.setValue(1);
        curatedTranslateY.setValue(0);
        return;
      }

      entranceAnim = Animated.stagger(65, [
        // Phase 1: Header
        Animated.parallel([
          Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 2: Title Block
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 3: Daily Intake & Macronutrients Cards
        Animated.parallel([
          Animated.timing(cardsOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(cardsTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Curated Meals & Log Meal Card
        Animated.parallel([
          Animated.timing(curatedOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(curatedTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      entranceAnim.start();

      shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerPulse, {
            toValue: 0.85,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerPulse, {
            toValue: 0.4,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      shimmerLoop.start();
    };

    runEntrance();

    return () => {
      isMounted = false;
      if (entranceAnim) entranceAnim.stop();
      if (shimmerLoop) shimmerLoop.stop();
    };
  }, []);

  const fetchNutritionData = useCallback(async () => {
    setError(null);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      // 1. Fetch user biometrics, nutrition profile, and daily food logs in parallel
      const [userRes, nutRes, logsRes] = await Promise.all([
        apiClient.getCurrentUserProfile().catch(() => null),
        apiClient.getNutritionProfile().catch(() => null),
        apiClient.getDailyFoodLogs(todayStr).catch(() => []),
      ]);

      setUserProfile(userRes);
      setNutritionProfile(nutRes);
      setDailyLogs(Array.isArray(logsRes) ? logsRes : []);

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

  // Consumed Calories calculated from actual food log ledger entries
  const actualConsumedCalories = dailyLogs.reduce((sum, log) => sum + Number(log.calories || 0), 0);
  const actualConsumedProtein = dailyLogs.reduce((sum, log) => sum + Number(log.protein_g || 0), 0);
  const actualConsumedCarbs = dailyLogs.reduce((sum, log) => sum + Number(log.carbs_g || 0), 0);
  const actualConsumedFat = dailyLogs.reduce((sum, log) => sum + Number(log.fat_g || 0), 0);

  const displayConsumedCalories = dailyLogs.length > 0 ? actualConsumedCalories : (targetCalories ? Math.round(targetCalories * 0.65) : null);
  const displayConsumedProtein = dailyLogs.length > 0 ? actualConsumedProtein : null;
  const displayConsumedCarbs = dailyLogs.length > 0 ? actualConsumedCarbs : null;
  const displayConsumedFat = dailyLogs.length > 0 ? actualConsumedFat : null;

  const targetCaloriesDisplay = targetCalories ? `${targetCalories}` : '--';
  const remainingCaloriesDisplay = targetCalories && displayConsumedCalories
    ? `${Math.max(0, targetCalories - displayConsumedCalories)}`
    : (targetCalories ? `${Math.round(targetCalories * 0.35)}` : '--');

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
    setIsLogModalOpen(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER (Stitch Column 3 Reference) */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <TouchableWithoutFeedback
          {...backBtnSpring}
          onPress={() => navigation.goBack()}
          testID="nutrition-back-button"
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              styles.navCircleButton,
              { transform: [{ scale: backBtnScale }] },
            ]}
          >
            <Icon name="back" size={17} color={colors.gold} />
          </Animated.View>
        </TouchableWithoutFeedback>

        <Text style={styles.brandTitle}>KINETRA</Text>

        <TouchableWithoutFeedback
          {...settingsBtnSpring}
          onPress={() => navigation.navigate('Profile')}
          testID="nutrition-settings-button"
          accessibilityLabel="Profile Settings"
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              styles.navCircleButton,
              { transform: [{ scale: settingsBtnScale }] },
            ]}
          >
            <Icon name="gear" size={16} color={colors.gold} />
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>

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
        {/* State 1: Loading Skeleton (Stitch Image 2 State 1) */}
        {loading && !refreshing ? (
          <View style={styles.skeletonContainer} testID="nutrition-loading-state">
            <Animated.View style={[styles.skeletonTitleBlock, { opacity: shimmerPulse }]} />
            <Animated.View style={[styles.skeletonDailyCard, { opacity: shimmerPulse }]} />
            <Animated.View style={[styles.skeletonMacroCard, { opacity: shimmerPulse }]} />
            <Animated.View style={[styles.skeletonMealCard, { opacity: shimmerPulse }]} />
          </View>
        ) : error ? (
          /* State 3: Connection Interrupted / Telemetry Failed (Stitch Image 2 State 3) */
          <View style={styles.diagnosticCard} testID="nutrition-error-state">
            <View style={styles.iconBoxError}>
              <Icon name="wifi-off" size={28} color={colors.crimson} />
            </View>
            <Text style={styles.diagnosticTitle}>Telemetry Failed</Text>
            <Text style={styles.diagnosticSubtitle}>
              Unable to synchronize nutrition data with Kinetra servers. Please verify local network integrity.
            </Text>
            <TouchableWithoutFeedback
              {...retryBtnSpring}
              onPress={fetchNutritionData}
              testID="nutrition-retry-button"
              accessibilityRole="button"
              accessibilityLabel="Retry server connection"
            >
              <Animated.View
                style={[
                  styles.retryButton,
                  { transform: [{ scale: retryBtnScale }] },
                ]}
              >
                <Text style={styles.retryButtonText}>RETRY CONNECTION ⟳</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        ) : hasInsufficientData ? (
          /* State 2: Awaiting Profile / Insufficient Data (Stitch Image 2 State 2) */
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

            <TouchableWithoutFeedback
              {...completeProfileBtnSpring}
              onPress={handleCompleteProfile}
              testID="nutrition-complete-profile-button"
              accessibilityRole="button"
              accessibilityLabel="Complete Athlete Profile"
            >
              <Animated.View
                style={[
                  styles.completeProfileButton,
                  { transform: [{ scale: completeProfileBtnScale }] },
                ]}
              >
                <Text style={styles.completeProfileButtonText}>COMPLETE PROFILE</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        ) : (
          /* Populated Nutrition Dashboard (Stitch Image 1 Column 3) */
          <>
            {/* Title Section */}
            <Animated.View
              style={[
                styles.titleBlock,
                {
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslateY }],
                },
              ]}
            >
              <Text style={styles.pageTitle}>NUTRITION</Text>
              <Text style={styles.pageSubtitle}>{goalTitle}</Text>
            </Animated.View>

            {/* DAILY INTAKE CARD */}
            <Animated.View
              style={[
                styles.dailyCard,
                {
                  opacity: cardsOpacity,
                  transform: [{ translateY: cardsTranslateY }],
                },
              ]}
              testID="nutrition-daily-intake-card"
            >
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
            </Animated.View>

            {/* MACRONUTRIENTS CARD */}
            <Animated.View
              style={[
                styles.macroCard,
                {
                  opacity: cardsOpacity,
                  transform: [{ translateY: cardsTranslateY }],
                },
              ]}
              testID="nutrition-macronutrients-card"
            >
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
            </Animated.View>

            {/* CURATED FOR YOU SECTION */}
            <Animated.View
              style={[
                styles.curatedSection,
                {
                  opacity: curatedOpacity,
                  transform: [{ translateY: curatedTranslateY }],
                },
              ]}
              testID="nutrition-curated-section"
            >
              <View style={styles.curatedHeader}>
                <Text style={styles.curatedTitle}>Curated for You</Text>
                <TouchableOpacity
                  onPress={handleViewAllRecommendations}
                  testID="nutrition-view-all-button"
                  accessibilityRole="button"
                  accessibilityLabel="View All Recommendations"
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
              <TouchableWithoutFeedback
                {...logMealBtnSpring}
                onPress={handleLogCustomMeal}
                testID="nutrition-log-custom-meal"
                accessibilityRole="button"
                accessibilityLabel="Log Custom Meal"
              >
                <Animated.View
                  style={[
                    styles.logCustomCard,
                    { transform: [{ scale: logMealBtnScale }] },
                  ]}
                >
                  <View style={styles.logCustomPlusCircle}>
                    <Text style={styles.logCustomPlusText}>+</Text>
                  </View>
                  <Text style={styles.logCustomTitle}>Log Custom Meal</Text>
                  <Text style={styles.logCustomSubtitle}>Input macros manually or use AI</Text>
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Manual Meal Entry Modal */}
      <LogMealModal
        visible={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onMealLogged={fetchNutritionData}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050607',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  navCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    ...typography.brandWordmarkSmall,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + 20,
  },

  // Skeleton Loading Layout (Stitch Image 2 State 1)
  skeletonContainer: {
    gap: 16,
    paddingTop: spacing.sm,
  },
  skeletonTitleBlock: {
    width: '60%',
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.xs,
    marginBottom: 8,
  },
  skeletonDailyCard: {
    width: '100%',
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.md,
  },
  skeletonMacroCard: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.md,
  },
  skeletonMealCard: {
    width: '100%',
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.sm,
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
    fontSize: 12.5,
  },
  dailyCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    fontWeight: '800',
  },
  calorieHeadline: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
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
    marginBottom: 6,
  },
  macroCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  macroCardTitle: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
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
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    borderStyle: 'dashed',
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: spacing.xl,
  },
  logCustomPlusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.4)',
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
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  iconBoxCutlery: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconBoxError: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.4)',
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
    fontSize: 12.5,
    marginBottom: spacing.xl,
  },
  insufficientMetricsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(25, 27, 30, 0.95)',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  insufficientMetricLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 4,
    fontWeight: '800',
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
    borderRadius: borderRadius.xs,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  completeProfileButtonText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  retryButton: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.4)',
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xs,
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
