import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';
import { ExerciseRow } from '../types/database.js';

export interface ExerciseFilterOptions {
  muscle_group?: string;
  difficulty?: string;
  equipment?: string;
  page?: number;
  limit?: number;
}

export class ExercisesService {
  /**
   * List exercises with optional filters and pagination
   */
  static async listExercises(options: ExerciseFilterOptions): Promise<{ data: ExerciseRow[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from('exercises').select('*', { count: 'exact' });

    if (options.muscle_group) {
      query = query.ilike('muscle_group', `%${options.muscle_group}%`);
    }
    if (options.difficulty) {
      query = query.eq('difficulty', options.difficulty);
    }
    if (options.equipment) {
      query = query.ilike('equipment', `%${options.equipment}%`);
    }

    const { data, count, error } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list exercises: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
    };
  }

  /**
   * Get exercise details by ID including landmarks & instructions
   */
  static async getExerciseById(id: string): Promise<ExerciseRow> {
    const { data, error } = await supabaseAdmin
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Exercise not found', 'EXERCISE_NOT_FOUND');
    }

    return data;
  }
}
