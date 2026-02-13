import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('jurix'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_SSL: z.coerce.boolean().default(false),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // AWS
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRO_PRICE_ID: z.string().min(1),
  STRIPE_BUSINESS_PRICE_ID: z.string().min(1),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().min(1),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // SES
  SES_FROM_EMAIL: z.string().email().optional(),
  SES_REGION: z.string().optional(),

  // SMTP (local dev with Mailpit)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),

  // WhatsApp (Meta Cloud API)
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),

  // App
  CORS_ORIGINS: z.string().default('*'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env | null = null;

export function getEnv(): Env {
  if (env) return env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid environment configuration');
  }

  env = result.data;
  return env;
}

export function getDatabaseUrl(): string {
  const e = getEnv();

  if (e.DATABASE_URL) {
    return e.DATABASE_URL;
  }

  const ssl = e.DB_SSL ? '?sslmode=require' : '';
  return `postgresql://${e.DB_USER}:${e.DB_PASSWORD}@${e.DB_HOST}:${e.DB_PORT}/${e.DB_NAME}${ssl}`;
}
