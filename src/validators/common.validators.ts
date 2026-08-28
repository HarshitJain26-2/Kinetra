import { z } from 'zod';

export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});
