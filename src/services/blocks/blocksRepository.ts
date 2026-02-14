import { getFirestoreDb, isFirebaseConfigured } from '../firebase';
import { runFirestoreOperation } from '../firebaseDbLogger';
import { BlockedUserRecord } from './types';

type BlocksRepository = {
  listBlockedUsers: (input: { userId: string; limit: number }) => Promise<BlockedUserRecord[]>;
  removeBlockedUser: (input: { userId: string; blockedUserId: string }) => Promise<void>;
};

const localBlockedByUserId: Record<string, Record<string, BlockedUserRecord>> = {};

const DEFAULT_BLOCKED_NAME = 'Blocked user';
const DEFAULT_BLOCKED_HANDLE = 'blocked_user';
const DEFAULT_BLOCKED_CREATED_AT = '1970-01-01T00:00:00.000Z';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
};

const toCleanHandle = (value: unknown) => {
  const normalized = toStringOrNull(value);
  if (!normalized) {
    return null;
  }

  return normalized.replace(/^@+/, '').trim() || null;
};

const toBlockedUserRecord = (
  userId: string,
  docId: string,
  raw: unknown
): BlockedUserRecord | null => {
  if (!isRecord(raw)) {
    return null;
  }

  const blockedUserId = toStringOrNull(raw.blockedUserId) || docId;
  if (!blockedUserId) {
    return null;
  }

  const blockedName =
    toStringOrNull(raw.blockedName) ||
    toStringOrNull(raw.userName) ||
    toStringOrNull(raw.name) ||
    DEFAULT_BLOCKED_NAME;

  const blockedHandle =
    toCleanHandle(raw.blockedHandle) ||
    toCleanHandle(raw.userHandle) ||
    toCleanHandle(raw.handle) ||
    DEFAULT_BLOCKED_HANDLE;

  const blockedAvatar =
    toStringOrNull(raw.blockedAvatar) ||
    toStringOrNull(raw.userAvatar) ||
    toStringOrNull(raw.avatar);

  const createdAt = toStringOrNull(raw.createdAt) || DEFAULT_BLOCKED_CREATED_AT;

  return {
    userId,
    blockedUserId,
    blockedName,
    blockedHandle,
    blockedAvatar,
    createdAt,
  };
};

const byNewestBlockedDate = (a: BlockedUserRecord, b: BlockedUserRecord) =>
  b.createdAt.localeCompare(a.createdAt);

function createLocalBlocksRepository(): BlocksRepository {
  return {
    listBlockedUsers: async ({ userId, limit }) =>
      Object.values(localBlockedByUserId[userId] || {})
        .sort(byNewestBlockedDate)
        .slice(0, Math.max(1, limit)),
    removeBlockedUser: async ({ userId, blockedUserId }) => {
      const userBlocks = localBlockedByUserId[userId];
      if (!userBlocks || !userBlocks[blockedUserId]) {
        return;
      }

      const nextUserBlocks = { ...userBlocks };
      delete nextUserBlocks[blockedUserId];
      localBlockedByUserId[userId] = nextUserBlocks;
    },
  };
}

function createFirestoreBlocksRepository(): BlocksRepository {
  return {
    listBlockedUsers: async ({ userId, limit }) => {
      const { collection, getDocs, limit: limitFn, orderBy, query } = await import('firebase/firestore');
      const boundedLimit = Math.max(1, limit);
      const db = getFirestoreDb();
      const blockedUsersQuery = query(
        collection(db, 'userBlocks', userId, 'items'),
        orderBy('createdAt', 'desc'),
        limitFn(boundedLimit)
      );

      const snapshot = await runFirestoreOperation(
        'blocks.listBlockedUsers',
        {
          userId,
          limit: boundedLimit,
          path: `userBlocks/${userId}/items`,
        },
        () => getDocs(blockedUsersQuery)
      );

      const records: BlockedUserRecord[] = [];
      snapshot.forEach((item) => {
        const blockedUser = toBlockedUserRecord(userId, item.id, item.data());
        if (blockedUser) {
          records.push(blockedUser);
        }
      });

      return records;
    },
    removeBlockedUser: async ({ userId, blockedUserId }) => {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const blockedUserRef = doc(db, 'userBlocks', userId, 'items', blockedUserId);

      await runFirestoreOperation(
        'blocks.removeBlockedUser',
        {
          userId,
          blockedUserId,
          path: blockedUserRef.path,
        },
        () => deleteDoc(blockedUserRef)
      );
    },
  };
}

export function createBlocksRepository(): BlocksRepository {
  if (!isFirebaseConfigured) {
    return createLocalBlocksRepository();
  }

  return createFirestoreBlocksRepository();
}
