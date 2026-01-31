import type { NotificationType } from '../enum';

export interface CaseNotification {
  id: string;
  caseId: string;
  lawyerId: string | null;
  type: NotificationType;
  message: string | null;
  date: Date;
  isRead: boolean;
  readAt: Date | null;
  isSent: boolean;
  sentAt: Date | null;
  createdAt: Date;
}

export interface CreateNotificationInput {
  caseId: string;
  lawyerId?: string;
  type: NotificationType;
  message?: string;
  date: Date;
}

export interface UpdateNotificationInput {
  type?: NotificationType;
  message?: string;
  date?: Date;
}
