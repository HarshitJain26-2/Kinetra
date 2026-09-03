import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ScreenProps } from '../navigation/types';
import { ScreenBackground } from '../components/ScreenBackground';
import { BrandLogo } from '../components/BrandLogo';
import { AuthCard } from '../components/AuthCard';
import { KinetraInput } from '../components/KinetraInput';
import { PasswordInput } from '../components/PasswordInput';
import { KinetraButton } from '../components/KinetraButton';
import { InlineError } from '../components/InlineError';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, validateFullName } from '../utils/validation';
import { images } from '../assets';
import { spacing, typography, colors } from '../theme';

export const SignUpScreen: React.FC<ScreenProps<'SignUp'>> = ({ navigation }) => {
  const { signUp, loading, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  // Synchronous submission lock to guarantee ONE request per button press
  const isSubmittingRef = useRef<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSignUp = async () => {
    // Immediate lock check: prevent duplicate or rapid repeat taps
    if (isSubmittingRef.current || loading || submitting) {
      return;
    }
    isSubmittingRef.current = true;
    setSubmitting(true);
    clearError();

    try {
      const nameValidation = validateFullName(fullName);
      const emailValidation = validateEmail(email);
      const passValidation = validatePassword(password);

      setNameError(nameValidation.error);
      setEmailError(emailValidation.error);
      setPasswordError(passValidation.error);

      if (!nameValidation.isValid || !emailValidation.isValid || !passValidation.isValid) {
        return;
      }

      const success = await signUp(email, password, fullName);
      if (success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleSignInNav = () => {
    clearError();
    navigation.navigate('Login');
  };

  const UserIcon = <Text style={styles.inputIcon}>👤</Text>;
  const MailIcon = <Text style={styles.inputIcon}>✉️</Text>;

  return (
    <ScreenBackground
      backgroundImage={images.heroAthlete}
      overlayOpacity={0.88}
      scrollable={true}
      contentContainerStyle={styles.container}
    >
      <View style={styles.topBranding}>
        <BrandLogo size="medium" />
      </View>

      <AuthCard
        title="Join the Elite"
        subtitle="Step 1 of 3: Account Creation"
        style={styles.card}
      >
        <InlineError message={error} />

        <KinetraInput
          label="FULL NAME"
          placeholder="John Doe"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (nameError) setNameError(undefined);
          }}
          error={nameError}
          leftIcon={UserIcon}
          autoCapitalize="words"
          testID="signup-name-input"
        />

        <KinetraInput
          label="EMAIL ADDRESS"
          placeholder="john@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError(undefined);
          }}
          error={emailError}
          leftIcon={MailIcon}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          testID="signup-email-input"
        />

        <PasswordInput
          label="PASSWORD"
          placeholder="••••••••"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError(undefined);
          }}
          error={passwordError}
          testID="signup-password-input"
        />

        <KinetraButton
          title="CREATE ACCOUNT  →"
          variant="primary"
          onPress={handleSignUp}
          loading={loading || submitting}
          disabled={loading || submitting}
          style={styles.submitButton}
          testID="signup-submit-button"
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already an athlete? </Text>
          <TouchableOpacity
            onPress={handleSignInNav}
            accessibilityRole="button"
          >
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legalNotice}>
          By creating an account, you agree to our Terms and Privacy Policy.
        </Text>
      </AuthCard>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.lg,
    flexGrow: 1,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  footerText: {
    ...typography.bodySm,
    color: colors.secondaryText,
  },
  footerLink: {
    ...typography.bodySm,
    color: colors.gold,
    fontWeight: '700',
  },
  legalNotice: {
    ...typography.caption,
    color: colors.tertiaryText,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 16,
  },
});
