/**
 * Kinetra Pose Skeleton Overlay
 * Renders on-screen joint keypoints, limbs, and athlete framing guide.
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { colors, borderRadius } from '../theme';
import { PoseLandmark } from '../engine/pose/types';

interface PoseSkeletonOverlayProps {
  landmarks?: PoseLandmark[];
  width?: number;
  height?: number;
  testID?: string;
}

export const POSE_CONNECTIONS: [string, string][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

export const PoseSkeletonOverlay: React.FC<PoseSkeletonOverlayProps> = ({
  landmarks = [],
  width = Dimensions.get('window').width,
  height = Dimensions.get('window').height,
  testID = 'pose-skeleton-overlay',
}) => {
  const landmarkMap: Record<string, { x: number; y: number; visibility?: number }> = {};
  for (const lm of landmarks) {
    if (lm && lm.name) {
      landmarkMap[lm.name] = {
        x: lm.x * width,
        y: lm.y * height,
        visibility: lm.visibility,
      };
    }
  }

  // Draw Head circle if nose/shoulders present
  const nose = landmarkMap['nose'];
  const leftShoulder = landmarkMap['left_shoulder'];
  const rightShoulder = landmarkMap['right_shoulder'];

  let headCenter = nose;
  if (!headCenter && leftShoulder && rightShoulder) {
    headCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: Math.min(leftShoulder.y, rightShoulder.y) - 60,
    };
  }

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none" testID={testID}>
      {/* 1. ATHLETE POSITIONING BOUNDING GUIDE */}
      <View style={styles.framingGuide} />

      {/* 2. LIMB CONNECTION LINES */}
      {POSE_CONNECTIONS.map(([p1Name, p2Name], index) => {
        const p1 = landmarkMap[p1Name];
        const p2 = landmarkMap[p2Name];

        if (!p1 || !p2) return null;
        if ((p1.visibility ?? 1) < 0.35 || (p2.visibility ?? 1) < 0.35) return null;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        return (
          <View
            key={`limb-${index}-${p1Name}-${p2Name}`}
            style={[
              styles.limbLine,
              {
                width: length,
                left: p1.x,
                top: p1.y,
                transform: [
                  { rotateZ: `${angle}deg` },
                  { translateY: -3 }, // center 6px thick line
                ],
              },
            ]}
          />
        );
      })}

      {/* 3. HEAD CIRCLE */}
      {headCenter && (
        <View
          style={[
            styles.headCircle,
            {
              left: headCenter.x - 26,
              top: headCenter.y - 26,
            },
          ]}
        />
      )}

      {/* 4. KEYPOINT JOINTS */}
      {landmarks.map((lm) => {
        if (!lm || (lm.visibility ?? 1) < 0.35) return null;
        // Skip facial detail landmarks for clean athletic stick-figure visual matching Reference Image 2
        if (
          lm.name.includes('eye') ||
          lm.name.includes('ear') ||
          lm.name.includes('mouth') ||
          lm.name === 'nose' ||
          lm.name.includes('pinky') ||
          lm.name.includes('index') ||
          lm.name.includes('thumb')
        ) {
          return null;
        }

        const px = lm.x * width;
        const py = lm.y * height;

        return (
          <View
            key={`joint-${lm.name}`}
            style={[
              styles.jointCircle,
              {
                left: px - 8,
                top: py - 8,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  framingGuide: {
    width: '82%',
    height: '75%',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 184, 63, 0.25)',
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
  },
  limbLine: {
    position: 'absolute',
    height: 6,
    backgroundColor: colors.gold,
    borderRadius: 3,
    transformOrigin: 'left center',
  },
  headCircle: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold,
  },
  jointCircle: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: '#050607',
  },
});
