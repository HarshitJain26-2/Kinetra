/**
 * Kinetra Profile & Biometrics Command Center (Phase 35)
 * Exact Stitch luxury dark athletic design matching Screen 2 (Command Center).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { apiClient, UserProfileData } from '../api/client';

export const EditProfileScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [classification, setClassification] = useState('Hybrid Athlete');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [goal, setGoal] = useState('Muscle Hypertrophy & Longevity');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiClient.getCurrentUserProfile();
        if (data) {
          setProfile(data);
          setDisplayName(data.display_name || user?.user_metadata?.full_name || 'Apex_01');
          if (data.height_cm) setHeightCm(String(data.height_cm));
          if (data.weight_kg) setWeightKg(String(data.weight_kg));
        }
      } catch {
        setDisplayName('Apex_01');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  // Calculate dynamic BMR based on Mifflin-St Jeor formula
  const parsedH = parseFloat(heightCm) || 184;
  const parsedW = parseFloat(weightKg) || 82.5;
  const calculatedBmr = Math.round(10 * parsedW + 6.25 * parsedH - 5 * 25 + 5);

  const handleSaveProtocol = async () => {
    setError(null);
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);

    if (heightCm && (isNaN(h) || h < 50 || h > 250)) {
      setError('Please enter a valid height (50 - 250 cm).');
      return;
    }
    if (weightKg && (isNaN(w) || w < 20 || w > 300)) {
      setError('Please enter a valid weight (20 - 300 kg).');
      return;
    }

    setSaving(true);
    try {
      await apiClient.updateUserProfile({
        display_name: displayName.trim() || 'Athlete',
        height_cm: !isNaN(h) ? h : null,
        weight_kg: !isNaN(w) ? w : null,
      });

      Alert.alert('Protocol Saved', 'Your elite biometric telemetry has been synchronized.');
      navigation.goBack();
    } catch (err: any) {
      setError(err?.message || 'Failed to save biometric configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          testID="command-center-back-button"
        >
          <Icon name="back" size={18} color={colors.gold} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>KINETRA</Text>

        <TouchableOpacity style={styles.gearButton}>
          <Icon name="gear" size={16} color={colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE & SAVE ROW */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={styles.mainTitle}>Command{'\n'}Center</Text>
            <Text style={styles.subtitle}>Elite Biometric Configuration.</Text>
          </View>

          <TouchableOpacity
            style={styles.saveProtocolBtn}
            onPress={handleSaveProtocol}
            disabled={saving}
            testID="save-protocol-button"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.inverseText} />
            ) : (
              <Text style={styles.saveProtocolText}>Save Protocol</Text>
            )}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* 1. IDENTITY SECTION */}
        <Text style={styles.sectionHeader}>Identity</Text>
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase() || 'A'}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>STATUS:  ⬡ Elite</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Call Sign</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Apex_01"
              placeholderTextColor={colors.tertiaryText}
              testID="profile-callsign-input"
            />
          </View>

          <Text style={styles.inputLabel}>Classification</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={classification}
              onChangeText={setClassification}
              placeholder="e.g. Hybrid Athlete"
              placeholderTextColor={colors.tertiaryText}
            />
          </View>
        </View>

        {/* AI INSIGHT BANNER */}
        <View style={styles.insightBox}>
          <View style={styles.insightIconBox}>
            <Icon name="sparkle" size={16} color={colors.gold} />
          </View>
          <View style={styles.insightTextCol}>
            <Text style={styles.insightTitle}>Kinetra AI Insight</Text>
            <Text style={styles.insightDescription}>
              Metabolic rate tracking requires an updated body fat percentage reading for precision optimization.
            </Text>
          </View>
        </View>

        {/* 2. CORE TELEMETRY SECTION */}
        <Text style={styles.sectionHeader}>Core Telemetry</Text>
        <View style={styles.card}>
          {/* Height Row */}
          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Height</Text>
            <View style={styles.telemetryInputRow}>
              <TextInput
                style={styles.telemetryValInput}
                value={heightCm}
                onChangeText={setHeightCm}
                placeholder="184"
                placeholderTextColor={colors.tertiaryText}
                keyboardType="numeric"
                testID="profile-height-input"
              />
              <Text style={styles.telemetryUnit}>cm</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Mass Row */}
          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Mass</Text>
            <View style={styles.telemetryInputRow}>
              <TextInput
                style={styles.telemetryValInput}
                value={weightKg}
                onChangeText={setWeightKg}
                placeholder="82.5"
                placeholderTextColor={colors.tertiaryText}
                keyboardType="numeric"
                testID="profile-mass-input"
              />
              <Text style={styles.telemetryUnit}>kg</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Body Fat Row */}
          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Body Fat</Text>
            <View style={styles.telemetryInputRow}>
              <TextInput
                style={styles.telemetryValInput}
                value={bodyFat}
                onChangeText={setBodyFat}
                placeholder="--"
                placeholderTextColor={colors.tertiaryText}
                keyboardType="numeric"
              />
              <Text style={styles.telemetryUnit}>%</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Basal Metabolic Rate Row */}
          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Basal Metabolic Rate</Text>
            <View style={styles.telemetryInputRow}>
              <Text style={styles.telemetryValDisplay}>{calculatedBmr}</Text>
              <Text style={styles.telemetryUnit}>kcal</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Goal Protocol */}
          <Text style={styles.inputLabel}>Performance Goal Protocol</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={goal}
              onChangeText={setGoal}
              placeholder="Define prime directive..."
              placeholderTextColor={colors.tertiaryText}
            />
          </View>
        </View>
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
  gearButton: {
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
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  titleLeft: {
    flex: 1,
  },
  mainTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '800',
    color: colors.primaryText,
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
  },
  saveProtocolBtn: {
    backgroundColor: colors.primaryText,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    marginLeft: 12,
  },
  saveProtocolText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 11,
    fontWeight: '800',
  },
  errorText: {
    color: colors.crimson,
    marginBottom: spacing.sm,
    fontSize: 12,
  },
  sectionHeader: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  statusText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
  },
  inputLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  inputBox: {
    backgroundColor: colors.surfaceBright,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  textInput: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderGold,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  insightIconBox: {
    marginRight: 10,
    marginTop: 2,
  },
  insightTextCol: {
    flex: 1,
  },
  insightTitle: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  insightDescription: {
    ...typography.caption,
    color: colors.secondaryText,
    lineHeight: 16,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  telemetryLabel: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: 14,
  },
  telemetryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryValInput: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'right',
    marginRight: 4,
    minWidth: 50,
  },
  telemetryValDisplay: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 18,
    marginRight: 4,
  },
  telemetryUnit: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
});
