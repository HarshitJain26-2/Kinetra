import { z } from 'zod';
import { uuidSchema, calendarDateSchema } from './common.validators.js';

export const userIdParamSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export const updateProfileBodySchema = z
  .object({
    display_name: z.string().trim().min(1, 'Display name cannot be empty').max(100).optional(),
    avatar_url: z.string().url('Invalid avatar URL').max(500).nullable().optional(),
    date_of_birth: calendarDateSchema.nullable().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable().optional(),
    height_cm: z.number().positive('Height must be positive').max(300, 'Height must be <= 300 cm').nullable().optional(),
    weight_kg: z.number().positive('Weight must be positive').max(500, 'Weight must be <= 500 kg').nullable().optional(),
    fitness_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    onboarding_done: z.boolean().optional(),
  })
  .strict();

