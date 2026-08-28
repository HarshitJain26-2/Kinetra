import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { WorkoutRow, WorkoutExerciseRow, ExerciseRow } from '../types/database.js';

export interface WorkoutExerciseInput {
  exercise_id: string;
  order_index: number;
  target_sets: number;
  target_reps?: number | null;
  target_weight_kg?: number | null;
}

export interface CreateWorkoutInput {
  title: string;
  description?: string | null;
  category?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard';
  is_public?: boolean;
  exercises?: WorkoutExerciseInput[];
}

export interface UpdateWorkoutInput {
  title?: string;
  description?: string | null;
  category?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard';
  is_public?: boolean;
  exercises?: WorkoutExerciseInput[];
}

export interface FullWorkoutResponse extends WorkoutRow {
  exercises: Array<WorkoutExerciseRow & { exercise?: ExerciseRow }>;
}

export class WorkoutsService {
  /**
   * Create a new workout template with attached workout_exercises
   */
  static async createWorkout(
    userId: string,
    input: CreateWorkoutInput
  ): Promise<FullWorkoutResponse> {
    const { exercises, ...workoutData } = input;

    // 1. Insert workout template
    const { data: workout, error: workoutError } = await supabaseAdmin
      .from('workouts')
      .insert({
        creator_id: userId,
        title: workoutData.title,
        description: workoutData.description || null,
        category: workoutData.category || null,
        difficulty: workoutData.difficulty || 'medium',
        is_public: workoutData.is_public ?? false,
      })
      .select()
      .single();

    if (workoutError || !workout) {
      throw new Error(`Failed to create workout: ${workoutError?.message}`);
    }

    // 2. Insert exercises if provided
    let insertedExercises: WorkoutExerciseRow[] = [];
    if (exercises && exercises.length > 0) {
      const exerciseRows = exercises.map((ex) => ({
        workout_id: workout.id,
        exercise_id: ex.exercise_id,
        order_index: ex.order_index,
        target_sets: ex.target_sets || 3,
        target_reps: ex.target_reps ?? null,
        target_weight_kg: ex.target_weight_kg ?? null,
      }));

      const { data: weData, error: weError } = await supabaseAdmin
        .from('workout_exercises')
        .insert(exerciseRows)
        .select('*, exercise:exercises(*)');

      if (weError) {
        // Rollback created workout on failure
        await supabaseAdmin.from('workouts').delete().eq('id', workout.id);
        throw new Error(`Failed to insert workout exercises: ${weError.message}`);
      }

      insertedExercises = weData || [];
    }

    return {
      ...workout,
      exercises: insertedExercises,
    };
  }

  /**
   * List workouts (own private + public workouts)
   */
  static async listWorkouts(
    userId: string,
    options: { category?: string; difficulty?: string; mine?: boolean; page?: number; limit?: number }
  ): Promise<{ data: WorkoutRow[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from('workouts').select('*', { count: 'exact' });

    if (options.mine) {
      query = query.eq('creator_id', userId);
    } else {
      query = query.or(`creator_id.eq.${userId},is_public.eq.true`);
    }

    if (options.category) {
      query = query.ilike('category', `%${options.category}%`);
    }
    if (options.difficulty) {
      query = query.eq('difficulty', options.difficulty);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list workouts: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
    };
  }

  /**
   * Get workout by ID with full nested exercises details
   */
  static async getWorkoutById(userId: string, workoutId: string): Promise<FullWorkoutResponse> {
    const { data: workout, error } = await supabaseAdmin
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (error || !workout) {
      throw new NotFoundError('Workout not found');
    }

    // Access check: must be owner or public
    if (!workout.is_public && workout.creator_id !== userId) {
      throw new ForbiddenError('You do not have access to this private workout');
    }

    // Fetch nested exercises
    const { data: exercises, error: weError } = await supabaseAdmin
      .from('workout_exercises')
      .select('*, exercise:exercises(*)')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    if (weError) {
      throw new Error(`Failed to fetch workout exercises: ${weError.message}`);
    }

    return {
      ...workout,
      exercises: exercises || [],
    };
  }

  /**
   * Update workout details and optionally perform full replace of workout_exercises
   */
  static async updateWorkout(
    userId: string,
    workoutId: string,
    input: UpdateWorkoutInput
  ): Promise<FullWorkoutResponse> {
    // 1. Verify existence & ownership
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('workouts')
      .select('creator_id')
      .eq('id', workoutId)
      .single();

    if (checkError || !existing) {
      throw new NotFoundError('Workout not found');
    }

    if (existing.creator_id !== userId) {
      throw new ForbiddenError('Only the workout creator can modify this workout');
    }

    const { exercises, ...workoutData } = input;

    // 2. Update workout metadata if provided
    let updatedWorkout: WorkoutRow = existing as any;
    if (Object.keys(workoutData).length > 0) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('workouts')
        .update({
          ...workoutData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workoutId)
        .select()
        .single();

      if (updateError || !updated) {
        throw new Error(`Failed to update workout: ${updateError?.message}`);
      }
      updatedWorkout = updated;
    }

    // 3. Full replace of exercises if provided
    if (exercises !== undefined) {
      // Delete old exercises
      await supabaseAdmin.from('workout_exercises').delete().eq('workout_id', workoutId);

      // Insert new exercises
      if (exercises.length > 0) {
        const exerciseRows = exercises.map((ex) => ({
          workout_id: workoutId,
          exercise_id: ex.exercise_id,
          order_index: ex.order_index,
          target_sets: ex.target_sets || 3,
          target_reps: ex.target_reps ?? null,
          target_weight_kg: ex.target_weight_kg ?? null,
        }));

        const { error: insertError } = await supabaseAdmin
          .from('workout_exercises')
          .insert(exerciseRows);

        if (insertError) {
          throw new Error(`Failed to update workout exercises: ${insertError.message}`);
        }
      }
    }

    return this.getWorkoutById(userId, workoutId);
  }

  /**
   * Delete workout
   */
  static async deleteWorkout(userId: string, workoutId: string): Promise<void> {
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('workouts')
      .select('creator_id')
      .eq('id', workoutId)
      .single();

    if (checkError || !existing) {
      throw new NotFoundError('Workout not found');
    }

    if (existing.creator_id !== userId) {
      throw new ForbiddenError('Only the workout creator can delete this workout');
    }

    const { error } = await supabaseAdmin.from('workouts').delete().eq('id', workoutId);
    if (error) {
      throw new Error(`Failed to delete workout: ${error.message}`);
    }
  }
}
