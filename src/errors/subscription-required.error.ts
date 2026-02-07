import { AppError } from './app-error';

export class SubscriptionRequiredError extends AppError {
  constructor(message = 'An active subscription is required to perform this action') {
    super(message, 402, 'SUBSCRIPTION_REQUIRED');
  }
}
