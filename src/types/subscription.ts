import type { SubscriptionStatus } from '../enum/subscription-status';
import type { PlanType } from '../enum/plan-type';

export interface Subscription {
  id: string;
  organizationId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  plan: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionInput {
  organizationId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  plan: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}

export interface UpdateSubscriptionInput {
  stripePriceId?: string;
  plan?: string;
  status?: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
}

export interface SubscriptionInfo {
  subscription: Subscription | null;
  plan: PlanType | null;
  status: SubscriptionStatus | null;
  usage: {
    lawyers: { current: number; limit: number | null };
    activeCases: { current: number; limit: number | null };
    documents: { current: number; limit: number | null };
    shareLinks: { current: number; limit: number | null };
  };
  trialEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
}
