import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';

export interface PoseAnalysisSetSummaryInput {
  session_id: string;
  exercise_id: string;
  set_number?: number;
  reps: number;
  weight_kg?: number | null;
  duration_sec?: number | null;
  form_score: number;
  injury_flag?: boolean;
  flagged_body_parts?: string[];
  rep_scores?: number[];
  notes?: string | null;
}

export interface PoseAnalysisResponse {
  session_exercise_id: string;
  form_score: number;
  injury_flag: boolean;
  feedback: string;
  flagged_body_parts: string[];
  injury_flag_id: string | null;
}

export class PoseAnalysisService {
  /**
   * Ingest completed set summary from on-device AI pose analysis model.
   * Creates session_exercises entry and auto-raises injury_flags if needed.
   */
  static async submitSetAnalysis(
    userId: string,
    input: PoseAnalysisSetSummaryInput
  ): Promise<PoseAnalysisResponse> {
    // 1. Verify session existence, ownership, and active state
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('user_id, status')
      .eq('id', input.session_id)
      .single();

    if (sessionError || !session) {
      throw new NotFoundError('Session not found');
    }

    if (session.user_id !== userId) {
      throw new ForbiddenError('You do not own this session');
    }

    if (session.status !== 'active') {
      throw new BadRequestError('Cannot submit analysis to an inactive session', 'SESSION_NOT_ACTIVE');
    }

    // 2. Verify exercise exists
    const { data: exercise, error: exError } = await supabaseAdmin
      .from('exercises')
      .select('name')
      .eq('id', input.exercise_id)
      .single();

    if (exError || !exercise) {
      throw new NotFoundError('Exercise not found');
    }

    // 3. Generate dynamic contextual feedback based on score and injury status
    let feedback = '';
    const isInjury: boolean = Boolean(input.injury_flag) || Boolean(input.flagged_body_parts && input.flagged_body_parts.length > 0);

    if (isInjury) {
      feedback = `Form breakdown detected on ${input.flagged_body_parts?.join(', ') || 'target joints'}. Reduce weight and focus on alignment.`;
    } else if (input.form_score >= 90) {
      feedback = `Outstanding form on ${exercise.name}! Consistent depth and biomechanics.`;
    } else if (input.form_score >= 75) {
      feedback = `Good set on ${exercise.name}. Minor joint deviation detected; maintain steady tempo.`;
    } else {
      feedback = `Form score sub-optimal (${input.form_score}%). Focus on controlled eccentric phase.`;
    }

    // 4. Create session_exercises row
    const { data: sessionExercise, error: seError } = await supabaseAdmin
      .from('session_exercises')
      .insert({
        session_id: input.session_id,
        exercise_id: input.exercise_id,
        set_number: input.set_number || 1,
        reps: input.reps,
        weight_kg: input.weight_kg ?? null,
        duration_sec: input.duration_sec ?? null,
        form_score: input.form_score,
        injury_flag: isInjury,
        feedback,
      })
      .select()
      .single();

    if (seError || !sessionExercise) {
      throw new Error(`Failed to record session exercise: ${seError?.message}`);
    }

    // 5. If injury flagged, auto-create injury_flags record
    let createdInjuryFlagId: string | null = null;
    if (isInjury) {
      const primaryBodyPart = input.flagged_body_parts?.[0] || 'general_joint';
      const severity = input.form_score < 60 ? 'high' : input.form_score < 75 ? 'medium' : 'low';

      const { data: injuryFlag, error: injuryError } = await supabaseAdmin
        .from('injury_flags')
        .insert({
          user_id: userId,
          session_exercise_id: sessionExercise.id,
          body_part: primaryBodyPart,
          severity,
          description: `AI detected excessive torque / valgus on ${primaryBodyPart} during ${exercise.name} (Set ${input.set_number || 1})`,
          source: 'ai',
          resolved: false,
          flagged_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (!injuryError && injuryFlag) {
        createdInjuryFlagId = injuryFlag.id;
      }
    }

    return {
      session_exercise_id: sessionExercise.id,
      form_score: input.form_score,
      injury_flag: isInjury,
      feedback,
      flagged_body_parts: input.flagged_body_parts || [],
      injury_flag_id: createdInjuryFlagId,
    };
  }
}
