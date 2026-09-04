import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError, ForbiddenError, BadRequestError, InternalServerError } from '../utils/errors.js';
import { WorkoutRow, WorkoutExerciseRow, ExerciseRow } from '../types/database.js';

export interface WorkoutExerciseInput {
  exercise_id: string;
  order_index: number;
  target_sets?: number;
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

export const ALLOWED_WORKOUT_UPDATE_FIELDS: readonly (keyof Omit<WorkoutRow, 'id' | 'creator_id' | 'created_at' | 'updated_at'>)[] = [
  'title',
  'description',
  'category',
  'difficulty',
  'is_public',
] as const;

export class WorkoutsService {
  /**
   * Helper: Validate that all exercise IDs exist in the master catalog
   */
  private static async validateExerciseIdsExist(exerciseIds: string[]): Promise<void> {
    if (exerciseIds.length === 0) return;
    const uniqueIds = [...new Set(exerciseIds)];
    const { data: existing, error } = await supabaseAdmin
      .from('exercises')
      .select('id')
      .in('id', uniqueIds);

    if (error) {
      throw new InternalServerError('Failed to validate exercise references');
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[BACKEND DB EXERCISE LOOKUP]', {
        requested_ids: uniqueIds,
        found_in_db_count: existing?.length || 0,
        found_ids: existing?.map((e) => e.id) || [],
      });
    }

    if (!existing || existing.length !== uniqueIds.length) {
      throw new BadRequestError('One or more referenced exercises do not exist in catalog', 'VALIDATION_ERROR');
    }
  }

  /**
   * Create a new workout template with attached workout_exercises
   */
  static async createWorkout(
    userId: string,
    input: CreateWorkoutInput
  ): Promise<FullWorkoutResponse> {
    const { exercises, ...workoutData } = input;

    // Validate exercise IDs before insertion
    if (exercises && exercises.length > 0) {
      await this.validateExerciseIdsExist(exercises.map((e) => e.exercise_id));
    }

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
      throw new InternalServerError(`Failed to create workout: ${workoutError?.message}`);
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
        throw new InternalServerError(`Failed to insert workout exercises: ${weError.message}`);
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
  ): Promise<{ data: FullWorkoutResponse[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('workouts')
      .select('*, exercises:workout_exercises(*, exercise:exercises(*))', { count: 'exact' });

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
      throw new InternalServerError('Failed to list workouts');
    }

    return {
      data: (data as FullWorkoutResponse[]) || [],
      total: count ?? (data ? data.length : 0),
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
      throw new NotFoundError('Workout not found', 'WORKOUT_NOT_FOUND');
    }

    // Access check: must be owner or public
    if (!workout.is_public && workout.creator_id !== userId) {
      throw new ForbiddenError('Private workout owned by another user', 'FORBIDDEN');
    }

    // Fetch nested exercises
    const { data: exercises, error: weError } = await supabaseAdmin
      .from('workout_exercises')
      .select('*, exercise:exercises(*)')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    if (weError) {
      throw new InternalServerError('Failed to fetch workout exercises');
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
      .select('*')
      .eq('id', workoutId)
      .single();

    if (checkError || !existing) {
      throw new NotFoundError('Workout not found', 'WORKOUT_NOT_FOUND');
    }

    if (existing.creator_id !== userId) {
      throw new ForbiddenError('Only the workout creator can modify this workout', 'FORBIDDEN');
    }

    const { exercises, ...workoutData } = input;

    // Validate new exercises if provided
    if (exercises !== undefined && exercises.length > 0) {
      await this.validateExerciseIdsExist(exercises.map((e) => e.exercise_id));
    }

    // 2. Update workout metadata if provided
    const sanitizedUpdates: Record<string, any> = {};
    for (const key of ALLOWED_WORKOUT_UPDATE_FIELDS) {
      if (key in workoutData && (workoutData as any)[key] !== undefined) {
        sanitizedUpdates[key] = (workoutData as any)[key];
      }
    }

    if (Object.keys(sanitizedUpdates).length > 0) {
      sanitizedUpdates.updated_at = new Date().toISOString();
      const { error: updateError } = await supabaseAdmin
        .from('workouts')
        .update(sanitizedUpdates)
        .eq('id', workoutId);

      if (updateError) {
        throw new InternalServerError('Failed to update workout metadata');
      }
    }

    // 3. Full replace of exercises if provided
    if (exercises !== undefined) {
      // Delete old exercises
      const { error: deleteError } = await supabaseAdmin
        .from('workout_exercises')
        .delete()
        .eq('workout_id', workoutId);

      if (deleteError) {
        throw new InternalServerError('Failed to clear previous workout exercises');
      }

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
          throw new InternalServerError('Failed to update workout exercises');
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
      throw new NotFoundError('Workout not found', 'WORKOUT_NOT_FOUND');
    }

    if (existing.creator_id !== userId) {
      throw new ForbiddenError('Only the workout creator can delete this workout', 'FORBIDDEN');
    }

    const { error } = await supabaseAdmin.from('workouts').delete().eq('id', workoutId);
    if (error) {
      throw new InternalServerError('Failed to delete workout');
    }
  }
}

