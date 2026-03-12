import { AppError } from './app-error';

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, messageKey?: string) {
    super(message, 400, 'VALIDATION_ERROR', details, messageKey);
    this.name = 'ValidationError';
  }
}
