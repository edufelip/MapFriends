import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { BlockedUserRecord } from '../../services/blocks';
import { useBlockedUsersStore } from './blocksStore';

const EMPTY_BLOCKED_USERS_BY_ID: Record<string, BlockedUserRecord> = {};
const EMPTY_PENDING_UNBLOCK_BY_ID: Record<string, boolean> = {};

const selectBlockedUserRecords = (state: {
  blockedUserIds: string[];
  blockedUsersById: Record<string, BlockedUserRecord>;
}) => state.blockedUserIds.map((blockedUserId) => state.blockedUsersById[blockedUserId]).filter(Boolean);

const selectBlockedUsersHydrationGate = (state: {
  hydratedUserId: string | null;
  isHydrating: boolean;
  hydrateError: string | null;
}) => ({
  hydratedUserId: state.hydratedUserId,
  isHydrating: state.isHydrating,
  hydrateError: state.hydrateError,
});

export function useBlockedUserRecords() {
  return useBlockedUsersStore(useShallow(selectBlockedUserRecords));
}

export function useBlockedUsersHydrating() {
  return useBlockedUsersStore((state) => state.isHydrating);
}

export function useBlockedUsersError() {
  return useBlockedUsersStore((state) => state.hydrateError);
}

export function usePendingUnblockIds() {
  return useBlockedUsersStore((state) => state.pendingUnblockById || EMPTY_PENDING_UNBLOCK_BY_ID);
}

export function useIsUserBlocked(blockedUserId: string | null | undefined) {
  return useBlockedUsersStore((state) => {
    if (!blockedUserId) {
      return false;
    }

    return Boolean((state.blockedUsersById || EMPTY_BLOCKED_USERS_BY_ID)[blockedUserId]);
  });
}

export function useHydrateBlockedUsersState(
  userId: string | null | undefined,
  enabled = true,
  limit = 120
) {
  const { hydratedUserId, isHydrating, hydrateError } = useBlockedUsersStore(useShallow(selectBlockedUsersHydrationGate));
  const hydrateBlockedUsers = useBlockedUsersStore((state) => state.hydrateBlockedUsers);
  const clearBlockedUsers = useBlockedUsersStore((state) => state.clearBlockedUsers);

  React.useEffect(() => {
    if (!enabled || !userId) {
      clearBlockedUsers();
      return;
    }

    if (isHydrating || hydrateError) {
      return;
    }

    if (hydratedUserId === userId) {
      return;
    }

    void hydrateBlockedUsers({ userId, limit });
  }, [clearBlockedUsers, enabled, hydrateError, hydrateBlockedUsers, hydratedUserId, isHydrating, limit, userId]);
}

export function useUnblockBlockedUser() {
  const unblockUserAndStore = useBlockedUsersStore((state) => state.unblockUserAndStore);

  return React.useCallback(
    async (input: { userId: string; blockedUserId: string }) => unblockUserAndStore(input),
    [unblockUserAndStore]
  );
}
