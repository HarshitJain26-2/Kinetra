import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenProps } from '../navigation/types';
import { images } from '../assets';
import { colors, spacing, typography, borderRadius } from '../theme';

export const SplashScreen: React.FC<ScreenProps<'Splash'>> = ({ navigation }) => {
  // Animation drivers
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(24)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(14)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(20)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  // Button interactive press scale
  const buttonScale = useRef(new Animated.Value(1)).current;
  const [isNavigating, setIsNavigating] = useState(false);

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
        taglineOpacity.setValue(1);
        taglineTranslateY.setValue(0);
        ctaOpacity.setValue(1);
        ctaTranslateY.setValue(0);
        footerOpacity.setValue(1);
        return;
      }

      // Cinematic staggered entrance sequence
      animComposite = Animated.sequence([
        // 1. Smooth background reveal
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // 2. Brand Emblem & Wordmark upward reveal
        Animated.parallel([
          Animated.timing(brandOpacity, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(brandTranslateY, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // 3. Supporting Tagline fade in
        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(taglineTranslateY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // 4. CTA and Footer entrance
        Animated.parallel([
          Animated.timing(ctaOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ctaTranslateY, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(footerOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
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
    taglineOpacity,
    taglineTranslateY,
    ctaOpacity,
    ctaTranslateY,
    footerOpacity,
  ]);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handleGetStarted = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigation.navigate('Welcome');
  };

  return (
    <View style={styles.root}>
      {/* 1. CINEMATIC BACKGROUND IMAGE */}
      <Animated.View style={[styles.backgroundWrapper, { opacity: bgOpacity }]}>
        <ImageBackground
          source={images.splashBg}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* Multi-tier gradient dark overlay */}
          <View style={styles.darkOverlay} />
        </ImageBackground>
      </Animated.View>

      {/* 2. SAFE AREA CONTENT CONTAINER */}
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom', 'left', 'right']}>
        {/* CENTER HERO SECTION */}
        <View style={styles.centerSection}>
          {/* Brand Emblem & Wordmark (Animated) */}
          <Animated.View
            style={[
              styles.brandBlock,
              {
                opacity: brandOpacity,
                transform: [{ translateY: brandTranslateY }],
              },
            ]}
          >
            {/* Geometric Luxury Emblem Card */}
            <View style={styles.emblemCard}>
              <View style={styles.emblemInner}>
                <Text style={styles.emblemLetter}>K</Text>
                <Text style={styles.emblemBrandName}>KINETRA</Text>
                <Text style={styles.emblemSubLabel}>FITNESS</Text>
              </View>
            </View>

            {/* Main Wordmark */}
            <Text style={styles.mainWordmark}>KINETRA</Text>
          </Animated.View>

          {/* Supporting Tagline (Animated Stagger) */}
          <Animated.View
            style={[
              styles.taglineBlock,
              {
                opacity: taglineOpacity,
                transform: [{ translateY: taglineTranslateY }],
              },
            ]}
          >
            <View style={styles.taglineDecoratorRow}>
              <View style={styles.taglineLine} />
              <View style={styles.taglineDiamond} />
              <View style={styles.taglineLine} />
            </View>
            <Text style={styles.taglineText}>
              ELITE INTELLIGENCE. REFINED PERFORMANCE.
            </Text>
          </Animated.View>
        </View>

        {/* BOTTOM SECTION */}
        <View style={styles.bottomSection}>
          {/* CTA Button (Animated + Scale Feedback) */}
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
              onPress={handleGetStarted}
              testID="splash-get-started-button"
              accessibilityRole="button"
              accessibilityLabel="Get Started"
            >
              <Animated.View
                style={[
                  styles.ctaButton,
                  { transform: [{ scale: buttonScale }] },
                ]}
              >
                <Text style={styles.ctaButtonText}>GET STARTED</Text>
                <Text style={styles.ctaButtonArrow}>→</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>

          {/* Subtitle Accreditation / Status Line */}
          <Animated.View style={[styles.footerBlock, { opacity: footerOpacity }]}>
            <View style={styles.statusIndicatorDot} />
            <Text style={styles.footerText}>ON-DEVICE AI PERFORMANCE PROTOCOL</Text>
          </Animated.View>
        </View>
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
    backgroundColor: 'rgba(5, 6, 7, 0.82)',
  },
  safeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.lg,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  brandBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemCard: {
    width: 136,
    height: 136,
    backgroundColor: 'rgba(15, 17, 19, 0.94)',
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    padding: 6,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  emblemInner: {
    flex: 1,
    backgroundColor: colors.surfaceBright,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemLetter: {
    fontFamily: typography.brandWordmark.fontFamily,
    fontSize: 50,
    fontWeight: '800',
    color: colors.goldBright,
    letterSpacing: 2,
    lineHeight: 56,
  },
  emblemBrandName: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 10,
    letterSpacing: 3.2,
    marginTop: 2,
    fontWeight: '700',
  },
  emblemSubLabel: {
    ...typography.caption,
    color: colors.gold,
    fontSize: 8,
    letterSpacing: 2.2,
    marginTop: 1,
    fontWeight: '600',
  },
  mainWordmark: {
    ...typography.brandWordmark,
    fontSize: 34,
    letterSpacing: 8,
    color: colors.primaryText,
    textAlign: 'center',
  },
  taglineBlock: {
    alignItems: 'center',
    marginTop: spacing.md,
    maxWidth: 320,
  },
  taglineDecoratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    width: 160,
  },
  taglineLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(217, 184, 63, 0.3)',
  },
  taglineDiamond: {
    width: 5,
    height: 5,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 8,
  },
  taglineText: {
    ...typography.tagline,
    color: colors.secondaryText,
    fontSize: 10,
    letterSpacing: 2.2,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: spacing.sm,
  },
  ctaWrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  ctaButton: {
    height: spacing.buttonHeight,
    backgroundColor: 'rgba(15, 17, 19, 0.92)',
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ctaButtonText: {
    ...typography.labelCaps,
    color: colors.goldBright,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 2,
    marginRight: 8,
  },
  ctaButtonArrow: {
    color: colors.goldBright,
    fontSize: 14,
    fontWeight: '700',
  },
  footerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  statusIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gold,
    marginRight: 7,
  },
  footerText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
