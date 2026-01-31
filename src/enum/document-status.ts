export const DocumentStatus = {
  PENDING: 'pending',
  PENDING_APPROVAL: 'pending_approval',
  REJECTED: 'rejected',
  RECEIVED: 'received',
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const DOCUMENT_STATUSES = Object.values(DocumentStatus);
