import { z } from 'zod';
import { uuidSchema, paginationQuerySchema } from './common.validators.js';

export const exerciseIdParamSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export const exerciseFilterQuerySchema = paginationQuerySchema.extend({
  muscle_group: z.string().trim().max(50).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  equipment: z.string().trim().max(50).optional(),
  search: z.string().trim().max(100).optional(),
});


