import { z } from 'zod';
import { uuidSchema, paginationQuerySchema } from './common.validators.js';

export const injuryIdParamSchema = z.object({
  id: uuidSchema,
});

export const injuryFilterQuerySchema = paginationQuerySchema.extend({
  resolved: z.coerce.boolean().optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
});

export const patchInjuryBodySchema = z.object({
  resolved: z.boolean().optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  description: z.string().max(1000).optional(),
});

export const upsertNutritionProfileBodySchema = z.object({
  goal: z.enum(['lose_weight', 'maintain', 'gain_muscle', 'general_health']).optional(),
  diet_type: z.enum(['omnivore', 'vegetarian', 'vegan', 'keto', 'paleo', 'custom']).optional(),
  allergies: z.array(z.string()).optional(),
  daily_cal_target: z.number().positive().max(10000).optional(),
  protein_g: z.number().nonnegative().max(1000).optional(),
  carbs_g: z.number().nonnegative().max(1000).optional(),
  fat_g: z.number().nonnegative().max(1000).optional(),
});

export const nutritionRecommendBodySchema = z.object({
  num_meals: z.number().int().min(1).max(8).default(4).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const challengeIdParamSchema = z.object({
  id: uuidSchema,
});

export const createChallengeBodySchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(1000).nullable().optional(),
  type: z.enum(['streak', 'volume', 'time', 'custom']).default('custom'),
  metric_key: z.string().max(50).nullable().optional(),
  target_value: z.number().positive().nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export const challengeFilterQuerySchema = paginationQuerySchema.extend({
  type: z.enum(['streak', 'volume', 'time', 'custom']).optional(),
  mine: z.coerce.boolean().optional(),
});

export const leaderboardQuerySchema = paginationQuerySchema.extend({
  challenge_id: uuidSchema.optional(),
  metric: z.string().default('total_reps').optional(),
});
