import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

export type IconName =
  | 'home'
  | 'explore'
  | 'train'
  | 'stats'
  | 'profile'
  | 'bell'
  | 'bolt'
  | 'sparkle'
  | 'clock'
  | 'flame'
  | 'pulse'
  | 'shield'
  | 'chevron-right'
  | 'view-all'
  | 'back'
  | 'bookmark'
  | 'bookmark-outline'
  | 'play'
  | 'warning'
  | 'retry'
  | 'check';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = colors.primaryText,
  style,
}) => {
  const renderIconContent = () => {
    switch (name) {
      case 'home':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.9, color, lineHeight: size }}>⌂</Text>
          </View>
        );
      case 'explore':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>◎</Text>
          </View>
        );
      case 'train':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>⤢</Text>
          </View>
        );
      case 'stats':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>☵</Text>
          </View>
        );
      case 'profile':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>👤</Text>
          </View>
        );
      case 'bell':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>🔔</Text>
          </View>
        );
      case 'bolt':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>⚡</Text>
          </View>
        );
      case 'sparkle':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>✦</Text>
          </View>
        );
      case 'clock':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>⏱</Text>
          </View>
        );
      case 'flame':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>🔥</Text>
          </View>
        );
      case 'pulse':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>📈</Text>
          </View>
        );
      case 'shield':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>🛡️</Text>
          </View>
        );
      case 'chevron-right':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>›</Text>
          </View>
        );
      case 'back':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.9, color, lineHeight: size, fontWeight: '700' }}>←</Text>
          </View>
        );
      case 'bookmark':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>🔖</Text>
          </View>
        );
      case 'bookmark-outline':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>⚐</Text>
          </View>
        );
      case 'play':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.7, color, lineHeight: size, marginLeft: 2 }}>▶</Text>
          </View>
        );
      case 'warning':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size, fontWeight: '800' }}>!</Text>
          </View>
        );
      case 'retry':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>⟳</Text>
          </View>
        );
      case 'check':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>✓</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return <View style={[styles.container, style]}>{renderIconContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
