/**
 * Kinetra Meal Recommendations Screen (Section 25: Nutrition Recommendations Refinement)
 * Exact Stitch luxury dark athletic performance-lab recommendation console.
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
import { MealCard } from '../components/MealCard';
import {
  apiClient,
  MealPlanItem,
  DietType,
} from '../api/client';

type DietFilterOption = 'all' | 'high_protein' | 'keto' | 'vegan';

const FILTER_OPTIONS: { id: DietFilterOption; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'high_protein', label: 'HIGH PROTEIN' },
  { id: 'keto', label: 'KETO' },
  { id: 'vegan', label: 'VEGAN' },
];

interface MealRecommendationsScreenProps {
  navigation?: any;
  route?: any;
}

export const MealRecommendationsScreen: React.FC<MealRecommendationsScreenProps> = ({
  navigation,
  route,
}) => {
  const initialDietType: DietFilterOption = route?.params?.initialDietType || 'all';
  const [selectedFilter, setSelectedFilter] = useState<DietFilterOption>(initialDietType);
  const [meals, setMeals] = useState<MealPlanItem[]>([]);
  const [userObjective, setUserObjective] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 4-Phase Staggered Entrance Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const identityOpacity = useRef(new Animated.Value(0)).current;
  const identityTranslateY = useRef(new Animated.Value(10)).current;
  const featuredOpacity = useRef(new Animated.Value(0)).current;
  const featuredTranslateY = useRef(new Animated.Value(12)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listTranslateY = useRef(new Animated.Value(14)).current;

  // Skeleton shimmer pulse
  const shimmerPulse = useRef(new Animated.Value(0.4)).current;

  // Tactile Spring Scales
  const backBtnScale = useRef(new Animated.Value(1)).current;
  const retryBtnScale = useRef(new Animated.Value(1)).current;
  const featuredCtaScale = useRef(new Animated.Value(1)).current;
  const profileCtaScale = useRef(new Animated.Value(1)).current;

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
  const retryBtnSpring = createSpring(retryBtnScale, 0.96, 1);
  const featuredCtaSpring = createSpring(featuredCtaScale, 0.96, 1);
  const profileCtaSpring = createSpring(profileCtaScale, 0.96, 1);

  // Entrance & Shimmer Sequences
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
        featuredOpacity.setValue(1);
        featuredTranslateY.setValue(0);
        listOpacity.setValue(1);
        listTranslateY.setValue(0);
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
        // Phase 2: Editorial Identity & Filter Bar
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
        // Phase 3: Featured Recommendation Protocol
        Animated.parallel([
          Animated.timing(featuredOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(featuredTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Recommendation Collection List
        Animated.parallel([
          Animated.timing(listOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(listTranslateY, {
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

  const fetchRecommendations = useCallback(async (dietFilter: DietFilterOption) => {
    setError(null);
    try {
      const [result, profileRes] = await Promise.all([
        apiClient.getNutritionRecommendations({ num_meals: 4 }).catch(() => null),
        apiClient.getNutritionProfile().catch(() => null),
      ]);

      if (profileRes?.goal) {
        setUserObjective(profileRes.goal.replace('_', ' ').toUpperCase());
      }

      const rawMeals = result?.meal_plan?.meals || [];

      // Filter meals based on selected macro/diet profile
      let filtered = rawMeals;
      if (dietFilter === 'high_protein') {
        filtered = rawMeals.filter((m) => m.protein_g >= 30);
      } else if (dietFilter === 'keto') {
        filtered = rawMeals.filter((m) => m.fat_g >= 25 || m.carbs_g <= 20);
      }

      setMeals(filtered);
    } catch (err: any) {
      setError(err?.message || 'Unable to synchronize nutrition recommendations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRecommendations(selectedFilter);
  }, [fetchRecommendations, selectedFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecommendations(selectedFilter);
  }, [fetchRecommendations, selectedFilter]);

  const handleMealPress = (meal: MealPlanItem) => {
    navigation?.navigate('MealDetails', { meal, dietType: selectedFilter });
  };

  const handleCompleteProfile = () => {
    navigation?.navigate('Profile');
  };

  const featuredMeal = meals.length > 0 ? meals[0] : null;
  const remainingMeals = meals.length > 1 ? meals.slice(1) : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP NAVIGATION */}
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
          onPress={() => navigation?.goBack()}
          testID="meal-recommendations-back-button"
          accessibilityLabel="Back to Nutrition Dashboard"
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              styles.navCircleButton,
              { transform: [{ scale: backBtnScale }] },
            ]}
            testID="recommendations-back-button"
          >
            <Icon name="back" size={17} color={colors.gold} />
          </Animated.View>
        </TouchableWithoutFeedback>

        <Text style={styles.brandTitle}>KINETRA</Text>

        <TouchableOpacity
          style={styles.navCircleButton}
          onPress={() => navigation?.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="Athlete Profile Settings"
        >
          <Icon name="gear" size={16} color={colors.gold} />
        </TouchableOpacity>
      </Animated.View>

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
        {/* 2. EDITORIAL RECOMMENDATION HEADER */}
        <Animated.View
          style={[
            styles.identitySection,
            {
              opacity: identityOpacity,
              transform: [{ translateY: identityTranslateY }],
            },
          ]}
        >
          <Text style={styles.eyebrowText}>NUTRITION INTELLIGENCE // CURATED</Text>
          <Text style={styles.headline}>RECOMMENDED FUEL</Text>
          <Text style={styles.subcopy}>
            Precision meals calibrated to your current performance objective.
          </Text>

          {/* Objective Calibration Context Card */}
          <View style={styles.objectiveContextCard}>
            <View style={styles.objectiveDot} />
            <Text style={styles.objectiveLabel}>
              FUELING FOR:{' '}
              <Text style={styles.objectiveValue}>
                {userObjective ? `${userObjective} PROTOCOL` : 'OBJECTIVE // NOT CALIBRATED'}
              </Text>
            </Text>
            <View style={styles.calibrationStatusPill}>
              <Text style={styles.calibrationStatusText}>
                {loading ? 'REFRESHING' : meals.length > 0 ? 'CALIBRATED' : 'AWAITING PROFILE'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 3. DIET / RECOMMENDATION FILTER CONTROLS */}
        <Animated.View
          style={[
            styles.filterContainer,
            {
              opacity: identityOpacity,
              transform: [{ translateY: identityTranslateY }],
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTER_OPTIONS.map((filter) => {
              const isActive = selectedFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => setSelectedFilter(filter.id)}
                  style={[
                    styles.filterPill,
                    isActive ? styles.filterPillActive : styles.filterPillInactive,
                  ]}
                  testID={`filter-diet-${filter.id}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Filter by ${filter.label}`}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* 4. MAIN CONTENT AREA: LOADING / ERROR / EMPTY / POPULATED */}
        {loading && !refreshing ? (
          /* Layout-Preserving Skeleton (Section 25 Loading State) */
          <View style={styles.skeletonContainer} testID="meal-recommendations-loading">
            <Animated.View style={[styles.skeletonFeaturedCard, { opacity: shimmerPulse }]} />
            <Animated.View style={[styles.skeletonListCard, { opacity: shimmerPulse }]} />
            <Animated.View style={[styles.skeletonListCard, { opacity: shimmerPulse }]} />
          </View>
        ) : error ? (
          /* Error State */
          <View style={styles.errorCard} testID="meal-recommendations-error-state">
            <View testID="recommendations-error" style={{ alignItems: 'center', width: '100%' }}>
              <View style={styles.errorIconBox}>
                <Icon name="wifi-off" size={28} color={colors.crimson} />
              </View>
              <Text style={styles.errorTitle}>RECOMMENDATION ENGINE INTERRUPTED</Text>
              <Text style={styles.errorSubtitle}>{error}</Text>
              <TouchableWithoutFeedback
                {...retryBtnSpring}
                onPress={() => fetchRecommendations(selectedFilter)}
                testID="meal-recommendations-retry-button"
                accessibilityRole="button"
                accessibilityLabel="Retry recommendation synchronization"
              >
                <Animated.View
                  style={[
                    styles.retryButton,
                    { transform: [{ scale: retryBtnScale }] },
                  ]}
                >
                  <Text style={styles.retryButtonText} testID="recommendations-retry-button">
                    RETRY CONNECTION ⟳
                  </Text>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        ) : meals.length === 0 ? (
          /* Empty / Insufficient Profile State */
          <View style={styles.emptyCard} testID="recommendations-empty">
            <View style={styles.emptyIconBox}>
              <Icon name="cutlery" size={28} color={colors.tertiaryText} />
            </View>
            <Text style={styles.emptyTitle}>NO RECOMMENDATIONS</Text>
            <Text style={styles.emptySubtitle}>
              The recommendation engine has no meal protocols available for the current calibration state.
            </Text>
            <TouchableWithoutFeedback
              {...profileCtaSpring}
              onPress={handleCompleteProfile}
              testID="meal-recommendations-complete-profile-button"
              accessibilityRole="button"
              accessibilityLabel="Complete Profile Calibration"
            >
              <Animated.View
                style={[
                  styles.completeProfileBtn,
                  { transform: [{ scale: profileCtaScale }] },
                ]}
              >
                <Text style={styles.completeProfileBtnText}>COMPLETE PROFILE →</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        ) : (
          /* Populated Recommendations */
          <>
            {/* 5. FEATURED RECOMMENDATION (PRIMARY PROTOCOL) */}
            {featuredMeal ? (
              <Animated.View
                style={[
                  styles.featuredSection,
                  {
                    opacity: featuredOpacity,
                    transform: [{ translateY: featuredTranslateY }],
                  },
                ]}
              >
                <View style={styles.featuredSectionHeader}>
                  <Text style={styles.featuredEyebrow}>PRIMARY RECOMMENDATION</Text>
                  <View style={styles.featuredTimingBadge}>
                    <Text style={styles.featuredTimingText}>
                      {(featuredMeal.name || 'OPTIMAL FUEL').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.featuredCard}
                  activeOpacity={0.9}
                  onPress={() => handleMealPress(featuredMeal)}
                  testID="meal-recommendation-card-0"
                  accessibilityRole="button"
                  accessibilityLabel={`View primary meal ${featuredMeal.items?.[0] || featuredMeal.name}`}
                >
                  <View style={styles.featuredCardInner} testID="recommendation-card-0">
                    <Text style={styles.featuredMealTitle}>
                      {featuredMeal.items && featuredMeal.items.length > 0
                        ? featuredMeal.items[0]
                        : featuredMeal.name}
                    </Text>
                    <Text style={styles.featuredMealDescription} numberOfLines={2}>
                      {featuredMeal.items && featuredMeal.items.length > 1
                        ? featuredMeal.items.slice(1).join(' • ')
                        : 'Curated high-performance whole food athletic nutrition.'}
                    </Text>

                    {/* Macro Intelligence Scannable Matrix */}
                    <View style={styles.macroMatrixGrid}>
                      <View style={styles.macroMatrixCol}>
                        <Text style={styles.macroMatrixLabel}>CALORIES</Text>
                        <Text style={styles.macroMatrixValue}>
                          {featuredMeal.calories ? `${featuredMeal.calories}` : '--'}
                          <Text style={styles.macroMatrixUnit}> KCAL</Text>
                        </Text>
                      </View>
                      <View style={styles.macroMatrixDivider} />
                      <View style={styles.macroMatrixCol}>
                        <Text style={styles.macroMatrixLabel}>PROTEIN</Text>
                        <Text style={styles.macroMatrixValue}>
                          {featuredMeal.protein_g ?? '--'}
                          <Text style={styles.macroMatrixUnit}>G</Text>
                        </Text>
                      </View>
                      <View style={styles.macroMatrixDivider} />
                      <View style={styles.macroMatrixCol}>
                        <Text style={styles.macroMatrixLabel}>CARBS</Text>
                        <Text style={styles.macroMatrixValue}>
                          {featuredMeal.carbs_g ?? '--'}
                          <Text style={styles.macroMatrixUnit}>G</Text>
                        </Text>
                      </View>
                      <View style={styles.macroMatrixDivider} />
                      <View style={styles.macroMatrixCol}>
                        <Text style={styles.macroMatrixLabel}>FAT</Text>
                        <Text style={styles.macroMatrixValue}>
                          {featuredMeal.fat_g ?? '--'}
                          <Text style={styles.macroMatrixUnit}>G</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Featured CTA Button */}
                    <TouchableWithoutFeedback
                      {...featuredCtaSpring}
                      onPress={() => handleMealPress(featuredMeal)}
                      accessibilityRole="button"
                      accessibilityLabel="View Featured Meal Details"
                    >
                      <Animated.View
                        style={[
                          styles.featuredCtaBtn,
                          { transform: [{ scale: featuredCtaScale }] },
                        ]}
                      >
                        <Text style={styles.featuredCtaText}>VIEW MEAL PROTOCOL →</Text>
                      </Animated.View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ) : null}

            {/* 6. REMAINING RECOMMENDATIONS LIST */}
            {remainingMeals.length > 0 ? (
              <Animated.View
                style={[
                  styles.listSection,
                  {
                    opacity: listOpacity,
                    transform: [{ translateY: listTranslateY }],
                  },
                ]}
              >
                <Text style={styles.listSectionTitle}>ADDITIONAL CURATED PROTOCOLS</Text>

                {remainingMeals.map((meal, index) => {
                  const actualIndex = index + 1;
                  return (
                    <View
                      key={`rec-meal-${actualIndex}`}
                      testID={`meal-recommendation-card-${actualIndex}`}
                    >
                      <View testID={`recommendation-card-${actualIndex}`}>
                        <MealCard
                          meal={meal}
                          variant="full"
                          onPress={() => handleMealPress(meal)}
                        />
                      </View>
                    </View>
                  );
                })}
              </Animated.View>
            ) : null}
          </>
        )}
      </ScrollView>
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

  // Editorial Identity Section
  identitySection: {
    marginBottom: spacing.md,
  },
  eyebrowText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8.5,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: 6,
  },
  headline: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subcopy: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 10,
  },
  objectiveContextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  objectiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginRight: 8,
  },
  objectiveLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1.2,
    flex: 1,
  },
  objectiveValue: {
    color: colors.primaryText,
    fontWeight: '800',
  },
  calibrationStatusPill: {
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
  },
  calibrationStatusText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Filter Bar
  filterContainer: {
    marginBottom: spacing.lg,
  },
  filterRow: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  filterPillInactive: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillText: {
    ...typography.labelCaps,
    fontSize: 9.5,
    letterSpacing: 1.2,
  },
  filterPillTextActive: {
    color: colors.inverseText,
    fontWeight: '800',
  },
  filterPillTextInactive: {
    color: colors.secondaryText,
    fontWeight: '700',
  },

  // Featured Recommendation Card
  featuredSection: {
    marginBottom: spacing.xl,
  },
  featuredSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  featuredEyebrow: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  featuredTimingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  featuredTimingText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  featuredCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  featuredCardInner: {
    padding: spacing.lg,
  },
  featuredMealTitle: {
    ...typography.headlineMd,
    fontFamily: 'serif',
    color: colors.primaryText,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredMealDescription: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  macroMatrixGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(25, 27, 30, 0.95)',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  macroMatrixCol: {
    flex: 1,
    alignItems: 'center',
  },
  macroMatrixDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  macroMatrixLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 7.5,
    letterSpacing: 1,
    fontWeight: '800',
    marginBottom: 2,
  },
  macroMatrixValue: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  macroMatrixUnit: {
    fontSize: 9,
    color: colors.tertiaryText,
    fontWeight: '500',
  },
  featuredCtaBtn: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.xs,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCtaText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Additional Protocols List Section
  listSection: {
    marginBottom: spacing.xl,
  },
  listSectionTitle: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: spacing.md,
  },

  // Skeletons
  skeletonContainer: {
    gap: 16,
    paddingTop: spacing.sm,
  },
  skeletonFeaturedCard: {
    width: '100%',
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.md,
  },
  skeletonListCard: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.sm,
  },

  // Diagnostics & Empty States
  errorCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.4)',
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  errorIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 16,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 19,
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.4)',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: borderRadius.xs,
  },
  retryButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  emptyCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 18,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 19,
    fontSize: 12,
    marginBottom: spacing.lg,
    maxWidth: '90%',
  },
  completeProfileBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: borderRadius.xs,
  },
  completeProfileBtnText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
