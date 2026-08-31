import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
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
}

const TABS: TabItemConfig[] = [
  { name: 'Home', label: 'HOME', icon: 'home', testID: 'tab-home' },
  { name: 'Explore', label: 'EXPLORE', icon: 'explore', testID: 'tab-explore' },
  { name: 'Train', label: 'TRAIN', icon: 'train', testID: 'tab-train' },
  { name: 'Stats', label: 'STATS', icon: 'stats', testID: 'tab-stats' },
  { name: 'Profile', label: 'PROFILE', icon: 'profile', testID: 'tab-profile' },
];

interface BottomTabNavigatorProps {
  navigation?: any;
}

export const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ navigation: rootNavigation }) => {
  const [activeTab, setActiveTab] = useState<MainTabName>('Home');
  const insets = useSafeAreaInsets();

  const combinedNavigation = {
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
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen navigation={combinedNavigation} />;
      case 'Explore':
        return <ExploreScreen navigation={combinedNavigation} />;
      case 'Train':
        return <TrainScreen />;
      case 'Stats':
        return <StatsScreen navigation={combinedNavigation} />;
      case 'Profile':
        return <ProfileScreen navigation={combinedNavigation} />;
      default:
        return <HomeScreen navigation={combinedNavigation} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Active Screen View */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.tabBar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            height: 60 + Math.max(insets.bottom, 12),
          },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.name;
          const activeColor = colors.gold;
          const inactiveColor = colors.tertiaryText;
          const tintColor = isActive ? activeColor : inactiveColor;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab.name)}
              activeOpacity={0.8}
              testID={tab.testID}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <Icon name={tab.icon} size={22} color={tintColor} style={styles.tabIcon} />
              <Text
                style={[
                  styles.tabLabel,
                  { color: tintColor, fontWeight: isActive ? '700' : '500' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceDim,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    marginBottom: 3,
  },
  tabLabel: {
    ...typography.labelCaps,
    fontSize: 9,
    letterSpacing: 1.2,
  },
});
