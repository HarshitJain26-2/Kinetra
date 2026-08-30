/**
 * Kinetra Pose Analysis Engine — API Integration Mapper
 *
 * Framework-independent boundary between PoseEngine and the HTTP API layer.
 * Converts pure PoseAnalysisResult + Mobile Session Metadata into
 * a validated PoseAnalysisSetSummaryInput DTO.
 *
 * No imports from Express, Supabase, HTTP, or database libraries.
 */

import type { PoseAnalysisResult, FormFlag } from './types.js';

export interface PoseSessionMetadata {
  /** Target workout session UUID */
  session_id: string;
  /** Catalog exercise UUID */
  exercise_id: string;
  /** Set number within session (>= 1, default 1) */
  set_number?: number;
  /** Resistance load in kilograms (optional) */
  weight_kg?: number | null;
  /** Set duration in seconds (optional) */
  duration_sec?: number | null;
  /** Optional user or coaching notes */
  notes?: string | null;
}

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

/**
 * Mapping table from form flag identifiers to anatomical body parts.
 */
const FLAG_TO_BODY_PART_MAP: Record<string, string> = {
  knee_over_flexion: 'knee',
  excessive_forward_lean: 'lower_back',
  elbow_over_flexion: 'elbow',
  body_alignment_deviation: 'lower_back',
  incomplete_extension: 'elbow',
  hip_sag: 'hips',
  knee_valgus: 'knee',
  shoulder_impingement: 'shoulder',
};

/**
 * Extract distinct flagged body parts from FormFlag[] list.
 */
export function extractFlaggedBodyParts(flags: FormFlag[]): string[] {
  if (!flags || !Array.isArray(flags) || flags.length === 0) {
    return [];
  }

  const parts = new Set<string>();
  for (const flagObj of flags) {
    if (!flagObj?.flag) continue;
    const mapped = FLAG_TO_BODY_PART_MAP[flagObj.flag];
    if (mapped) {
      parts.add(mapped);
    } else {
      // Fallback: derive from flag prefix or generic joint
      const prefix = flagObj.flag.split('_')[0];
      parts.add(prefix || 'general_joint');
    }
  }

  return Array.from(parts);
}

/**
 * Transform a PoseEngine analysis result + session metadata into an API DTO.
 *
 * @param result   - Output from PoseEngine.analyze()
 * @param metadata - Client session metadata (session_id, exercise_id, weight, etc.)
 */
export function mapPoseResultToApiPayload(
  result: PoseAnalysisResult,
  metadata: PoseSessionMetadata
): PoseAnalysisSetSummaryInput {
  const flaggedParts = extractFlaggedBodyParts(result.flags);
  const hasHighSeverityFlag = result.flags?.some(f => f.severity === 'high') ?? false;
  const isInjury = hasHighSeverityFlag || (result.average_form_score > 0 && result.average_form_score < 60);

  // Compile notes from form feedback if no custom notes supplied
  let compiledNotes = metadata.notes ?? null;
  if (!compiledNotes && result.flags && result.flags.length > 0) {
    compiledNotes = result.flags.map(f => f.description).join('; ');
    if (compiledNotes.length > 1000) {
      compiledNotes = compiledNotes.slice(0, 997) + '...';
    }
  }

  return {
    session_id: metadata.session_id,
    exercise_id: metadata.exercise_id,
    set_number: metadata.set_number ?? 1,
    reps: Math.max(0, Math.floor(result.rep_count)),
    weight_kg: metadata.weight_kg ?? null,
    duration_sec: metadata.duration_sec ?? null,
    form_score: Math.min(100, Math.max(0, Math.round(result.average_form_score))),
    injury_flag: isInjury,
    flagged_body_parts: flaggedParts,
    rep_scores: (result.rep_scores || []).map(s => Math.min(100, Math.max(0, Math.round(s)))),
    notes: compiledNotes,
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Strictly validate the mapped API payload to ensure no NaN, Infinity, or out-of-range values reach the database.
 */
export function validatePoseAnalysisPayload(payload: PoseAnalysisSetSummaryInput): ValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be a non-null object'] };
  }

  // Session ID & Exercise ID
  if (!payload.session_id || typeof payload.session_id !== 'string') {
    errors.push('session_id is required');
  }
  if (!payload.exercise_id || typeof payload.exercise_id !== 'string') {
    errors.push('exercise_id is required');
  }

  // Reps
  if (
    typeof payload.reps !== 'number' ||
    !Number.isFinite(payload.reps) ||
    Number.isNaN(payload.reps) ||
    payload.reps < 0 ||
    payload.reps > 1000
  ) {
    errors.push('reps must be a finite number between 0 and 1000');
  }

  // Form Score
  if (
    typeof payload.form_score !== 'number' ||
    !Number.isFinite(payload.form_score) ||
    Number.isNaN(payload.form_score) ||
    payload.form_score < 0 ||
    payload.form_score > 100
  ) {
    errors.push('form_score must be a finite number between 0 and 100');
  }

  // Weight kg
  if (payload.weight_kg !== null && payload.weight_kg !== undefined) {
    if (typeof payload.weight_kg !== 'number' || !Number.isFinite(payload.weight_kg) || payload.weight_kg < 0) {
      errors.push('weight_kg must be a non-negative finite number or null');
    }
  }

  // Duration sec
  if (payload.duration_sec !== null && payload.duration_sec !== undefined) {
    if (typeof payload.duration_sec !== 'number' || !Number.isFinite(payload.duration_sec) || payload.duration_sec < 0) {
      errors.push('duration_sec must be a non-negative finite integer or null');
    }
  }

  // Rep Scores
  if (payload.rep_scores !== undefined && payload.rep_scores !== null) {
    if (!Array.isArray(payload.rep_scores)) {
      errors.push('rep_scores must be an array');
    } else {
      for (let i = 0; i < payload.rep_scores.length; i++) {
        const score = payload.rep_scores[i];
        if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100) {
          errors.push(`rep_scores[${i}] must be a finite number between 0 and 100`);
          break;
        }
      }
    }
  }

  // Flagged Body Parts
  if (payload.flagged_body_parts !== undefined && payload.flagged_body_parts !== null) {
    if (!Array.isArray(payload.flagged_body_parts)) {
      errors.push('flagged_body_parts must be an array');
    } else {
      for (const part of payload.flagged_body_parts) {
        if (typeof part !== 'string' || part.length > 50) {
          errors.push('flagged_body_parts must contain strings with max length 50');
          break;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
