import type { ScheduledEvent, Context } from 'aws-lambda';
import { getPrisma } from '../db/prisma';
import { NotificationRepository } from '../db/repository/notification-repository';
import { NotificationSenderUseCase } from '../use-cases/worker/notification-sender.usecase';
import { CleanupUseCase } from '../use-cases/worker/cleanup.usecase';
import { getWorkerEnv } from '../config/env-worker';

export const handler = async (_event: ScheduledEvent, _context: Context): Promise<void> => {
  getWorkerEnv();
  const prisma = getPrisma();

  // 1. Cleanup old data (notifications read + expired links older than 3 months)
  const cleanup = new CleanupUseCase(prisma);
  const cleanupResult = await cleanup.execute();
  console.log('[notification-worker] Cleanup:', JSON.stringify(cleanupResult));

  // 2. Send pending notifications
  const notificationRepo = new NotificationRepository(prisma);
  const sender = new NotificationSenderUseCase(notificationRepo);
  const sendResult = await sender.execute();
  console.log('[notification-worker] Notifications:', JSON.stringify(sendResult));
};
