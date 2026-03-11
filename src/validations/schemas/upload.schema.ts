import { z } from 'zod';

const allowedContentTypes = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
] as const;

export const presignedUrlSchema = z.object({
  folder: z.enum(['photos', 'documents']),
  contentType: z.enum(allowedContentTypes),
  fileName: z.string().min(1),
});

export const publicPresignedUrlSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  fileName: z.string().min(1),
  documentId: z.string().uuid(),
});

export const uploadFileSchema = z.object({
  folder: z.enum(['photos', 'documents']),
  contentType: z.enum(allowedContentTypes),
  fileName: z.string().min(1),
  data: z.string().min(1),
});

export type PresignedUrlSchemaInput = z.infer<typeof presignedUrlSchema>;
export type PublicPresignedUrlSchemaInput = z.infer<typeof publicPresignedUrlSchema>;
export type UploadFileSchemaInput = z.infer<typeof uploadFileSchema>;
