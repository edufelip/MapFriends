import seed from '../mocks/notifications.json';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
};

const notifications = seed.notifications as NotificationItem[];

export function getNotifications() {
  return notifications;
}
