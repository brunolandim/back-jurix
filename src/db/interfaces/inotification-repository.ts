import type {
  CaseNotification,
  CreateNotificationInput,
  UpdateNotificationInput,
} from '../../types';

export interface INotificationRepository {
  findById(id: string): Promise<CaseNotification | null>;
  findByLawyer(lawyerId: string, unreadOnly?: boolean): Promise<CaseNotification[]>;
  findByCase(caseId: string): Promise<CaseNotification[]>;
  findPendingToSend(): Promise<CaseNotification[]>;
  create(input: CreateNotificationInput): Promise<CaseNotification>;
  update(id: string, input: UpdateNotificationInput): Promise<CaseNotification | null>;
  markAsRead(id: string): Promise<CaseNotification | null>;
  markAllAsRead(lawyerId: string): Promise<number>;
  markAsSent(id: string): Promise<CaseNotification | null>;
  delete(id: string): Promise<boolean>;
}
