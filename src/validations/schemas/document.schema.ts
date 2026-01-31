import { z } from 'zod';

const rejectionReasonEnum = z.enum(['low_quality', 'wrong_document', 'incomplete', 'illegible', 'other'] as const);

export const createDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required').max(100),
  description: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required').max(100).optional(),
  description: z.string().optional(),
});

export const rejectDocumentSchema = z.object({
  rejectionReason: rejectionReasonEnum,
  rejectionNote: z.string().optional(),
});

export const uploadDocumentSchema = z.object({
  fileUrl: z.string().url('Invalid file URL'),
});

export type CreateDocumentSchemaInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentSchemaInput = z.infer<typeof updateDocumentSchema>;
export type RejectDocumentSchemaInput = z.infer<typeof rejectDocumentSchema>;
export type UploadDocumentSchemaInput = z.infer<typeof uploadDocumentSchema>;
