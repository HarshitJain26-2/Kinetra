import { z } from 'zod';
import { uuidSchema } from './common.validators.js';

export const userIdParamSchema = z.object({
  id: uuidSchema,
});

export const updateProfileBodySchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().nullable().optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable().optional(),
  height_cm: z.number().positive().max(300).nullable().optional(),
  weight_kg: z.number().positive().max(500).nullable().optional(),
  fitness_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  onboarding_done: z.boolean().optional(),
});
