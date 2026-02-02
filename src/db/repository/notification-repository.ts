import type { PrismaClient } from '../prisma';
import type { INotificationRepository } from '../interfaces/inotification-repository';
import type {
  CaseNotification,
  CreateNotificationInput,
  UpdateNotificationInput,
} from '../../types';

export class NotificationRepository implements INotificationRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<CaseNotification | null> {
    return this.prisma.caseNotification.findUnique({ where: { id } });
  }

  async findByLawyer(lawyerId: string, unreadOnly = false): Promise<CaseNotification[]> {
    return this.prisma.caseNotification.findMany({
      where: {
        lawyerId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { date: 'desc' },
    });
  }

  async findByCase(caseId: string): Promise<CaseNotification[]> {
    return this.prisma.caseNotification.findMany({
      where: { caseId },
      orderBy: { date: 'desc' },
    });
  }

  async findPendingToSend(): Promise<CaseNotification[]> {
    const now = new Date();
    return this.prisma.caseNotification.findMany({
      where: {
        isSent: false,
        date: { lte: now },
      },
      orderBy: { date: 'asc' },
    });
  }

  async create(input: CreateNotificationInput): Promise<CaseNotification> {
    return this.prisma.caseNotification.create({
      data: {
        caseId: input.caseId,
        lawyerId: input.lawyerId ?? null,
        type: input.type,
        message: input.message ?? null,
        date: input.date,
      },
    });
  }

  async update(id: string, input: UpdateNotificationInput): Promise<CaseNotification | null> {
    const updateData: Record<string, unknown> = {};

    if (input.type !== undefined) updateData.type = input.type;
    if (input.message !== undefined) updateData.message = input.message;
    if (input.date !== undefined) updateData.date = input.date;

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    return this.prisma.caseNotification.update({
      where: { id },
      data: updateData,
    });
  }

  async markAsRead(id: string): Promise<CaseNotification | null> {
    return this.prisma.caseNotification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(lawyerId: string): Promise<number> {
    const result = await this.prisma.caseNotification.updateMany({
      where: {
        lawyerId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  async markAsSent(id: string): Promise<CaseNotification | null> {
    return this.prisma.caseNotification.update({
      where: { id },
      data: {
        isSent: true,
        sentAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.caseNotification.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
