export const DEFAULT_COLUMNS = [
  { title: 'new', order: 0, isDefault: true },
  { title: 'completed', order: 999, isDefault: true },
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

export interface PlanFeatures {
  emailNotifications: boolean;
}

export interface PlanDefinition {
  name: string;
  type: string;
  price: number;
  limits: PlanLimits;
  features: PlanFeatures;
}

export const PLANS: Record<string, PlanDefinition> = {
  pro: {
    name: 'Pro',
    type: 'pro',
    price: 9700,
    limits: {
      lawyers: 3,
      activeCases: 50,
      shareLinks: 50,
      documents: null,
    },
    features: {
      emailNotifications: true,
    },
  },
  business: {
    name: 'Business',
    type: 'business',
    price: 19700,
    limits: {
      lawyers: 10,
      activeCases: 300,
      shareLinks: 300,
      documents: null,
    },
    features: {
      emailNotifications: true,
    },
  },
  enterprise: {
    name: 'Enterprise',
    type: 'enterprise',
    price: 39700,
    limits: {
      lawyers: null,
      activeCases: null,
      shareLinks: null,
      documents: null,
    },
    features: {
      emailNotifications: true,
    },
  },
};
