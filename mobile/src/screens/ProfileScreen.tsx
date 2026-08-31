import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { KinetraButton } from '../components/KinetraButton';
import { Icon } from '../components/Icon';

export const ProfileScreen: React.FC = () => {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your Kinetra account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Athlete';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>KINETRA</Text>
      </View>
      <View style={styles.content}>
        {/* Avatar Badge */}
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>

        {/* User Identity */}
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{user?.email || 'authenticated.athlete@kinetra.ai'}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>ELITE ATHLETE TIER</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>PROFILE & PREFERENCES</Text>
          <Text style={styles.infoSubtitle}>
            Biometric calibration, hardware sync (Apple Watch, Polar), and coaching preferences will be available in Phase 33.
          </Text>
        </View>

        {/* Sign Out Action */}
        <View style={styles.actionContainer}>
          <KinetraButton
            title="SIGN OUT"
            variant="darkOutline"
            onPress={handleSignOut}
            loading={loading}
            testID="profile-sign-out-button"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  brandTitle: {
    ...typography.brandWordmarkSmall,
    color: colors.primaryText,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceBright,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarLetter: {
    ...typography.headlineMd,
    color: colors.gold,
    fontFamily: 'serif',
    fontWeight: '700',
  },
  userName: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    ...typography.bodySm,
    color: colors.secondaryText,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.goldMuted,
    borderWidth: 1,
    borderColor: colors.borderGold,
    marginBottom: spacing.xl,
  },
  badgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  infoTitle: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  infoSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    lineHeight: 18,
  },
  actionContainer: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: spacing.xl,
  },
});
