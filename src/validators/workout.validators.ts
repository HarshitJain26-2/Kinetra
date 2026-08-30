import { z } from 'zod';
import { uuidSchema, paginationQuerySchema } from './common.validators.js';

export const workoutIdParamSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export const workoutExerciseItemSchema = z
  .object({
    exercise_id: uuidSchema,
    order_index: z.number().int().min(0, 'order_index must be >= 0'),
    target_sets: z.number().int().min(1, 'target_sets must be at least 1').max(100).default(3),
    target_reps: z.number().int().min(1, 'target_reps must be at least 1').max(1000).nullable().optional(),
    target_weight_kg: z.number().nonnegative('target_weight_kg must be >= 0').max(1000).nullable().optional(),
  })
  .strict();

const uniqueOrderIndexRefine = (exercises?: Array<{ order_index: number }>) => {
  if (!exercises || exercises.length === 0) return true;
  const indices = exercises.map((e) => e.order_index);
  return new Set(indices).size === indices.length;
};

export const createWorkoutBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(150, 'Title cannot exceed 150 characters'),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').nullable().optional(),
    category: z.string().max(50, 'Category cannot exceed 50 characters').nullable().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium').optional(),
    is_public: z.boolean().default(false).optional(),
    exercises: z.array(workoutExerciseItemSchema).max(50, 'Workout cannot exceed 50 exercises').optional(),
  })
  .strict()
  .refine((data) => uniqueOrderIndexRefine(data.exercises), {
    message: 'Exercises must not contain duplicate order_index values',
    path: ['exercises'],
  });

export const updateWorkoutBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty').max(150, 'Title cannot exceed 150 characters').optional(),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').nullable().optional(),
    category: z.string().max(50, 'Category cannot exceed 50 characters').nullable().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    is_public: z.boolean().optional(),
    exercises: z.array(workoutExerciseItemSchema).max(50, 'Workout cannot exceed 50 exercises').optional(),
  })
  .strict()
  .refine((data) => uniqueOrderIndexRefine(data.exercises), {
    message: 'Exercises must not contain duplicate order_index values',
    path: ['exercises'],
  });

export const workoutFilterQuerySchema = paginationQuerySchema.extend({
  category: z.string().max(50).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  mine: z.coerce.boolean().optional(),
});

