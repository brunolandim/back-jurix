import { z } from 'zod';
import { PLAN_TYPES } from '../../enum';

export const createCheckoutSchema = z.object({
  plan: z.enum(PLAN_TYPES as [string, ...string[]]),
});

export type CreateCheckoutSchemaInput = z.infer<typeof createCheckoutSchema>;
