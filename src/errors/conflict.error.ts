import { AppError } from './app-error';

export class ConflictError extends AppError {
  constructor(message: string, field?: string, messageKey?: string) {
    super(message, 409, 'CONFLICT', field ? { field } : undefined, messageKey);
    this.name = 'ConflictError';
  }
}
