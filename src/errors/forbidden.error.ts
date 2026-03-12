import { AppError } from './app-error';

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied', messageKey?: string) {
    super(message, 403, 'FORBIDDEN', undefined, messageKey);
    this.name = 'ForbiddenError';
  }
}
