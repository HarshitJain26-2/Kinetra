import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ScreenProps } from '../navigation/types';
import { ScreenBackground } from '../components/ScreenBackground';
import { BrandLogo } from '../components/BrandLogo';
import { AuthCard } from '../components/AuthCard';
import { KinetraInput } from '../components/KinetraInput';
import { KinetraButton } from '../components/KinetraButton';
import { InlineError } from '../components/InlineError';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/validation';
import { images } from '../assets';
import { spacing, typography, colors, borderRadius } from '../theme';

export const ForgotPasswordScreen: React.FC<ScreenProps<'ForgotPassword'>> = ({ navigation }) => {
  const { resetPassword, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleReset = async () => {
    clearError();
    setSuccessMessage(null);

    const emailValidation = validateEmail(email);
    setEmailError(emailValidation.error);

    if (!emailValidation.isValid) {
      return;
    }

    const success = await resetPassword(email);
    if (success) {
      setSuccessMessage('Password reset instructions have been sent to your email.');
    }
  };

  const handleBackToSignIn = () => {
    clearError();
    navigation.navigate('Login');
  };

  const MailIcon = <Text style={styles.inputIcon}>✉️</Text>;

  return (
    <ScreenBackground
      backgroundImage={images.gymBarbell}
      overlayOpacity={0.88}
      scrollable={true}
      contentContainerStyle={styles.container}
    >
      <View style={styles.topBranding}>
        <BrandLogo size="medium" />
      </View>

      <AuthCard
        title="Reset Password"
        subtitle="Enter the email associated with your elite account. We will send you instructions to regain access."
        style={styles.card}
      >
        <InlineError message={error} />

        {successMessage ? (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <KinetraInput
          label="EMAIL ADDRESS"
          placeholder="your@email.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError(undefined);
            if (successMessage) setSuccessMessage(null);
          }}
          error={emailError}
          leftIcon={MailIcon}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          testID="forgot-password-email-input"
        />

        <KinetraButton
          title="SEND RESET LINK"
          variant="secondary"
          onPress={handleReset}
          loading={loading}
          style={styles.submitButton}
          testID="forgot-password-submit-button"
        />

        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={handleBackToSignIn}
            accessibilityRole="button"
          >
            <Text style={styles.footerLink}>← Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </AuthCard>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.lg,
    minHeight: '100%',
  },
  topBranding: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  card: {
    width: '100%',
  },
  inputIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: borderRadius.xs,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successIcon: {
    fontSize: 16,
    color: colors.success,
    marginRight: spacing.sm,
    fontWeight: '700',
  },
  successText: {
    ...typography.bodySm,
    color: colors.primaryText,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerLink: {
    ...typography.bodySm,
    color: colors.gold,
    fontWeight: '600',
  },
});
