import { create } from 'zustand';
import { BlockedUserRecord, listBlockedUsers, removeBlockedUser } from '../../services/blocks';

type HydrateBlockedUsersInput = {
  userId: string;
  limit?: number;
  force?: boolean;
};

type BlockedUsersState = {
  blockedUsersById: Record<string, BlockedUserRecord>;
  blockedUserIds: string[];
  hydratedUserId: string | null;
  isHydrating: boolean;
  hydrateError: string | null;
  pendingUnblockById: Record<string, boolean>;
  hydrateBlockedUsers: (input: HydrateBlockedUsersInput) => Promise<void>;
  refreshBlockedUsers: (input: { userId: string; limit?: number }) => Promise<void>;
  unblockUserAndStore: (input: { userId: string; blockedUserId: string }) => Promise<void>;
  clearBlockedUsers: () => void;
};

const byNewestBlockedDate = (a: BlockedUserRecord, b: BlockedUserRecord) =>
  b.createdAt.localeCompare(a.createdAt);

const toSortedBlockedUserIds = (blockedUsersById: Record<string, BlockedUserRecord>) =>
  Object.values(blockedUsersById).sort(byNewestBlockedDate).map((blockedUser) => blockedUser.blockedUserId);

const removeBlockedUserRecord = (
  blockedUsersById: Record<string, BlockedUserRecord>,
  blockedUserId: string
) => {
  if (!blockedUsersById[blockedUserId]) {
    return blockedUsersById;
  }

  const next = { ...blockedUsersById };
  delete next[blockedUserId];
  return next;
};

const upsertBlockedUserRecord = (
  blockedUsersById: Record<string, BlockedUserRecord>,
  blockedUser: BlockedUserRecord
) => ({
  ...blockedUsersById,
  [blockedUser.blockedUserId]: blockedUser,
});

export const useBlockedUsersStore = create<BlockedUsersState>((set, get) => ({
  blockedUsersById: {},
  blockedUserIds: [],
  hydratedUserId: null,
  isHydrating: false,
  hydrateError: null,
  pendingUnblockById: {},
  hydrateBlockedUsers: async ({ userId, limit = 120, force = false }) => {
    const state = get();
    const isDifferentUser = state.hydratedUserId && state.hydratedUserId !== userId;
    const alreadyHydrated = state.hydratedUserId === userId && !force;

    if (isDifferentUser) {
      set({
        blockedUsersById: {},
        blockedUserIds: [],
        hydratedUserId: null,
        hydrateError: null,
        pendingUnblockById: {},
      });
    }

    if (get().isHydrating || alreadyHydrated) {
      return;
    }

    set({ isHydrating: true, hydrateError: null });

    try {
      const records = await listBlockedUsers({ userId, limit });

      set(() => {
        const nextById = records.reduce<Record<string, BlockedUserRecord>>((acc, record) => {
          acc[record.blockedUserId] = record;
          return acc;
        }, {});

        return {
          blockedUsersById: nextById,
          blockedUserIds: toSortedBlockedUserIds(nextById),
          hydratedUserId: userId,
          isHydrating: false,
          hydrateError: null,
          pendingUnblockById: {},
        };
      });
    } catch (error) {
      set({
        isHydrating: false,
        hydrateError: error instanceof Error ? error.message : 'blocked-users-hydrate-failed',
      });
      throw error;
    }
  },
  refreshBlockedUsers: async ({ userId, limit = 120 }) => {
    await get().hydrateBlockedUsers({ userId, limit, force: true });
  },
  unblockUserAndStore: async ({ userId, blockedUserId }) => {
    const existingRecord = get().blockedUsersById[blockedUserId];

    if (!existingRecord || get().pendingUnblockById[blockedUserId]) {
      return;
    }

    set((state) => {
      const nextById = removeBlockedUserRecord(state.blockedUsersById, blockedUserId);

      return {
        blockedUsersById: nextById,
        blockedUserIds: toSortedBlockedUserIds(nextById),
        pendingUnblockById: {
          ...state.pendingUnblockById,
          [blockedUserId]: true,
        },
      };
    });

    try {
      await removeBlockedUser({ userId, blockedUserId });

      set((state) => {
        const nextPending = { ...state.pendingUnblockById };
        delete nextPending[blockedUserId];

        return {
          pendingUnblockById: nextPending,
        };
      });
    } catch (error) {
      set((state) => {
        const nextPending = { ...state.pendingUnblockById };
        delete nextPending[blockedUserId];

        const nextById = upsertBlockedUserRecord(state.blockedUsersById, existingRecord);

        return {
          blockedUsersById: nextById,
          blockedUserIds: toSortedBlockedUserIds(nextById),
          pendingUnblockById: nextPending,
        };
      });

      throw error;
    }
  },
  clearBlockedUsers: () => {
    set({
      blockedUsersById: {},
      blockedUserIds: [],
      hydratedUserId: null,
      isHydrating: false,
      hydrateError: null,
      pendingUnblockById: {},
    });
  },
}));
