import { AppError } from './app-error';

export class ReadOnlyModeError extends AppError {
  constructor(message = 'Your subscription is past due. Please update your payment method to continue.') {
    super(message, 403, 'READ_ONLY_MODE');
  }
}
