import { z } from 'zod';
import { LawyerRole } from '../../enum';
import { PASSWORD_MIN_LENGTH } from '../../config/constants';

const lawyerRoleEnum = z.enum(['owner', 'admin', 'lawyer'] as const);

export const createLawyerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
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
  specialty: z.string().optional(),
  role: lawyerRoleEnum.optional(),
  active: z.boolean().optional(),
});

export type CreateLawyerSchemaInput = z.infer<typeof createLawyerSchema>;
export type UpdateLawyerSchemaInput = z.infer<typeof updateLawyerSchema>;
