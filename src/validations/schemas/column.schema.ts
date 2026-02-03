import { z } from 'zod';

export const createColumnSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
});

export const updateColumnSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateColumnSchemaInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnSchemaInput = z.infer<typeof updateColumnSchema>;
