import React from 'react';
import { useFollowingStore } from './followingStore';

const EMPTY_FOLLOWED_USER_IDS: string[] = [];

export function useFollowedUserIds(userId: string | null | undefined) {
  return useFollowingStore(
    React.useCallback(
      (state) => {
        if (!userId) {
          return EMPTY_FOLLOWED_USER_IDS;
        }

        return state.followedUserIdsByUserId[userId] || EMPTY_FOLLOWED_USER_IDS;
      },
      [userId]
    )
  );
}

export function useHydrateFollowing(
  userId: string | null | undefined,
  enabled = true,
  staleMs = 2 * 60 * 1000
) {
  const hydrateFollowing = useFollowingStore((state) => state.hydrateFollowing);

  React.useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    void hydrateFollowing(userId, { staleMs });
  }, [enabled, hydrateFollowing, staleMs, userId]);
}
