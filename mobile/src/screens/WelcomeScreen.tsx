import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ScreenProps } from '../navigation/types';
import { ScreenBackground } from '../components/ScreenBackground';
import { BrandLogo } from '../components/BrandLogo';
import { AuthCard } from '../components/AuthCard';
import { KinetraButton } from '../components/KinetraButton';
import { images } from '../assets';
import { spacing, typography, colors } from '../theme';

export const WelcomeScreen: React.FC<ScreenProps<'Welcome'>> = ({ navigation }) => {
  const handleJoinElite = () => {
    navigation.navigate('SignUp');
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <ScreenBackground
      backgroundImage={images.heroAthlete}
      overlayOpacity={0.78}
      contentContainerStyle={styles.container}
    >
      <View style={styles.topSection}>
        <BrandLogo size="medium" />
      </View>

      <View style={styles.bottomSection}>
        <AuthCard showGoldIndicator={true} style={styles.card}>
          <Text style={styles.heroHeadline}>
            Redefine{'\n'}Your Limits.
          </Text>

          <Text style={styles.supportingCopy}>
            Experience the pinnacle of AI-driven performance training.
            Precision data meets athletic luxury.
          </Text>

          <View style={styles.buttonGroup}>
            <KinetraButton
              title="JOIN THE ELITE"
              variant="primary"
              onPress={handleJoinElite}
              testID="welcome-join-elite-button"
            />

            <KinetraButton
              title="SIGN IN"
              variant="secondary"
              onPress={handleSignIn}
              testID="welcome-sign-in-button"
            />
          </View>
        </AuthCard>
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.lg,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: spacing.sm,
  },
  card: {
    width: '100%',
  },
  heroHeadline: {
    ...typography.headlineXl,
    color: colors.primaryText,
    marginBottom: spacing.md,
    lineHeight: 44,
  },
  supportingCopy: {
    ...typography.bodyMd,
    color: colors.secondaryText,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  buttonGroup: {
    gap: spacing.xs,
  },
});
