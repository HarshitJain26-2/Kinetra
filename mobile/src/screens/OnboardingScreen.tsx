/**
 * Kinetra Onboarding Screen (Phase 35)
 * Exact Stitch luxury dark athletic design matching Screen 1 (Define Your Protocol).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { images } from '../assets';
import { apiClient } from '../api/client';

type FitnessTier = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export const OnboardingScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation }) => {
  const [objective, setObjective] = useState('Hypertrophy, Endurance, Powerlifting');
  const [tier, setTier] = useState<FitnessTier>('advanced');
  const [heightCm, setHeightCm] = useState('184');
  const [weightKg, setWeightKg] = useState('82.5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // 2. Initialize baseline nutrition profile targets derived from physiological metrics
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP HERO HEADER */}
        <ImageBackground
          source={images.splashBg}
          style={styles.heroBanner}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.brandWordmark}>KINETRA</Text>
          </View>
        </ImageBackground>

        {/* PHASE PILL */}
        <View style={styles.phaseHeaderRow}>
          <Text style={styles.phaseLabel}>PHASE 01 // ATHLETE SETUP</Text>
          <Text style={styles.stepIndicator}>1 OF 4</Text>
        </View>

        {/* MAIN HEADLINE */}
        <Text style={styles.mainTitle}>DEFINE YOUR{'\n'}PROTOCOL</Text>
        <Text style={styles.subtitle}>
          Calibrate Kinetra to your precise biomechanical profile and performance objectives.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* 1. PRIMARY OBJECTIVE */}
        <Text style={styles.inputLabel}>PRIMARY OBJECTIVE</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.textInput}
            value={objective}
            onChangeText={setObjective}
            placeholder="e.g. Hypertrophy, Endurance, Powerlifting"
            placeholderTextColor={colors.tertiaryText}
            testID="onboarding-objective-input"
          />
        </View>

        {/* 2. CURRENT TIER */}
        <Text style={styles.inputLabel}>CURRENT TIER</Text>
        <View style={styles.tierRow}>
          <TouchableOpacity
            style={[styles.tierCard, tier === 'intermediate' && styles.tierCardActive]}
            onPress={() => setTier('intermediate')}
            testID="tier-intermediate"
          >
            <Text style={[styles.tierTitle, tier === 'intermediate' && styles.tierTextActive]}>
              TIER 1
            </Text>
            <Text style={styles.tierSubtitle}>Intermediate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tierCard, tier === 'advanced' && styles.tierCardActive]}
            onPress={() => setTier('advanced')}
            testID="tier-advanced"
          >
            <Text style={[styles.tierTitle, tier === 'advanced' && styles.tierTextActive]}>
              TIER 2
            </Text>
            <Text style={styles.tierSubtitle}>Advanced</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tierCard, tier === 'elite' && styles.tierCardActive]}
            onPress={() => setTier('elite')}
            testID="tier-elite"
          >
            <Text style={[styles.tierTitle, tier === 'elite' && styles.tierTextActive]}>
              TIER 3
            </Text>
            <Text style={styles.tierSubtitle}>Elite/Pro</Text>
          </TouchableOpacity>
        </View>

        {/* 3. HEIGHT & WEIGHT 2-COLUMN */}
        <View style={styles.biometricsRow}>
          <View style={styles.bioColumn}>
            <Text style={styles.inputLabel}>HEIGHT (CM)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                testID="onboarding-height-input"
              />
            </View>
          </View>

          <View style={styles.bioColumn}>
            <Text style={styles.inputLabel}>WEIGHT (KG)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="numeric"
                testID="onboarding-weight-input"
              />
            </View>
          </View>
        </View>

        {/* CTA BUTTON */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleInitializeProtocol}
          disabled={loading}
          testID="onboarding-submit-button"
        >
          <Text style={styles.ctaButtonText}>
            {loading ? 'CALIBRATING...' : 'INITIALIZE PROTOCOL →'}
          </Text>
        </TouchableOpacity>

        {/* IMPORT LINK */}
        <TouchableOpacity
          style={styles.importLink}
          onPress={() => Alert.alert('Import Data', 'Apple Health & Google Fit telemetry integration is ready.')}
        >
          <Text style={styles.importLinkText}>IMPORT PREVIOUS DATA</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroBanner: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 7, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandWordmark: {
    ...typography.brandWordmarkSmall,
    color: colors.gold,
    fontSize: 16,
    letterSpacing: 4,
  },
  phaseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  phaseLabel: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  stepIndicator: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
  },
  mainTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '800',
    color: colors.primaryText,
    fontSize: 30,
    lineHeight: 36,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.crimson,
    marginBottom: spacing.sm,
    fontSize: 12,
  },
  inputLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  textInput: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  tierRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  tierCard: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tierCardActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
  },
  tierTitle: {
    ...typography.labelCaps,
    fontSize: 10,
    color: colors.tertiaryText,
    marginBottom: 2,
  },
  tierTextActive: {
    color: colors.gold,
    fontWeight: '800',
  },
  tierSubtitle: {
    fontSize: 11,
    color: colors.primaryText,
    fontWeight: '600',
  },
  biometricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  bioColumn: {
    flex: 1,
  },
  ctaButton: {
    backgroundColor: colors.primaryText,
    borderRadius: borderRadius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  ctaButtonText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  importLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  importLinkText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
