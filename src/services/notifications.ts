import {
  createNotificationsRepository,
  DEFAULT_NOTIFICATIONS_LIMIT,
} from './notifications.repository';
import {
  CreateNotificationInput,
  ListNotificationsResult,
  NotificationBadge,
  NotificationPreview,
  NotificationRecord,
  NotificationRequestStatus,
  NotificationType,
} from './notifications.types';

export type {
  CreateNotificationInput,
  ListNotificationsResult,
  NotificationBadge,
  NotificationPreview,
  NotificationRecord,
  NotificationRequestStatus,
  NotificationType,
};

const repository = createNotificationsRepository();

export async function listNotifications(input: {
  userId: string;
  limit?: number;
}): Promise<ListNotificationsResult> {
  return repository.list({
    userId: input.userId,
    limit: input.limit ?? DEFAULT_NOTIFICATIONS_LIMIT,
  });
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationRecord> {
  return repository.create(input);
}

export async function markNotificationRead(input: {
  userId: string;
  notificationId: string;
  readAt?: string;
}): Promise<void> {
  return repository.markRead({
    userId: input.userId,
    notificationId: input.notificationId,
    readAt: input.readAt || new Date().toISOString(),
  });
}

export async function updateNotificationRequestStatus(input: {
  userId: string;
  notificationId: string;
  requestStatus: Exclude<NotificationRequestStatus, null>;
  readAt?: string;
}): Promise<void> {
  return repository.updateRequestStatus(input);
}

export async function clearNotifications(input: { userId: string }): Promise<void> {
  return repository.clear(input);
}

export async function subscribeNotificationUnreadCount(input: {
  userId: string;
  onChange: (count: number) => void;
  onError?: (error: unknown) => void;
}): Promise<() => void> {
  return repository.subscribeUnreadCount(input);
}
