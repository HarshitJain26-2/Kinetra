/**
 * Kinetra Meal Recommendations Screen (Phase 34)
 * Exact Stitch luxury dark athletic design matching Screen 2.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { MealCard } from '../components/MealCard';
import { LoadingIndicator } from '../components/LoadingIndicator';
import {
  apiClient,
  MealPlanItem,
  DietType,
} from '../api/client';

type DietFilterOption = 'all' | 'high_protein' | 'keto' | 'vegan';

const FILTER_OPTIONS: { id: DietFilterOption; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'high_protein', label: 'High Protein' },
  { id: 'keto', label: 'Keto' },
  { id: 'vegan', label: 'Vegan' },
];

interface MealRecommendationsScreenProps {
  navigation?: any;
  route?: any;
}

export const MealRecommendationsScreen: React.FC<MealRecommendationsScreenProps> = ({
  navigation,
  route,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<DietFilterOption>('all');
  const [meals, setMeals] = useState<MealPlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (dietFilter: DietFilterOption) => {
    setError(null);
    try {
      // Map filter to backend request if custom diet applied
      const result = await apiClient.getNutritionRecommendations({ num_meals: 4 });
      const rawMeals = result?.meal_plan?.meals || [];

      // Filter meals based on selected macro/diet profile
      let filtered = rawMeals;
      if (dietFilter === 'high_protein') {
        filtered = rawMeals.filter((m) => m.protein_g >= 30);
      } else if (dietFilter === 'keto') {
        filtered = rawMeals.filter((m) => m.fat_g >= 25 || m.carbs_g <= 20);
      }

      setMeals(filtered);
    } catch (err: any) {
      setError(err?.message || 'Unable to synchronize nutrition recommendations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRecommendations(selectedFilter);
  }, [fetchRecommendations, selectedFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecommendations(selectedFilter);
  }, [fetchRecommendations, selectedFilter]);

  const handleMealPress = (meal: MealPlanItem) => {
    navigation.navigate('MealDetails', { meal, dietType: selectedFilter });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          testID="recommendations-back-button"
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Icon name="back" size={18} color={colors.gold} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>RECOMMENDATIONS</Text>

        <View style={styles.headerRightBadge}>
          <Icon name="sparkle" size={16} color={colors.gold} />
        </View>
      </View>

      {/* 2. FILTER PILLS */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_OPTIONS.map((filter) => {
            const isActive = selectedFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setSelectedFilter(filter.id)}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                testID={`filter-diet-${filter.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. MEALS LIST */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        {loading && !refreshing ? (
          <View style={styles.loadingWrapper}>
            <LoadingIndicator message="Synthesizing personalized meal plans..." />
          </View>
        ) : error ? (
          <View style={styles.errorCard} testID="recommendations-error">
            <Icon name="warning" size={32} color={colors.gold} style={{ marginBottom: 12 }} />
            <Text style={styles.errorTitle}>Telemetry Failed</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchRecommendations(selectedFilter)}
              testID="recommendations-retry-button"
            >
              <Text style={styles.retryButtonText}>RETRY CONNECTION ⟳</Text>
            </TouchableOpacity>
          </View>
        ) : meals.length === 0 ? (
          <View style={styles.emptyCard} testID="recommendations-empty">
            <Icon name="cutlery" size={32} color={colors.tertiaryText} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Matching Meal Plans</Text>
            <Text style={styles.emptySubtitle}>
              No meals found matching this specific dietary filter and allergen profile.
            </Text>
          </View>
        ) : (
          meals.map((meal, index) => (
            <MealCard
              key={`rec-meal-${index}`}
              meal={meal}
              variant="full"
              onPress={() => handleMealPress(meal)}
              testID={`recommendation-card-${index}`}
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  headerTitle: {
    ...typography.headlineMd,
    fontSize: 16,
    lineHeight: 22,
    color: colors.primaryText,
    fontFamily: 'serif',
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  headerRightBadge: {
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
  filterRow: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  filterPillInactive: {
    backgroundColor: colors.surfaceDim,
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  loadingWrapper: {
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
  errorTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: spacing.xs,
  },
  errorSubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
  },
  retryButtonText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
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
  emptyTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
});
