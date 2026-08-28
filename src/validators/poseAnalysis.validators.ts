import { z } from 'zod';
import { uuidSchema } from './common.validators.js';

export const poseAnalysisBodySchema = z.object({
  session_id: uuidSchema,
  exercise_id: uuidSchema,
  set_number: z.number().int().min(1).default(1),
  reps: z.number().int().min(0, 'Reps must be non-negative'),
  weight_kg: z.number().nonnegative().nullable().optional(),
  duration_sec: z.number().int().nonnegative().nullable().optional(),
  form_score: z
    .number()
    .min(0, 'Form score must be >= 0')
    .max(100, 'Form score must be <= 100'),
  injury_flag: z.boolean().default(false),
  flagged_body_parts: z.array(z.string()).default([]),
  rep_scores: z.array(z.number().min(0).max(100)).optional(),
  notes: z.string().max(1000).nullable().optional(),
});
