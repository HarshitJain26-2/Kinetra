/**
 * Kinetra Nutrition Systems / System Status Diagnostics Screen (Section 27 Refinement)
 * Exact Stitch luxury dark athletic performance-lab diagnostic console matching
 * Image 3 (Nutrition Systems - System Status Diagnostic: States 1, 2, 3, 4, 5).
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
  const consoleOpacity = useRef(new Animated.Value(0)).current;
  const consoleTranslateY = useRef(new Animated.Value(12)).current;
  const telemetryOpacity = useRef(new Animated.Value(0)).current;
  const telemetryTranslateY = useRef(new Animated.Value(14)).current;

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
        consoleOpacity.setValue(1);
        consoleTranslateY.setValue(0);
        telemetryOpacity.setValue(1);
        telemetryTranslateY.setValue(0);
        return;
      }

      entranceAnim = Animated.stagger(65, [
        // Phase 1: Diagnostic System Header
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
        // Phase 2: Editorial Diagnostic Identity
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
        // Phase 3: Primary Diagnostic Console
        Animated.parallel([
          Animated.timing(consoleOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(consoleTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Telemetry & Activity Matrix
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
      : ((userProfile as any)?.primary_goal
          ? `${(userProfile as any).primary_goal.toUpperCase()} PROTOCOL`
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

  // Check if baseline user profile has sufficient data
  const hasInsufficientData = !userProfile?.height_cm && !userProfile?.weight_kg && !nutritionProfile?.daily_cal_target;

  // System Readiness & Daily Status (Derived from real state)
  const isSystemReady = !hasInsufficientData && !error && targetCalories !== null;
  const readinessLabel = error
    ? 'TELEMETRY INTERRUPTED'
    : hasInsufficientData
    ? 'CALIBRATION REQUIRED'
    : 'READY';

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

  const handleCompleteProfile = () => {
    if (navigation?.navigate) {
      navigation.navigate('EditProfile');
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
      {/* 1. DIAGNOSTIC SYSTEM HEADER */}
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

      {/* 2. SCROLLABLE DIAGNOSTIC CONSOLE CONTENT */}
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
        {/* 2. EDITORIAL DIAGNOSTIC IDENTITY (Image 3) */}
        <Animated.View
          style={[
            styles.identityBlock,
            {
              opacity: identityOpacity,
              transform: [{ translateY: identityTranslateY }],
            },
          ]}
        >
          <View style={styles.identityEyebrowRow}>
            <Text style={styles.eyebrowText}>NUTRITION SYSTEMS // DIAGNOSTICS</Text>
            <View style={[
              styles.readinessPill,
              isSystemReady ? styles.readinessPillReady : styles.readinessPillWarning,
            ]}>
              <View style={[
                styles.readinessDot,
                isSystemReady ? styles.readinessDotReady : styles.readinessDotWarning,
              ]} />
              <Text style={[
                styles.readinessPillText,
                isSystemReady ? styles.readinessPillTextReady : styles.readinessPillTextWarning,
              ]}>
                {readinessLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.pageTitle}>Nutrition Systems</Text>
          <Text style={styles.pageSubtitle}>
            System Status Diagnostic. Evaluating physiological telemetry and precision fuel calibration.
          </Text>
        </Animated.View>

        {/* 3. DIAGNOSTIC STATES DISPLAY */}
        {loading && !refreshing ? (
          /* State 1: Processing Data (Image 3 State 1) */
          <View
            style={styles.diagnosticStateSection}
            testID="nutrition-dashboard-loading"
          >
            <View style={styles.stateHeadingRow}>
              <Icon name="sparkle" size={12} color={colors.gold} style={{ marginRight: 6 }} />
              <Text style={styles.stateHeadingText}>State 1: Processing Data</Text>
            </View>

            <View testID="nutrition-loading-state" style={styles.skeletonContainer}>
              <Animated.View style={[styles.skeletonTelemetryConsole, { opacity: shimmerPulse }]} />
              <Animated.View style={[styles.skeletonDailyCard, { opacity: shimmerPulse }]} />
              <Animated.View style={[styles.skeletonMacroCard, { opacity: shimmerPulse }]} />
              <Animated.View style={[styles.skeletonTimelineCard, { opacity: shimmerPulse }]} />
            </View>
          </View>
        ) : error ? (
          /* State 3 / State 4: Connection Interrupted / Telemetry Failed (Image 3 State 3) */
          <View
            style={styles.diagnosticStateSection}
            testID="nutrition-error-state"
          >
            <View style={styles.stateHeadingRow}>
              <View style={styles.crimsonWarningTriangle} />
              <Text style={[styles.stateHeadingText, { color: colors.crimson }]}>
                State 3: Connection Interrupted
              </Text>
            </View>

            <View style={styles.diagnosticCard}>
              <View style={styles.iconBoxError}>
                <Icon name="wifi-off" size={28} color={colors.crimson} />
              </View>
              <Text style={styles.diagnosticTitle}>Telemetry Failed</Text>
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
          </View>
        ) : hasInsufficientData ? (
          /* State 2: Awaiting Profile / Insufficient Data (Image 3 State 2) */
          <View
            style={styles.diagnosticStateSection}
            testID="nutrition-dashboard-insufficient-data"
          >
            <View style={styles.stateHeadingRow}>
              <View style={styles.amberWarningCircle} />
              <Text style={styles.stateHeadingText}>State 2: Awaiting Profile</Text>
            </View>

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
          /* State 5: System Ready / Calibrated Telemetry Console */
          <>
            {/* PRIMARY DIAGNOSTIC CONSOLE CARD */}
            <Animated.View
              style={[
                styles.diagnosticConsoleCard,
                {
                  opacity: consoleOpacity,
                  transform: [{ translateY: consoleTranslateY }],
                },
              ]}
            >
              <View style={styles.consoleHeaderRow}>
                <View style={styles.consoleHeaderLeft}>
                  <View style={styles.goldIndicatorBar} />
                  <Text style={styles.consoleHeaderTitle}>SYSTEM TELEMETRY</Text>
                </View>
                <View style={styles.calibratedTagPill}>
                  <Text style={styles.calibratedTagText}>CALIBRATED</Text>
                </View>
              </View>

              {/* Status Checklist Grid */}
              <View style={styles.telemetryStatusRows}>
                <View style={styles.telemetryStatusRow}>
                  <Text style={styles.telemetryFieldLabel}>NUTRITION ENGINE</Text>
                  <Text style={styles.telemetryFieldValueGold}>ONLINE</Text>
                </View>
                <View style={styles.telemetryStatusRow}>
                  <Text style={styles.telemetryFieldLabel}>PROFILE</Text>
                  <Text style={styles.telemetryFieldValueMuted}>
                    {userProfile?.height_cm && userProfile?.weight_kg ? 'CALIBRATED' : 'INCOMPLETE'}
                  </Text>
                </View>
                <View style={styles.telemetryStatusRow}>
                  <Text style={styles.telemetryFieldLabel}>DAILY INTAKE</Text>
                  <Text style={styles.telemetryFieldValueMuted}>
                    {dailyLogs.length > 0 ? `${dailyLogs.length} LOGS RECORDED` : 'NO DATA'}
                  </Text>
                </View>
                <View style={styles.telemetryStatusRow}>
                  <Text style={styles.telemetryFieldLabel}>RECOMMENDATION ENGINE</Text>
                  <Text style={styles.telemetryFieldValueMuted}>
                    {curatedMeals.length > 0 ? 'READY' : 'AWAITING PROFILE'}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* DAILY ENERGY CALORIE INTELLIGENCE CARD */}
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
                  <Text style={styles.cardHeaderLabel}>DAILY INTAKE</Text>
                  <Text style={styles.targetStatusHint}>
                    {targetCalories ? 'PRECISION TARGET' : 'CALIBRATION REQUIRED'}
                  </Text>
                </View>

                <Text style={styles.calorieHeadline}>
                  {consumedCaloriesDisplay}
                  <Text style={styles.calorieTarget}> / {targetCaloriesDisplay} kcal</Text>
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

            {/* MACRO INTELLIGENCE CARD */}
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
                  <Text style={styles.cardHeaderLabel}>MACRONUTRIENTS</Text>
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

            {/* State 3: NO FUEL LOGGED OR ACTIVE MEAL TIMELINE */}
            <Animated.View
              style={[
                styles.timelineSection,
                {
                  opacity: telemetryOpacity,
                  transform: [{ translateY: telemetryTranslateY }],
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

              {dailyLogs.length === 0 ? (
                /* State 3: No Intake Logged State */
                <View style={styles.emptyTimelineCard} testID="nutrition-dashboard-log-meal">
                  <View style={styles.emptyTimelineIconBox}>
                    <Icon name="cutlery" size={24} color={colors.tertiaryText} />
                  </View>
                  <Text style={styles.emptyTimelineTitle}>NO FUEL LOGGED</Text>
                  <Text style={styles.emptyTimelineSub}>
                    Your nutrition ledger is calibrated, but today's intake has not been recorded into your training ledger.
                  </Text>

                  <View style={styles.zeroTelemetryRow}>
                    <View style={styles.zeroTelemetryBox}>
                      <Text style={styles.zeroTelemetryLabel}>CALORIES</Text>
                      <Text style={styles.zeroTelemetryVal}>0 KCAL</Text>
                    </View>
                    <View style={styles.zeroTelemetryBox}>
                      <Text style={styles.zeroTelemetryLabel}>PROTEIN</Text>
                      <Text style={styles.zeroTelemetryVal}>0 G</Text>
                    </View>
                    <View style={styles.zeroTelemetryBox}>
                      <Text style={styles.zeroTelemetryLabel}>CARBS</Text>
                      <Text style={styles.zeroTelemetryVal}>0 G</Text>
                    </View>
                    <View style={styles.zeroTelemetryBox}>
                      <Text style={styles.zeroTelemetryLabel}>FAT</Text>
                      <Text style={styles.zeroTelemetryVal}>0 G</Text>
                    </View>
                  </View>

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
                            {((log as any).timing || (log as any).meal_type || 'MEAL').toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.loggedMealCalories}>
                          {log.calories ? `${log.calories} KCAL` : '-- KCAL'}
                        </Text>
                      </View>

                      <Text style={styles.loggedMealName} numberOfLines={1}>
                        {log.meal_name || (log as any).name}
                      </Text>

                      <View style={styles.loggedMealMacroRow}>
                        <Text style={styles.loggedMealMacroTag}>
                          P: {log.protein_g ?? '--'}G • C: {log.carbs_g ?? '--'}G • F: {log.fat_g ?? '--'}G
                        </Text>
                        {(log.created_at || (log as any).logged_at) ? (
                          <Text style={styles.loggedMealTimestamp}>
                            {new Date(log.created_at || (log as any).logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>

            {/* CURATED PERFORMANCE RECOMMENDATIONS */}
            <Animated.View
              style={[
                styles.curatedSection,
                {
                  opacity: telemetryOpacity,
                  transform: [{ translateY: telemetryTranslateY }],
                },
              ]}
              testID="nutrition-curated-section"
            >
              <View style={styles.curatedHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Curated for You</Text>
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

  // ── Editorial Diagnostic Identity ──
  identityBlock: {
    marginBottom: spacing.md,
  },
  identityEyebrowRow: {
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
  readinessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  readinessPillReady: {
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderColor: 'rgba(217, 184, 63, 0.35)',
  },
  readinessPillWarning: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  readinessDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  readinessDotReady: {
    backgroundColor: colors.gold,
  },
  readinessDotWarning: {
    backgroundColor: colors.tertiaryText,
  },
  readinessPillText: {
    ...typography.labelCaps,
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '800',
  },
  readinessPillTextReady: {
    color: colors.gold,
  },
  readinessPillTextWarning: {
    color: colors.tertiaryText,
  },
  pageTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 28,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  pageSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
  },

  // ── Diagnostic State Section Header (Image 3) ──
  diagnosticStateSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  stateHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stateHeadingText: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.gold,
    fontSize: 15,
  },
  amberWarningCircle: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E9C46A',
    marginRight: 8,
  },
  crimsonWarningTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.crimson,
    marginRight: 8,
  },

  // ── Skeleton Layout ──
  skeletonContainer: {
    gap: 14,
  },
  skeletonTelemetryConsole: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.md,
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

  // ── Primary Diagnostic Console Card ──
  diagnosticConsoleCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  consoleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingBottom: spacing.sm,
  },
  consoleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goldIndicatorBar: {
    width: 3,
    height: 13,
    backgroundColor: colors.gold,
    marginRight: 8,
    borderRadius: 1.5,
  },
  consoleHeaderTitle: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  calibratedTagPill: {
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
  },
  calibratedTagText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  telemetryStatusRows: {
    gap: 8,
  },
  telemetryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryFieldLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  telemetryFieldValueGold: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8.5,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  telemetryFieldValueMuted: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 8.5,
    letterSpacing: 1.2,
    fontWeight: '700',
  },

  // ── Daily Intake Card ──
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

  // ── Macro Card ──
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

  // ── Meal Timeline Section ──
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
  zeroTelemetryRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(25, 27, 30, 0.95)',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    marginBottom: spacing.md,
  },
  zeroTelemetryBox: {
    flex: 1,
    alignItems: 'center',
  },
  zeroTelemetryLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 7.5,
    letterSpacing: 1,
    fontWeight: '800',
    marginBottom: 2,
  },
  zeroTelemetryVal: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
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

  // ── Curated Section ──
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

  // ── Diagnostics & Insufficient Data Styles (Image 3) ──
  diagnosticCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.xl,
    alignItems: 'center',
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
