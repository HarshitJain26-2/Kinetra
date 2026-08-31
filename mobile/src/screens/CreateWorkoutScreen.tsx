/**
 * Kinetra Custom Workout Builder Screen (Phase 35)
 * Exact Stitch luxury dark athletic design matching Screen 3 (Build Your Session).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Icon } from '../components/Icon';
import { apiClient, ExerciseCatalogItem } from '../api/client';

type FilterCategory = 'ALL' | 'PUSH' | 'PULL' | 'LEGS';

interface DraftExercise {
  exercise_id: string;
  name: string;
  order_index: number;
  target_sets: number;
  target_reps: number;
  target_weight_kg?: number;
  rest_seconds: number;
}

export const CreateWorkoutScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
}) => {
  const [workoutTitle, setWorkoutTitle] = useState('Hypertrophy Protocol Alpha');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('ALL');
  const [catalog, setCatalog] = useState<ExerciseCatalogItem[]>([]);
  const [activeExercises, setActiveExercises] = useState<DraftExercise[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const list = await apiClient.getExercises({ limit: 50 });
        if (Array.isArray(list) && list.length > 0) {
          setCatalog(list);
        } else {
          // Fallback foundational exercises
          setCatalog([
            { id: '11111111-0000-0000-0000-000000000001', name: 'Barbell Back Squat', muscle_group: 'LEGS', difficulty: 'hard' },
            { id: '11111111-0000-0000-0000-000000000002', name: 'Overhead Press', muscle_group: 'PUSH', difficulty: 'medium' },
            { id: '11111111-0000-0000-0000-000000000003', name: 'Romanian Deadlift', muscle_group: 'PULL', difficulty: 'hard' },
            { id: '11111111-0000-0000-0000-000000000004', name: 'Barbell Bench Press', muscle_group: 'PUSH', difficulty: 'medium' },
            { id: '11111111-0000-0000-0000-000000000005', name: 'Weighted Pull-Ups', muscle_group: 'PULL', difficulty: 'hard' },
          ]);
        }
      } catch {
        // Fallback
        setCatalog([
          { id: '11111111-0000-0000-0000-000000000001', name: 'Barbell Back Squat', muscle_group: 'LEGS', difficulty: 'hard' },
          { id: '11111111-0000-0000-0000-000000000002', name: 'Overhead Press', muscle_group: 'PUSH', difficulty: 'medium' },
          { id: '11111111-0000-0000-0000-000000000003', name: 'Romanian Deadlift', muscle_group: 'PULL', difficulty: 'hard' },
        ]);
      } finally {
        setLoadingCatalog(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleAddExercise = (item: ExerciseCatalogItem) => {
    const isAlreadyAdded = activeExercises.some((e) => e.exercise_id === item.id);
    if (isAlreadyAdded) {
      Alert.alert('Exercise Already in Protocol', `${item.name} is already part of this session.`);
      return;
    }

    const newEx: DraftExercise = {
      exercise_id: item.id,
      name: item.name,
      order_index: activeExercises.length,
      target_sets: 4,
      target_reps: 10,
      rest_seconds: 90,
    };
    setActiveExercises((prev) => [...prev, newEx]);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setActiveExercises((prev) =>
      prev
        .filter((e) => e.exercise_id !== exerciseId)
        .map((e, idx) => ({ ...e, order_index: idx }))
    );
  };

  const handleSaveProtocol = async () => {
    setError(null);
    if (!workoutTitle.trim()) {
      setError('Please provide a workout title.');
      return;
    }
    if (activeExercises.length === 0) {
      setError('Please add at least 1 exercise to the active protocol.');
      return;
    }

    setSaving(true);
    try {
      const created = await apiClient.createWorkout({
        title: workoutTitle.trim(),
        category: 'strength',
        difficulty: 'medium',
        is_public: false,
        exercises: activeExercises.map((e) => ({
          exercise_id: e.exercise_id,
          order_index: e.order_index,
          target_sets: e.target_sets,
          target_reps: e.target_reps,
          target_weight_kg: e.target_weight_kg || null,
        })),
      });

      Alert.alert('Protocol Created', `${workoutTitle} is now ready.`);
      navigation.navigate('WorkoutDetails', {
        workoutId: created.id,
        initialWorkout: created,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to create workout protocol.');
    } finally {
      setSaving(false);
    }
  };

  // Filter catalog
  const filteredCatalog = catalog.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === 'ALL') return matchesSearch;
    return matchesSearch && ex.muscle_group.toUpperCase() === selectedFilter;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          testID="create-workout-back-button"
        >
          <Icon name="back" size={18} color={colors.gold} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>KINETRA</Text>

        <TouchableOpacity style={styles.gearButton}>
          <Icon name="gear" size={16} color={colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE & SAVE ROW */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={styles.mainTitle}>Build Your{'\n'}Session</Text>
            <Text style={styles.subtitle}>Design your protocol. Precision over volume.</Text>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveProtocol}
            disabled={saving}
            testID="save-workout-protocol-btn"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.inverseText} />
            ) : (
              <Text style={styles.saveBtnText}>SAVE PROTOCOL</Text>
            )}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* WORKOUT TITLE INPUT */}
        <View style={styles.workoutNameBox}>
          <TextInput
            style={styles.workoutNameInput}
            value={workoutTitle}
            onChangeText={setWorkoutTitle}
            placeholder="Protocol Title..."
            placeholderTextColor={colors.tertiaryText}
            testID="create-workout-title-input"
          />
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exercises..."
            placeholderTextColor={colors.tertiaryText}
            testID="exercise-search-input"
          />
        </View>

        {/* FILTER PILLS */}
        <View style={styles.filterRow}>
          {(['ALL', 'PUSH', 'PULL', 'LEGS'] as FilterCategory[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, selectedFilter === f && styles.filterPillActive]}
              onPress={() => setSelectedFilter(f)}
              testID={`filter-${f.toLowerCase()}`}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedFilter === f && styles.filterPillTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* EXERCISE CATALOG LIST */}
        <View style={styles.catalogList}>
          {filteredCatalog.slice(0, 4).map((ex) => (
            <TouchableOpacity
              key={ex.id}
              style={styles.catalogCard}
              onPress={() => handleAddExercise(ex)}
              testID={`catalog-exercise-${ex.id}`}
            >
              <View>
                <Text style={styles.catalogName}>{ex.name}</Text>
                <Text style={styles.catalogMeta}>
                  COMPOUND • {ex.muscle_group.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.plusIcon}>+</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ACTIVE PROTOCOL SECTION */}
        <View style={styles.protocolHeaderRow}>
          <Text style={styles.protocolTitle}>Active Protocol</Text>
          <View style={styles.exerciseBadge}>
            <Text style={styles.exerciseBadgeText}>
              {activeExercises.length} EXERCISES
            </Text>
          </View>
        </View>

        {activeExercises.length === 0 ? (
          <View style={styles.emptyProtocolBox}>
            <Text style={styles.emptyProtocolText}>
              Tap exercises above to build your protocol
            </Text>
          </View>
        ) : (
          activeExercises.map((ex, idx) => (
            <View key={ex.exercise_id} style={styles.activeExCard} testID={`active-ex-${idx}`}>
              <View style={styles.activeExTop}>
                <Text style={styles.activeExIndex}>
                  {String.fromCharCode(65 + idx)}1. {ex.name}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveExercise(ex.exercise_id)}>
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.restText}>REST: {ex.rest_seconds}s</Text>

              <View style={styles.setRepRow}>
                <View style={styles.pillBox}>
                  <Text style={styles.pillLabel}>SETS</Text>
                  <Text style={styles.pillValue}>{ex.target_sets}</Text>
                </View>

                <View style={styles.pillBox}>
                  <Text style={styles.pillLabel}>REPS</Text>
                  <Text style={styles.pillValue}>{ex.target_reps}</Text>
                </View>
              </View>
            </View>
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
  brandTitle: {
    ...typography.brandWordmarkSmall,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 3,
  },
  gearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleLeft: {
    flex: 1,
  },
  mainTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '800',
    color: colors.primaryText,
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
  },
  saveBtn: {
    backgroundColor: colors.primaryText,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    marginLeft: 12,
  },
  saveBtnText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 11,
    fontWeight: '800',
  },
  errorText: {
    color: colors.crimson,
    marginBottom: spacing.sm,
    fontSize: 12,
  },
  workoutNameBox: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  workoutNameInput: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.primaryText,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceDim,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  filterPillText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 10,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: colors.inverseText,
    fontWeight: '800',
  },
  catalogList: {
    marginBottom: spacing.lg,
    gap: 8,
  },
  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  catalogName: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 2,
  },
  catalogMeta: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 10,
  },
  plusIcon: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '800',
  },
  protocolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  protocolTitle: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
  },
  exerciseBadge: {
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  exerciseBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
  },
  emptyProtocolBox: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyProtocolText: {
    ...typography.bodySm,
    color: colors.secondaryText,
  },
  activeExCard: {
    backgroundColor: colors.surfaceDim,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activeExTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activeExIndex: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 14,
  },
  removeIcon: {
    color: colors.tertiaryText,
    fontSize: 14,
  },
  restText: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 11,
    marginBottom: 8,
  },
  setRepRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBox: {
    flex: 1,
    backgroundColor: colors.surfaceBright,
    borderRadius: borderRadius.sm,
    paddingVertical: 6,
    alignItems: 'center',
  },
  pillLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    marginBottom: 2,
  },
  pillValue: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontWeight: '700',
  },
});
