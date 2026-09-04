import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  AccessibilityInfo,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenProps } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';
import { images } from '../assets';
import { spacing, typography, colors, borderRadius } from '../theme';
import { Icon } from '../components/Icon';

export const LoginScreen: React.FC<ScreenProps<'Login'>> = ({ navigation }) => {
  const { signIn, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Synchronous submission lock to guarantee ONE request per button press
  const isSubmittingRef = useRef<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // References for inputs
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Animation values for entrance sequence
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(18)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;
  const fieldsOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(14)).current;
  const socialOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  // Button tactile scale animations
  const loginButtonScale = useRef(new Animated.Value(1)).current;
  const appleButtonScale = useRef(new Animated.Value(1)).current;
  const googleButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;
    let animComposite: Animated.CompositeAnimation | null = null;

    const runEntrance = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(
        () => false
      );

      if (!isMounted) return;

      if (reduceMotion) {
        bgOpacity.setValue(1);
        brandOpacity.setValue(1);
        brandTranslateY.setValue(0);
        cardOpacity.setValue(1);
        cardTranslateY.setValue(0);
        fieldsOpacity.setValue(1);
        ctaOpacity.setValue(1);
        ctaTranslateY.setValue(0);
        socialOpacity.setValue(1);
        footerOpacity.setValue(1);
        return;
      }

      // Cinematic staggered entrance sequence
      animComposite = Animated.sequence([
        // 1. Background reveal
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // 2. Top Kinetra Fitness Branding
        Animated.parallel([
          Animated.timing(brandOpacity, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(brandTranslateY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // 3. Login Card & "Welcome Back" Container
        Animated.parallel([
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(cardTranslateY, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // 4. Form Fields (Email & Password)
        Animated.timing(fieldsOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // 5. Login CTA Button
        Animated.parallel([
          Animated.timing(ctaOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ctaTranslateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // 6. Social Buttons & Divider
        Animated.timing(socialOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // 7. Bottom Account Footer
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

      animComposite.start();
    };

    runEntrance();

    return () => {
      isMounted = false;
      if (animComposite) {
        animComposite.stop();
      }
    };
  }, [
    bgOpacity,
    brandOpacity,
    brandTranslateY,
    cardOpacity,
    cardTranslateY,
    fieldsOpacity,
    ctaOpacity,
    ctaTranslateY,
    socialOpacity,
    footerOpacity,
  ]);

  const handleLogin = async () => {
    if (isSubmittingRef.current || loading || submitting) {
      return;
    }
    isSubmittingRef.current = true;
    setSubmitting(true);
    clearError();

    try {
      const emailValidation = validateEmail(email);
      const passValidation = validatePassword(password);

      setEmailError(emailValidation.error);
      setPasswordError(passValidation.error);

      if (!emailValidation.isValid || !passValidation.isValid) {
        return;
      }

      const success = await signIn(email, password);
      // Navigation transition to 'Main' is handled reactively by RootNavigator when session changes
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
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

  // Button spring tactile handlers
  const createSpringFeedback = (animatedValue: Animated.Value) => ({
    onPressIn: () => {
      Animated.spring(animatedValue, {
        toValue: 0.965,
        useNativeDriver: true,
        speed: 40,
        bounciness: 0,
      }).start();
    },
    onPressOut: () => {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }).start();
    },
  });

  const loginSpring = createSpringFeedback(loginButtonScale);
  const appleSpring = createSpringFeedback(appleButtonScale);
  const googleSpring = createSpringFeedback(googleButtonScale);

  const isBusy = loading || submitting;

  return (
    <View style={styles.root}>
      {/* 1. CINEMATIC BACKGROUND IMAGE */}
      <Animated.View style={[styles.backgroundWrapper, { opacity: bgOpacity }]}>
        <ImageBackground
          source={images.gymBarbell}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.darkOverlay} />
        </ImageBackground>
      </Animated.View>

      {/* 2. SAFE AREA & SCROLLABLE CONTAINER */}
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* TOP BRANDING (KINETRA FITNESS) */}
            <Animated.View
              style={[
                styles.topBranding,
                {
                  opacity: brandOpacity,
                  transform: [{ translateY: brandTranslateY }],
                },
              ]}
            >
              <Text style={styles.brandTitle}>KINETRA</Text>
              <Text style={styles.brandSubtitle}>FITNESS</Text>
            </Animated.View>

            {/* LOGIN FORM CARD */}
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: cardOpacity,
                  transform: [{ translateY: cardTranslateY }],
                },
              ]}
            >
              {/* Subtle gold left accent indicator */}
              <View style={styles.goldIndicator} />

              {/* "Welcome Back" Heading */}
              <Text style={styles.headingTitle}>Welcome Back</Text>

              {/* INLINE AUTH ERROR BANNER */}
              {error ? (
                <View style={styles.errorContainer} testID="login-error-banner">
                  <Icon name="warning" size={14} color={colors.crimson} style={styles.errorIcon} />
                  <Text style={styles.errorBannerText}>{error}</Text>
                  <TouchableOpacity
                    onPress={clearError}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss error"
                  >
                    <Text style={styles.errorDismissText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* FORM FIELDS */}
              <Animated.View style={{ opacity: fieldsOpacity }}>
                {/* EMAIL FIELD */}
                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <TouchableWithoutFeedback onPress={() => emailInputRef.current?.focus()}>
                    <View
                      style={[
                        styles.inputContainer,
                        emailFocused && styles.inputContainerFocused,
                        Boolean(emailError) && styles.inputContainerError,
                      ]}
                    >
                      <Text style={styles.inputIconText}>✉️</Text>
                      <TextInput
                        ref={emailInputRef}
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.placeholderText}
                        selectionColor={colors.gold}
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (emailError) setEmailError(undefined);
                          if (error) clearError();
                        }}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        testID="login-email-input"
                      />
                    </View>
                  </TouchableWithoutFeedback>
                  {Boolean(emailError) && (
                    <Text style={styles.validationErrorText}>{emailError}</Text>
                  )}
                </View>

                {/* PASSWORD FIELD */}
                <View style={styles.fieldWrapper}>
                  <View style={styles.passwordHeaderRow}>
                    <Text style={styles.fieldLabel}>PASSWORD</Text>
                    <TouchableOpacity
                      onPress={handleForgotPassword}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Forgot Password?"
                    >
                      <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableWithoutFeedback onPress={() => passwordInputRef.current?.focus()}>
                    <View
                      style={[
                        styles.inputContainer,
                        passwordFocused && styles.inputContainerFocused,
                        Boolean(passwordError) && styles.inputContainerError,
                      ]}
                    >
                      <Text style={styles.inputIconText}>🔒</Text>
                      <TextInput
                        ref={passwordInputRef}
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.placeholderText}
                        selectionColor={colors.gold}
                        secureTextEntry={isPasswordSecure}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (passwordError) setPasswordError(undefined);
                          if (error) clearError();
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        testID="login-password-input"
                      />
                      <TouchableOpacity
                        onPress={() => setIsPasswordSecure((prev) => !prev)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        accessibilityLabel={isPasswordSecure ? 'Show password' : 'Hide password'}
                        accessibilityRole="button"
                      >
                        <Text style={styles.passwordToggleText}>
                          {isPasswordSecure ? '👁' : '🚫'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                  {Boolean(passwordError) && (
                    <Text style={styles.validationErrorText}>{passwordError}</Text>
                  )}
                </View>
              </Animated.View>

              {/* PRIMARY CTA: LOG IN BUTTON */}
              <Animated.View
                style={[
                  styles.ctaWrapper,
                  {
                    opacity: ctaOpacity,
                    transform: [{ translateY: ctaTranslateY }],
                  },
                ]}
              >
                <TouchableWithoutFeedback
                  {...loginSpring}
                  onPress={isBusy ? undefined : handleLogin}
                  testID="login-submit-button"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isBusy, busy: isBusy }}
                  accessibilityLabel="Log In"
                >
                  <Animated.View
                    style={[
                      styles.loginButton,
                      isBusy && styles.loginButtonDisabled,
                      { transform: [{ scale: loginButtonScale }] },
                    ]}
                  >
                    {isBusy ? (
                      <View style={styles.buttonLoadingRow}>
                        <ActivityIndicator size="small" color={colors.inverseText} />
                        <Text style={styles.loginButtonTextLoading}>LOGGING IN...</Text>
                      </View>
                    ) : (
                      <Text style={styles.loginButtonText}>LOG IN</Text>
                    )}
                  </Animated.View>
                </TouchableWithoutFeedback>
              </Animated.View>

              {/* DIVIDER */}
              <Animated.View style={[styles.dividerRow, { opacity: socialOpacity }]}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </Animated.View>

              {/* SOCIAL AUTH BUTTONS */}
              <Animated.View style={[styles.socialRow, { opacity: socialOpacity }]}>
                {/* Apple Button */}
                <TouchableWithoutFeedback
                  {...appleSpring}
                  onPress={() => handleSocialAuth('apple')}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Apple"
                >
                  <Animated.View
                    style={[
                      styles.socialButton,
                      { transform: [{ scale: appleButtonScale }] },
                    ]}
                  >
                    <Text style={styles.appleIcon}></Text>
                    <Text style={styles.socialLabel}>Apple</Text>
                  </Animated.View>
                </TouchableWithoutFeedback>

                {/* Google Button */}
                <TouchableWithoutFeedback
                  {...googleSpring}
                  onPress={() => handleSocialAuth('google')}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                >
                  <Animated.View
                    style={[
                      styles.socialButton,
                      { transform: [{ scale: googleButtonScale }] },
                    ]}
                  >
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.socialLabel}>Google</Text>
                  </Animated.View>
                </TouchableWithoutFeedback>
              </Animated.View>

              {/* BOTTOM ACCOUNT CTA */}
              <Animated.View style={[styles.footerRow, { opacity: footerOpacity }]}>
                <Text style={styles.footerPromptText}>Don't have an account?</Text>
                <TouchableOpacity
                  onPress={handleSignUpNav}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Request Access"
                >
                  <Text style={styles.footerActionText}>Request Access</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundWrapper: {
    ...StyleSheet.absoluteFill,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 6, 7, 0.88)',
  },
  safeContainer: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.lg,
  },
  topBranding: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandTitle: {
    ...typography.brandWordmark,
    fontSize: 26,
    letterSpacing: 6,
    color: colors.primaryText,
    textAlign: 'center',
  },
  brandSubtitle: {
    ...typography.tagline,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 3.5,
    marginTop: 2,
    fontWeight: '700',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.cardPadding,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  goldIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.goldBright,
  },
  headingTitle: {
    ...typography.headlineLg,
    fontSize: 26,
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.35)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorIcon: {
    marginRight: spacing.sm,
  },
  errorBannerText: {
    ...typography.bodySm,
    color: colors.error,
    flex: 1,
    fontWeight: '500',
  },
  errorDismissText: {
    color: colors.error,
    fontSize: 14,
    paddingLeft: spacing.sm,
    fontWeight: '700',
  },
  fieldWrapper: {
    marginBottom: spacing.md,
    width: '100%',
  },
  fieldLabel: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 10,
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  passwordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  forgotPasswordLink: {
    ...typography.caption,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  inputContainer: {
    height: spacing.inputHeight,
    backgroundColor: '#0F1113',
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  inputContainerFocused: {
    borderColor: colors.gold,
    backgroundColor: '#121417',
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputContainerError: {
    borderColor: colors.crimson,
  },
  inputIconText: {
    fontSize: 14,
    marginRight: spacing.sm,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: typography.bodyMd.fontFamily,
    color: colors.primaryText,
    fontWeight: '500',
    paddingVertical: 0,
  },
  passwordToggleText: {
    fontSize: 15,
    opacity: 0.7,
    paddingLeft: spacing.xs,
  },
  validationErrorText: {
    ...typography.caption,
    color: colors.crimson,
    marginTop: spacing.xs,
    fontSize: 11,
  },
  ctaWrapper: {
    width: '100%',
    marginTop: spacing.sm,
  },
  loginButton: {
    height: spacing.buttonHeight,
    backgroundColor: colors.goldBright,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonTextLoading: {
    ...typography.button,
    color: colors.inverseText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginLeft: spacing.sm,
  },
  loginButtonText: {
    ...typography.button,
    color: colors.inverseText,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    marginHorizontal: spacing.md,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  socialButton: {
    flex: 1,
    height: 46,
    backgroundColor: 'rgba(15, 17, 19, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: borderRadius.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  appleIcon: {
    fontSize: 16,
    color: colors.primaryText,
    marginRight: 8,
    fontWeight: '700',
  },
  googleIcon: {
    fontSize: 15,
    color: colors.primaryText,
    marginRight: 8,
    fontWeight: '700',
  },
  socialLabel: {
    ...typography.button,
    color: colors.primaryText,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'none',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerPromptText: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12,
    textAlign: 'center',
  },
  footerActionText: {
    ...typography.bodySm,
    color: colors.gold,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});

