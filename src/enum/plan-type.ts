export const PlanType = {
  PRO: 'pro',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise',
} as const;

export type PlanType = (typeof PlanType)[keyof typeof PlanType];
export const PLAN_TYPES = Object.values(PlanType);
