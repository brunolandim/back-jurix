import { z } from 'zod';

const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent'] as const);

export const createCaseSchema = z.object({
  columnId: z.string().uuid('Invalid column ID'),
  number: z.string().min(1, 'Process number is required'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  client: z.string().min(1, 'Client name is required').max(255),
  priority: priorityEnum.optional(),
  assignedTo: z.string().uuid('Invalid lawyer ID').optional(),
});

export const updateCaseSchema = z.object({
  columnId: z.string().uuid('Invalid column ID').optional(),
  number: z.string().min(1, 'Process number is required').optional(),
  title: z.string().min(1, 'Title is required').max(255).optional(),
  description: z.string().optional(),
  client: z.string().min(1, 'Client name is required').max(255).optional(),
  priority: priorityEnum.optional(),
  assignedTo: z.string().uuid('Invalid lawyer ID').nullable().optional(),
});

export const moveCaseSchema = z.object({
  columnId: z.string().uuid('Invalid column ID'),
  order: z.number().min(0),
});

export const assignCaseSchema = z.object({
  assignedTo: z.string().uuid('Invalid lawyer ID').nullable(),
});

export type CreateCaseSchemaInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseSchemaInput = z.infer<typeof updateCaseSchema>;
export type MoveCaseSchemaInput = z.infer<typeof moveCaseSchema>;
export type AssignCaseSchemaInput = z.infer<typeof assignCaseSchema>;
