import { z } from 'zod';
import { uuidSchema, paginationQuerySchema } from './common.validators.js';

export const workoutIdParamSchema = z.object({
  id: uuidSchema,
});

export const workoutExerciseItemSchema = z.object({
  exercise_id: uuidSchema,
  order_index: z.number().int().min(0),
  target_sets: z.number().int().min(1).default(3),
  target_reps: z.number().int().min(1).nullable().optional(),
  target_weight_kg: z.number().nonnegative().nullable().optional(),
});

export const createWorkoutBodySchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium').optional(),
  is_public: z.boolean().default(false).optional(),
  exercises: z.array(workoutExerciseItemSchema).optional(),
});

export const updateWorkoutBodySchema = createWorkoutBodySchema.partial();

export const workoutFilterQuerySchema = paginationQuerySchema.extend({
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  mine: z.coerce.boolean().optional(),
});
