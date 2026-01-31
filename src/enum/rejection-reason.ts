export const RejectionReason = {
  LOW_QUALITY: 'low_quality',
  WRONG_DOCUMENT: 'wrong_document',
  INCOMPLETE: 'incomplete',
  ILLEGIBLE: 'illegible',
  OTHER: 'other',
} as const;

export type RejectionReason = (typeof RejectionReason)[keyof typeof RejectionReason];

export const REJECTION_REASONS = Object.values(RejectionReason);
