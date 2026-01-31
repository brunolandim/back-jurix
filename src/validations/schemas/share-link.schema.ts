import { z } from 'zod';

export const createShareLinkSchema = z.object({
  caseId: z.string().uuid('Invalid case ID'),
  documentIds: z.array(z.string().uuid('Invalid document ID')).min(1, 'At least one document is required'),
});

export type CreateShareLinkSchemaInput = z.infer<typeof createShareLinkSchema>;
