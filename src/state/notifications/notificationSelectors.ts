import React from 'react';
import { AppState } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { subscribeNotificationUnreadCount, NotificationRecord } from '../../services/notifications';
import { useNotificationsStore } from './notificationsStore';

const EMPTY_NOTIFICATIONS_BY_ID: Record<string, NotificationRecord> = {};
const EMPTY_PENDING_BY_ID: Record<string, boolean> = {};

const selectNotificationRecords = (state: {
  notificationIds: string[];
  notificationsById: Record<string, NotificationRecord>;
}) =>
  state.notificationIds
    .map((notificationId) => state.notificationsById[notificationId])
    .filter(Boolean);

const selectHydrationGate = (state: {
  hydratedUserId: string | null;
  isHydrating: boolean;
  hydrateError: string | null;
}) => ({
  hydratedUserId: state.hydratedUserId,
  isHydrating: state.isHydrating,
  hydrateError: state.hydrateError,
});

export function useNotificationRecords() {
  return useNotificationsStore(useShallow(selectNotificationRecords));
}

export function useNotificationUnreadCount(userId?: string | null) {
  return useNotificationsStore((state) => {
    if (
      !userId ||
      (state.hydratedUserId !== userId && state.unreadCountUserId !== userId)
    ) {
      return 0;
    }

    return Math.max(0, state.unreadCount);
  });
}

export function useObserveNotificationUnreadCount(userId?: string | null, enabled = true) {
  const setUnreadCountForUser = useNotificationsStore((state) => state.setUnreadCountForUser);

  React.useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const stopSubscription = () => {
      if (!unsubscribe) {
        return;
      }

      unsubscribe();
      unsubscribe = null;
    };

    const startSubscription = async () => {
      stopSubscription();

      try {
        const nextUnsubscribe = await subscribeNotificationUnreadCount({
          userId,
          onChange: (unreadCount) => {
            if (!isMounted) {
              return;
            }

            setUnreadCountForUser({ userId, unreadCount });
          },
        });

        if (!isMounted) {
          nextUnsubscribe();
          return;
        }

        unsubscribe = nextUnsubscribe;
      } catch {
        // best-effort live updates; fallback refresh still keeps the badge fresh.
      }
    };

    if (AppState.currentState === 'active') {
      void startSubscription();
    }

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void startSubscription();
        return;
      }

      stopSubscription();
    });

    return () => {
      isMounted = false;
      appStateSubscription.remove();
      stopSubscription();
    };
  }, [enabled, setUnreadCountForUser, userId]);
}

export function useNotificationsHydrating() {
  return useNotificationsStore((state) => state.isHydrating);
}

export function useNotificationsClearing() {
  return useNotificationsStore((state) => state.isClearing);
}

export function useNotificationsError() {
  return useNotificationsStore((state) => state.hydrateError);
}

export function usePendingNotificationActions() {
  return useNotificationsStore((state) => state.pendingActionById || EMPTY_PENDING_BY_ID);
}

export function useNotificationById(notificationId?: string | null) {
  return useNotificationsStore((state) => {
    if (!notificationId) {
      return null;
    }

    return (state.notificationsById || EMPTY_NOTIFICATIONS_BY_ID)[notificationId] || null;
  });
}

export function useHydrateNotificationsState(
  userId: string | null | undefined,
  enabled = true,
  limit = 120
) {
  const { hydratedUserId, isHydrating, hydrateError } = useNotificationsStore(
    useShallow(selectHydrationGate)
  );
  const hydrateNotifications = useNotificationsStore((state) => state.hydrateNotifications);
  const clearNotificationsState = useNotificationsStore((state) => state.clearNotificationsState);

  React.useEffect(() => {
    if (!enabled || !userId) {
      clearNotificationsState();
      return;
    }

    if (isHydrating || hydrateError) {
      return;
    }

    if (hydratedUserId === userId) {
      return;
    }

    void hydrateNotifications({ userId, limit });
  }, [
    clearNotificationsState,
    enabled,
    hydrateError,
    hydrateNotifications,
    hydratedUserId,
    isHydrating,
    limit,
    userId,
  ]);
}

export function useRefreshNotifications() {
  const refreshNotifications = useNotificationsStore((state) => state.refreshNotifications);
  return React.useCallback(
    async (input: { userId: string; limit?: number }) => refreshNotifications(input),
    [refreshNotifications]
  );
}

export function useMarkNotificationRead() {
  const markNotificationReadAndStore = useNotificationsStore((state) => state.markNotificationReadAndStore);
  return React.useCallback(
    async (input: { userId: string; notificationId: string }) => markNotificationReadAndStore(input),
    [markNotificationReadAndStore]
  );
}

export function useAcceptFollowRequestNotification() {
  const acceptFollowRequestAndStore = useNotificationsStore(
    (state) => state.acceptFollowRequestAndStore
  );

  return React.useCallback(
    async (input: {
      userId: string;
      notificationId: string;
      actor: {
        id: string;
        name: string;
        handle: string;
        avatar: string | null;
      };
    }) => acceptFollowRequestAndStore(input),
    [acceptFollowRequestAndStore]
  );
}

export function useDeclineFollowRequestNotification() {
  const declineFollowRequestAndStore = useNotificationsStore(
    (state) => state.declineFollowRequestAndStore
  );

  return React.useCallback(
    async (input: { userId: string; notificationId: string }) => declineFollowRequestAndStore(input),
    [declineFollowRequestAndStore]
  );
}

export function useFollowBackNotification() {
  const followBackAndStore = useNotificationsStore((state) => state.followBackAndStore);

  return React.useCallback(
    async (input: {
      userId: string;
      notificationId: string;
      actor: {
        id: string;
        name: string;
        handle: string;
        avatar: string | null;
      };
    }) => followBackAndStore(input),
    [followBackAndStore]
  );
}

export function useClearNotifications() {
  const clearNotificationsAndStore = useNotificationsStore((state) => state.clearNotificationsAndStore);
  return React.useCallback(
    async (input: { userId: string }) => clearNotificationsAndStore(input),
    [clearNotificationsAndStore]
  );
}
