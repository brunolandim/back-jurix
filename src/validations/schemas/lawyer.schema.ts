import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '../../config/constants';

const lawyerRoleEnum = z.enum(['owner', 'admin', 'lawyer'] as const);
const avatarColorEnum = z.enum(['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const);

export const createLawyerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .optional(),
  phone: z.string().optional(),
  oab: z.string().min(3, 'Invalid OAB number'),
  specialty: z.string().optional(),
  role: lawyerRoleEnum.optional(),
});

export const updateLawyerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .optional(),
  phone: z.string().optional(),
  photo: z.string().url().optional().nullable(),
  specialty: z.string().optional(),
  role: lawyerRoleEnum.optional(),
  active: z.boolean().optional(),
  avatarColor: avatarColorEnum.optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  photo: z.string().url().optional().nullable(),
  specialty: z.string().optional(),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .optional(),
  avatarColor: avatarColorEnum.optional(),
});

export type CreateLawyerSchemaInput = z.infer<typeof createLawyerSchema>;
export type UpdateLawyerSchemaInput = z.infer<typeof updateLawyerSchema>;
export type UpdateProfileSchemaInput = z.infer<typeof updateProfileSchema>;
