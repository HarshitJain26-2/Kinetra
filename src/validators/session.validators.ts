import { z } from 'zod';
import { uuidSchema, paginationQuerySchema } from './common.validators.js';

export const sessionIdParamSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export const startSessionBodySchema = z
  .object({
    workout_id: uuidSchema.nullable().optional(),
  })
  .strict();

export const logExerciseBodySchema = z
  .object({
    exercise_id: uuidSchema,
    set_number: z.number().int().min(1, 'set_number must be at least 1').default(1),
    reps: z.number().int().nonnegative('reps must be non-negative').max(1000).nullable().optional(),
    weight_kg: z.number().nonnegative('weight_kg must be non-negative').max(1000).nullable().optional(),
    duration_sec: z.number().int().nonnegative('duration_sec must be non-negative').max(86400).nullable().optional(),
    form_score: z.number().min(0, 'form_score must be >= 0').max(100, 'form_score must be <= 100').nullable().optional(),
    injury_flag: z.boolean().default(false).optional(),
    feedback: z.string().max(1000).nullable().optional(),
  })
  .strict();

export const endSessionBodySchema = z
  .object({
    notes: z.string().max(2000, 'notes cannot exceed 2000 characters').nullable().optional(),
  })
  .strict();

export const sessionFilterQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
});

