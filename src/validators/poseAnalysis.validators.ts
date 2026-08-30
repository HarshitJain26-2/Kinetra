import { z } from 'zod';
import { uuidSchema } from './common.validators.js';

export const poseAnalysisBodySchema = z
  .object({
    session_id: uuidSchema,
    exercise_id: uuidSchema,
    set_number: z.number().int().min(1, 'set_number must be at least 1').default(1),
    reps: z.number().int().min(0, 'reps must be non-negative').max(1000),
    weight_kg: z.number().nonnegative('weight_kg must be non-negative').max(1000).nullable().optional(),
    duration_sec: z.number().int().nonnegative('duration_sec must be non-negative').max(86400).nullable().optional(),
    form_score: z
      .number()
      .min(0, 'Form score must be >= 0')
      .max(100, 'Form score must be <= 100'),
    injury_flag: z.boolean().default(false),
    flagged_body_parts: z
      .array(z.string().max(50))
      .max(50, 'Cannot exceed 50 flagged body parts')
      .default([]),
    rep_scores: z
      .array(z.number().min(0, 'rep_score must be >= 0').max(100, 'rep_score must be <= 100'))
      .max(500, 'rep_scores cannot exceed 500 items')
      .optional(),
    notes: z.string().max(1000, 'notes cannot exceed 1000 characters').nullable().optional(),
  })
  .strict();

