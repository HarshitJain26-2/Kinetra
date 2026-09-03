/**
 * Kinetra Bottom Tab Navigator (Section 28: Global Navigation Refinement)
 * Exact Stitch luxury dark athletic performance-lab floating obsidian command console.
 * Connects the 5 authenticated primary tabs with tactile spring interactions,
 * safe-area adaptation, and accessibility semantics.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { Icon, IconName } from '../components/Icon';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { TrainScreen } from '../screens/TrainScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type MainTabName = 'Home' | 'Explore' | 'Train' | 'Stats' | 'Profile';

interface TabItemConfig {
  name: MainTabName;
  label: string;
  icon: IconName;
  testID: string;
  globalTestID: string;
}

const TABS: TabItemConfig[] = [
  { name: 'Home', label: 'HOME', icon: 'home', testID: 'tab-home', globalTestID: 'global-tab-home' },
  { name: 'Explore', label: 'EXPLORE', icon: 'explore', testID: 'tab-explore', globalTestID: 'global-tab-explore' },
  { name: 'Train', label: 'TRAIN', icon: 'train', testID: 'tab-train', globalTestID: 'global-tab-train' },
  { name: 'Stats', label: 'STATS', icon: 'stats', testID: 'tab-stats', globalTestID: 'global-tab-stats' },
  { name: 'Profile', label: 'PROFILE', icon: 'profile', testID: 'tab-profile', globalTestID: 'global-tab-profile' },
];

interface BottomTabNavigatorProps {
  navigation?: any;
}

interface TabButtonProps {
  tab: TabItemConfig;
  isActive: boolean;
  onPress: () => void;
  reduceMotion: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, isActive, onPress, reduceMotion }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const activeColor = colors.gold;
  const inactiveColor = 'rgba(255, 255, 255, 0.42)';
  const tintColor = isActive ? activeColor : inactiveColor;

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={tab.testID}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${tab.label} tab`}
    >
      <Animated.View
        style={[
          styles.tabButton,
          { transform: [{ scale }] },
        ]}
      >
        {/* Active Tab Ambient Dot Indicator */}
        {isActive && <View style={styles.activeTabTopDot} />}

        <Icon
          name={tab.icon}
          size={20}
          color={tintColor}
          style={styles.tabIcon}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: tintColor,
              fontWeight: isActive ? '800' : '600',
            },
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ navigation: rootNavigation }) => {
  const [activeTab, setActiveTab] = useState<MainTabName>('Home');
  const [reduceMotion, setReduceMotion] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setReduceMotion(enabled);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const combinedNavigation = React.useMemo(
    () => ({
      navigate: (screen: string, params?: any) => {
        if (TABS.some((t) => t.name === screen)) {
          setActiveTab(screen as MainTabName);
        } else if (rootNavigation?.navigate) {
          rootNavigation.navigate(screen, params);
        }
      },
      goBack: () => {
        if (rootNavigation?.goBack) rootNavigation.goBack();
      },
      push: (screen: string, params?: any) => {
        if (rootNavigation?.push) {
          rootNavigation.push(screen, params);
        } else if (rootNavigation?.navigate) {
          rootNavigation.navigate(screen, params);
        }
      },
      replace: (screen: string, params?: any) => {
        if (rootNavigation?.replace) {
          rootNavigation.replace(screen, params);
        } else if (rootNavigation?.navigate) {
          rootNavigation.navigate(screen, params);
        }
      },
    }),
    [rootNavigation]
  );

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen navigation={combinedNavigation} />;
      case 'Explore':
        return <ExploreScreen navigation={combinedNavigation} />;
      case 'Train':
        return <TrainScreen navigation={combinedNavigation} />;
      case 'Stats':
        return <StatsScreen navigation={combinedNavigation} />;
      case 'Profile':
        return <ProfileScreen navigation={combinedNavigation} />;
      default:
        return <HomeScreen navigation={combinedNavigation} />;
    }
  };

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);

  return (
    <View style={styles.container}>
      {/* Active Screen Canvas */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Floating Obsidian Command Console (Tab Bar) */}
      <View
        style={[
          styles.tabBar,
          {
            paddingBottom: bottomPadding,
            height: 54 + bottomPadding,
          },
        ]}
      >
        {TABS.map((tab) => (
          <TabButton
            key={tab.name}
            tab={tab}
            isActive={activeTab === tab.name}
            onPress={() => setActiveTab(tab.name)}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050607',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(18, 20, 22, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  activeTabTopDot: {
    position: 'absolute',
    top: -6,
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.gold,
  },
  tabIcon: {
    marginBottom: 3,
  },
  tabLabel: {
    ...typography.labelCaps,
    fontSize: 8.5,
    letterSpacing: 1.1,
  },
});
