/**
 * Kinetra Onboarding Screen (Section 18: Onboarding / Athlete Setup Refinement)
 * Exact Stitch luxury dark athletic design matching Screen 1 (Define Your Protocol).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Animated,
  Easing,
  AccessibilityInfo,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { images } from '../assets';
import { apiClient } from '../api/client';

type FitnessTier = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export const OnboardingScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation }) => {
  const [objective, setObjective] = useState('Hypertrophy, Endurance, Powerlifting');
  const [tier, setTier] = useState<FitnessTier>('advanced');
  const [heightCm, setHeightCm] = useState('184');
  const [weightKg, setWeightKg] = useState('82.5');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Staggered Entrance Animation Values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-12)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(10)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(14)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(14)).current;

  // Spring Button Scales
  const submitBtnScale = useRef(new Animated.Value(1)).current;
  const importBtnScale = useRef(new Animated.Value(1)).current;
  const tier1Scale = useRef(new Animated.Value(1)).current;
  const tier2Scale = useRef(new Animated.Value(1)).current;
  const tier3Scale = useRef(new Animated.Value(1)).current;
  const backBtnScale = useRef(new Animated.Value(1)).current;

  const createSpring = (val: Animated.Value, down = 0.96, back = 1) => ({
    onPressIn: () => {
      Animated.spring(val, {
        toValue: down,
        useNativeDriver: true,
        speed: 40,
        bounciness: 3,
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

  const submitSpring = createSpring(submitBtnScale, 0.96, 1);
  const importSpring = createSpring(importBtnScale, 0.96, 1);
  const tier1Spring = createSpring(tier1Scale, 0.95, 1);
  const tier2Spring = createSpring(tier2Scale, 0.95, 1);
  const tier3Spring = createSpring(tier3Scale, 0.95, 1);
  const backSpring = createSpring(backBtnScale, 0.90, 1);

  // Entrance sequence
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
        formOpacity.setValue(1);
        formTranslateY.setValue(0);
        ctaOpacity.setValue(1);
        ctaTranslateY.setValue(0);
        return;
      }

      entranceAnim = Animated.stagger(75, [
        // Phase 1: Top Navigation & Progress
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
        // Phase 2: Hero Banner & Headline
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
        // Phase 3: Form Fields & Tier Selector
        Animated.parallel([
          Animated.timing(formOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(formTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: CTA Button & Import Link
        Animated.parallel([
          Animated.timing(ctaOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ctaTranslateY, {
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

  const handleInitializeProtocol = async () => {
    setError(null);
    const parsedHeight = parseFloat(heightCm);
    const parsedWeight = parseFloat(weightKg);

    if (isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 250) {
      setError('Please enter a valid height between 50 and 250 cm.');
      return;
    }
    if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 300) {
      setError('Please enter a valid weight between 20 and 300 kg.');
      return;
    }

    setLoading(true);
    try {
      // 1. Update user profile with biometrics & mark onboarding complete
      await apiClient.updateUserProfile({
        height_cm: parsedHeight,
        weight_kg: parsedWeight,
        fitness_level: tier === 'elite' ? 'advanced' : tier,
        onboarding_done: true,
      });

      // 2. Initialize baseline nutrition profile targets derived from physiological metrics (Mifflin-St Jeor)
      const bmr = Math.round(10 * parsedWeight + 6.25 * parsedHeight - 5 * 25 + 5);
      const dailyCalTarget = Math.round(bmr * 1.5);

      await apiClient.upsertNutritionProfile({
        goal: 'gain_muscle',
        diet_type: 'omnivore',
        daily_cal_target: dailyCalTarget,
        protein_g: Math.round(parsedWeight * 2.2),
        carbs_g: Math.round((dailyCalTarget * 0.45) / 4),
        fat_g: Math.round((dailyCalTarget * 0.25) / 9),
      });

      // 3. Reset into Main bottom-tabs
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize biometric protocol. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      Alert.alert(
        'Exit Setup',
        'Biometric protocol initialization is required for precise telemetry calibration.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* TOP HEADER BAR */}
        <Animated.View
          style={[
            styles.headerBar,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <TouchableWithoutFeedback
            {...backSpring}
            onPress={handleBack}
            testID="onboarding-back-button"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Animated.View
              style={[
                styles.backButton,
                { transform: [{ scale: backBtnScale }] },
              ]}
            >
              <Icon name="back" size={16} color={colors.gold} />
            </Animated.View>
          </TouchableWithoutFeedback>

          <Text style={styles.headerBrand}>KINETRA</Text>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1 OF 4</Text>
          </View>
        </Animated.View>

        {/* 4-SEGMENT PROGRESS BAR */}
        <Animated.View
          style={[
            styles.progressBarContainer,
            { opacity: headerOpacity },
          ]}
        >
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={styles.progressSegment} />
          <View style={styles.progressSegment} />
          <View style={styles.progressSegment} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HERO BANNER & TITLE BLOCK */}
          <Animated.View
            style={{
              opacity: heroOpacity,
              transform: [{ translateY: heroTranslateY }],
            }}
          >
            {/* Cinematic Hero Banner */}
            <ImageBackground
              source={images.splashBg}
              style={styles.heroBanner}
              imageStyle={styles.heroImage}
            >
              <View style={styles.heroOverlay}>
                <View style={styles.heroWatermarkWrapper}>
                  <Text style={styles.heroWatermark}>PROTOCOL 01</Text>
                </View>
              </View>
            </ImageBackground>

            {/* Phase Subtitle Pill */}
            <View style={styles.phaseHeaderRow}>
              <View style={styles.phaseIndicatorDot} />
              <Text style={styles.phaseLabel}>PHASE 01 // ATHLETE SETUP</Text>
            </View>

            {/* Main Headline */}
            <Text style={styles.mainTitle}>DEFINE YOUR{'\n'}PROTOCOL</Text>
            <Text style={styles.subtitle}>
              Calibrate Kinetra to your precise biomechanical profile and performance objectives.
            </Text>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner} testID="onboarding-error-banner">
                <Icon name="warning" size={16} color={colors.crimson} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </Animated.View>

          {/* FORM FIELDS & CONTROLS */}
          <Animated.View
            style={{
              opacity: formOpacity,
              transform: [{ translateY: formTranslateY }],
            }}
          >
            {/* 1. PRIMARY OBJECTIVE */}
            <Text style={styles.inputLabel}>PRIMARY OBJECTIVE</Text>
            <View
              style={[
                styles.inputBox,
                focusedField === 'objective' && styles.inputBoxFocused,
              ]}
            >
              <TextInput
                style={styles.textInput}
                value={objective}
                onChangeText={setObjective}
                onFocus={() => setFocusedField('objective')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Hypertrophy, Endurance, Powerlifting"
                placeholderTextColor={colors.tertiaryText}
                testID="onboarding-objective-input"
              />
            </View>

            {/* 2. CURRENT TIER (Fitness Level Selection) */}
            <Text style={styles.inputLabel}>CURRENT TIER</Text>
            <View style={styles.tierRow}>
              {/* Tier 1: Intermediate */}
              <TouchableWithoutFeedback
                {...tier1Spring}
                onPress={() => setTier('intermediate')}
                testID="tier-intermediate"
                accessibilityRole="button"
                accessibilityLabel="Select Tier 1 Intermediate"
              >
                <Animated.View
                  style={[
                    styles.tierCard,
                    tier === 'intermediate' && styles.tierCardActive,
                    { transform: [{ scale: tier1Scale }] },
                  ]}
                >
                  <Text
                    style={[
                      styles.tierTitle,
                      tier === 'intermediate' && styles.tierTextActive,
                    ]}
                  >
                    TIER 1
                  </Text>
                  <Text style={styles.tierSubtitle}>Intermediate</Text>
                </Animated.View>
              </TouchableWithoutFeedback>

              {/* Tier 2: Advanced */}
              <TouchableWithoutFeedback
                {...tier2Spring}
                onPress={() => setTier('advanced')}
                testID="tier-advanced"
                accessibilityRole="button"
                accessibilityLabel="Select Tier 2 Advanced"
              >
                <Animated.View
                  style={[
                    styles.tierCard,
                    tier === 'advanced' && styles.tierCardActive,
                    { transform: [{ scale: tier2Scale }] },
                  ]}
                >
                  <Text
                    style={[
                      styles.tierTitle,
                      tier === 'advanced' && styles.tierTextActive,
                    ]}
                  >
                    TIER 2
                  </Text>
                  <Text style={styles.tierSubtitle}>Advanced</Text>
                </Animated.View>
              </TouchableWithoutFeedback>

              {/* Tier 3: Elite/Pro */}
              <TouchableWithoutFeedback
                {...tier3Spring}
                onPress={() => setTier('elite')}
                testID="tier-elite"
                accessibilityRole="button"
                accessibilityLabel="Select Tier 3 Elite or Pro"
              >
                <Animated.View
                  style={[
                    styles.tierCard,
                    tier === 'elite' && styles.tierCardActive,
                    { transform: [{ scale: tier3Scale }] },
                  ]}
                >
                  <Text
                    style={[
                      styles.tierTitle,
                      tier === 'elite' && styles.tierTextActive,
                    ]}
                  >
                    TIER 3
                  </Text>
                  <Text style={styles.tierSubtitle}>Elite/Pro</Text>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>

            {/* 3. HEIGHT & WEIGHT 2-COLUMN BIOMETRICS */}
            <View style={styles.biometricsRow}>
              {/* Height Column */}
              <View style={styles.bioColumn}>
                <Text style={styles.inputLabel}>HEIGHT (CM)</Text>
                <View
                  style={[
                    styles.inputBox,
                    focusedField === 'height' && styles.inputBoxFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    value={heightCm}
                    onChangeText={setHeightCm}
                    onFocus={() => setFocusedField('height')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="numeric"
                    testID="onboarding-height-input"
                  />
                  <Text style={styles.unitSuffix}>CM</Text>
                </View>
              </View>

              {/* Weight Column */}
              <View style={styles.bioColumn}>
                <Text style={styles.inputLabel}>WEIGHT (KG)</Text>
                <View
                  style={[
                    styles.inputBox,
                    focusedField === 'weight' && styles.inputBoxFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    value={weightKg}
                    onChangeText={setWeightKg}
                    onFocus={() => setFocusedField('weight')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="numeric"
                    testID="onboarding-weight-input"
                  />
                  <Text style={styles.unitSuffix}>KG</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* CTA BUTTON & SECONDARY ACTIONS */}
          <Animated.View
            style={{
              opacity: ctaOpacity,
              transform: [{ translateY: ctaTranslateY }],
            }}
          >
            {/* Primary Action Button */}
            <TouchableWithoutFeedback
              {...submitSpring}
              onPress={handleInitializeProtocol}
              disabled={loading}
              testID="onboarding-submit-button"
              accessibilityRole="button"
              accessibilityLabel="Initialize Biometric Protocol"
            >
              <Animated.View
                style={[
                  styles.ctaButton,
                  loading && styles.ctaButtonDisabled,
                  { transform: [{ scale: submitBtnScale }] },
                ]}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.inverseText} style={{ marginRight: 8 }} />
                    <Text style={styles.ctaButtonText}>CALIBRATING...</Text>
                  </View>
                ) : (
                  <Text style={styles.ctaButtonText}>INITIALIZE PROTOCOL →</Text>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>

            {/* Import Data Secondary Action */}
            <TouchableWithoutFeedback
              {...importSpring}
              onPress={() =>
                Alert.alert(
                  'Import Telemetry',
                  'Apple Health & Google Fit biometrics synchronization is initialized.'
                )
              }
              testID="onboarding-import-button"
              accessibilityRole="button"
              accessibilityLabel="Import Previous Data"
            >
              <Animated.View
                style={[
                  styles.importLink,
                  { transform: [{ scale: importBtnScale }] },
                ]}
              >
                <Text style={styles.importLinkText}>IMPORT PREVIOUS DATA</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050607',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
  },
  headerBrand: {
    ...typography.brandWordmarkSmall,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: '800',
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepBadgeText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  progressBarContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  progressSegment: {
    flex: 1,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressSegmentActive: {
    backgroundColor: colors.gold,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl + 20,
  },
  heroBanner: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 7, 0.45)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  heroWatermarkWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(5, 6, 7, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
  },
  heroWatermark: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9.5,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  phaseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  phaseIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginRight: 8,
  },
  phaseLabel: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '800',
  },
  mainTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.4)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.crimson,
    fontSize: 12,
    flex: 1,
  },
  inputLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9.5,
    letterSpacing: 1.4,
    fontWeight: '800',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
  },
  inputBoxFocused: {
    borderColor: colors.gold,
  },
  textInput: {
    flex: 1,
    color: colors.primaryText,
    fontSize: 13.5,
    fontWeight: '600',
  },
  unitSuffix: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
  },
  tierRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  tierCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  tierCardActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
  },
  tierTitle: {
    ...typography.labelCaps,
    fontSize: 9.5,
    color: colors.tertiaryText,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 2,
  },
  tierTextActive: {
    color: colors.gold,
    fontWeight: '800',
  },
  tierSubtitle: {
    fontSize: 11.5,
    color: colors.primaryText,
    fontWeight: '600',
  },
  biometricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.sm,
  },
  bioColumn: {
    flex: 1,
  },
  ctaButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.xs,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  importLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  importLinkText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
});
