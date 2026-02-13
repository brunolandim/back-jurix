export const AvatarColor = {
  DEFAULT: 'default',
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
} as const;

export type AvatarColor = (typeof AvatarColor)[keyof typeof AvatarColor];

export const AVATAR_COLORS = Object.values(AvatarColor);
