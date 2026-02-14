import { getFirestoreDb, isFirebaseConfigured } from './firebase';
import { runFirestoreOperation } from './firebaseDbLogger';
import {
  CreateNotificationInput,
  ListNotificationsResult,
  NotificationRecord,
  NotificationRequestStatus,
  NotificationType,
} from './notifications.types';

export type NotificationsRepository = {
  list: (input: { userId: string; limit: number }) => Promise<ListNotificationsResult>;
  create: (input: CreateNotificationInput) => Promise<NotificationRecord>;
  markRead: (input: { userId: string; notificationId: string; readAt: string }) => Promise<void>;
  updateRequestStatus: (input: {
    userId: string;
    notificationId: string;
    requestStatus: Exclude<NotificationRequestStatus, null>;
    readAt?: string;
  }) => Promise<void>;
  clear: (input: { userId: string }) => Promise<void>;
  subscribeUnreadCount: (input: {
    userId: string;
    onChange: (count: number) => void;
    onError?: (error: unknown) => void;
  }) => Promise<() => void>;
};

const localNotificationsByUserId: Record<string, Record<string, NotificationRecord>> = {};
const localUnreadCountListenersByUserId: Record<string, Set<(count: number) => void>> = {};

const NOTIFICATION_BATCH_DELETE_LIMIT = 200;
export const DEFAULT_NOTIFICATIONS_LIMIT = 120;

const randomId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const isNotificationType = (value: unknown): value is NotificationType =>
  value === 'follow_started' ||
  value === 'follow_request' ||
  value === 'review_published' ||
  value === 'follow_request_accepted';

const isRequestStatus = (value: unknown): value is NotificationRequestStatus =>
  value === 'pending' || value === 'accepted' || value === 'declined' || value === null;

const toNotificationRecord = (id: string, raw: unknown): NotificationRecord | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const userId = toStringOrNull(source.userId);
  const actorUserId = toStringOrNull(source.actorUserId);
  const actorName = toStringOrNull(source.actorName);
  const actorHandle = toStringOrNull(source.actorHandle);
  const createdAt = toStringOrNull(source.createdAt);

  if (!userId || !actorUserId || !actorName || !actorHandle || !createdAt) {
    return null;
  }

  if (!isNotificationType(source.type)) {
    return null;
  }

  const readAtRaw = source.readAt;
  const readAt =
    readAtRaw === null || typeof readAtRaw === 'undefined' ? null : toStringOrNull(readAtRaw);

  const requestStatusRaw = source.requestStatus;
  const requestStatus =
    typeof requestStatusRaw === 'undefined'
      ? null
      : isRequestStatus(requestStatusRaw)
        ? requestStatusRaw
        : null;

  const targetReviewVisibility =
    source.targetReviewVisibility === 'followers' || source.targetReviewVisibility === 'subscribers'
      ? source.targetReviewVisibility
      : null;

  return {
    id,
    userId,
    type: source.type,
    actorUserId,
    actorName,
    actorHandle,
    actorAvatar: toStringOrNull(source.actorAvatar),
    createdAt,
    readAt,
    requestStatus,
    targetReviewId: toStringOrNull(source.targetReviewId),
    targetReviewPlaceTitle: toStringOrNull(source.targetReviewPlaceTitle),
    targetReviewPlaceSubtitle: toStringOrNull(source.targetReviewPlaceSubtitle),
    targetReviewImageUrl: toStringOrNull(source.targetReviewImageUrl),
    targetReviewVisibility,
  };
};

const byNewestNotification = (a: NotificationRecord, b: NotificationRecord) =>
  b.createdAt.localeCompare(a.createdAt);

const toPayload = (input: CreateNotificationInput, id: string) => ({
  id,
  userId: input.userId,
  type: input.type,
  actorUserId: input.actorUserId,
  actorName: input.actorName,
  actorHandle: input.actorHandle,
  actorAvatar: input.actorAvatar ?? null,
  createdAt: input.createdAt,
  readAt: input.readAt ?? null,
  requestStatus: input.requestStatus ?? (input.type === 'follow_request' ? 'pending' : null),
  targetReviewId: input.targetReviewId ?? null,
  targetReviewPlaceTitle: input.targetReviewPlaceTitle ?? null,
  targetReviewPlaceSubtitle: input.targetReviewPlaceSubtitle ?? null,
  targetReviewImageUrl: input.targetReviewImageUrl ?? null,
  targetReviewVisibility: input.targetReviewVisibility ?? null,
});

const getLocalUnreadCount = (userId: string) =>
  Object.values(localNotificationsByUserId[userId] || {}).filter((item) => !item.readAt).length;

const emitLocalUnreadCount = (userId: string) => {
  const listeners = localUnreadCountListenersByUserId[userId];
  if (!listeners || listeners.size === 0) {
    return;
  }

  const count = getLocalUnreadCount(userId);
  listeners.forEach((listener) => {
    listener(count);
  });
};

function createLocalNotificationsRepository(): NotificationsRepository {
  return {
    list: async ({ userId, limit }) => {
      const userNotifications = Object.values(localNotificationsByUserId[userId] || {}).sort(
        byNewestNotification
      );

      return {
        items: userNotifications.slice(0, Math.max(1, limit)),
        unreadCount: userNotifications.filter((item) => !item.readAt).length,
      };
    },
    create: async (input) => {
      const id = input.id || randomId();
      const payload = toPayload(input, id);

      localNotificationsByUserId[input.userId] = {
        ...(localNotificationsByUserId[input.userId] || {}),
        [id]: payload,
      };

      emitLocalUnreadCount(input.userId);
      return payload;
    },
    markRead: async ({ userId, notificationId, readAt }) => {
      const userNotifications = localNotificationsByUserId[userId];
      if (!userNotifications || !userNotifications[notificationId]) {
        return;
      }

      userNotifications[notificationId] = {
        ...userNotifications[notificationId],
        readAt,
      };

      emitLocalUnreadCount(userId);
    },
    updateRequestStatus: async ({ userId, notificationId, requestStatus, readAt }) => {
      const userNotifications = localNotificationsByUserId[userId];
      if (!userNotifications || !userNotifications[notificationId]) {
        return;
      }

      userNotifications[notificationId] = {
        ...userNotifications[notificationId],
        requestStatus,
        readAt: readAt || userNotifications[notificationId].readAt,
      };

      emitLocalUnreadCount(userId);
    },
    clear: async ({ userId }) => {
      localNotificationsByUserId[userId] = {};
      emitLocalUnreadCount(userId);
    },
    subscribeUnreadCount: async ({ userId, onChange }) => {
      const listeners = localUnreadCountListenersByUserId[userId] || new Set<(count: number) => void>();
      listeners.add(onChange);
      localUnreadCountListenersByUserId[userId] = listeners;

      onChange(getLocalUnreadCount(userId));

      return () => {
        const activeListeners = localUnreadCountListenersByUserId[userId];
        if (!activeListeners) {
          return;
        }

        activeListeners.delete(onChange);
        if (activeListeners.size === 0) {
          delete localUnreadCountListenersByUserId[userId];
        }
      };
    },
  };
}

function createFirestoreNotificationsRepository(): NotificationsRepository {
  return {
    list: async ({ userId, limit }) => {
      const {
        collection,
        getCountFromServer,
        getDocs,
        limit: limitFn,
        orderBy,
        query,
        where,
      } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const boundedLimit = Math.max(1, limit);

      const listQuery = query(
        collection(db, 'userNotifications', userId, 'items'),
        orderBy('createdAt', 'desc'),
        limitFn(boundedLimit)
      );

      const listSnapshot = await runFirestoreOperation(
        'notifications.listNotifications',
        {
          userId,
          limit: boundedLimit,
          path: `userNotifications/${userId}/items`,
        },
        () => getDocs(listQuery)
      );

      const records: NotificationRecord[] = [];
      listSnapshot.forEach((item) => {
        const parsed = toNotificationRecord(item.id, item.data());
        if (parsed) {
          records.push(parsed);
        }
      });

      let unreadCount = 0;
      try {
        const unreadQuery = query(
          collection(db, 'userNotifications', userId, 'items'),
          where('readAt', '==', null)
        );

        const unreadSnapshot = await runFirestoreOperation(
          'notifications.getUnreadCount',
          {
            userId,
            path: `userNotifications/${userId}/items`,
          },
          () => getCountFromServer(unreadQuery)
        );

        unreadCount = unreadSnapshot.data().count;
      } catch {
        unreadCount = records.filter((item) => !item.readAt).length;
      }

      return {
        items: records.sort(byNewestNotification),
        unreadCount,
      };
    },
    create: async (input) => {
      const { doc, setDoc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const id = input.id || randomId();
      const notificationRef = doc(db, 'userNotifications', input.userId, 'items', id);
      const payload = toPayload(input, id);

      await runFirestoreOperation(
        'notifications.createNotification',
        {
          userId: input.userId,
          actorUserId: input.actorUserId,
          type: input.type,
          notificationId: id,
          path: notificationRef.path,
        },
        () => setDoc(notificationRef, payload)
      );

      return payload;
    },
    markRead: async ({ userId, notificationId, readAt }) => {
      const { doc, updateDoc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const notificationRef = doc(db, 'userNotifications', userId, 'items', notificationId);

      await runFirestoreOperation(
        'notifications.markNotificationRead',
        {
          userId,
          notificationId,
          path: notificationRef.path,
        },
        () => updateDoc(notificationRef, { readAt })
      );
    },
    updateRequestStatus: async ({ userId, notificationId, requestStatus, readAt }) => {
      const { doc, updateDoc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const notificationRef = doc(db, 'userNotifications', userId, 'items', notificationId);

      await runFirestoreOperation(
        'notifications.updateRequestStatus',
        {
          userId,
          notificationId,
          requestStatus,
          path: notificationRef.path,
        },
        () =>
          updateDoc(notificationRef, {
            requestStatus,
            ...(readAt ? { readAt } : {}),
          })
      );
    },
    clear: async ({ userId }) => {
      const { collection, getDocs, limit: limitFn, query, writeBatch } = await import(
        'firebase/firestore'
      );
      const db = getFirestoreDb();
      const collectionRef = collection(db, 'userNotifications', userId, 'items');

      while (true) {
        const pageQuery = query(collectionRef, limitFn(NOTIFICATION_BATCH_DELETE_LIMIT));
        const pageSnapshot = await runFirestoreOperation(
          'notifications.clearNotifications.page',
          {
            userId,
            pageSize: NOTIFICATION_BATCH_DELETE_LIMIT,
            path: `userNotifications/${userId}/items`,
          },
          () => getDocs(pageQuery)
        );

        if (pageSnapshot.empty) {
          return;
        }

        const batch = writeBatch(db);
        pageSnapshot.docs.forEach((item) => {
          batch.delete(item.ref);
        });

        await runFirestoreOperation(
          'notifications.clearNotifications.commit',
          {
            userId,
            deletedInBatch: pageSnapshot.size,
            path: `userNotifications/${userId}/items`,
          },
          () => batch.commit()
        );

        if (pageSnapshot.size < NOTIFICATION_BATCH_DELETE_LIMIT) {
          return;
        }
      }
    },
    subscribeUnreadCount: async ({ userId, onChange, onError }) => {
      const { collection, onSnapshot, query, where } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const unreadQuery = query(
        collection(db, 'userNotifications', userId, 'items'),
        where('readAt', '==', null)
      );

      const unsubscribe = onSnapshot(
        unreadQuery,
        (snapshot) => {
          onChange(snapshot.size);
        },
        (error) => {
          if (onError) {
            onError(error);
          }
        }
      );

      return unsubscribe;
    },
  };
}

export function createNotificationsRepository(): NotificationsRepository {
  return isFirebaseConfigured ? createFirestoreNotificationsRepository() : createLocalNotificationsRepository();
}
