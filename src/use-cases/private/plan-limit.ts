import type { ISubscriptionRepository } from '../../db/interfaces';
import type { Subscription } from '../../types';
import { SubscriptionRequiredError, ReadOnlyModeError } from '../../errors';

export function enforceActiveSubscription(subscription: Subscription | null): void {
  if (!subscription) {
    throw new SubscriptionRequiredError();
  }

  const { status } = subscription;

  if (status === 'trialing' || status === 'active') {
    return;
  }

  if (status === 'past_due') {
    throw new ReadOnlyModeError();
  }

  throw new SubscriptionRequiredError();
}
