import { getFirestoreDb, isFirebaseConfigured } from '../firebase';
import { runFirestoreOperation } from '../firebaseDbLogger';
import { FollowingListState } from './types';

type FollowingRepository = {
  listFollowingUserIds: (input: { userId: string; limit: number }) => Promise<FollowingListState>;
};

const localFollowingByUserId: Record<string, string[]> = {};

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

function createLocalFollowingRepository(): FollowingRepository {
  return {
    listFollowingUserIds: async ({ userId }) => ({
      userId,
      followedUserIds: toUniqueIds(localFollowingByUserId[userId] || [], userId),
    }),
  };
}

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
  };
}

export function createFollowingRepository(): FollowingRepository {
  if (!isFirebaseConfigured) {
    return createLocalFollowingRepository();
  }

  return createFirestoreFollowingRepository();
}
