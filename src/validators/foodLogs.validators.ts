import { z } from 'zod';
import { uuidSchema, calendarDateSchema } from './common.validators.js';

export const foodLogIdParamSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export const foodLogFilterQuerySchema = z
  .object({
    date: calendarDateSchema.optional(),
  })
  .strict();

export const createFoodLogBodySchema = z
  .object({
    log_date: calendarDateSchema.optional(),
    meal_name: z.string().trim().min(1, 'meal_name is required').max(150, 'meal_name cannot exceed 150 characters'),
    timing: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']).default('lunch').optional(),
    calories: z.number().nonnegative('calories must be >= 0').max(10000, 'calories cannot exceed 10000'),
    protein_g: z.number().nonnegative('protein_g must be >= 0').max(1000).default(0).optional(),
    carbs_g: z.number().nonnegative('carbs_g must be >= 0').max(1000).default(0).optional(),
    fat_g: z.number().nonnegative('fat_g must be >= 0').max(1000).default(0).optional(),
  })
  .strict();
