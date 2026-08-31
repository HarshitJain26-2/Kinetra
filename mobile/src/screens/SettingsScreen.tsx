/**
 * Kinetra Settings & Account Screen (Phase 33)
 * Exact Stitch luxury dark visual matching Screen 3.
 */

import React, { useState } from 'react';
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
import { Icon, IconName } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { SignOutModal } from '../components/SignOutModal';

interface SettingsRowItem {
  id: string;
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  testID: string;
}

interface SettingsSectionProps {
  title: string;
  items: SettingsRowItem[];
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, items }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionHeader}>{title}</Text>
    <View style={styles.sectionCard}>
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <TouchableOpacity
            style={styles.rowItem}
            onPress={item.onPress}
            testID={item.testID}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Icon name={item.icon} size={16} color={colors.gold} />
              </View>
              <Text style={styles.rowTitle}>{item.title}</Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.tertiaryText} />
          </TouchableOpacity>
          {index < items.length - 1 && <View style={styles.rowDivider} />}
        </React.Fragment>
      ))}
    </View>
  </View>
);

interface SettingsScreenProps {
  onBack: () => void;
  navigation?: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, navigation }) => {
  const { user, signOut, resetPassword } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState<boolean>(false);
  const [signingOut, setSigningOut] = useState<boolean>(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleProfileInfo = () => {
    if (navigation?.navigate) {
      navigation.navigate('EditProfile');
    } else {
      const email = user?.email || 'N/A';
      const name =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.display_name ||
        email.split('@')[0];

      Alert.alert(
        'Profile Information',
        `Athlete Name: ${name}\nEmail: ${email}\nTier: Elite Member\nSecurity: End-to-End Encrypted`
      );
    }
  };

  const handleChangePassword = () => {
    if (!user?.email) {
      Alert.alert('Error', 'No authenticated email found.');
      return;
    }

    Alert.alert(
      'Change Password',
      `Send password reset link to ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            const success = await resetPassword(user.email!);
            if (success) {
              Alert.alert('Sent', 'Password reset instructions have been sent to your email.');
            }
          },
        },
      ]
    );
  };

  const handleUnits = () => {
    Alert.alert(
      'Units & Measurements',
      'System: Metric (kg, cm, m)\nHeart Rate: BPM\nVelocity: m/s\n\nMetric calibration is standardized across all AI pose tracking algorithms.'
    );
  };

  const handleNotifications = () => {
    Alert.alert(
      'Notifications',
      'Workout reminders, telemetry sync digests, and personal milestone alerts are active.'
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy & Security',
      'Zero-video retention guarantee: On-device ML processes all camera frames locally. No raw video is ever uploaded or stored on servers.'
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Kinetra',
      'Kinetra Mobile — Elite Athletic Intelligence\nVersion: 1.0.0 (Phase 33)\nEngine: On-Device MediaPipe Pose Landmark Ingestion\nArchitecture: React Native & Supabase'
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support Center',
      'For assistance, feedback, or coaching inquiries, reach out to concierge@kinetra.ai.'
    );
  };

  const handleLegal = () => {
    Alert.alert(
      'Legal & Compliance',
      'Terms of Service, End User License Agreement, and Privacy Policy are governed under Kinetra Athletic Systems.'
    );
  };

  const executeSignOut = async () => {
    setSignOutError(null);
    setSigningOut(true);
    try {
      await signOut();
      setShowSignOutModal(false);
    } catch (err: any) {
      setSignOutError(err?.message || 'Unable to securely sign out. Please check your network connection.');
    } finally {
      setSigningOut(false);
    }
  };

  const accountItems: SettingsRowItem[] = [
    {
      id: 'profile-info',
      icon: 'person',
      title: 'Profile Information',
      onPress: handleProfileInfo,
      testID: 'settings-profile-info',
    },
    {
      id: 'change-password',
      icon: 'lock',
      title: 'Change Password',
      onPress: handleChangePassword,
      testID: 'settings-change-password',
    },
  ];

  const preferencesItems: SettingsRowItem[] = [
    {
      id: 'units',
      icon: 'scale',
      title: 'Units & Measurements',
      onPress: handleUnits,
      testID: 'settings-units',
    },
    {
      id: 'notifications',
      icon: 'bell',
      title: 'Notifications',
      onPress: handleNotifications,
      testID: 'settings-notifications',
    },
    {
      id: 'privacy',
      icon: 'shield',
      title: 'Privacy & Security',
      onPress: handlePrivacy,
      testID: 'settings-privacy',
    },
  ];

  const appInfoItems: SettingsRowItem[] = [
    {
      id: 'about',
      icon: 'info',
      title: 'About Kinetra',
      onPress: handleAbout,
      testID: 'settings-about',
    },
    {
      id: 'support',
      icon: 'help',
      title: 'Support Center',
      onPress: handleSupport,
      testID: 'settings-support',
    },
    {
      id: 'legal',
      icon: 'bookmark',
      title: 'Legal Terms',
      onPress: handleLegal,
      testID: 'settings-legal',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          testID="settings-back-button"
          accessibilityLabel="Back to Profile"
          accessibilityRole="button"
        >
          <Icon name="back" size={18} color={colors.gold} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>KINETRA</Text>

        <View style={styles.headerRightBadge}>
          <Icon name="gear" size={16} color={colors.gold} />
        </View>
      </View>

      {/* 2. SCROLLABLE SETTINGS CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.mainTitle}>Settings</Text>
          <Text style={styles.subtitle}>Manage your premium Kinetra experience.</Text>
        </View>

        {/* Sections */}
        <SettingsSection title="ACCOUNT" items={accountItems} />
        <SettingsSection title="PREFERENCES" items={preferencesItems} />
        <SettingsSection title="APP INFORMATION" items={appInfoItems} />

        {/* 3. SIGN OUT ACTION BUTTON */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => setShowSignOutModal(true)}
          testID="settings-sign-out-button"
          accessibilityRole="button"
        >
          <Icon name="sign-out" size={16} color={colors.crimson} style={{ marginRight: 8 }} />
          <Text style={styles.signOutButtonText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 4. SIGN OUT MODAL */}
      <SignOutModal
        visible={showSignOutModal}
        loading={signingOut}
        error={signOutError}
        onConfirm={executeSignOut}
        onCancel={() => setShowSignOutModal(false)}
        onRetry={executeSignOut}
      />
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  titleBlock: {
    marginBottom: spacing.xl,
  },
  mainTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 30,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    lineHeight: 20,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowTitle: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '500',
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 46,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.3)',
    paddingVertical: 14,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  signOutButtonText: {
    ...typography.labelCaps,
    color: colors.crimson,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
