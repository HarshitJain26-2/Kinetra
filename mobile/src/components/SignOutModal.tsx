/**
 * Kinetra Sign Out Confirmation Modal & Status Flow (Phase 33)
 * Exact Stitch luxury dark visual matching Screen 4 & Screen 5.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={styles.overlay} testID="sign-out-modal-overlay">
        {/* State A: Ending Session Loading Spinner */}
        {loading ? (
          <View style={styles.card} testID="sign-out-loading-state">
            <ActivityIndicator size="large" color={colors.gold} style={styles.spinner} />
            <Text style={styles.statusTitle}>ENDING SESSION</Text>
            <Text style={styles.statusSubtitle}>Securing your performance data</Text>
          </View>
        ) : error ? (
          /* State B: Connection Interrupted Error Banner */
          <View style={styles.card} testID="sign-out-error-state">
            <View style={styles.iconCircleError}>
              <Icon name="wifi-off" size={28} color={colors.gold} />
            </View>
            <Text style={styles.statusTitle}>CONNECTION INTERRUPTED</Text>
            <Text style={styles.statusSubtitle}>
              {error || 'Unable to securely sign out. Please check your network connection.'}
            </Text>
            <View style={styles.buttonGroup}>
              {onRetry && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={onRetry}
                  testID="sign-out-retry-button"
                  accessibilityRole="button"
                >
                  <Text style={styles.retryButtonText}>RETRY ⟳</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                testID="sign-out-error-cancel-button"
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>DISMISS</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* State C: Sign Out Confirmation Dialog */
          <View style={styles.card} testID="sign-out-confirm-state">
            <View style={styles.iconBox}>
              <Icon name="sign-out" size={24} color={colors.crimson} />
            </View>

            <Text style={styles.title}>SIGN OUT</Text>
            <Text style={styles.message}>
              ARE YOU SURE YOU WISH TO SIGN OUT OF YOUR KINETRA SESSION?
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onConfirm}
                testID="sign-out-confirm-button"
                accessibilityRole="button"
              >
                <Text style={styles.confirmButtonText}>SIGN OUT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                testID="sign-out-cancel-button"
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 7, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconCircleError: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.goldMuted,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  spinner: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: 2,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    ...typography.caption,
    color: colors.secondaryText,
    letterSpacing: 1.2,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  statusTitle: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 14,
    letterSpacing: 1.8,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  statusSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: colors.crimson,
    paddingVertical: 13,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    ...typography.labelCaps,
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 13,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...typography.labelCaps,
    color: colors.secondaryText,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  retryButton: {
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingVertical: 13,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
