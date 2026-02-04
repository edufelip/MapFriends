import seed from '../mocks/notifications.json';

export type NotificationBadge = {
  icon: string;
  color: string;
};

export type NotificationPreview = {
  title: string;
  subtitle: string;
  image: string;
};

export type NotificationItem = {
  id: string;
  name: string;
  time: string;
  avatar: string;
  message: string;
  quote?: string;
  badge?: NotificationBadge | null;
  actions?: Array<'accept' | 'decline'>;
  preview?: NotificationPreview;
  premiumCard?: boolean;
  action?: 'follow';
};

export type NotificationSections = {
  newRequests: NotificationItem[];
  earlier: NotificationItem[];
  week: NotificationItem[];
};

const notifications = seed as NotificationSections;

export function getNotificationSections() {
  return notifications;
}
