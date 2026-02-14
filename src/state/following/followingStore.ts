import { create } from 'zustand';
import { listFollowingUserIds } from '../../services/following';

type FollowingHydrateOptions = {
  staleMs?: number;
  force?: boolean;
};

type FollowingState = {
  followedUserIdsByUserId: Record<string, string[]>;
  isHydratingByUserId: Record<string, boolean>;
  errorByUserId: Record<string, string | null>;
  lastHydratedAtByUserId: Record<string, number | null>;
  hydrateFollowing: (userId: string, options?: FollowingHydrateOptions) => Promise<void>;
  clearFollowing: () => void;
};

const DEFAULT_STALE_MS = 2 * 60 * 1000;

const isFresh = (timestamp: number | null | undefined, staleMs: number) => {
  if (typeof timestamp !== 'number') {
    return false;
  }
  return Date.now() - timestamp < staleMs;
};

export const useFollowingStore = create<FollowingState>((set, get) => ({
  followedUserIdsByUserId: {},
  isHydratingByUserId: {},
  errorByUserId: {},
  lastHydratedAtByUserId: {},
  hydrateFollowing: async (userId, options = {}) => {
    if (!userId) {
      return;
    }

    const staleMs = Math.max(0, options.staleMs ?? DEFAULT_STALE_MS);
    const force = options.force === true;
    const stateAtStart = get();
    const currentlyHydrating = Boolean(stateAtStart.isHydratingByUserId[userId]);
    const lastHydratedAt = stateAtStart.lastHydratedAtByUserId[userId];

    if (currentlyHydrating || (!force && isFresh(lastHydratedAt, staleMs))) {
      return;
    }

    set((state) => ({
      isHydratingByUserId: {
        ...state.isHydratingByUserId,
        [userId]: true,
      },
      errorByUserId: {
        ...state.errorByUserId,
        [userId]: null,
      },
    }));

    try {
      const result = await listFollowingUserIds({ userId, limit: 300 });
      const hydratedAt = Date.now();

      set((state) => ({
        followedUserIdsByUserId: {
          ...state.followedUserIdsByUserId,
          [userId]: result.followedUserIds,
        },
        isHydratingByUserId: {
          ...state.isHydratingByUserId,
          [userId]: false,
        },
        errorByUserId: {
          ...state.errorByUserId,
          [userId]: null,
        },
        lastHydratedAtByUserId: {
          ...state.lastHydratedAtByUserId,
          [userId]: hydratedAt,
        },
      }));
    } catch (error) {
      set((state) => ({
        isHydratingByUserId: {
          ...state.isHydratingByUserId,
          [userId]: false,
        },
        errorByUserId: {
          ...state.errorByUserId,
          [userId]: error instanceof Error ? error.message : 'following-hydrate-failed',
        },
      }));
    }
  },
  clearFollowing: () => {
    set({
      followedUserIdsByUserId: {},
      isHydratingByUserId: {},
      errorByUserId: {},
      lastHydratedAtByUserId: {},
    });
  },
}));
