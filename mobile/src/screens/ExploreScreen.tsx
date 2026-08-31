import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { WorkoutListCard } from '../components/WorkoutListCard';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { KinetraButton } from '../components/KinetraButton';
import { apiClient, WorkoutItem } from '../api/client';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={handleProfilePress}
          accessibilityLabel="Profile"
          accessibilityRole="button"
          testID="workouts-header-profile-button"
        >
          <Icon name="profile" size={16} color={colors.gold} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>WORKOUTS</Text>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleNotificationPress}
          accessibilityLabel="Notifications"
          accessibilityRole="button"
          testID="workouts-header-notification-button"
        >
          <Icon name="bell" size={18} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* 2. CATEGORY HORIZONTAL FILTER PILLS */}
      <View style={styles.filterContainer}>
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
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                testID={`category-pill-${category.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
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
      </View>

      {/* 3. MAIN WORKOUT LIST / STATES */}
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
        {loading ? (
          <View style={styles.stateWrapper}>
            <LoadingIndicator message="Loading training regimens..." />
          </View>
        ) : error ? (
          /* EXACT STITCH ERROR CARD MATCHING IMAGE 3 */
          <View style={styles.errorCard} testID="workouts-error-state">
            <View style={styles.warningCircle}>
              <Icon name="warning" size={28} color={colors.gold} />
            </View>
            <Text style={styles.errorTitle}>Connection Interrupted</Text>
            <Text style={styles.errorSubtitle}>
              Our elite servers are temporarily unreachable. Please verify your secure connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchWorkoutList(selectedCategory)}
              testID="workouts-retry-button"
            >
              <Icon name="retry" size={14} color={colors.gold} style={styles.retryIcon} />
              <Text style={styles.retryButtonText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        ) : workouts.length === 0 ? (
          <View style={styles.emptyCard} testID="workouts-empty-state">
            <Icon name="train" size={32} color={colors.tertiaryText} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No Workouts Available</Text>
            <Text style={styles.emptySubtitle}>
              No workouts found in the "{CATEGORIES.find((c) => c.id === selectedCategory)?.label}" category.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => handleSelectCategory('all')}
              testID="workouts-view-all-button"
            >
              <Text style={styles.retryButtonText}>VIEW ALL WORKOUTS</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  brandTitle: {
    ...typography.headlineMd,
    fontSize: 18,
    lineHeight: 24,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    letterSpacing: 3,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterContainer: {
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.gold,
  },
  filterPillInactive: {
    backgroundColor: colors.surfaceDim,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterPillText: {
    ...typography.labelCaps,
    fontSize: 11,
    letterSpacing: 0.8,
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
    paddingBottom: spacing.xxl,
  },
  stateWrapper: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  warningCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.goldMuted,
  },
  errorTitle: {
    ...typography.headlineMd,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    fontSize: 22,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.surfaceBright,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emptyIcon: {
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
});
