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
import { validateEmail } from '../utils/validation';
import { images } from '../assets';
import { spacing, typography, colors, borderRadius } from '../theme';
import { Icon } from '../components/Icon';

export const ForgotPasswordScreen: React.FC<ScreenProps<'ForgotPassword'>> = ({ navigation }) => {
  const { resetPassword, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [emailFocused, setEmailFocused] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // References
  const emailInputRef = useRef<TextInput>(null);

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
        // 5. Email Input Field
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
        // 7. Secondary Return Action
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

  return (
    <View style={styles.root}>
      {/* 1. CINEMATIC BACKGROUND IMAGE */}
      <Animated.View style={[styles.backgroundWrapper, { opacity: bgOpacity }]}>
        <ImageBackground
          source={images.forgotPassRef}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.darkOverlay} />
        </ImageBackground>
      </Animated.View>

      {/* 2. SAFE AREA & SCROLLABLE RECOVERY CONTAINER */}
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
                <Text style={styles.headingTitle}>Reset Password</Text>
                <Text style={styles.headingSubtitle}>
                  Enter the email associated with your athlete account to receive password reset instructions.
                </Text>
              </Animated.View>

              {/* INLINE AUTH ERROR BANNER */}
              {error ? (
                <View style={styles.errorContainer} testID="forgot-password-error-banner">
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

              {/* POLISHED SUCCESS STATE */}
              {successMessage ? (
                <View style={styles.successContainer} testID="forgot-password-success-banner">
                  <View style={styles.successIconBadge}>
                    <Text style={styles.successIconText}>✓</Text>
                  </View>
                  <View style={styles.successTextWrapper}>
                    <Text style={styles.successHeading}>Instructions Dispatched</Text>
                    <Text style={styles.successBody}>{successMessage}</Text>
                  </View>
                </View>
              ) : null}

              {/* EMAIL INPUT FIELD */}
              <Animated.View style={{ opacity: fieldsOpacity }}>
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
                        placeholder="your@email.com"
                        placeholderTextColor={colors.placeholderText}
                        selectionColor={colors.gold}
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (emailError) setEmailError(undefined);
                          if (successMessage) setSuccessMessage(null);
                          if (error) clearError();
                        }}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        testID="forgot-password-email-input"
                      />
                    </View>
                  </TouchableWithoutFeedback>
                  {Boolean(emailError) && (
                    <Text style={styles.validationErrorText}>{emailError}</Text>
                  )}
                </View>
              </Animated.View>

              {/* PRIMARY CTA: SEND RESET LINK */}
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
                  onPress={loading ? undefined : handleReset}
                  testID="forgot-password-submit-button"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: loading, busy: loading }}
                  accessibilityLabel="Send Reset Link"
                >
                  <Animated.View
                    style={[
                      styles.submitButton,
                      loading && styles.submitButtonDisabled,
                      { transform: [{ scale: submitButtonScale }] },
                    ]}
                  >
                    {loading ? (
                      <View style={styles.buttonLoadingRow}>
                        <ActivityIndicator size="small" color={colors.inverseText} />
                        <Text style={styles.submitButtonTextLoading}>TRANSMITTING RESET LINK...</Text>
                      </View>
                    ) : (
                      <Text style={styles.submitButtonText}>SEND RESET LINK  →</Text>
                    )}
                  </Animated.View>
                </TouchableWithoutFeedback>
              </Animated.View>

              {/* SECONDARY ACTION: RETURN TO SIGN IN */}
              <Animated.View style={[styles.footerRow, { opacity: footerOpacity }]}>
                <TouchableOpacity
                  onPress={handleBackToSignIn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Sign In"
                >
                  <Text style={styles.footerLink}>← Back to Sign In</Text>
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(42, 157, 143, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(42, 157, 143, 0.4)',
    borderRadius: borderRadius.xs,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(42, 157, 143, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 1,
  },
  successIconText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '800',
  },
  successTextWrapper: {
    flex: 1,
  },
  successHeading: {
    ...typography.labelCaps,
    color: colors.success,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 2,
  },
  successBody: {
    ...typography.bodySm,
    color: colors.primaryText,
    lineHeight: 18,
    fontSize: 12,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerLink: {
    ...typography.bodySm,
    color: colors.gold,
    fontWeight: '700',
    fontSize: 13,
  },
});

