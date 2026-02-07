import { getEnv } from './env';
import { PLANS, type PlanDefinition } from './constants';

export function getPlanByPriceId(priceId: string): PlanDefinition | null {
  const env = getEnv();

  const priceMap: Record<string, string> = {
    [env.STRIPE_PRO_PRICE_ID]: 'pro',
    [env.STRIPE_BUSINESS_PRICE_ID]: 'business',
    [env.STRIPE_ENTERPRISE_PRICE_ID]: 'enterprise',
  };

  const planType = priceMap[priceId];
  if (!planType) return null;

  return PLANS[planType];
}

export function getPriceIdByPlan(plan: string): string | null {
  const env = getEnv();

  const planMap: Record<string, string> = {
    pro: env.STRIPE_PRO_PRICE_ID,
    business: env.STRIPE_BUSINESS_PRICE_ID,
    enterprise: env.STRIPE_ENTERPRISE_PRICE_ID,
  };

  return planMap[plan] ?? null;
}
