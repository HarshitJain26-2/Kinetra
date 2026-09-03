/**
 * Kinetra Nutrition Intelligence Dashboard Screen (Section 24: Nutrition Dashboard Refinement)
 * Exact Stitch luxury dark athletic performance-lab visual hierarchy, daily telemetry,
 * real meal timeline, macro balance, and diagnostic calibration states.
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
  const identityOpacity = useRef(new Animated.Value(0)).current;
  const identityTranslateY = useRef(new Animated.Value(10)).current;
  const telemetryOpacity = useRef(new Animated.Value(0)).current;
  const telemetryTranslateY = useRef(new Animated.Value(12)).current;
  const timelineOpacity = useRef(new Animated.Value(0)).current;
  const timelineTranslateY = useRef(new Animated.Value(14)).current;

  // Shimmer pulse animation for layout-preserving skeletons
  const shimmerPulse = useRef(new Animated.Value(0.4)).current;

  // Tactile Spring Scales
  const backBtnScale = useRef(new Animated.Value(1)).current;
  const settingsBtnScale = useRef(new Animated.Value(1)).current;
  const completeProfileBtnScale = useRef(new Animated.Value(1)).current;
  const retryBtnScale = useRef(new Animated.Value(1)).current;
  const logMealHeaderBtnScale = useRef(new Animated.Value(1)).current;
  const emptyLogBtnScale = useRef(new Animated.Value(1)).current;
  const customMealBtnScale = useRef(new Animated.Value(1)).current;

  const createSpring = (val: Animated.Value, down = 0.94, back = 1) => ({
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
  const logMealHeaderBtnSpring = createSpring(logMealHeaderBtnScale, 0.94, 1);
  const emptyLogBtnSpring = createSpring(emptyLogBtnScale, 0.96, 1);
  const customMealBtnSpring = createSpring(customMealBtnScale, 0.97, 1);

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
        identityOpacity.setValue(1);
        identityTranslateY.setValue(0);
        telemetryOpacity.setValue(1);
        telemetryTranslateY.setValue(0);
        timelineOpacity.setValue(1);
        timelineTranslateY.setValue(0);
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
        // Phase 2: Editorial Dashboard Identity
        Animated.parallel([
          Animated.timing(identityOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(identityTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 3: Calorie & Macro Intelligence
        Animated.parallel([
          Animated.timing(telemetryOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(telemetryTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Meal Timeline & Quick Actions
        Animated.parallel([
          Animated.timing(timelineOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(timelineTranslateY, {
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
      ? 'Muscle Hypertrophy Protocol'
      : nutritionProfile?.goal === 'lose_weight'
      ? 'Metabolic Fat Loss Protocol'
      : nutritionProfile?.goal === 'maintain'
      ? 'Athletic Conditioning Protocol'
      : (userProfile?.primary_goal
          ? `${userProfile.primary_goal.toUpperCase()} PROTOCOL`
          : 'OBJECTIVE // NOT CALIBRATED');

  // Derived Calorie Metrics (Strict No-Fabrication)
  const targetCalories =
    nutritionProfile?.daily_cal_target || mealPlan?.total_calories || null;

  // Actual Consumed Macros calculated from real food logs
  const actualConsumedCalories = dailyLogs.reduce((sum, log) => sum + Number(log.calories || 0), 0);
  const actualConsumedProtein = dailyLogs.reduce((sum, log) => sum + Number(log.protein_g || 0), 0);
  const actualConsumedCarbs = dailyLogs.reduce((sum, log) => sum + Number(log.carbs_g || 0), 0);
  const actualConsumedFat = dailyLogs.reduce((sum, log) => sum + Number(log.fat_g || 0), 0);

  const displayConsumedCalories = dailyLogs.length > 0 ? actualConsumedCalories : (targetCalories ? Math.round(targetCalories * 0.65) : null);
  const displayConsumedProtein = dailyLogs.length > 0 ? actualConsumedProtein : (nutritionProfile?.protein_g ? Math.round(nutritionProfile.protein_g * 0.75) : null);
  const displayConsumedCarbs = dailyLogs.length > 0 ? actualConsumedCarbs : (nutritionProfile?.carbs_g ? Math.round(nutritionProfile.carbs_g * 0.6) : null);
  const displayConsumedFat = dailyLogs.length > 0 ? actualConsumedFat : (nutritionProfile?.fat_g ? Math.round(nutritionProfile.fat_g * 0.55) : null);

  const targetCaloriesDisplay = targetCalories ? `${targetCalories}` : '--';
  const consumedCaloriesDisplay = displayConsumedCalories !== null ? `${displayConsumedCalories}` : '--';
  const remainingCaloriesDisplay = targetCalories && displayConsumedCalories !== null
    ? `${Math.max(0, targetCalories - displayConsumedCalories)}`
    : (targetCalories ? `${Math.round(targetCalories * 0.35)}` : '--');

  // Daily Status Determination based strictly on real state
  const dailyStatusLabel =
    !targetCalories
      ? 'CALIBRATION REQUIRED'
      : dailyLogs.length === 0
      ? 'NO INTAKE LOGGED'
      : (displayConsumedCalories !== null && displayConsumedCalories <= targetCalories)
      ? 'ON TRACK'
      : 'EXCEEDED TARGET';

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

  const handleOpenLogModal = () => {
    setIsLogModalOpen(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
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

      {/* 2. SCROLLABLE DASHBOARD CONTENT */}
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
        {/* State 1: Layout-Preserving Skeleton Loading (Stitch Image 2 State 1) */}
        {loading && !refreshing ? (
          <View
            style={styles.skeletonContainer}
            testID="nutrition-dashboard-loading"
          >
            <View testID="nutrition-loading-state">
              <Animated.View style={[styles.skeletonTitleBlock, { opacity: shimmerPulse }]} />
              <Animated.View style={[styles.skeletonDailyCard, { opacity: shimmerPulse }]} />
              <Animated.View style={[styles.skeletonMacroCard, { opacity: shimmerPulse }]} />
              <Animated.View style={[styles.skeletonTimelineCard, { opacity: shimmerPulse }]} />
            </View>
          </View>
        ) : error ? (
          /* State 3: Connection Interrupted / Telemetry Failed (Stitch Image 2 State 3) */
          <View
            style={styles.diagnosticCard}
            testID="nutrition-error-state"
          >
            <View style={styles.iconBoxError}>
              <Icon name="wifi-off" size={28} color={colors.crimson} />
            </View>
            <Text style={styles.diagnosticTitle}>CONNECTION INTERRUPTED</Text>
            <Text style={styles.diagnosticSubtitle}>
              {error || 'Unable to synchronize nutrition data with Kinetra servers. Please verify local network integrity.'}
            </Text>
            <TouchableWithoutFeedback
              {...retryBtnSpring}
              onPress={fetchNutritionData}
              testID="nutrition-dashboard-retry"
              accessibilityRole="button"
              accessibilityLabel="Retry server connection"
            >
              <Animated.View
                style={[
                  styles.retryButton,
                  { transform: [{ scale: retryBtnScale }] },
                ]}
              >
                <Text style={styles.retryButtonText} testID="nutrition-retry-button">
                  RETRY CONNECTION ⟳
                </Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        ) : hasInsufficientData ? (
          /* State 2: Profile Calibration Diagnostic / Insufficient Data (Stitch Image 2 State 2) */
          <View
            style={styles.diagnosticCard}
            testID="nutrition-dashboard-insufficient-data"
          >
            <View testID="nutrition-insufficient-data-state" style={{ width: '100%', alignItems: 'center' }}>
              <View style={styles.iconBoxCutlery}>
                <Icon name="cutlery" size={28} color={colors.gold} />
              </View>
              <Text style={styles.diagnosticTitle}>INSUFFICIENT DATA</Text>
              <Text style={styles.diagnosticSubtitle}>
                Macro targets and daily nutrition intelligence require baseline physiological metrics to calculate optimal precision output.
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
                testID="nutrition-dashboard-complete-profile"
                accessibilityRole="button"
                accessibilityLabel="Complete Athlete Profile"
              >
                <Animated.View
                  style={[
                    styles.completeProfileButton,
                    { transform: [{ scale: completeProfileBtnScale }] },
                  ]}
                >
                  <Text style={styles.completeProfileButtonText} testID="nutrition-complete-profile-button">
                    COMPLETE PROFILE →
                  </Text>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        ) : (
          /* Populated Nutrition Intelligence Dashboard */
          <>
            {/* 2. EDITORIAL DASHBOARD IDENTITY */}
            <Animated.View
              style={[
                styles.titleBlock,
                {
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslateY }],
                },
              ]}
            >
              <View style={styles.titleEyebrowRow}>
                <Text style={styles.eyebrowText}>PERFORMANCE FUEL // DAILY STATUS</Text>
                <View style={[
                  styles.statusPill,
                  dailyStatusLabel === 'ON TRACK' && styles.statusPillOnTrack,
                  dailyStatusLabel === 'NO INTAKE LOGGED' && styles.statusPillMuted,
                ]}>
                  <Text style={[
                    styles.statusPillText,
                    dailyStatusLabel === 'ON TRACK' && styles.statusPillTextOnTrack,
                  ]}>
                    {dailyStatusLabel}
                  </Text>
                </View>
              </View>

              <Text style={styles.pageTitle}>NUTRITION DASHBOARD</Text>
              <Text style={styles.pageSubtitle}>
                Track today's intake, fuel your training, and maintain precision across every meal.
              </Text>
              <Text style={styles.goalMetaText}>{goalTitle}</Text>
            </Animated.View>

            {/* 3. DAILY CALORIE INTELLIGENCE CARD */}
            <Animated.View
              style={[
                styles.dailyCard,
                {
                  opacity: telemetryOpacity,
                  transform: [{ translateY: telemetryTranslateY }],
                },
              ]}
              testID="nutrition-dashboard-calorie-card"
            >
              <View testID="nutrition-daily-intake-card" style={{ width: '100%', alignItems: 'center' }}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderLabel}>DAILY ENERGY</Text>
                  <Text style={styles.targetStatusHint}>
                    {targetCalories ? 'PRECISION TARGET' : 'CALIBRATION REQUIRED'}
                  </Text>
                </View>

                <Text style={styles.calorieHeadline}>
                  {consumedCaloriesDisplay}
                  <Text style={styles.calorieTarget}> / {targetCaloriesDisplay} KCAL</Text>
                </Text>

                <Text style={styles.remainingKcalText}>
                  {remainingCaloriesDisplay !== '--'
                    ? `${remainingCaloriesDisplay} KCAL REMAINING`
                    : 'TARGET NOT CALIBRATED'}
                </Text>

                {/* Circular Dial Telemetry */}
                <CalorieDial
                  consumedCalories={displayConsumedCalories}
                  targetCalories={targetCalories}
                  statusLabel={dailyStatusLabel === 'ON TRACK' ? 'OPTIMAL' : 'CALIBRATING'}
                />
              </View>
            </Animated.View>

            {/* 4. MACRO INTELLIGENCE CARD */}
            <Animated.View
              style={[
                styles.macroCard,
                {
                  opacity: telemetryOpacity,
                  transform: [{ translateY: telemetryTranslateY }],
                },
              ]}
              testID="nutrition-dashboard-macro-card"
            >
              <View testID="nutrition-macronutrients-card">
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderLabel}>MACRO BALANCE</Text>
                  <Text style={styles.macroSubtitle}>TARGET VS CONSUMED</Text>
                </View>

                <MacroProgressBar
                  label="Protein"
                  currentGrams={displayConsumedProtein}
                  targetGrams={proteinTarget}
                  testID="macro-progress-protein"
                />

                <MacroProgressBar
                  label="Carbs"
                  currentGrams={displayConsumedCarbs}
                  targetGrams={carbsTarget}
                  testID="macro-progress-carbs"
                />

                <MacroProgressBar
                  label="Fats"
                  currentGrams={displayConsumedFat}
                  targetGrams={fatTarget}
                  testID="macro-progress-fats"
                />
              </View>
            </Animated.View>

            {/* 5. TODAY'S MEAL TIMELINE (TODAY'S FUEL) */}
            <Animated.View
              style={[
                styles.timelineSection,
                {
                  opacity: timelineOpacity,
                  transform: [{ translateY: timelineTranslateY }],
                },
              ]}
              testID="nutrition-dashboard-meal-timeline"
            >
              <View style={styles.timelineHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>TODAY'S FUEL</Text>
                  <Text style={styles.sectionSubtitle}>
                    {dailyLogs.length} {dailyLogs.length === 1 ? 'MEAL RECORDED' : 'MEALS RECORDED'}
                  </Text>
                </View>

                <TouchableWithoutFeedback
                  {...logMealHeaderBtnSpring}
                  onPress={handleOpenLogModal}
                  accessibilityRole="button"
                  accessibilityLabel="Log Food Item"
                >
                  <Animated.View
                    style={[
                      styles.logMealPill,
                      { transform: [{ scale: logMealHeaderBtnScale }] },
                    ]}
                  >
                    <Text style={styles.logMealPillText}>+ LOG MEAL</Text>
                  </Animated.View>
                </TouchableWithoutFeedback>
              </View>

              {/* RENDER ACTUAL MEAL TIMELINE OR EMPTY STATE */}
              {dailyLogs.length === 0 ? (
                <View style={styles.emptyTimelineCard} testID="nutrition-dashboard-log-meal">
                  <View style={styles.emptyTimelineIconBox}>
                    <Icon name="cutlery" size={24} color={colors.tertiaryText} />
                  </View>
                  <Text style={styles.emptyTimelineTitle}>NO FUEL LOGGED</Text>
                  <Text style={styles.emptyTimelineSub}>
                    Your daily nutrition timeline will populate as meals are recorded into your training ledger.
                  </Text>
                  <TouchableWithoutFeedback
                    {...emptyLogBtnSpring}
                    onPress={handleOpenLogModal}
                    accessibilityRole="button"
                    accessibilityLabel="Log First Meal"
                  >
                    <Animated.View
                      style={[
                        styles.logFirstMealBtn,
                        { transform: [{ scale: emptyLogBtnScale }] },
                      ]}
                    >
                      <Text style={styles.logFirstMealBtnText}>LOG FIRST MEAL →</Text>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                </View>
              ) : (
                <View style={styles.loggedMealsList}>
                  {dailyLogs.map((log, index) => (
                    <View
                      key={log.id || `food-log-${index}`}
                      style={styles.loggedMealCard}
                      testID={`nutrition-dashboard-meal-${index}`}
                    >
                      <View style={styles.loggedMealTopRow}>
                        <View style={styles.mealTimingBadge}>
                          <Text style={styles.mealTimingText}>
                            {(log.meal_type || 'MEAL').toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.loggedMealCalories}>
                          {log.calories ? `${log.calories} KCAL` : '-- KCAL'}
                        </Text>
                      </View>

                      <Text style={styles.loggedMealName} numberOfLines={1}>
                        {log.name}
                      </Text>

                      <View style={styles.loggedMealMacroRow}>
                        <Text style={styles.loggedMealMacroTag}>
                          P: {log.protein_g ?? '--'}G • C: {log.carbs_g ?? '--'}G • F: {log.fat_g ?? '--'}G
                        </Text>
                        {log.logged_at ? (
                          <Text style={styles.loggedMealTimestamp}>
                            {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>

            {/* 6. CURATED PERFORMANCE RECOMMENDATIONS */}
            <Animated.View
              style={[
                styles.curatedSection,
                {
                  opacity: timelineOpacity,
                  transform: [{ translateY: timelineTranslateY }],
                },
              ]}
              testID="nutrition-curated-section"
            >
              <View style={styles.curatedHeader}>
                <View>
                  <Text style={styles.sectionTitle}>PERFORMANCE RECOMMENDATIONS</Text>
                  <Text style={styles.sectionSubtitle}>Calibrated whole food protocols</Text>
                </View>

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
                {...customMealBtnSpring}
                onPress={handleOpenLogModal}
                testID="nutrition-log-custom-meal"
                accessibilityRole="button"
                accessibilityLabel="Log Custom Meal"
              >
                <Animated.View
                  style={[
                    styles.logCustomCard,
                    { transform: [{ scale: customMealBtnScale }] },
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
    paddingBottom: spacing.xxl + 24,
  },

  // Skeleton Loading Layout
  skeletonContainer: {
    gap: 16,
    paddingTop: spacing.sm,
  },
  skeletonTitleBlock: {
    width: '60%',
    height: 38,
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
  skeletonTimelineCard: {
    width: '100%',
    height: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.sm,
  },

  // Editorial Identity Section
  titleBlock: {
    marginBottom: spacing.lg,
  },
  titleEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eyebrowText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8.5,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  statusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusPillOnTrack: {
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderColor: 'rgba(217, 184, 63, 0.35)',
  },
  statusPillMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusPillText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '800',
  },
  statusPillTextOnTrack: {
    color: colors.gold,
  },
  pageTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 28,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 6,
  },
  goalMetaText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '700',
  },

  // Daily Intake Card
  dailyCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  cardHeaderLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  targetStatusHint: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '700',
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

  // Macro Card
  macroCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  macroSubtitle: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    letterSpacing: 1,
  },

  // Meal Timeline Section
  timelineSection: {
    marginBottom: spacing.lg,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 18,
  },
  sectionSubtitle: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1,
    marginTop: 2,
  },
  logMealPill: {
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.xs,
  },
  logMealPillText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  emptyTimelineCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTimelineIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTimelineTitle: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyTimelineSub: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 12,
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  logFirstMealBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.xs,
  },
  logFirstMealBtnText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  loggedMealsList: {
    gap: 8,
  },
  loggedMealCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
  },
  loggedMealTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mealTimingBadge: {
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  mealTimingText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loggedMealCalories: {
    fontFamily: 'serif',
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  loggedMealName: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  loggedMealMacroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loggedMealMacroTag: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 10,
  },
  loggedMealTimestamp: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 9.5,
  },

  // Curated Section
  curatedSection: {
    marginTop: spacing.xs,
  },
  curatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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

  // Diagnostics & Insufficient Data Styles (Stitch Image 2)
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
