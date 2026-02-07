import type Stripe from 'stripe';
import type { ISubscriptionRepository, IOrganizationRepository } from '../../db/interfaces';
import type { SubscriptionStatus } from '../../enum';
import { getPlanByPriceId } from '../../config/stripe-plans';

export class WebhookUseCase {
  constructor(
    private subscriptionRepo: ISubscriptionRepository,
    private organizationRepo: IOrganizationRepository
  ) {}

  async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const existing = await this.subscriptionRepo.findByStripeSubscriptionId(subscription.id);
    if (existing) return;

    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) {
      console.error('Webhook: missing organizationId in subscription metadata', subscription.id);
      return;
    }

    const priceId = subscription.items.data[0]?.price?.id;
    if (!priceId) {
      console.error('Webhook: missing priceId in subscription', subscription.id);
      return;
    }

    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      console.error('Webhook: unknown priceId', priceId);
      return;
    }

    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

    const org = await this.organizationRepo.findById(organizationId);
    if (org && !org.stripeCustomerId) {
      await this.organizationRepo.updateStripeCustomerId(organizationId, customerId);
    }

    await this.subscriptionRepo.create({
      organizationId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan: plan.type,
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const existing = await this.subscriptionRepo.findByStripeSubscriptionId(subscription.id);
    if (!existing) {
      await this.handleSubscriptionCreated(subscription);
      return;
    }

    const priceId = subscription.items.data[0]?.price?.id;
    const plan = priceId ? getPlanByPriceId(priceId) : null;

    await this.subscriptionRepo.update(existing.id, {
      status: subscription.status as SubscriptionStatus,
      stripePriceId: priceId ?? existing.stripePriceId,
      plan: plan?.type ?? existing.plan,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    });
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await this.subscriptionRepo.updateByStripeSubscriptionId(subscription.id, {
      status: 'canceled',
      canceledAt: new Date(),
    });
  }

  async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    console.log('Trial will end for subscription:', subscription.id);
  }
}
