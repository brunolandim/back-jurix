export const NotificationType = {
  HEARING: 'hearing',
  DEADLINE: 'deadline',
  MEETING: 'meeting',
  TASK: 'task',
  OTHER: 'other',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NOTIFICATION_TYPES = Object.values(NotificationType);
