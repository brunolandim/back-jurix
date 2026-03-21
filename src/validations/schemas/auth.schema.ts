import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '../../config/constants';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must contain only digits'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
});

export const registerSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  document: z
    .string()
    .transform(v => v.replace(/\D/g, ''))
    .pipe(z.string().length(14, 'Invalid CNPJ')),
  companyEmail: z.string().email('Invalid email format').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  companyPhone: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  oab: z.string().min(3, 'Invalid OAB number'),
  phone: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
