/**
 * Kinetra Custom Workout Builder Screen (Section 19: Custom Workout Builder Refinement)
 * Exact Stitch luxury dark athletic design matching Screen 3 (Build Your Session).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  AccessibilityInfo,
  Platform,
  KeyboardAvoidingView,
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
  exercise?: ExerciseCatalogItem;
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
  const [isCatalogUnseeded, setIsCatalogUnseeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Staggered Entrance Animation Values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-12)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(10)).current;
  const filterOpacity = useRef(new Animated.Value(0)).current;
  const filterTranslateY = useRef(new Animated.Value(12)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(14)).current;

  // Spring Button Scales
  const backBtnScale = useRef(new Animated.Value(1)).current;
  const topSaveBtnScale = useRef(new Animated.Value(1)).current;
  const bottomSaveBtnScale = useRef(new Animated.Value(1)).current;

  const createSpring = (val: Animated.Value, down = 0.95, back = 1) => ({
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

  const backSpring = createSpring(backBtnScale, 0.90, 1);
  const topSaveSpring = createSpring(topSaveBtnScale, 0.95, 1);
  const bottomSaveSpring = createSpring(bottomSaveBtnScale, 0.96, 1);

  // Entrance sequence
  useEffect(() => {
    let isMounted = true;
    let entranceAnim: Animated.CompositeAnimation | null = null;

    const runEntrance = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (!isMounted) return;

      if (reduceMotion) {
        headerOpacity.setValue(1);
        headerTranslateY.setValue(0);
        titleOpacity.setValue(1);
        titleTranslateY.setValue(0);
        filterOpacity.setValue(1);
        filterTranslateY.setValue(0);
        contentOpacity.setValue(1);
        contentTranslateY.setValue(0);
        return;
      }

      entranceAnim = Animated.stagger(75, [
        // Phase 1: Header
        Animated.parallel([
          Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 2: Title Block & Title Input
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 3: Search Bar & Filters
        Animated.parallel([
          Animated.timing(filterOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(filterTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Phase 4: Catalog & Active Protocol
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(contentTranslateY, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      entranceAnim.start();
    };

    runEntrance();

    return () => {
      isMounted = false;
      if (entranceAnim) entranceAnim.stop();
    };
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const list = await apiClient.getExercises({ limit: 50 });
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[GET /exercises CANONICAL RESULT]', {
            count: Array.isArray(list) ? list.length : 0,
            sample: Array.isArray(list) ? list.slice(0, 3).map((e) => ({ id: e.id, name: e.name })) : [],
          });
        }
        if (Array.isArray(list) && list.length > 0) {
          setCatalog(list);
          setIsCatalogUnseeded(false);
        } else {
          setIsCatalogUnseeded(true);
          setCatalog([]);
        }
      } catch {
        setIsCatalogUnseeded(true);
        setCatalog([]);
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
      exercise: item,
    };

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[ACTIVE PROTOCOL ADD]', {
        name: item.name,
        canonical_exercise_id: item.id,
        order_index: newEx.order_index,
      });
    }

    setActiveExercises((prev) => [...prev, newEx]);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setActiveExercises((prev) =>
      prev
        .filter((e) => e.exercise_id !== exerciseId)
        .map((e, idx) => ({ ...e, order_index: idx }))
    );
  };

  const handleUpdateSets = (exerciseId: string, delta: number) => {
    setActiveExercises((prev) =>
      prev.map((e) => {
        if (e.exercise_id === exerciseId) {
          const newSets = Math.max(1, Math.min(10, e.target_sets + delta));
          return { ...e, target_sets: newSets };
        }
        return e;
      })
    );
  };

  const handleUpdateReps = (exerciseId: string, delta: number) => {
    setActiveExercises((prev) =>
      prev.map((e) => {
        if (e.exercise_id === exerciseId) {
          const newReps = Math.max(1, Math.min(50, e.target_reps + delta));
          return { ...e, target_reps: newReps };
        }
        return e;
      })
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

    if (isCatalogUnseeded || catalog.length === 0) {
      setError('Database exercise catalog is unseeded. Run migration 002_seed_exercises.sql in Supabase SQL Editor to save protocols.');
      return;
    }

    const invalidExercise = activeExercises.find(
      (e) => !catalog.some((c) => c.id === e.exercise_id)
    );
    if (invalidExercise) {
      setError(`Movement "${invalidExercise.name}" is not present in the live database catalog.`);
      return;
    }


    const payloadExercises = activeExercises.map((e) => ({
      exercise_id: e.exercise_id,
      order_index: e.order_index,
      target_sets: e.target_sets,
      target_reps: e.target_reps,
      target_weight_kg: e.target_weight_kg || null,
    }));

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[POST WORKOUT PAYLOAD EXERCISES]', {
        title: workoutTitle.trim(),
        total_exercises: payloadExercises.length,
        exercises: payloadExercises.map((ex) => ({
          exercise_id: ex.exercise_id,
          order_index: ex.order_index,
        })),
      });
    }

    setSaving(true);
    try {
      const created = await apiClient.createWorkout({
        title: workoutTitle.trim(),
        category: 'strength',
        difficulty: 'medium',
        is_public: false,
        exercises: payloadExercises,
      });

      Alert.alert('Protocol Created', `${workoutTitle} is now ready.`);
      navigation.navigate('WorkoutDetails', {
        workoutId: created.id,
        initialWorkout: created,
      });
    } catch (err: any) {
      const detailsMsg =
        err?.details && Array.isArray(err.details)
          ? err.details.map((d: any) => `${d.field ? `${d.field}: ` : ''}${d.message}`).join(', ')
          : err?.message;
      setError(detailsMsg || 'Failed to create workout protocol.');
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

  // Calculate truthful derived summary metrics from builder state
  const totalSets = activeExercises.reduce((sum, e) => sum + e.target_sets, 0);
  const estimatedDurationMin = Math.max(15, Math.round(totalSets * 2.5));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* 1. TOP HEADER (Stitch Reference Column 4) */}
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
            {...backSpring}
            onPress={() => navigation.goBack()}
            testID="create-workout-back-button"
            accessibilityRole="button"
            accessibilityLabel="Back to Workout Library"
          >
            <Animated.View
              style={[
                styles.backButton,
                { transform: [{ scale: backBtnScale }] },
              ]}
            >
              <Icon name="back" size={17} color={colors.gold} />
            </Animated.View>
          </TouchableWithoutFeedback>

          <Text style={styles.brandTitle}>KINETRA</Text>

          <View style={styles.gearButton}>
            <Icon name="gear" size={16} color={colors.gold} />
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 2. TITLE & TOP SAVE ROW (Stitch Reference Column 4) */}
          <Animated.View
            style={[
              styles.titleRow,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            <View style={styles.titleLeft}>
              <Text style={styles.mainTitle}>Build Your{'\n'}Session</Text>
              <Text style={styles.subtitle}>Design your protocol. Precision over volume.</Text>
            </View>

            <TouchableWithoutFeedback
              {...topSaveSpring}
              onPress={handleSaveProtocol}
              disabled={saving}
              testID="save-workout-protocol-btn"
              accessibilityRole="button"
              accessibilityLabel="Save Workout Protocol"
            >
              <Animated.View
                style={[
                  styles.saveBtn,
                  { transform: [{ scale: topSaveBtnScale }] },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.inverseText} />
                ) : (
                  <Text style={styles.saveBtnText}>SAVE PROTOCOL</Text>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>

          {/* ERROR BANNER */}
          {error ? (
            <View style={styles.errorCard}>
              <Icon name="warning" size={16} color={colors.crimson} style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* UNSEEDED DATABASE CATALOG NOTICE */}
          {isCatalogUnseeded ? (
            <View style={styles.unseededCard}>
              <Icon name="warning" size={16} color={colors.gold} style={{ marginRight: 8 }} />
              <Text style={styles.unseededText}>
                Database exercise catalog is unseeded (0 rows in Supabase). Run migration 002_seed_exercises.sql in Supabase SQL Editor to save protocols.
              </Text>
            </View>
          ) : null}

          {/* 3. WORKOUT TITLE INPUT */}
          <Animated.View
            style={[
              styles.workoutNameBox,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            <Text style={styles.inputLabelHeader}>PROTOCOL IDENTITY</Text>
            <TextInput
              style={styles.workoutNameInput}
              value={workoutTitle}
              onChangeText={setWorkoutTitle}
              placeholder="Protocol Title..."
              placeholderTextColor={colors.tertiaryText}
              testID="create-workout-title-input"
            />
          </Animated.View>

          {/* 4. SEARCH BAR */}
          <Animated.View
            style={[
              styles.searchBar,
              {
                opacity: filterOpacity,
                transform: [{ translateY: filterTranslateY }],
              },
            ]}
          >
            <Icon name="search" size={16} color={colors.tertiaryText} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises in catalog..."
              placeholderTextColor={colors.tertiaryText}
              testID="exercise-search-input"
            />
          </Animated.View>

          {/* 5. FILTER PILLS */}
          <Animated.View
            style={[
              styles.filterRow,
              {
                opacity: filterOpacity,
                transform: [{ translateY: filterTranslateY }],
              },
            ]}
          >
            {(['ALL', 'PUSH', 'PULL', 'LEGS'] as FilterCategory[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, selectedFilter === f && styles.filterPillActive]}
                onPress={() => setSelectedFilter(f)}
                testID={`filter-${f.toLowerCase()}`}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${f}`}
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
          </Animated.View>

          {/* 6. EXERCISE CATALOG LIST (Top 4 Available) */}
          <Animated.View
            style={[
              styles.catalogList,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            {loadingCatalog ? (
              <View style={styles.loadingCatalogBox}>
                <ActivityIndicator size="small" color={colors.gold} />
                <Text style={styles.loadingCatalogText}>LOADING EXERCISE CATALOG...</Text>
              </View>
            ) : isCatalogUnseeded || catalog.length === 0 ? (
              <View style={styles.emptyCatalogBox} testID="empty-unseeded-catalog">
                <Icon name="warning" size={20} color={colors.gold} style={{ marginBottom: 6 }} />
                <Text style={styles.emptyCatalogTitle}>No Exercises Available</Text>
                <Text style={[styles.emptyCatalogText, { textAlign: 'center', maxWidth: 300 }]}>
                  Exercise catalog has not been seeded. Run migration 002_seed_exercises.sql in Supabase SQL Editor.
                </Text>
              </View>
            ) : filteredCatalog.length === 0 ? (
              <View style={styles.emptyCatalogBox}>
                <Text style={styles.emptyCatalogText}>No matching movements found in catalog.</Text>
              </View>
            ) : (

              filteredCatalog.slice(0, 4).map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.catalogCard}
                  onPress={() => handleAddExercise(ex)}
                  testID={`catalog-exercise-${ex.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${ex.name} to protocol`}
                >
                  <View style={styles.catalogCardLeft}>
                    <Text style={styles.catalogName}>{ex.name}</Text>
                    <Text style={styles.catalogMeta}>
                      COMPOUND • {ex.muscle_group.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.addCircle}>
                    <Text style={styles.plusIcon}>+</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </Animated.View>

          {/* 7. ACTIVE PROTOCOL SECTION */}
          <Animated.View
            style={[
              styles.protocolHeaderRow,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <Text style={styles.protocolTitle}>Active Protocol</Text>
            <View style={styles.exerciseBadge}>
              <Text style={styles.exerciseBadgeText}>
                {activeExercises.length} EXERCISES
              </Text>
            </View>
          </Animated.View>

          {activeExercises.length === 0 ? (
            <Animated.View
              style={[
                styles.emptyProtocolBox,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslateY }],
                },
              ]}
            >
              <Icon name="workout" size={26} color={colors.tertiaryText} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyProtocolText}>
                Tap exercises above to build your protocol
              </Text>
            </Animated.View>
          ) : (
            <Animated.View
              style={{
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              }}
            >
              {/* Active Exercise Cards */}
              {activeExercises.map((ex, idx) => (
                <View key={ex.exercise_id} style={styles.activeExCard} testID={`active-ex-${idx}`}>
                  <View style={styles.activeExTop}>
                    <Text style={styles.activeExIndex}>
                      {String.fromCharCode(65 + idx)}1. {ex.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveExercise(ex.exercise_id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${ex.name}`}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.restText}>REST: {ex.rest_seconds}s</Text>

                  {/* Sets & Reps Stepper Controls */}
                  <View style={styles.setRepRow}>
                    {/* Sets Pill with Steppers */}
                    <View style={styles.pillBox}>
                      <Text style={styles.pillLabel}>SETS</Text>
                      <View style={styles.stepperRow}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleUpdateSets(ex.exercise_id, -1)}
                          accessibilityLabel="Decrease sets"
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.pillValue}>{ex.target_sets}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleUpdateSets(ex.exercise_id, 1)}
                          accessibilityLabel="Increase sets"
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Reps Pill with Steppers */}
                    <View style={styles.pillBox}>
                      <Text style={styles.pillLabel}>REPS</Text>
                      <View style={styles.stepperRow}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleUpdateReps(ex.exercise_id, -1)}
                          accessibilityLabel="Decrease reps"
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.pillValue}>{ex.target_reps}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleUpdateReps(ex.exercise_id, 1)}
                          accessibilityLabel="Increase reps"
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              {/* Truthful Protocol Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeaderRow}>
                  <Icon name="sparkle" size={13} color={colors.gold} style={{ marginRight: 6 }} />
                  <Text style={styles.summaryTitle}>PROTOCOL TELEMETRY SUMMARY</Text>
                </View>
                <View style={styles.summaryMetricsRow}>
                  <View style={styles.summaryMetricItem}>
                    <Text style={styles.summaryMetricLabel}>MOVEMENTS</Text>
                    <Text style={styles.summaryMetricValue}>{activeExercises.length}</Text>
                  </View>
                  <View style={styles.summaryMetricDivider} />
                  <View style={styles.summaryMetricItem}>
                    <Text style={styles.summaryMetricLabel}>TOTAL SETS</Text>
                    <Text style={styles.summaryMetricValue}>{totalSets}</Text>
                  </View>
                  <View style={styles.summaryMetricDivider} />
                  <View style={styles.summaryMetricItem}>
                    <Text style={styles.summaryMetricLabel}>EST. TIME</Text>
                    <Text style={styles.summaryMetricValue}>{estimatedDurationMin}M</Text>
                  </View>
                </View>
              </View>

              {/* Bottom Save Action CTA */}
              <TouchableWithoutFeedback
                {...bottomSaveSpring}
                onPress={handleSaveProtocol}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Confirm and Save Protocol"
              >
                <Animated.View
                  style={[
                    styles.bottomSaveBtn,
                    { transform: [{ scale: bottomSaveBtnScale }] },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.inverseText} />
                  ) : (
                    <Text style={styles.bottomSaveBtnText}>SAVE PROTOCOL →</Text>
                  )}
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
  },
  brandTitle: {
    ...typography.brandWordmarkSmall,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: '800',
  },
  gearButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleLeft: {
    flex: 1,
    paddingRight: 8,
  },
  mainTitle: {
    ...typography.headlineLg,
    fontFamily: 'serif',
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
  },
  saveBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.xs,
    marginLeft: 8,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  saveBtnText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.4)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.crimson,
    fontSize: 12,
    flex: 1,
  },
  unseededCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 184, 63, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  unseededText: {
    ...typography.bodySm,
    color: colors.gold,
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
  },
  workoutNameBox: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  inputLabelHeader: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 2,
  },
  workoutNameInput: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.primaryText,
    fontSize: 13.5,
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
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  filterPillText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  filterPillTextActive: {
    color: colors.inverseText,
    fontWeight: '800',
  },
  catalogList: {
    marginBottom: spacing.lg,
    gap: 8,
  },
  loadingCatalogBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loadingCatalogText: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 9.5,
    letterSpacing: 1.5,
    marginTop: 8,
  },
  emptyCatalogBox: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyCatalogTitle: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyCatalogText: {
    ...typography.bodySm,
    color: colors.tertiaryText,
    fontSize: 12,
  },

  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
  },
  catalogCardLeft: {
    flex: 1,
  },
  catalogName: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.primaryText,
    fontSize: 14,
    marginBottom: 2,
  },
  catalogMeta: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 9.5,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  addCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 184, 63, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  plusIcon: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
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
    borderColor: 'rgba(217, 184, 63, 0.3)',
  },
  exerciseBadgeText: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  emptyProtocolBox: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyProtocolText: {
    ...typography.bodySm,
    color: colors.secondaryText,
    fontSize: 12.5,
  },
  activeExCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    flex: 1,
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  removeIcon: {
    color: colors.secondaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  restText: {
    ...typography.caption,
    color: colors.tertiaryText,
    fontSize: 10.5,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 8,
  },
  setRepRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBox: {
    flex: 1,
    backgroundColor: 'rgba(25, 27, 30, 0.95)',
    borderRadius: borderRadius.xs,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pillLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  pillValue: {
    ...typography.bodyMd,
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 15,
  },
  summaryCard: {
    backgroundColor: 'rgba(18, 20, 22, 0.95)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 184, 63, 0.25)',
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    ...typography.labelCaps,
    color: colors.gold,
    fontSize: 9.5,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryMetricLabel: {
    ...typography.labelCaps,
    color: colors.tertiaryText,
    fontSize: 8.5,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  summaryMetricValue: {
    ...typography.headlineSm,
    fontFamily: 'serif',
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: '700',
  },
  bottomSaveBtn: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.xs,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bottomSaveBtnText: {
    ...typography.labelCaps,
    color: colors.inverseText,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
