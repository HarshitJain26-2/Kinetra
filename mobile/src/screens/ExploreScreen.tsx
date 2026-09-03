import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  Alert,
  Animated,
  Easing,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { WorkoutListCard } from '../components/WorkoutListCard';
import { apiClient, WorkoutItem } from '../api/client';

interface CategoryFilterOption {
  id: string;
  label: string;
  backendCategory?: string;
}

const CATEGORIES: CategoryFilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'strength', label: 'Strength', backendCategory: 'strength' },
  { id: 'mobility', label: 'Mobility', backendCategory: 'mobility' },
  { id: 'conditioning', label: 'Conditioning', backendCategory: 'endurance' },
  { id: 'recovery', label: 'Recovery', backendCategory: 'rehab' },
];

interface ExploreScreenProps {
  navigation?: any;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Staggered Entrance Animation Values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-12)).current;
  const filterOpacity = useRef(new Animated.Value(0)).current;
  const filterTranslateY = useRef(new Animated.Value(-8)).current;
  const buildProtoOpacity = useRef(new Animated.Value(0)).current;
  const buildProtoTranslateY = useRef(new Animated.Value(10)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listTranslateY = useRef(new Animated.Value(12)).current;

  // Shimmer pulse animation for loading skeleton cards
  const skeletonShimmer = useRef(new Animated.Value(0.35)).current;

  // Button Spring Press Scales
  const profileBtnScale = useRef(new Animated.Value(1)).current;
  const notificationBtnScale = useRef(new Animated.Value(1)).current;
  const buildProtoBtnScale = useRef(new Animated.Value(1)).current;
  const retryBtnScale = useRef(new Animated.Value(1)).current;

  const createSpring = (val: Animated.Value, down = 0.92, back = 1) => ({
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

  const profileSpring = createSpring(profileBtnScale, 0.90, 1);
  const notificationSpring = createSpring(notificationBtnScale, 0.90, 1);
  const buildProtoSpring = createSpring(buildProtoBtnScale, 0.97, 1);
  const retrySpring = createSpring(retryBtnScale, 0.95, 1);

  // Entrance sequence & skeleton pulse
  useEffect(() => {
    let isMounted = true;
    let entranceAnim: Animated.CompositeAnimation | null = null;
    let shimmerLoop: Animated.CompositeAnimation | null = null;

    const runEntrance = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (!isMounted) return;

      if (reduceMotion) {
        headerOpacity.setValue(1);
        headerTranslateY.setValue(0);
        filterOpacity.setValue(1);
        filterTranslateY.setValue(0);
        buildProtoOpacity.setValue(1);
        buildProtoTranslateY.setValue(0);
        listOpacity.setValue(1);
        listTranslateY.setValue(0);
        return;
      }

      entranceAnim = Animated.stagger(70, [
        // Phase 1: Header
        Animated.parallel([
          Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 2: Category Filter Bar
        Animated.parallel([
          Animated.timing(filterOpacity, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(filterTranslateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 3: Custom Protocol Banner
        Animated.parallel([
          Animated.timing(buildProtoOpacity, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(buildProtoTranslateY, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Workout List
        Animated.parallel([
          Animated.timing(listOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(listTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      entranceAnim.start();

      shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonShimmer, {
            toValue: 0.85,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(skeletonShimmer, {
            toValue: 0.35,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      shimmerLoop.start();
    };

    runEntrance();

    return () => {
      isMounted = false;
      if (entranceAnim) entranceAnim.stop();
      if (shimmerLoop) shimmerLoop.stop();
    };
  }, []);

  const fetchWorkoutList = useCallback(async (categoryId: string) => {
    setError(null);
    try {
      const selectedOption = CATEGORIES.find((c) => c.id === categoryId);
      const filters = selectedOption?.backendCategory
        ? { category: selectedOption.backendCategory, limit: 30 }
        : { limit: 30 };

      const data = await apiClient.getWorkouts(filters);
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        err?.message ||
          'Our elite servers are temporarily unreachable. Please verify your secure connection and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchWorkoutList(selectedCategory);
  }, [selectedCategory, fetchWorkoutList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkoutList(selectedCategory);
  }, [selectedCategory, fetchWorkoutList]);

  const handleSelectCategory = (categoryId: string) => {
    if (selectedCategory !== categoryId) {
      setSelectedCategory(categoryId);
    }
  };

  const handleWorkoutPress = (workout: WorkoutItem) => {
    if (navigation?.navigate) {
      navigation.navigate('WorkoutDetails', {
        workoutId: workout.id,
        initialWorkout: workout,
      });
    }
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'All workout regimens and telemetry updates are active.');
  };

  const handleProfilePress = () => {
    if (navigation?.navigate) {
      navigation.navigate('Profile');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER (Stitch Reference) */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <TouchableWithoutFeedback
          {...profileSpring}
          onPress={handleProfilePress}
          accessibilityLabel="Profile"
          accessibilityRole="button"
          testID="workouts-header-profile-button"
        >
          <Animated.View
            style={[
              styles.avatarButton,
              { transform: [{ scale: profileBtnScale }] },
            ]}
          >
            <Icon name="profile" size={16} color={colors.gold} />
          </Animated.View>
        </TouchableWithoutFeedback>

        <Text style={styles.brandTitle}>WORKOUTS</Text>

        <TouchableWithoutFeedback
          {...notificationSpring}
          onPress={handleNotificationPress}
          accessibilityLabel="Notifications"
          accessibilityRole="button"
          testID="workouts-header-notification-button"
        >
          <Animated.View
            style={[
              styles.notificationButton,
              { transform: [{ scale: notificationBtnScale }] },
            ]}
          >
            <Icon name="bell" size={18} color={colors.primaryText} />
            <View style={styles.notificationDot} />
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* 2. CATEGORY HORIZONTAL FILTER PILLS (Stitch Reference) */}
      <Animated.View
        style={[
          styles.filterContainer,
          {
            opacity: filterOpacity,
            transform: [{ translateY: filterTranslateY }],
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleSelectCategory(category.id)}
                activeOpacity={0.8}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                testID={`category-pill-${category.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${category.label} category filter`}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* 3. SCROLLABLE WORKOUT LIST */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* BUILD CUSTOM PROTOCOL BUTTON */}
        <Animated.View
          style={{
            opacity: buildProtoOpacity,
            transform: [{ translateY: buildProtoTranslateY }],
          }}
        >
          <TouchableWithoutFeedback
            {...buildProtoSpring}
            onPress={() => navigation?.navigate('CreateWorkout')}
            testID="build-custom-protocol-btn"
            accessibilityRole="button"
            accessibilityLabel="Build Custom Protocol"
          >
            <Animated.View
              style={[
                styles.buildProtocolBtn,
                { transform: [{ scale: buildProtoBtnScale }] },
              ]}
            >
              <View style={styles.buildProtocolLeft}>
                <View style={styles.buildSparkleCircle}>
                  <Icon name="sparkle" size={14} color={colors.gold} />
                </View>
                <Text style={styles.buildProtocolText}>+ BUILD CUSTOM PROTOCOL</Text>
              </View>
              <Icon name="chevron-right" size={14} color={colors.gold} />
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* WORKOUTS CONTENT AREA */}
        <Animated.View
          style={{
            opacity: listOpacity,
            transform: [{ translateY: listTranslateY }],
          }}
        >
          {loading ? (
            /* Luxury Obsidian Skeleton Loader Cards */
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((idx) => (
                <View key={idx} style={styles.skeletonCard}>
                  <Animated.View
                    style={[
                      styles.skeletonImagePlaceholder,
                      { opacity: skeletonShimmer },
                    ]}
                  />
                  <View style={styles.skeletonInfo}>
                    <Animated.View
                      style={[
                        styles.skeletonBarSmall,
                        { opacity: skeletonShimmer },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.skeletonBarMedium,
                        { opacity: skeletonShimmer },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.skeletonBarLarge,
                        { opacity: skeletonShimmer },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : error ? (
            /* Stitch Luxury Error State */
            <View style={styles.errorCard} testID="workouts-error-state">
              <View style={styles.warningCircle}>
                <Icon name="warning" size={28} color={colors.crimson} />
              </View>
              <Text style={styles.errorTitle}>Connection Interrupted</Text>
              <Text style={styles.errorSubtitle}>
                Our elite servers are temporarily unreachable. Please verify your secure connection and try again.
              </Text>
              <TouchableWithoutFeedback
                {...retrySpring}
                onPress={() => fetchWorkoutList(selectedCategory)}
                testID="workouts-retry-button"
                accessibilityRole="button"
                accessibilityLabel="Retry fetching workouts"
              >
                <Animated.View
                  style={[
                    styles.retryButton,
                    { transform: [{ scale: retryBtnScale }] },
                  ]}
                >
                  <Icon name="retry" size={14} color={colors.inverseText} style={styles.retryIcon} />
                  <Text style={styles.retryButtonText}>RETRY</Text>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          ) : workouts.length === 0 ? (
            /* Stitch Empty State */
            <View style={styles.emptyCard} testID="workouts-empty-state">
              <View style={styles.emptyIconWrapper}>
                <Icon name="train" size={32} color={colors.tertiaryText} />
              </View>
              <Text style={styles.emptyTitle}>No Workouts Available</Text>
              <Text style={styles.emptySubtitle}>
                No workouts found in the "{CATEGORIES.find((c) => c.id === selectedCategory)?.label}" category.
              </Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => handleSelectCategory('all')}
                testID="workouts-view-all-button"
                accessibilityRole="button"
                accessibilityLabel="View All Workouts"
              >
                <Text style={styles.viewAllButtonText}>VIEW ALL WORKOUTS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            workouts.map((workout) => (
              <WorkoutListCard
                key={workout.id}
                workout={workout}
                onPress={() => handleWorkoutPress(workout)}
                testID={`workout-list-item-${workout.id}`}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050607',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  brandTitle: {
    ...typography.headlineMd,
    fontSize: 17,
    lineHeight: 22,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    letterSpacing: 4,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  filterContainer: {
    paddingVertical: spacing.md,
    backgroundColor: '#050607',
  },
  filterScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.gold,
  },
  filterPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillText: {
    ...typography.labelCaps,
    fontSize: 11,
    letterSpacing: 1,
  },
  filterPillTextActive: {
    color: colors.inverseText,
    fontWeight: '800',
  },
  filterPillTextInactive: {
    color: colors.secondaryText,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 24,
  },
  buildProtocolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18, 20, 22, 0.9)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.4)',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.lg,
  },
  buildProtocolLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buildSparkleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(217, 184, 63, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildProtocolText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Skeleton Loader Styles
  skeletonContainer: {
    gap: spacing.lg,
  },
  skeletonCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  skeletonImagePlaceholder: {
    width: '100%',
    height: 190,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  skeletonInfo: {
    padding: spacing.md,
    gap: 10,
  },
  skeletonBarSmall: {
    width: '30%',
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  skeletonBarMedium: {
    width: '65%',
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  skeletonBarLarge: {
    width: '90%',
    height: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Error Card Styles
  errorCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.4)',
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.crimson,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  warningCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 57, 70, 0.5)',
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 21,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    height: 48,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.gold,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '800',
  },

  // Empty Card Styles
  emptyCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emptyIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.headlineSm,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 20,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    height: 46,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: 'rgba(217, 184, 63, 0.1)',
  },
  viewAllButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
});
