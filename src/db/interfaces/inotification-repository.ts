import type {
  CaseNotification,
  CreateNotificationInput,
  UpdateNotificationInput,
} from '../../types';

export interface PendingNotificationLawyer {
  name: string;
  email: string;
  phone: string | null;
  organizationId: string;
}

export interface PendingNotificationCase {
  title: string;
  number: string;
}

export interface PendingNotification extends CaseNotification {
  lawyer: PendingNotificationLawyer | null;
  case: PendingNotificationCase;
}

export interface INotificationRepository {
  findById(id: string): Promise<CaseNotification | null>;
  findByLawyer(lawyerId: string, unreadOnly?: boolean): Promise<CaseNotification[]>;
  findByCase(caseId: string): Promise<CaseNotification[]>;
  findPendingToSend(): Promise<PendingNotification[]>;
  create(input: CreateNotificationInput): Promise<CaseNotification>;
  update(id: string, input: UpdateNotificationInput): Promise<CaseNotification | null>;
  markAsRead(id: string): Promise<CaseNotification | null>;
  markAllAsRead(lawyerId: string): Promise<number>;
  markAsSent(id: string): Promise<CaseNotification | null>;
  reassignPending(caseId: string, newLawyerId: string): Promise<number>;
  delete(id: string): Promise<boolean>;
}
