import { getFirestoreDb, isFirebaseConfigured } from '../firebase';
import { runFirestoreOperation } from '../firebaseDbLogger';
import { FollowerListState, FollowRequestRecord, FollowingListState } from './types';

type FollowingRepository = {
  listFollowingUserIds: (input: { userId: string; limit: number }) => Promise<FollowingListState>;
  listFollowerUserIds: (input: { userId: string; limit: number }) => Promise<FollowerListState>;
  createFollowLink: (input: {
    userId: string;
    followedUserId: string;
    createdAt: string;
  }) => Promise<void>;
  removeFollowLink: (input: { userId: string; followedUserId: string }) => Promise<void>;
  createFollowRequest: (input: FollowRequestRecord) => Promise<void>;
  listOutgoingFollowRequestTargetUserIds: (input: {
    requesterUserId: string;
    targetUserIds: string[];
  }) => Promise<string[]>;
  listFollowRequests: (input: { userId: string; limit: number }) => Promise<FollowRequestRecord[]>;
  acceptFollowRequest: (input: {
    userId: string;
    requesterUserId: string;
    acceptedAt: string;
  }) => Promise<void>;
  declineFollowRequest: (input: { userId: string; requesterUserId: string }) => Promise<void>;
};

const localFollowingByUserId: Record<string, string[]> = {};
const localFollowersByUserId: Record<string, string[]> = {};
const localFollowRequestsByTargetUserId: Record<string, Record<string, FollowRequestRecord>> = {};

const toUniqueIds = (items: string[], userId: string) => {
  const unique = new Set<string>();
  items.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }

    const normalized = value.trim();
    if (!normalized || normalized === userId) {
      return;
    }

    unique.add(normalized);
  });
  return Array.from(unique);
};

const byNewestRequest = (a: FollowRequestRecord, b: FollowRequestRecord) =>
  b.createdAt.localeCompare(a.createdAt);

function createLocalFollowingRepository(): FollowingRepository {
  return {
    listFollowingUserIds: async ({ userId }) => ({
      userId,
      followedUserIds: toUniqueIds(localFollowingByUserId[userId] || [], userId),
    }),
    listFollowerUserIds: async ({ userId }) => ({
      userId,
      followerUserIds: toUniqueIds(localFollowersByUserId[userId] || [], userId),
    }),
    createFollowLink: async ({ userId, followedUserId }) => {
      localFollowingByUserId[userId] = toUniqueIds(
        [...(localFollowingByUserId[userId] || []), followedUserId],
        userId
      );

      localFollowersByUserId[followedUserId] = toUniqueIds(
        [...(localFollowersByUserId[followedUserId] || []), userId],
        followedUserId
      );
    },
    removeFollowLink: async ({ userId, followedUserId }) => {
      localFollowingByUserId[userId] = toUniqueIds(
        (localFollowingByUserId[userId] || []).filter((value) => value !== followedUserId),
        userId
      );

      localFollowersByUserId[followedUserId] = toUniqueIds(
        (localFollowersByUserId[followedUserId] || []).filter((value) => value !== userId),
        followedUserId
      );
    },
    createFollowRequest: async (input) => {
      localFollowRequestsByTargetUserId[input.targetUserId] = {
        ...(localFollowRequestsByTargetUserId[input.targetUserId] || {}),
        [input.requesterUserId]: input,
      };
    },
    listOutgoingFollowRequestTargetUserIds: async ({ requesterUserId, targetUserIds }) => {
      const requested: string[] = [];
      targetUserIds.forEach((targetUserId) => {
        if (!targetUserId) {
          return;
        }

        if (localFollowRequestsByTargetUserId[targetUserId]?.[requesterUserId]) {
          requested.push(targetUserId);
        }
      });

      return requested;
    },
    listFollowRequests: async ({ userId, limit }) =>
      Object.values(localFollowRequestsByTargetUserId[userId] || {})
        .sort(byNewestRequest)
        .slice(0, Math.max(1, limit)),
    acceptFollowRequest: async ({ userId, requesterUserId, acceptedAt }) => {
      const next = { ...(localFollowRequestsByTargetUserId[userId] || {}) };
      delete next[requesterUserId];
      localFollowRequestsByTargetUserId[userId] = next;

      await createLocalFollowingRepository().createFollowLink({
        userId: requesterUserId,
        followedUserId: userId,
        createdAt: acceptedAt,
      });
    },
    declineFollowRequest: async ({ userId, requesterUserId }) => {
      const next = { ...(localFollowRequestsByTargetUserId[userId] || {}) };
      delete next[requesterUserId];
      localFollowRequestsByTargetUserId[userId] = next;
    },
  };
}

const toStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

function createFirestoreFollowingRepository(): FollowingRepository {
  return {
    listFollowingUserIds: async ({ userId, limit }) => {
      const { collection, getDocs, limit: limitFn, query } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const boundedLimit = Math.max(1, limit);
      const followingQuery = query(
        collection(db, 'userFollowing', userId, 'items'),
        limitFn(boundedLimit)
      );

      const snapshot = await runFirestoreOperation(
        'following.listFollowingUserIds',
        {
          userId,
          limit: boundedLimit,
          path: `userFollowing/${userId}/items`,
        },
        () => getDocs(followingQuery)
      );

      const ids: string[] = [];
      snapshot.forEach((item) => {
        const raw = item.data() as Record<string, unknown>;
        const value =
          typeof raw.followedUserId === 'string' && raw.followedUserId.trim()
            ? raw.followedUserId
            : item.id;

        if (typeof value === 'string') {
          ids.push(value);
        }
      });

      return {
        userId,
        followedUserIds: toUniqueIds(ids, userId),
      };
    },
    listFollowerUserIds: async ({ userId, limit }) => {
      const { collection, getDocs, limit: limitFn, query } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const boundedLimit = Math.max(1, limit);
      const followersQuery = query(
        collection(db, 'userFollowers', userId, 'items'),
        limitFn(boundedLimit)
      );

      const snapshot = await runFirestoreOperation(
        'following.listFollowerUserIds',
        {
          userId,
          limit: boundedLimit,
          path: `userFollowers/${userId}/items`,
        },
        () => getDocs(followersQuery)
      );

      const ids: string[] = [];
      snapshot.forEach((item) => {
        const raw = item.data() as Record<string, unknown>;
        const value =
          typeof raw.followerUserId === 'string' && raw.followerUserId.trim()
            ? raw.followerUserId
            : item.id;

        if (typeof value === 'string') {
          ids.push(value);
        }
      });

      return {
        userId,
        followerUserIds: toUniqueIds(ids, userId),
      };
    },
    createFollowLink: async ({ userId, followedUserId, createdAt }) => {
      const { doc, writeBatch } = await import('firebase/firestore');
      const db = getFirestoreDb();

      const followingRef = doc(db, 'userFollowing', userId, 'items', followedUserId);
      const followerRef = doc(db, 'userFollowers', followedUserId, 'items', userId);

      const batch = writeBatch(db);
      batch.set(followingRef, {
        userId,
        followedUserId,
        createdAt,
      });
      batch.set(followerRef, {
        userId: followedUserId,
        followerUserId: userId,
        createdAt,
      });

      await runFirestoreOperation(
        'following.createFollowLink',
        {
          userId,
          followedUserId,
          followingPath: followingRef.path,
          followerPath: followerRef.path,
        },
        () => batch.commit()
      );
    },
    removeFollowLink: async ({ userId, followedUserId }) => {
      const { doc, writeBatch } = await import('firebase/firestore');
      const db = getFirestoreDb();

      const followingRef = doc(db, 'userFollowing', userId, 'items', followedUserId);
      const followerRef = doc(db, 'userFollowers', followedUserId, 'items', userId);

      const batch = writeBatch(db);
      batch.delete(followingRef);
      batch.delete(followerRef);

      await runFirestoreOperation(
        'following.removeFollowLink',
        {
          userId,
          followedUserId,
          followingPath: followingRef.path,
          followerPath: followerRef.path,
        },
        () => batch.commit()
      );
    },
    createFollowRequest: async (input) => {
      const { doc, setDoc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const requestRef = doc(
        db,
        'userFollowRequests',
        input.targetUserId,
        'items',
        input.requesterUserId
      );

      await runFirestoreOperation(
        'following.createFollowRequest',
        {
          targetUserId: input.targetUserId,
          requesterUserId: input.requesterUserId,
          path: requestRef.path,
        },
        () =>
          setDoc(requestRef, {
            targetUserId: input.targetUserId,
            requesterUserId: input.requesterUserId,
            requesterName: input.requesterName,
            requesterHandle: input.requesterHandle,
            requesterAvatar: input.requesterAvatar,
            createdAt: input.createdAt,
          })
      );
    },
    listOutgoingFollowRequestTargetUserIds: async ({ requesterUserId, targetUserIds }) => {
      const { doc, getDoc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const uniqueTargetIds = Array.from(
        new Set(
          targetUserIds
            .map((targetUserId) => (typeof targetUserId === 'string' ? targetUserId.trim() : ''))
            .filter(Boolean)
            .filter((targetUserId) => targetUserId !== requesterUserId)
        )
      );

      if (uniqueTargetIds.length === 0) {
        return [];
      }

      const snapshots = await runFirestoreOperation(
        'following.listOutgoingFollowRequestTargetUserIds',
        {
          requesterUserId,
          targetCount: uniqueTargetIds.length,
        },
        () =>
          Promise.all(
            uniqueTargetIds.map((targetUserId) =>
              getDoc(doc(db, 'userFollowRequests', targetUserId, 'items', requesterUserId))
            )
          )
      );

      return uniqueTargetIds.filter((_, index) => snapshots[index]?.exists());
    },
    listFollowRequests: async ({ userId, limit }) => {
      const { collection, getDocs, limit: limitFn, orderBy, query } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const boundedLimit = Math.max(1, limit);

      const requestsQuery = query(
        collection(db, 'userFollowRequests', userId, 'items'),
        orderBy('createdAt', 'desc'),
        limitFn(boundedLimit)
      );

      const snapshot = await runFirestoreOperation(
        'following.listFollowRequests',
        {
          userId,
          limit: boundedLimit,
          path: `userFollowRequests/${userId}/items`,
        },
        () => getDocs(requestsQuery)
      );

      const records: FollowRequestRecord[] = [];
      snapshot.forEach((item) => {
        const raw = item.data() as Record<string, unknown>;
        const requesterUserId = toStringOrNull(raw.requesterUserId) || item.id;
        const requesterName = toStringOrNull(raw.requesterName);
        const requesterHandle = toStringOrNull(raw.requesterHandle);
        const createdAt = toStringOrNull(raw.createdAt);

        if (!requesterUserId || !requesterName || !requesterHandle || !createdAt) {
          return;
        }

        records.push({
          targetUserId: userId,
          requesterUserId,
          requesterName,
          requesterHandle,
          requesterAvatar: toStringOrNull(raw.requesterAvatar),
          createdAt,
        });
      });

      return records;
    },
    acceptFollowRequest: async ({ userId, requesterUserId, acceptedAt }) => {
      const { doc, writeBatch } = await import('firebase/firestore');
      const db = getFirestoreDb();

      const requestRef = doc(db, 'userFollowRequests', userId, 'items', requesterUserId);
      const followingRef = doc(db, 'userFollowing', requesterUserId, 'items', userId);
      const followerRef = doc(db, 'userFollowers', userId, 'items', requesterUserId);

      const batch = writeBatch(db);
      batch.delete(requestRef);
      batch.set(followingRef, {
        userId: requesterUserId,
        followedUserId: userId,
        createdAt: acceptedAt,
      });
      batch.set(followerRef, {
        userId,
        followerUserId: requesterUserId,
        createdAt: acceptedAt,
      });

      await runFirestoreOperation(
        'following.acceptFollowRequest',
        {
          userId,
          requesterUserId,
          requestPath: requestRef.path,
          followingPath: followingRef.path,
          followerPath: followerRef.path,
        },
        () => batch.commit()
      );
    },
    declineFollowRequest: async ({ userId, requesterUserId }) => {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const requestRef = doc(db, 'userFollowRequests', userId, 'items', requesterUserId);

      await runFirestoreOperation(
        'following.declineFollowRequest',
        {
          userId,
          requesterUserId,
          requestPath: requestRef.path,
        },
        () => deleteDoc(requestRef)
      );
    },
  };
}

export function createFollowingRepository(): FollowingRepository {
  if (!isFirebaseConfigured) {
    return createLocalFollowingRepository();
  }

  return createFirestoreFollowingRepository();
}
