import type {
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from '../../types';

export interface ISubscriptionRepository {
  findByOrganizationId(organizationId: string): Promise<Subscription | null>;
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>;
  create(input: CreateSubscriptionInput): Promise<Subscription>;
  update(id: string, input: UpdateSubscriptionInput): Promise<Subscription | null>;
  updateByStripeSubscriptionId(stripeSubscriptionId: string, input: UpdateSubscriptionInput): Promise<Subscription | null>;
}
