import { AppError } from './app-error';

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', messageKey?: string) {
    super(message, 401, 'UNAUTHORIZED', undefined, messageKey);
    this.name = 'UnauthorizedError';
  }
}
