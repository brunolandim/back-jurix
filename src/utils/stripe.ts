import Stripe from 'stripe';
import { getEnv } from '../config/env';

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripe) return stripe;

  const env = getEnv();
  stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
  });

  return stripe;
}
