import { z } from 'zod';
import { uuidSchema, paginationQuerySchema, calendarDateSchema } from './common.validators.js';

export const injuryIdParamSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export const injuryFilterQuerySchema = paginationQuerySchema.extend({
  resolved: z.coerce.boolean().optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
});

export const patchInjuryBodySchema = z
  .object({
    resolved: z.boolean().optional(),
    severity: z.enum(['low', 'medium', 'high']).optional(),
  })
  .strict()
  .refine((data) => data.resolved !== undefined || data.severity !== undefined, {
    message: 'At least one field (resolved or severity) must be provided for update',
  });

export const upsertNutritionProfileBodySchema = z
  .object({
    goal: z.enum(['lose_weight', 'maintain', 'gain_muscle', 'general_health']).optional(),
    diet_type: z.enum(['omnivore', 'vegetarian', 'vegan', 'keto', 'paleo', 'custom']).optional(),
    allergies: z.array(z.string().max(50)).max(50, 'Allergies cannot exceed 50 items').optional(),
    daily_cal_target: z.number().positive('daily_cal_target must be positive').max(10000).optional(),
    protein_g: z.number().nonnegative('protein_g must be non-negative').max(1000).optional(),
    carbs_g: z.number().nonnegative('carbs_g must be non-negative').max(1000).optional(),
    fat_g: z.number().nonnegative('fat_g must be non-negative').max(1000).optional(),
  })
  .strict();

export const nutritionRecommendBodySchema = z
  .object({
    num_meals: z.number().int().min(1, 'num_meals must be at least 1').max(8, 'num_meals cannot exceed 8').default(4).optional(),
    date: calendarDateSchema.optional(),
  })
  .strict();

export const challengeIdParamSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export const createChallengeBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(150, 'Title cannot exceed 150 characters'),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').nullable().optional(),
    type: z.enum(['streak', 'volume', 'time', 'custom']).default('custom'),
    metric_key: z.string().max(50).nullable().optional(),
    target_value: z.number().positive('target_value must be positive').max(1000000).nullable().optional(),
    start_date: calendarDateSchema,
    end_date: calendarDateSchema,
  })
  .strict()
  .refine(
    (data) => {
      const [sy, sm, sd] = data.start_date.split('-').map(Number);
      const [ey, em, ed] = data.end_date.split('-').map(Number);
      const startDate = new Date(Date.UTC(sy, sm - 1, sd));
      const endDate = new Date(Date.UTC(ey, em - 1, ed));
      return endDate >= startDate;
    },
    {
      message: 'end_date must be on or after start_date',
      path: ['end_date'],
    }
  );

export const challengeFilterQuerySchema = paginationQuerySchema.extend({
  type: z.enum(['streak', 'volume', 'time', 'custom']).optional(),
  mine: z.coerce.boolean().optional(),
});

export const leaderboardQuerySchema = paginationQuerySchema.extend({
  challenge_id: uuidSchema.optional(),
  metric: z.string().max(50).default('total_reps').optional(),
});

