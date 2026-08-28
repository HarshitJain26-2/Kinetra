import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { SessionRow, SessionExerciseRow, ExerciseRow } from '../types/database.js';

export interface StartSessionInput {
  workout_id?: string | null;
}

export interface LogExerciseInput {
  exercise_id: string;
  set_number?: number;
  reps?: number | null;
  weight_kg?: number | null;
  duration_sec?: number | null;
  form_score?: number | null;
  injury_flag?: boolean;
  feedback?: string | null;
}

export interface EndSessionSummary {
  total_sets: number;
  total_reps: number;
  avg_form_score: number | null;
  injury_flags_raised: number;
}

export interface FullSessionResponse extends SessionRow {
  exercises: Array<SessionExerciseRow & { exercise?: ExerciseRow }>;
  summary?: EndSessionSummary;
}

export class SessionsService {
  /**
   * Start a new session for user
   */
  static async startSession(userId: string, input: StartSessionInput): Promise<SessionRow> {
    // Check if user already has an active session
    const { data: activeSession } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (activeSession) {
      throw new BadRequestError('User already has an active workout session', 'SESSION_ALREADY_ACTIVE');
    }

    if (input.workout_id) {
      const { data: workout, error } = await supabaseAdmin
        .from('workouts')
        .select('id')
        .eq('id', input.workout_id)
        .single();

      if (error || !workout) {
        throw new NotFoundError('Workout not found');
      }
    }

    const { data: session, error: createError } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: userId,
        workout_id: input.workout_id || null,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError || !session) {
      throw new Error(`Failed to start session: ${createError?.message}`);
    }

    return session;
  }

  /**
   * Log an exercise set manually
   */
  static async logExercise(
    userId: string,
    sessionId: string,
    input: LogExerciseInput
  ): Promise<SessionExerciseRow> {
    // 1. Verify session ownership and active status
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('user_id, status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new NotFoundError('Session not found');
    }

    if (session.user_id !== userId) {
      throw new ForbiddenError('You do not own this session');
    }

    if (session.status !== 'active') {
      throw new BadRequestError('Cannot log exercise to an inactive session', 'SESSION_NOT_ACTIVE');
    }

    // 2. Verify exercise existence
    const { data: exercise, error: exError } = await supabaseAdmin
      .from('exercises')
      .select('id')
      .eq('id', input.exercise_id)
      .single();

    if (exError || !exercise) {
      throw new NotFoundError('Exercise not found');
    }

    // 3. Insert manual set log
    const { data: loggedExercise, error: logError } = await supabaseAdmin
      .from('session_exercises')
      .insert({
        session_id: sessionId,
        exercise_id: input.exercise_id,
        set_number: input.set_number || 1,
        reps: input.reps ?? null,
        weight_kg: input.weight_kg ?? null,
        duration_sec: input.duration_sec ?? null,
        form_score: input.form_score ?? null,
        injury_flag: input.injury_flag ?? false,
        feedback: input.feedback ?? null,
      })
      .select()
      .single();

    if (logError || !loggedExercise) {
      throw new Error(`Failed to log session exercise: ${logError?.message}`);
    }

    return loggedExercise;
  }

  /**
   * End an active session and compute duration, calories, and metrics summary
   */
  static async endSession(
    userId: string,
    sessionId: string,
    notes?: string | null
  ): Promise<SessionRow & { summary: EndSessionSummary }> {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new NotFoundError('Session not found');
    }

    if (session.user_id !== userId) {
      throw new ForbiddenError('You do not own this session');
    }

    if (session.status !== 'active') {
      throw new BadRequestError('Session is already completed or cancelled', 'SESSION_NOT_ACTIVE');
    }

    const startedAt = new Date(session.started_at).getTime();
    const endedAtDate = new Date();
    const endedAt = endedAtDate.toISOString();
    const durationSec = Math.max(1, Math.round((endedAtDate.getTime() - startedAt) / 1000));

    // Fetch all logged sets to calculate summary metrics
    const { data: exercises } = await supabaseAdmin
      .from('session_exercises')
      .select('reps, form_score, injury_flag')
      .eq('session_id', sessionId);

    const loggedSets = exercises || [];
    const totalSets = loggedSets.length;
    const totalReps = loggedSets.reduce((sum, item) => sum + (item.reps || 0), 0);
    const scoredSets = loggedSets.filter((s) => s.form_score !== null);
    const avgFormScore =
      scoredSets.length > 0
        ? Number(
            (
              scoredSets.reduce((sum, item) => sum + Number(item.form_score), 0) /
              scoredSets.length
            ).toFixed(1)
          )
        : null;
    const injuryFlagsRaised = loggedSets.filter((s) => s.injury_flag).length;

    // Approximate calorie estimation (e.g. 5.5 kcal / min of vigorous training)
    const caloriesEst = Number(((durationSec / 60) * 5.5).toFixed(1));

    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        status: 'completed',
        ended_at: endedAt,
        duration_sec: durationSec,
        calories_est: caloriesEst,
        notes: notes || session.notes,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError || !updatedSession) {
      throw new Error(`Failed to end session: ${updateError?.message}`);
    }

    return {
      ...updatedSession,
      summary: {
        total_sets: totalSets,
        total_reps: totalReps,
        avg_form_score: avgFormScore,
        injury_flags_raised: injuryFlagsRaised,
      },
    };
  }

  /**
   * List past sessions for user
   */
  static async listSessions(
    userId: string,
    options: { status?: string; page?: number; limit?: number }
  ): Promise<{ data: SessionRow[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data, count, error } = await query
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list sessions: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
    };
  }

  /**
   * Get single session detail with exercises
   */
  static async getSessionById(userId: string, sessionId: string): Promise<FullSessionResponse> {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new NotFoundError('Session not found');
    }

    if (session.user_id !== userId) {
      throw new ForbiddenError('You do not own this session');
    }

    const { data: exercises, error: exError } = await supabaseAdmin
      .from('session_exercises')
      .select('*, exercise:exercises(*)')
      .eq('session_id', sessionId)
      .order('recorded_at', { ascending: true });

    if (exError) {
      throw new Error(`Failed to fetch session exercises: ${exError.message}`);
    }

    return {
      ...session,
      exercises: exercises || [],
    };
  }
}
