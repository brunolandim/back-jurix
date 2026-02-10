export const DEFAULT_COLUMNS = [
  { title: 'Novo', order: 0, isDefault: true },
] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const TOKEN_LENGTH = 64;

export const PASSWORD_MIN_LENGTH = 8;

export const DEFAULT_PASSWORD = 'admin123';

export const UPLOAD_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const TRIAL_DAYS = 14;

export interface PlanLimits {
  lawyers: number | null;
  activeCases: number | null;
  documents: number | null;
  shareLinks: number | null;
}

export interface PlanDefinition {
  name: string;
  type: string;
  price: number;
  limits: PlanLimits;
}

export const PLANS: Record<string, PlanDefinition> = {
  pro: {
    name: 'Pro',
    type: 'pro',
    price: 9700,
    limits: {
      lawyers: 3,
      activeCases: 30,
      documents: 100,
      shareLinks: 10,
    },
  },
  business: {
    name: 'Business',
    type: 'business',
    price: 19700,
    limits: {
      lawyers: 10,
      activeCases: 200,
      documents: 500,
      shareLinks: 50,
    },
  },
  enterprise: {
    name: 'Enterprise',
    type: 'enterprise',
    price: 39700,
    limits: {
      lawyers: null,
      activeCases: null,
      documents: null,
      shareLinks: null,
    },
  },
};
