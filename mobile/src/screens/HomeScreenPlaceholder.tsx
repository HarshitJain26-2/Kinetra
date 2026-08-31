import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ScreenProps } from '../navigation/types';
import { ScreenBackground } from '../components/ScreenBackground';
import { BrandLogo } from '../components/BrandLogo';
import { AuthCard } from '../components/AuthCard';
import { KinetraButton } from '../components/KinetraButton';
import { useAuth } from '../context/AuthContext';
import { spacing, typography, colors } from '../theme';

export const HomeScreenPlaceholder: React.FC<ScreenProps<'HomePlaceholder'>> = ({ navigation }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <ScreenBackground contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <BrandLogo size="medium" />
      </View>

      <AuthCard
        title="Welcome, Elite"
        subtitle="Phase 27 Mobile Foundation & Auth Complete."
        showGoldIndicator={true}
        style={styles.card}
      >
        <View style={styles.userInfo}>
          <Text style={styles.userLabel}>AUTHENTICATED ATHLETE</Text>
          <Text style={styles.userEmail}>{user?.email || 'athlete@kinetra.app'}</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>Next Evolution</Text>
          <Text style={styles.statusDescription}>
            Home Dashboard, Metrics, and Live AI Pose Workouts will be initialized in upcoming phases.
          </Text>
        </View>

        <KinetraButton
          title="SIGN OUT"
          variant="secondary"
          onPress={handleSignOut}
          style={styles.signOutButton}
          testID="home-sign-out-button"
        />
      </AuthCard>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    width: '100%',
  },
  userInfo: {
    backgroundColor: '#111315',
    padding: spacing.md,
    borderRadius: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  userLabel: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 10,
    marginBottom: 4,
  },
  userEmail: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontWeight: '600',
  },
  statusBox: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusTitle: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  statusDescription: {
    ...typography.bodySm,
    color: colors.secondaryText,
    lineHeight: 18,
  },
  signOutButton: {
    marginTop: spacing.sm,
  },
});
