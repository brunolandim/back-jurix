import type { PrismaClient } from '../../db/prisma';

export interface CleanupResult {
  notificationsDeleted: number;
  expiredLinksDeleted: number;
}

export class CleanupUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(): Promise<CleanupResult> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const [notificationsDeleted, expiredLinksDeleted] = await this.prisma.$transaction(async (tx) => {
      // Delete old notifications that were already read and sent (older than 3 months)
      const notifications = await tx.caseNotification.deleteMany({
        where: {
          isRead: true,
          isSent: true,
          date: { lt: threeMonthsAgo },
        },
      });

      // Delete link_documents for expired links older than 3 months
      await tx.linkDocument.deleteMany({
        where: {
          link: {
            isExpired: true,
            createdAt: { lt: threeMonthsAgo },
          },
        },
      });

      // Delete expired shareable links older than 3 months
      const links = await tx.shareableLink.deleteMany({
        where: {
          isExpired: true,
          createdAt: { lt: threeMonthsAgo },
        },
      });

      return [notifications.count, links.count] as const;
    });

    return { notificationsDeleted, expiredLinksDeleted };
  }
}
