import { z } from 'zod';
import { uuidSchema, paginationQuerySchema } from './common.validators.js';

export const sessionIdParamSchema = z.object({
  id: uuidSchema,
});

export const startSessionBodySchema = z.object({
  workout_id: uuidSchema.nullable().optional(),
});

export const logExerciseBodySchema = z.object({
  exercise_id: uuidSchema,
  set_number: z.number().int().min(1).default(1),
  reps: z.number().int().nonnegative().nullable().optional(),
  weight_kg: z.number().nonnegative().nullable().optional(),
  duration_sec: z.number().int().nonnegative().nullable().optional(),
  form_score: z.number().min(0).max(100).nullable().optional(),
  injury_flag: z.boolean().default(false).optional(),
  feedback: z.string().nullable().optional(),
});

export const endSessionBodySchema = z.object({
  notes: z.string().max(2000).nullable().optional(),
});

export const sessionFilterQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
});
