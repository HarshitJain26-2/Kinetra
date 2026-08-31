import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { ScreenProps } from '../navigation/types';
import { ScreenBackground } from '../components/ScreenBackground';
import { BrandLogo } from '../components/BrandLogo';
import { AuthCard } from '../components/AuthCard';
import { KinetraInput } from '../components/KinetraInput';
import { PasswordInput } from '../components/PasswordInput';
import { KinetraButton } from '../components/KinetraButton';
import { Divider } from '../components/Divider';
import { SocialAuthButton } from '../components/SocialAuthButton';
import { InlineError } from '../components/InlineError';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';
import { images } from '../assets';
import { spacing, typography, colors } from '../theme';

export const LoginScreen: React.FC<ScreenProps<'Login'>> = ({ navigation }) => {
  const { signIn, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const handleLogin = async () => {
    clearError();
    const emailValidation = validateEmail(email);
    const passValidation = validatePassword(password);

    setEmailError(emailValidation.error);
    setPasswordError(passValidation.error);

    if (!emailValidation.isValid || !passValidation.isValid) {
      return;
    }

    const success = await signIn(email, password);
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  const handleForgotPassword = () => {
    clearError();
    navigation.navigate('ForgotPassword');
  };

  const handleSignUpNav = () => {
    clearError();
    navigation.navigate('SignUp');
  };

  const handleSocialAuth = (provider: 'apple' | 'google') => {
    Alert.alert(
      `${provider === 'apple' ? 'Apple' : 'Google'} Sign In`,
      'Social authentication integration will be enabled in production.'
    );
  };

  const MailIcon = <Text style={styles.inputIcon}>✉️</Text>;

  const ForgotPasswordLink = (
    <TouchableOpacity
      onPress={handleForgotPassword}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Forgot Password?"
    >
      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenBackground
      backgroundImage={images.gymBarbell}
      overlayOpacity={0.85}
      scrollable={true}
      contentContainerStyle={styles.container}
    >
      <View style={styles.topBranding}>
        <BrandLogo size="medium" />
      </View>

      <AuthCard title="Welcome Back" style={styles.card}>
        <InlineError message={error} />

        <KinetraInput
          label="EMAIL ADDRESS"
          placeholder="Enter your email"
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
          testID="login-email-input"
        />

        <PasswordInput
          label="PASSWORD"
          placeholder="Enter your password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError(undefined);
          }}
          error={passwordError}
          headerRight={ForgotPasswordLink}
          testID="login-password-input"
        />

        <KinetraButton
          title="LOG IN"
          variant="primary"
          onPress={handleLogin}
          loading={loading}
          style={styles.loginButton}
          testID="login-submit-button"
        />

        <Divider text="OR CONTINUE WITH" />

        <View style={styles.socialRow}>
          <SocialAuthButton
            provider="apple"
            onPress={() => handleSocialAuth('apple')}
          />
          <SocialAuthButton
            provider="google"
            onPress={() => handleSocialAuth('google')}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={handleSignUpNav}
            accessibilityRole="button"
          >
            <Text style={styles.footerLink}>Join Now</Text>
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
  forgotPasswordText: {
    ...typography.caption,
    color: colors.gold,
    fontWeight: '700',
  },
  loginButton: {
    marginTop: spacing.md,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
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
});
