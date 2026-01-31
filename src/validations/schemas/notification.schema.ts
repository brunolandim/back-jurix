import { z } from 'zod';

const notificationTypeEnum = z.enum(['hearing', 'deadline', 'meeting', 'task', 'other'] as const);

export const createNotificationSchema = z.object({
  type: notificationTypeEnum,
  message: z.string().optional(),
  date: z.coerce.date(),
  lawyerId: z.string().uuid('Invalid lawyer ID').optional(),
});

export const updateNotificationSchema = z.object({
  type: notificationTypeEnum.optional(),
  message: z.string().optional(),
  date: z.coerce.date().optional(),
});

export type CreateNotificationSchemaInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationSchemaInput = z.infer<typeof updateNotificationSchema>;
