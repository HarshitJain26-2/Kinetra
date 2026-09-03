/**
 * Kinetra Settings & Account Screen (Section 16: Settings Refinement)
 * Exact Stitch luxury dark athletic visual matching Screen 3 (Settings & Preferences).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Animated,
  Easing,
  AccessibilityInfo,
  Platform,
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

const SettingsRow: React.FC<{ item: SettingsRowItem }> = ({ item }) => {
  const rowScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(rowScale, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 40,
      bounciness: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(rowScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={item.onPress}
      testID={item.testID}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <Animated.View
        style={[
          styles.rowItem,
          { transform: [{ scale: rowScale }] },
        ]}
      >
        <View style={styles.rowLeft}>
          <View style={styles.iconWrapper}>
            <Icon name={item.icon} size={15} color={colors.gold} />
          </View>
          <Text style={styles.rowTitle}>{item.title}</Text>
        </View>
        <Icon name="chevron-right" size={14} color={colors.tertiaryText} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, items }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionHeader}>{title}</Text>
    <View style={styles.sectionCard}>
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <SettingsRow item={item} />
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

  // Staggered Entrance Animation Values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(10)).current;
  const sectionsOpacity = useRef(new Animated.Value(0)).current;
  const sectionsTranslateY = useRef(new Animated.Value(12)).current;
  const signOutOpacity = useRef(new Animated.Value(0)).current;
  const signOutTranslateY = useRef(new Animated.Value(14)).current;

  // Spring Button Scales
  const backBtnScale = useRef(new Animated.Value(1)).current;
  const signOutBtnScale = useRef(new Animated.Value(1)).current;

  const createSpring = (val: Animated.Value, down = 0.94, back = 1) => ({
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

  const backSpring = createSpring(backBtnScale, 0.90, 1);
  const signOutSpring = createSpring(signOutBtnScale, 0.96, 1);

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
        titleOpacity.setValue(1);
        titleTranslateY.setValue(0);
        sectionsOpacity.setValue(1);
        sectionsTranslateY.setValue(0);
        signOutOpacity.setValue(1);
        signOutTranslateY.setValue(0);
        return;
      }

      entranceAnim = Animated.stagger(70, [
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
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 3: Settings Sections
        Animated.parallel([
          Animated.timing(sectionsOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(sectionsTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Sign Out CTA
        Animated.parallel([
          Animated.timing(signOutOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(signOutTranslateY, {
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
        `Athlete Name: ${name}\nEmail: ${email}\nSecurity: End-to-End Encrypted`
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
      'Kinetra Mobile — Elite Athletic Intelligence\nVersion: 1.0.0\nEngine: On-Device MediaPipe Pose Landmark Ingestion\nArchitecture: React Native & Supabase'
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
      {/* 1. TOP HEADER (Stitch Reference Column 1) */}
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
          {...backSpring}
          onPress={onBack}
          testID="settings-back-button"
          accessibilityLabel="Back to Profile"
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              styles.backButton,
              { transform: [{ scale: backBtnScale }] },
            ]}
          >
            <Icon name="back" size={17} color={colors.gold} />
          </Animated.View>
        </TouchableWithoutFeedback>

        <Text style={styles.brandTitle}>KINETRA</Text>

        <View style={styles.headerRightBadge}>
          <Icon name="gear" size={16} color={colors.gold} />
        </View>
      </Animated.View>

      {/* 2. SCROLLABLE SETTINGS CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Block (Stitch Reference) */}
        <Animated.View
          style={[
            styles.titleBlock,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.mainTitle}>Settings</Text>
          <Text style={styles.subtitle}>Manage your premium Kinetra experience.</Text>
        </Animated.View>

        {/* Sections (Stitch Reference Column 1) */}
        <Animated.View
          style={{
            opacity: sectionsOpacity,
            transform: [{ translateY: sectionsTranslateY }],
          }}
        >
          <SettingsSection title="ACCOUNT" items={accountItems} />
          <SettingsSection title="PREFERENCES" items={preferencesItems} />
          <SettingsSection title="APP INFORMATION" items={appInfoItems} />
        </Animated.View>

        {/* 3. SIGN OUT ACTION BUTTON */}
        <Animated.View
          style={{
            opacity: signOutOpacity,
            transform: [{ translateY: signOutTranslateY }],
          }}
        >
          <TouchableWithoutFeedback
            {...signOutSpring}
            onPress={() => setShowSignOutModal(true)}
            testID="settings-sign-out-button"
            accessibilityRole="button"
            accessibilityLabel="Sign Out of Kinetra"
          >
            <Animated.View
              style={[
                styles.signOutButton,
                { transform: [{ scale: signOutBtnScale }] },
              ]}
            >
              <Icon name="sign-out" size={15} color={colors.crimson} style={{ marginRight: 8 }} />
              <Text style={styles.signOutButtonText}>SIGN OUT</Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
  },
  brandTitle: {
    ...typography.brandWordmarkSmall,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: '800',
  },
  headerRightBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + 24,
  },
  titleBlock: {
    marginBottom: spacing.xl,
  },
  mainTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9.5,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontSize: 13.5,
    fontWeight: '600',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginLeft: 54,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.35)',
    paddingVertical: 14,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.crimson,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  signOutButtonText: {
    ...typography.labelCaps,
    color: colors.crimson,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
