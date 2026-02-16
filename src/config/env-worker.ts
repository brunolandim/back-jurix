import { z } from 'zod';

const workerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('jurix'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_SSL: z.coerce.boolean().default(false),

  // AWS
  AWS_REGION: z.string().default('us-east-1'),

  // SES
  SES_FROM_EMAIL: z.string().email().optional(),
  SES_REGION: z.string().optional(),

  // SMTP (local dev with Mailpit)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),

  // App
  APP_URL: z.string().url().default('http://localhost:3000'),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

let workerEnv: WorkerEnv | null = null;

export function getWorkerEnv(): WorkerEnv {
  if (workerEnv) return workerEnv;

  const result = workerEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid worker environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid worker environment configuration');
  }

  workerEnv = result.data;
  return workerEnv;
}
