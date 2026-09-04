import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
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
import { validateEmail, validatePassword, validateFullName } from '../utils/validation';
import { images } from '../assets';
import { spacing, typography, colors, borderRadius } from '../theme';
import { Icon } from '../components/Icon';

export const SignUpScreen: React.FC<ScreenProps<'SignUp'>> = ({ navigation }) => {
  const { signUp, loading, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);

  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Synchronous submission lock to guarantee ONE request per button press
  const isSubmittingRef = useRef<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Input element refs for smooth tap-to-focus
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Animation values for cinematic entrance sequence
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(18)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;
  const headingOpacity = useRef(new Animated.Value(0)).current;
  const headingTranslateY = useRef(new Animated.Value(14)).current;
  const fieldsOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(14)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  // Primary CTA tactile spring scale
  const submitButtonScale = useRef(new Animated.Value(1)).current;

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
        headingOpacity.setValue(1);
        headingTranslateY.setValue(0);
        fieldsOpacity.setValue(1);
        ctaOpacity.setValue(1);
        ctaTranslateY.setValue(0);
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
        // 2. Top KINETRA FITNESS Branding
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
        // 3. Form Card Container Reveal
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
        // 4. Heading & Supporting Copy
        Animated.parallel([
          Animated.timing(headingOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(headingTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // 5. Form Fields (Name, Email, Password)
        Animated.timing(fieldsOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // 6. Primary CTA Button
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
        // 7. Secondary Navigation & Legal Footer
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
    headingOpacity,
    headingTranslateY,
    fieldsOpacity,
    ctaOpacity,
    ctaTranslateY,
    footerOpacity,
  ]);

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

      await signUp(email, password, fullName);
      // AuthContext updates `session`, automatically mounting the authenticated branch ('Main')
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleSignInNav = () => {
    clearError();
    navigation.navigate('Login');
  };

  // Button spring tactile handlers
  const handlePressIn = () => {
    Animated.spring(submitButtonScale, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(submitButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const isBusy = loading || submitting;

  return (
    <View style={styles.root}>
      {/* 1. CINEMATIC BACKGROUND IMAGE */}
      <Animated.View style={[styles.backgroundWrapper, { opacity: bgOpacity }]}>
        <ImageBackground
          source={images.heroAthlete}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.darkOverlay} />
        </ImageBackground>
      </Animated.View>

      {/* 2. SAFE AREA & SCROLLABLE FORM CONTAINER */}
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

            {/* FORM CARD */}
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

              {/* HEADING & SUPPORTING COPY */}
              <Animated.View
                style={{
                  opacity: headingOpacity,
                  transform: [{ translateY: headingTranslateY }],
                }}
              >
                <Text style={styles.headingTitle}>Request Access</Text>
                <Text style={styles.headingSubtitle}>
                  Enter your athlete credentials to initialize protocol.
                </Text>
              </Animated.View>

              {/* INLINE AUTH ERROR BANNER */}
              {error ? (
                <View style={styles.errorContainer} testID="signup-error-banner">
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
                {/* 1. FULL NAME FIELD */}
                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  <TouchableWithoutFeedback onPress={() => nameInputRef.current?.focus()}>
                    <View
                      style={[
                        styles.inputContainer,
                        nameFocused && styles.inputContainerFocused,
                        Boolean(nameError) && styles.inputContainerError,
                      ]}
                    >
                      <Text style={styles.inputIconText}>👤</Text>
                      <TextInput
                        ref={nameInputRef}
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor={colors.placeholderText}
                        selectionColor={colors.gold}
                        value={fullName}
                        onChangeText={(text) => {
                          setFullName(text);
                          if (nameError) setNameError(undefined);
                          if (error) clearError();
                        }}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                        autoCapitalize="words"
                        autoCorrect={false}
                        testID="signup-name-input"
                      />
                    </View>
                  </TouchableWithoutFeedback>
                  {Boolean(nameError) && (
                    <Text style={styles.validationErrorText}>{nameError}</Text>
                  )}
                </View>

                {/* 2. EMAIL ADDRESS FIELD */}
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
                        placeholder="john@example.com"
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
                        testID="signup-email-input"
                      />
                    </View>
                  </TouchableWithoutFeedback>
                  {Boolean(emailError) && (
                    <Text style={styles.validationErrorText}>{emailError}</Text>
                  )}
                </View>

                {/* 3. PASSWORD FIELD */}
                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>PASSWORD</Text>
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
                        placeholder="••••••••"
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
                        testID="signup-password-input"
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

              {/* PRIMARY CTA: CREATE ACCOUNT BUTTON */}
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
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={isBusy ? undefined : handleSignUp}
                  testID="signup-submit-button"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isBusy, busy: isBusy }}
                  accessibilityLabel="Create Account"
                >
                  <Animated.View
                    style={[
                      styles.submitButton,
                      isBusy && styles.submitButtonDisabled,
                      { transform: [{ scale: submitButtonScale }] },
                    ]}
                  >
                    {isBusy ? (
                      <View style={styles.buttonLoadingRow}>
                        <ActivityIndicator size="small" color={colors.inverseText} />
                        <Text style={styles.submitButtonTextLoading}>INITIALIZING ACCOUNT...</Text>
                      </View>
                    ) : (
                      <Text style={styles.submitButtonText}>CREATE ACCOUNT  →</Text>
                    )}
                  </Animated.View>
                </TouchableWithoutFeedback>
              </Animated.View>

              {/* SECONDARY NAVIGATION & LEGAL NOTICE */}
              <Animated.View style={[styles.footerContainer, { opacity: footerOpacity }]}>
                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>Already an athlete?</Text>
                  <TouchableOpacity
                    onPress={handleSignInNav}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Sign In"
                  >
                    <Text style={styles.footerLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.legalNotice}>
                  By creating an account, you agree to our Terms and Privacy Policy.
                </Text>
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
    fontWeight: '700',
    fontFamily: 'serif',
  },
  headingSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
    lineHeight: 18,
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
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonTextLoading: {
    ...typography.button,
    color: colors.inverseText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginLeft: spacing.sm,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.inverseText,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footerContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  footerText: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12,
    marginRight: 6,
  },
  footerLink: {
    ...typography.bodySm,
    color: colors.gold,
    fontWeight: '700',
    fontSize: 13,
  },
  legalNotice: {
    ...typography.caption,
    color: colors.tertiaryText,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 16,
    fontSize: 10,
    maxWidth: 280,
  },
});

