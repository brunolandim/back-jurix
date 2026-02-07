import { NotFoundError, ForbiddenError, ValidationError } from '../../errors';
import type {
  ISubscriptionRepository,
  IOrganizationRepository,
  ILawyerRepository,
  ICaseRepository,
  IDocumentRepository,
  IShareLinkRepository,
} from '../../db/interfaces';
import type { AuthContext, SubscriptionInfo } from '../../types';
import type { PlanType } from '../../enum';
import { PLANS, TRIAL_DAYS } from '../../config/constants';
import { getPriceIdByPlan } from '../../config/stripe-plans';
import { getStripe } from '../../utils/stripe';
import { getEnv } from '../../config/env';

export class SubscriptionUseCase {
  constructor(
    private subscriptionRepo: ISubscriptionRepository,
    private organizationRepo: IOrganizationRepository,
    private lawyerRepo: ILawyerRepository,
    private caseRepo: ICaseRepository,
    private documentRepo: IDocumentRepository,
    private shareLinkRepo: IShareLinkRepository
  ) {}

  async getInfo(context: AuthContext): Promise<SubscriptionInfo> {
    const subscription = await this.subscriptionRepo.findByOrganizationId(context.organizationId);

    const plan = subscription ? (PLANS[subscription.plan] ?? null) : null;

    const [lawyerCount, caseCount, documentCount, shareLinkCount] = await Promise.all([
      this.lawyerRepo.countByOrganization(context.organizationId),
      this.caseRepo.countByOrganization(context.organizationId),
      this.documentRepo.countByOrganization(context.organizationId),
      this.shareLinkRepo.countByOrganization(context.organizationId),
    ]);

    return {
      subscription,
      plan: subscription?.plan as PlanType | null ?? null,
      status: subscription?.status ?? null,
      usage: {
        lawyers: { current: lawyerCount, limit: plan?.limits.lawyers ?? null },
        activeCases: { current: caseCount, limit: plan?.limits.activeCases ?? null },
        documents: { current: documentCount, limit: plan?.limits.documents ?? null },
        shareLinks: { current: shareLinkCount, limit: plan?.limits.shareLinks ?? null },
      },
      trialEndsAt: subscription?.trialEnd ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    };
  }

  async createCheckout(plan: string, context: AuthContext): Promise<{ url: string }> {
    if (context.role !== 'owner') {
      throw new ForbiddenError('Only the organization owner can manage subscriptions');
    }

    const existing = await this.subscriptionRepo.findByOrganizationId(context.organizationId);
    if (existing && (existing.status === 'active' || existing.status === 'trialing')) {
      throw new ValidationError('Organization already has an active subscription');
    }

    const priceId = getPriceIdByPlan(plan);
    if (!priceId) {
      throw new ValidationError('Invalid plan');
    }

    const organization = await this.organizationRepo.findById(context.organizationId);
    if (!organization) {
      throw new NotFoundError('Organization', context.organizationId);
    }

    const stripe = getStripe();
    const env = getEnv();

    let customerId = organization.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { organizationId: context.organizationId },
        email: organization.email ?? undefined,
        name: organization.name,
      });
      customerId = customer.id;
      await this.organizationRepo.updateStripeCustomerId(context.organizationId, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { organizationId: context.organizationId, plan },
      },
      success_url: `${env.APP_URL}/dashboard?checkout=success`,
      cancel_url: `${env.APP_URL}/pricing?checkout=cancel`,
    });

    if (!session.url) {
      throw new ValidationError('Failed to create checkout session');
    }

    return { url: session.url };
  }

  async createPortal(context: AuthContext): Promise<{ url: string }> {
    if (context.role !== 'owner') {
      throw new ForbiddenError('Only the organization owner can manage subscriptions');
    }

    const organization = await this.organizationRepo.findById(context.organizationId);
    if (!organization || !organization.stripeCustomerId) {
      throw new ValidationError('No billing account found');
    }

    const stripe = getStripe();
    const env = getEnv();

    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: `${env.APP_URL}/dashboard`,
    });

    return { url: session.url };
  }

  async cancel(context: AuthContext): Promise<void> {
    if (context.role !== 'owner') {
      throw new ForbiddenError('Only the organization owner can manage subscriptions');
    }

    const subscription = await this.subscriptionRepo.findByOrganizationId(context.organizationId);
    if (!subscription) {
      throw new ValidationError('No active subscription found');
    }

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      throw new ValidationError('Subscription is not active');
    }

    const stripe = getStripe();
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.subscriptionRepo.update(subscription.id, {
      cancelAtPeriodEnd: true,
    });
  }

  async reactivate(context: AuthContext): Promise<void> {
    if (context.role !== 'owner') {
      throw new ForbiddenError('Only the organization owner can manage subscriptions');
    }

    const subscription = await this.subscriptionRepo.findByOrganizationId(context.organizationId);
    if (!subscription) {
      throw new ValidationError('No subscription found');
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new ValidationError('Subscription is not set to cancel');
    }

    const stripe = getStripe();
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await this.subscriptionRepo.update(subscription.id, {
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });
  }
}
