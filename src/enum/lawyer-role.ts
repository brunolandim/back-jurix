export const LawyerRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  LAWYER: 'lawyer',
} as const;

export type LawyerRole = (typeof LawyerRole)[keyof typeof LawyerRole];

export const LAWYER_ROLES = Object.values(LawyerRole);
