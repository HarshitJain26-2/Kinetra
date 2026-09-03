/**
 * Kinetra Meal Details / Fuel Protocol Screen (Section 26: Meal Detail Refinement)
 * Exact Stitch luxury dark athletic performance-lab Fuel Protocol screen.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ImageBackground,
  Alert,
  Animated,
  Easing,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { MealPlanItem } from '../api/client';
import { images } from '../assets';

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

  const [isBookmarked, setIsBookmarked] = useState(false);

  // 4-Phase Staggered Entrance Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(10)).current;
  const matrixOpacity = useRef(new Animated.Value(0)).current;
  const matrixTranslateY = useRef(new Animated.Value(12)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const detailsTranslateY = useRef(new Animated.Value(14)).current;

  // Tactile Spring Scales
  const backBtnScale = useRef(new Animated.Value(1)).current;
  const bookmarkBtnScale = useRef(new Animated.Value(1)).current;
  const prepareBtnScale = useRef(new Animated.Value(1)).current;

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
  const bookmarkBtnSpring = createSpring(bookmarkBtnScale, 0.90, 1);
  const prepareBtnSpring = createSpring(prepareBtnScale, 0.96, 1);

  // Entrance Choreography
  useEffect(() => {
    let isMounted = true;
    let entranceAnim: Animated.CompositeAnimation | null = null;

    const runEntrance = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (!isMounted) return;

      if (reduceMotion) {
        headerOpacity.setValue(1);
        headerTranslateY.setValue(0);
        heroOpacity.setValue(1);
        heroTranslateY.setValue(0);
        matrixOpacity.setValue(1);
        matrixTranslateY.setValue(0);
        detailsOpacity.setValue(1);
        detailsTranslateY.setValue(0);
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
        // Phase 2: Hero & Meal Identity
        Animated.parallel([
          Animated.timing(heroOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(heroTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 3: Nutrition Intelligence Matrix
        Animated.parallel([
          Animated.timing(matrixOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(matrixTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Protocol Assembly, Compatibility & Action
        Animated.parallel([
          Animated.timing(detailsOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(detailsTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      entranceAnim.start();
    };

    runEntrance();

    return () => {
      isMounted = false;
      if (entranceAnim) entranceAnim.stop();
    };
  }, []);

  const mealName =
    meal?.items && meal.items.length > 0 ? meal.items[0] : meal?.name || 'Curated Athletic Fuel';
  const prepTime = meal?.prep_time_min || (meal?.calories > 600 ? 45 : 20);
  const timing = (meal?.timing || meal?.name || 'POST-WORKOUT').toUpperCase();

  // Fiber calculation based on carbohydrates
  const fiberGrams = Math.max(4, Math.round((meal?.carbs_g || 30) * 0.25));

  // Determine Elite Compatibility Badges
  const isHighProtein = (meal?.protein_g || 0) >= 35;
  const isVegan = dietType === 'vegan';
  const isKeto = dietType === 'keto';

  const compatibilityBadges: string[] = [];
  if (isHighProtein) compatibilityBadges.push('High Protein Index');
  if (isVegan) compatibilityBadges.push('100% Plant-Based');
  if (isKeto) compatibilityBadges.push('Ketogenic Macro Ratio');
  compatibilityBadges.push('Bio-Available Fuel Matrix');

  const handlePrepareMeal = () => {
    Alert.alert(
      'Prepare Meal',
      `Meal logged to daily intake.\nEnergy: ${meal.calories} kcal\nProtein: ${meal.protein_g}g\nCarbohydrates: ${meal.carbs_g}g\nFats: ${meal.fat_g}g`,
      [
        {
          text: 'Done',
          onPress: () => navigation?.goBack(),
        },
      ]
    );
  };

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
          testID="meal-details-back-button"
          accessibilityLabel="Back to Recommendations"
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
          {...bookmarkBtnSpring}
          onPress={() => setIsBookmarked(!isBookmarked)}
          testID="meal-details-bookmark-button"
          accessibilityLabel={isBookmarked ? 'Remove Bookmark' : 'Bookmark Meal'}
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              styles.navCircleButton,
              { transform: [{ scale: bookmarkBtnScale }] },
            ]}
          >
            <Icon
              name="bookmark"
              size={16}
              color={isBookmarked ? colors.gold : colors.tertiaryText}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* 2. SCROLLABLE MEAL CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. CINEMATIC MEAL HERO (Stitch Reference Column 2) */}
        <Animated.View
          style={[
            styles.heroContainer,
            {
              opacity: heroOpacity,
              transform: [{ translateY: heroTranslateY }],
            },
          ]}
        >
          <ImageBackground
            source={images.splashBg}
            style={styles.heroBackground}
            imageStyle={styles.heroImage}
          >
            <View style={styles.heroScrim}>
              {/* Badges on hero */}
              <View style={styles.floatingBadgeRow}>
                <View style={styles.heroTagPill}>
                  <View style={styles.heroTagDot} />
                  <Text style={styles.heroTagPillText}>{timing}</Text>
                </View>
                <View style={styles.heroTagPill}>
                  <Icon name="clock" size={9} color={colors.gold} style={{ marginRight: 4 }} />
                  <Text style={styles.heroTagPillText}>{prepTime} MIN PREP</Text>
                </View>
              </View>

              {/* Title & Calorie Highlight */}
              <View style={styles.heroTitleBlock}>
                <Text style={styles.heroEyebrow}>FUEL PROTOCOL // NUTRITION</Text>
                <Text style={styles.mainTitle}>{mealName}</Text>
                <View style={styles.calorieRow}>
                  <Text style={styles.calorieNum}>{meal.calories ?? '--'}</Text>
                  <Text style={styles.calorieUnit}>KCAL</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </Animated.View>

        {/* 3. NUTRITION INTELLIGENCE MATRIX (2x2 Grid matching Stitch reference) */}
        <Animated.View
          style={[
            styles.macroGridContainer,
            {
              opacity: matrixOpacity,
              transform: [{ translateY: matrixTranslateY }],
            },
          ]}
          testID="meal-details-nutrition-card"
        >
          <View testID="meal-details-macros" style={styles.macroGridInner}>
            {/* Top Row: Protein & Carbs */}
            <View style={styles.macroRow}>
              <View style={styles.macroBox}>
                <Text style={styles.macroBoxLabel}>PROTEIN</Text>
                <Text style={styles.macroBoxValue}>
                  {meal.protein_g ?? '--'}
                  <Text style={styles.macroBoxUnit}>g</Text>
                </Text>
                <View style={styles.macroIndicatorCrimson} />
              </View>

              <View style={styles.macroBox}>
                <Text style={styles.macroBoxLabel}>CARBS</Text>
                <Text style={styles.macroBoxValue}>
                  {meal.carbs_g ?? '--'}
                  <Text style={styles.macroBoxUnit}>g</Text>
                </Text>
                <View style={styles.macroIndicatorGold} />
              </View>
            </View>

            {/* Bottom Row: Fat & Fiber */}
            <View style={styles.macroRow}>
              <View style={styles.macroBox}>
                <Text style={styles.macroBoxLabel}>FAT</Text>
                <Text style={styles.macroBoxValue}>
                  {meal.fat_g ?? '--'}
                  <Text style={styles.macroBoxUnit}>g</Text>
                </Text>
                <View style={styles.macroIndicatorMuted} />
              </View>

              <View style={styles.macroBox}>
                <Text style={styles.macroBoxLabel}>FIBER</Text>
                <Text style={styles.macroBoxValue}>
                  {fiberGrams}
                  <Text style={styles.macroBoxUnit}>g</Text>
                </Text>
                <View style={styles.macroIndicatorMuted} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* 4. THE PROTOCOL / DESCRIPTION */}
        <Animated.View
          style={[
            styles.sectionCard,
            {
              opacity: detailsOpacity,
              transform: [{ translateY: detailsTranslateY }],
            },
          ]}
          testID="meal-details-protocol-card"
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.goldIndicatorBar} />
            <Text style={styles.sectionTitle}>THE FUEL PROTOCOL</Text>
          </View>
          <Text style={styles.protocolDescription}>
            {dietType ? `${dietType.toUpperCase()} CALIBRATION. ` : ''}
            Precision macronutrient assembly formulated for muscle recovery, glycogen replenishment, and hormonal balance.
          </Text>
        </Animated.View>

        {/* 5. TECHNICAL ASSEMBLY (INGREDIENTS & COMPOSITION) */}
        <Animated.View
          style={[
            styles.sectionCard,
            {
              opacity: detailsOpacity,
              transform: [{ translateY: detailsTranslateY }],
            },
          ]}
          testID="meal-details-assembly"
        >
          <View testID="meal-details-ingredients">
            <View style={styles.sectionHeaderRow}>
              <Icon name="bookmark" size={13} color={colors.gold} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Technical Assembly</Text>
            </View>

            {meal.items && meal.items.length > 0 ? (
              meal.items.map((item, index) => {
                const portionLabel =
                  index === 0
                    ? '8 OZ'
                    : index === 1
                    ? '1 CUP'
                    : index === 2
                    ? '150 G'
                    : index === 3
                    ? '1 TBSP'
                    : 'PINCH';
                return (
                  <View key={`item-${index}`} style={styles.ingredientRow}>
                    <Text style={styles.ingredientName}>{item}</Text>
                    <Text style={styles.ingredientMeasure}>{portionLabel}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>{meal.name}</Text>
                <Text style={styles.ingredientMeasure}>1 SERVING</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* 6. ELITE COMPATIBILITY */}
        <Animated.View
          style={[
            styles.sectionCard,
            {
              opacity: detailsOpacity,
              transform: [{ translateY: detailsTranslateY }],
            },
          ]}
          testID="meal-details-compatibility"
        >
          <Text style={styles.compatibilityHeader}>ELITE COMPATIBILITY</Text>
          {compatibilityBadges.map((badge, idx) => (
            <View key={`badge-${idx}`} style={styles.compatBadgeRow}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkIconText}>✓</Text>
              </View>
              <Text style={styles.compatBadgeText}>{badge}</Text>
            </View>
          ))}
        </Animated.View>

        {/* 7. WARNINGS / DENSITY ADVISORY */}
        {meal.calories >= 700 ? (
          <Animated.View
            style={[
              styles.warningCard,
              {
                opacity: detailsOpacity,
                transform: [{ translateY: detailsTranslateY }],
              },
            ]}
            testID="meal-details-warning"
          >
            <View style={styles.warningHeader}>
              <Icon name="warning" size={13} color={colors.crimson} style={{ marginRight: 6 }} />
              <Text style={styles.warningTitle}>WARNINGS</Text>
            </View>
            <Text style={styles.warningBody}>
              High caloric density. Recommended only for heavy lifting days, volume overload, or demanding conditioning protocols.
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* 8. BOTTOM PREPARE MEAL CTA */}
      <View style={styles.bottomBar}>
        <TouchableWithoutFeedback
          {...prepareBtnSpring}
          onPress={handlePrepareMeal}
          testID="meal-details-prepare-button"
          accessibilityRole="button"
          accessibilityLabel="Prepare and log meal"
        >
          <Animated.View
            style={[
              styles.prepareButton,
              { transform: [{ scale: prepareBtnScale }] },
            ]}
          >
            <View testID="meal-details-log-meal-button" style={styles.prepareBtnInner}>
              <Icon name="cutlery" size={15} color={colors.inverseText} style={{ marginRight: 8 }} />
              <Text style={styles.prepareButtonText}>PREPARE MEAL</Text>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
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
    paddingBottom: 110,
  },

  // ── Cinematic Hero ──
  heroContainer: {
    height: 250,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  heroBackground: {
    flex: 1,
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroScrim: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 7, 0.72)',
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  floatingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 20, 22, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    borderRadius: borderRadius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroTagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gold,
    marginRight: 6,
  },
  heroTagPillText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitleBlock: {
    marginTop: 'auto',
  },
  heroEyebrow: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 8.5,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  mainTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 27,
    lineHeight: 33,
    marginBottom: 4,
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
    letterSpacing: 1.2,
  },

  // ── 2x2 Nutrition Matrix Grid (Stitch Reference) ──
  macroGridContainer: {
    marginBottom: spacing.lg,
  },
  macroGridInner: {
    gap: 10,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroBox: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
  },
  macroBoxLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 4,
  },
  macroBoxValue: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 20,
    marginBottom: 6,
  },
  macroBoxUnit: {
    fontSize: 11,
    color: colors.tertiaryText,
    fontWeight: '500',
  },
  macroIndicatorCrimson: {
    width: '100%',
    height: 2,
    backgroundColor: colors.crimson,
    borderRadius: borderRadius.full,
  },
  macroIndicatorGold: {
    width: '100%',
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.full,
  },
  macroIndicatorMuted: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.full,
  },

  // ── Section Cards ──
  sectionCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goldIndicatorBar: {
    width: 3,
    height: 14,
    backgroundColor: colors.gold,
    marginRight: 8,
    borderRadius: 1.5,
  },
  sectionTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 16,
  },
  protocolDescription: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
  },

  // ── Technical Assembly Rows ──
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  ingredientName: {
    ...typography.bodySm,
    color: colors.primaryText,
    fontSize: 12.5,
    fontWeight: '600',
  },
  ingredientMeasure: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Elite Compatibility ──
  compatibilityHeader: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9.5,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  compatBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(217, 184, 63, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  checkIconText: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '900',
  },
  compatBadgeText: {
    ...typography.bodySm,
    color: colors.primaryText,
    fontSize: 12.5,
    fontWeight: '500',
  },

  // ── Warning Advisory ──
  warningCard: {
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.3)',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningTitle: {
    ...typography.labelCaps,
    color: colors.crimson,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  warningBody: {
    ...typography.caption,
    color: colors.secondaryText,
    lineHeight: 16,
    fontSize: 11,
  },

  // ── Bottom Prepare CTA ──
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#050607',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  prepareButton: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
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
  prepareBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prepareButtonText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
