import type { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors';

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = formatZodError(result.error);
    throw new ValidationError('Validation failed', { errors });
  }

  return result.data;
}

function formatZodError(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}
