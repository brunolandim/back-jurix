import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
});

export type UpdateOrganizationSchemaInput = z.infer<typeof updateOrganizationSchema>;
