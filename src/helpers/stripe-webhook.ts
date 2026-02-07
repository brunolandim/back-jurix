import type Stripe from 'stripe';
import { getStripe } from '../utils/stripe';
import { getEnv } from '../config/env';

export function verifyStripeWebhook(body: string, signature: string): Stripe.Event {
  const stripe = getStripe();
  const env = getEnv();

  return stripe.webhooks.constructEvent(
    body,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}
