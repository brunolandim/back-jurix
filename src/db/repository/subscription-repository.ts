import type { PrismaClient } from '../prisma';
import type { ISubscriptionRepository } from '../interfaces/isubscription-repository';
import type {
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from '../../types';

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private prisma: PrismaClient) {}

  async findByOrganizationId(organizationId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { organizationId },
    });
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });
  }

  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    return this.prisma.subscription.create({
      data: {
        organizationId: input.organizationId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        stripePriceId: input.stripePriceId,
        plan: input.plan,
        status: input.status,
        currentPeriodStart: input.currentPeriodStart,
        currentPeriodEnd: input.currentPeriodEnd,
        trialEnd: input.trialEnd ?? null,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
      },
    });
  }

  async update(id: string, input: UpdateSubscriptionInput): Promise<Subscription | null> {
    const updateData: Record<string, unknown> = {};

    if (input.stripePriceId !== undefined) updateData.stripePriceId = input.stripePriceId;
    if (input.plan !== undefined) updateData.plan = input.plan;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.currentPeriodStart !== undefined) updateData.currentPeriodStart = input.currentPeriodStart;
    if (input.currentPeriodEnd !== undefined) updateData.currentPeriodEnd = input.currentPeriodEnd;
    if (input.trialEnd !== undefined) updateData.trialEnd = input.trialEnd;
    if (input.cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = input.cancelAtPeriodEnd;
    if (input.canceledAt !== undefined) updateData.canceledAt = input.canceledAt;

    if (Object.keys(updateData).length === 0) {
      return this.prisma.subscription.findUnique({ where: { id } });
    }

    return this.prisma.subscription.update({
      where: { id },
      data: updateData,
    });
  }

  async updateByStripeSubscriptionId(
    stripeSubscriptionId: string,
    input: UpdateSubscriptionInput
  ): Promise<Subscription | null> {
    const subscription = await this.findByStripeSubscriptionId(stripeSubscriptionId);
    if (!subscription) return null;

    return this.update(subscription.id, input);
  }
}
