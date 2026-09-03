/**
 * Kinetra Sign Out Confirmation Modal & Status Flow (Section 17: Sign-Out Flow Refinement)
 * Exact Stitch luxury dark athletic visual matching Screen 4 (Confirm) and Screen 5 (Ending Session).
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Easing,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from './Icon';

interface SignOutModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  onRetry,
  loading = false,
  error = null,
}) => {
  // Modal Entrance Animation Values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.96)).current;
  const modalTranslateY = useRef(new Animated.Value(8)).current;

  // Spring Button Scales
  const confirmBtnScale = useRef(new Animated.Value(1)).current;
  const cancelBtnScale = useRef(new Animated.Value(1)).current;
  const retryBtnScale = useRef(new Animated.Value(1)).current;
  const dismissBtnScale = useRef(new Animated.Value(1)).current;

  const createSpring = (val: Animated.Value, down = 0.95, back = 1) => ({
    onPressIn: () => {
      Animated.spring(val, {
        toValue: down,
        useNativeDriver: true,
        speed: 40,
        bounciness: 3,
      }).start();
    },
    onPressOut: () => {
      Animated.spring(val, {
        toValue: back,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }).start();
    },
  });

  const confirmSpring = createSpring(confirmBtnScale, 0.95, 1);
  const cancelSpring = createSpring(cancelBtnScale, 0.95, 1);
  const retrySpring = createSpring(retryBtnScale, 0.95, 1);
  const dismissSpring = createSpring(dismissBtnScale, 0.95, 1);

  // Entrance & Dismissal Transition
  useEffect(() => {
    let isMounted = true;
    let anim: Animated.CompositeAnimation | null = null;

    if (visible) {
      const runEntrance = async () => {
        const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
        if (!isMounted) return;

        if (reduceMotion) {
          backdropOpacity.setValue(1);
          modalOpacity.setValue(1);
          modalScale.setValue(1);
          modalTranslateY.setValue(0);
          return;
        }

        anim = Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(modalScale, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.back(1.1)),
            useNativeDriver: true,
          }),
          Animated.timing(modalTranslateY, {
            toValue: 0,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]);
        anim.start();
      };

      runEntrance();
    } else {
      backdropOpacity.setValue(0);
      modalOpacity.setValue(0);
      modalScale.setValue(0.96);
      modalTranslateY.setValue(8);
    }

    return () => {
      isMounted = false;
      if (anim) anim.stop();
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={loading ? undefined : onCancel}
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: backdropOpacity },
        ]}
        testID="sign-out-modal-overlay"
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: modalOpacity,
              transform: [
                { scale: modalScale },
                { translateY: modalTranslateY },
              ],
            },
          ]}
        >
          {/* State A: Ending Session Loading State (Stitch Screen 5) */}
          {loading ? (
            <View style={styles.stateWrapper} testID="sign-out-loading-state">
              <View style={styles.spinnerWrapper}>
                <ActivityIndicator size="large" color={colors.gold} />
              </View>
              <Text style={styles.loadingTitle}>ENDING SESSION</Text>
              <Text style={styles.loadingSubtitle}>Securing your performance data</Text>
            </View>
          ) : error ? (
            /* State B: Connection Interrupted Error State */
            <View style={styles.stateWrapper} testID="sign-out-error-state">
              <View style={styles.iconCircleError}>
                <Icon name="warning" size={26} color={colors.crimson} />
              </View>
              <Text style={styles.errorTitle}>CONNECTION INTERRUPTED</Text>
              <Text style={styles.errorSubtitle}>
                {error || 'Unable to securely sign out. Please check your network connection.'}
              </Text>
              <View style={styles.buttonGroup}>
                {onRetry && (
                  <TouchableWithoutFeedback
                    {...retrySpring}
                    onPress={onRetry}
                    testID="sign-out-retry-button"
                    accessibilityRole="button"
                    accessibilityLabel="Retry Sign Out"
                  >
                    <Animated.View
                      style={[
                        styles.retryButton,
                        { transform: [{ scale: retryBtnScale }] },
                      ]}
                    >
                      <Text style={styles.retryButtonText}>RETRY ⟳</Text>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                )}
                <TouchableWithoutFeedback
                  {...dismissSpring}
                  onPress={onCancel}
                  testID="sign-out-error-cancel-button"
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss error dialog"
                >
                  <Animated.View
                    style={[
                      styles.cancelButton,
                      { transform: [{ scale: dismissBtnScale }] },
                    ]}
                  >
                    <Text style={styles.cancelButtonText}>DISMISS</Text>
                  </Animated.View>
                </TouchableWithoutFeedback>
              </View>
            </View>
          ) : (
            /* State C: Sign Out Confirmation Dialog (Stitch Screen 4) */
            <View style={styles.stateWrapper} testID="sign-out-confirm-state">
              <View style={styles.iconBox}>
                <Icon name="sign-out" size={24} color={colors.crimson} />
              </View>

              <Text style={styles.title}>SIGN OUT</Text>
              <Text style={styles.message}>
                ARE YOU SURE YOU WISH TO SIGN OUT OF YOUR KINETRA SESSION?
              </Text>

              <View style={styles.buttonGroup}>
                <TouchableWithoutFeedback
                  {...confirmSpring}
                  onPress={onConfirm}
                  testID="sign-out-confirm-button"
                  accessibilityRole="button"
                  accessibilityLabel="Confirm Sign Out"
                >
                  <Animated.View
                    style={[
                      styles.confirmButton,
                      { transform: [{ scale: confirmBtnScale }] },
                    ]}
                  >
                    <Text style={styles.confirmButtonText}>SIGN OUT</Text>
                  </Animated.View>
                </TouchableWithoutFeedback>

                <TouchableWithoutFeedback
                  {...cancelSpring}
                  onPress={onCancel}
                  testID="sign-out-cancel-button"
                  accessibilityRole="button"
                  accessibilityLabel="Cancel Sign Out"
                >
                  <Animated.View
                    style={[
                      styles.cancelButton,
                      { transform: [{ scale: cancelBtnScale }] },
                    ]}
                  >
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </Animated.View>
                </TouchableWithoutFeedback>
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 7, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(18, 20, 22, 0.98)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  stateWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconCircleError: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  spinnerWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(217, 184, 63, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: 2.5,
    fontSize: 22,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    ...typography.caption,
    color: colors.secondaryText,
    letterSpacing: 1.2,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  loadingTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.primaryText,
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  loadingSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  errorTitle: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 13,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: colors.crimson,
    height: 48,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.crimson,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  confirmButtonText: {
    ...typography.labelCaps,
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    height: 48,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 11.5,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    height: 48,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
