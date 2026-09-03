/**
 * Kinetra Unified Global Skeleton & Loading System (Section 29)
 * Production-quality obsidian/charcoal skeleton primitives with low-contrast pulse,
 * reduced-motion accessibility, and timer/animation cleanup.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
  ViewStyle,
  StyleProp,
  DimensionValue,
} from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Low-contrast opacity pulse primitive (0.40 ↔ 0.85).
 * Disables loop and renders static final opacity when reduced motion is enabled.
 */
export const SkeletonBlock: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.xs,
  style,
  testID = 'global-skeleton',
}) => {
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    let isMounted = true;
    let animLoop: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!isMounted) return;
        setReduceMotion(enabled);
        if (enabled) {
          opacityAnim.setValue(0.6);
          return;
        }

        animLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.85,
              duration: 900,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.40,
              duration: 900,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        );
        animLoop.start();
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (animLoop) animLoop.stop();
    };
  }, [opacityAnim]);

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="none"
      accessible={false}
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius: radius,
          opacity: reduceMotion ? 0.55 : opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const SkeletonText: React.FC<{
  width?: DimensionValue;
  height?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ width = '80%', height = 14, style }) => (
  <SkeletonBlock width={width} height={height} borderRadius={borderRadius.xs} style={style} />
);

export const SkeletonCard: React.FC<{
  height?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}> = ({ height = 140, style, children }) => (
  <View style={[styles.cardContainer, style]}>
    {children || <SkeletonBlock width="100%" height={height} borderRadius={borderRadius.sm} />}
  </View>
);

/**
 * Layout-preserving Stats Screen Skeleton
 */
export const StatsSkeleton: React.FC<{ testID?: string }> = ({ testID = 'stats-loading-skeleton' }) => (
  <View style={styles.statsSkeletonContainer} testID={testID}>
    {/* Range Filter Pill Row */}
    <View style={styles.skeletonRow}>
      <SkeletonBlock width={60} height={28} borderRadius={borderRadius.full} />
      <SkeletonBlock width={60} height={28} borderRadius={borderRadius.full} />
      <SkeletonBlock width={60} height={28} borderRadius={borderRadius.full} />
      <SkeletonBlock width={60} height={28} borderRadius={borderRadius.full} />
    </View>

    {/* Big Hero Telemetry Metric Card */}
    <SkeletonBlock width="100%" height={160} borderRadius={borderRadius.md} />

    {/* 3-Column Micro Metrics Grid */}
    <View style={styles.skeletonRow}>
      <SkeletonBlock width="31%" height={90} borderRadius={borderRadius.sm} />
      <SkeletonBlock width="31%" height={90} borderRadius={borderRadius.sm} />
      <SkeletonBlock width="31%" height={90} borderRadius={borderRadius.sm} />
    </View>

    {/* Chart Placeholder Card */}
    <SkeletonBlock width="100%" height={180} borderRadius={borderRadius.md} />
  </View>
);

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardContainer: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    overflow: 'hidden',
  },
  statsSkeletonContainer: {
    gap: 16,
    paddingTop: spacing.xs,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
