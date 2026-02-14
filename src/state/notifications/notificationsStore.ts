import { create } from 'zustand';
import {
  clearNotifications,
  createNotification,
  listNotifications,
  markNotificationRead,
  NotificationRecord,
  updateNotificationRequestStatus,
} from '../../services/notifications';
import {
  acceptFollowRequest,
  createFollowLink,
  declineFollowRequest,
} from '../../services/following';

type HydrateNotificationsInput = {
  userId: string;
  limit?: number;
  force?: boolean;
};

type NotificationActor = {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
};

type NotificationsState = {
  notificationsById: Record<string, NotificationRecord>;
  notificationIds: string[];
  hydratedUserId: string | null;
  isHydrating: boolean;
  hydrateError: string | null;
  isClearing: boolean;
  unreadCount: number;
  pendingActionById: Record<string, boolean>;
  hydrateNotifications: (input: HydrateNotificationsInput) => Promise<void>;
  refreshNotifications: (input: { userId: string; limit?: number }) => Promise<void>;
  markNotificationReadAndStore: (input: {
    userId: string;
    notificationId: string;
  }) => Promise<void>;
  acceptFollowRequestAndStore: (input: {
    userId: string;
    notificationId: string;
    actor: NotificationActor;
  }) => Promise<void>;
  declineFollowRequestAndStore: (input: {
    userId: string;
    notificationId: string;
  }) => Promise<void>;
  followBackAndStore: (input: {
    userId: string;
    notificationId: string;
    actor: NotificationActor;
  }) => Promise<void>;
  clearNotificationsAndStore: (input: { userId: string }) => Promise<void>;
  clearNotificationsState: () => void;
};

const toSortedIds = (notificationsById: Record<string, NotificationRecord>) =>
  Object.values(notificationsById)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => item.id);

const upsertNotification = (
  notificationsById: Record<string, NotificationRecord>,
  notification: NotificationRecord
) => ({
  ...notificationsById,
  [notification.id]: notification,
});

const removePendingAction = (pendingActionById: Record<string, boolean>, notificationId: string) => {
  const next = { ...pendingActionById };
  delete next[notificationId];
  return next;
};

const isUnread = (notification: NotificationRecord | undefined) => Boolean(notification && !notification.readAt);

const decrementUnread = (currentUnread: number, notification: NotificationRecord | undefined) => {
  if (!isUnread(notification)) {
    return Math.max(0, currentUnread);
  }

  return Math.max(0, currentUnread - 1);
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notificationsById: {},
  notificationIds: [],
  hydratedUserId: null,
  isHydrating: false,
  hydrateError: null,
  isClearing: false,
  unreadCount: 0,
  pendingActionById: {},
  hydrateNotifications: async ({ userId, limit = 120, force = false }) => {
    const state = get();
    const isDifferentUser = state.hydratedUserId && state.hydratedUserId !== userId;
    const alreadyHydrated = state.hydratedUserId === userId && !force;

    if (isDifferentUser) {
      set({
        notificationsById: {},
        notificationIds: [],
        hydratedUserId: null,
        hydrateError: null,
        unreadCount: 0,
        pendingActionById: {},
      });
    }

    if (get().isHydrating || alreadyHydrated) {
      return;
    }

    set({ isHydrating: true, hydrateError: null });

    try {
      const result = await listNotifications({ userId, limit });

      set(() => {
        const nextById = result.items.reduce<Record<string, NotificationRecord>>((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {});

        return {
          notificationsById: nextById,
          notificationIds: toSortedIds(nextById),
          hydratedUserId: userId,
          isHydrating: false,
          hydrateError: null,
          unreadCount: Math.max(0, result.unreadCount),
          pendingActionById: {},
        };
      });
    } catch (error) {
      set({
        isHydrating: false,
        hydrateError: error instanceof Error ? error.message : 'notifications-hydrate-failed',
      });
      throw error;
    }
  },
  refreshNotifications: async ({ userId, limit = 120 }) => {
    await get().hydrateNotifications({ userId, limit, force: true });
  },
  markNotificationReadAndStore: async ({ userId, notificationId }) => {
    const existing = get().notificationsById[notificationId];
    if (!existing || existing.userId !== userId || existing.readAt) {
      return;
    }

    const readAt = new Date().toISOString();

    await markNotificationRead({ userId, notificationId, readAt });

    set((state) => {
      const current = state.notificationsById[notificationId];
      if (!current) {
        return state;
      }

      const nextById = upsertNotification(state.notificationsById, {
        ...current,
        readAt,
      });

      return {
        notificationsById: nextById,
        notificationIds: toSortedIds(nextById),
        unreadCount: decrementUnread(state.unreadCount, current),
      };
    });
  },
  acceptFollowRequestAndStore: async ({ userId, notificationId, actor }) => {
    const notification = get().notificationsById[notificationId];
    if (
      !notification ||
      notification.userId !== userId ||
      notification.type !== 'follow_request' ||
      !notification.actorUserId
    ) {
      return;
    }

    if (get().pendingActionById[notificationId]) {
      return;
    }

    const acceptedAt = new Date().toISOString();

    set((state) => ({
      pendingActionById: {
        ...state.pendingActionById,
        [notificationId]: true,
      },
    }));

    try {
      await acceptFollowRequest({
        userId,
        requesterUserId: notification.actorUserId,
        acceptedAt,
      });

      await Promise.all([
        updateNotificationRequestStatus({
          userId,
          notificationId,
          requestStatus: 'accepted',
          readAt: acceptedAt,
        }),
        createNotification({
          userId: notification.actorUserId,
          type: 'follow_request_accepted',
          actorUserId: actor.id,
          actorName: actor.name,
          actorHandle: actor.handle,
          actorAvatar: actor.avatar,
          createdAt: acceptedAt,
        }),
      ]);

      set((state) => {
        const current = state.notificationsById[notificationId];
        if (!current) {
          return {
            pendingActionById: removePendingAction(state.pendingActionById, notificationId),
          };
        }

        const nextById = upsertNotification(state.notificationsById, {
          ...current,
          requestStatus: 'accepted',
          readAt: acceptedAt,
        });

        return {
          notificationsById: nextById,
          notificationIds: toSortedIds(nextById),
          unreadCount: decrementUnread(state.unreadCount, current),
          pendingActionById: removePendingAction(state.pendingActionById, notificationId),
        };
      });
    } catch (error) {
      try {
        await get().refreshNotifications({ userId, limit: 120 });
      } catch {}
      set((state) => ({
        pendingActionById: removePendingAction(state.pendingActionById, notificationId),
      }));
      throw error;
    }
  },
  declineFollowRequestAndStore: async ({ userId, notificationId }) => {
    const notification = get().notificationsById[notificationId];
    if (
      !notification ||
      notification.userId !== userId ||
      notification.type !== 'follow_request' ||
      !notification.actorUserId
    ) {
      return;
    }

    if (get().pendingActionById[notificationId]) {
      return;
    }

    const declinedAt = new Date().toISOString();

    set((state) => ({
      pendingActionById: {
        ...state.pendingActionById,
        [notificationId]: true,
      },
    }));

    try {
      await declineFollowRequest({
        userId,
        requesterUserId: notification.actorUserId,
      });

      await updateNotificationRequestStatus({
        userId,
        notificationId,
        requestStatus: 'declined',
        readAt: declinedAt,
      });

      set((state) => {
        const current = state.notificationsById[notificationId];
        if (!current) {
          return {
            pendingActionById: removePendingAction(state.pendingActionById, notificationId),
          };
        }

        const nextById = upsertNotification(state.notificationsById, {
          ...current,
          requestStatus: 'declined',
          readAt: declinedAt,
        });

        return {
          notificationsById: nextById,
          notificationIds: toSortedIds(nextById),
          unreadCount: decrementUnread(state.unreadCount, current),
          pendingActionById: removePendingAction(state.pendingActionById, notificationId),
        };
      });
    } catch (error) {
      try {
        await get().refreshNotifications({ userId, limit: 120 });
      } catch {}
      set((state) => ({
        pendingActionById: removePendingAction(state.pendingActionById, notificationId),
      }));
      throw error;
    }
  },
  followBackAndStore: async ({ userId, notificationId, actor }) => {
    const notification = get().notificationsById[notificationId];
    if (!notification || notification.userId !== userId || !notification.actorUserId) {
      return;
    }

    if (get().pendingActionById[notificationId]) {
      return;
    }

    const followedAt = new Date().toISOString();

    set((state) => ({
      pendingActionById: {
        ...state.pendingActionById,
        [notificationId]: true,
      },
    }));

    try {
      await createFollowLink({
        userId,
        followedUserId: notification.actorUserId,
        createdAt: followedAt,
      });

      await Promise.all([
        markNotificationRead({
          userId,
          notificationId,
          readAt: followedAt,
        }),
        createNotification({
          userId: notification.actorUserId,
          type: 'follow_started',
          actorUserId: actor.id,
          actorName: actor.name,
          actorHandle: actor.handle,
          actorAvatar: actor.avatar,
          createdAt: followedAt,
        }),
      ]);

      set((state) => {
        const current = state.notificationsById[notificationId];
        if (!current) {
          return {
            pendingActionById: removePendingAction(state.pendingActionById, notificationId),
          };
        }

        const nextById = upsertNotification(state.notificationsById, {
          ...current,
          readAt: followedAt,
        });

        return {
          notificationsById: nextById,
          notificationIds: toSortedIds(nextById),
          unreadCount: decrementUnread(state.unreadCount, current),
          pendingActionById: removePendingAction(state.pendingActionById, notificationId),
        };
      });
    } catch (error) {
      try {
        await get().refreshNotifications({ userId, limit: 120 });
      } catch {}
      set((state) => ({
        pendingActionById: removePendingAction(state.pendingActionById, notificationId),
      }));
      throw error;
    }
  },
  clearNotificationsAndStore: async ({ userId }) => {
    if (!userId || get().isClearing) {
      return;
    }

    set({ isClearing: true });

    try {
      await clearNotifications({ userId });
      set({
        notificationsById: {},
        notificationIds: [],
        hydratedUserId: userId,
        isClearing: false,
        unreadCount: 0,
        pendingActionById: {},
        hydrateError: null,
      });
    } catch (error) {
      set({
        isClearing: false,
      });
      throw error;
    }
  },
  clearNotificationsState: () => {
    set({
      notificationsById: {},
      notificationIds: [],
      hydratedUserId: null,
      isHydrating: false,
      hydrateError: null,
      isClearing: false,
      unreadCount: 0,
      pendingActionById: {},
    });
  },
}));
