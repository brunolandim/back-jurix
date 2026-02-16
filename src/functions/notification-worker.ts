import type { ScheduledEvent, Context } from 'aws-lambda';
import { getPrisma } from '../db/prisma';
import { NotificationRepository } from '../db/repository/notification-repository';
import { NotificationSenderUseCase } from '../use-cases/worker/notification-sender.usecase';
import { getWorkerEnv } from '../config/env-worker';

export const handler = async (_event: ScheduledEvent, _context: Context): Promise<void> => {
  getWorkerEnv();
  const prisma = getPrisma();
  const notificationRepo = new NotificationRepository(prisma);
  const sender = new NotificationSenderUseCase(notificationRepo);

  const result = await sender.execute();
  console.log('[notification-worker] Result:', JSON.stringify(result));
};
