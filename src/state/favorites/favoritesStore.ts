import { create } from 'zustand';
import { listFavorites, removeFavorite, saveFavorite, FavoriteRecord } from '../../services/favorites';
import { ReviewRecord } from '../../services/reviews';
import { toFavoriteSnapshot } from './favoriteViewModels';

type FavoriteState = {
  favoritesByReviewId: Record<string, FavoriteRecord>;
  favoriteReviewIds: string[];
  hydratedUserId: string | null;
  isHydrating: boolean;
  hydrateError: string | null;
  hydrateFavorites: (input: { userId: string; limit?: number; force?: boolean }) => Promise<void>;
  refreshFavorites: (input: { userId: string; limit?: number }) => Promise<void>;
  toggleFavorite: (input: { userId: string; review: ReviewRecord }) => Promise<boolean>;
  removeFavoriteAndStore: (input: { userId: string; reviewId: string }) => Promise<void>;
  clearFavorites: () => void;
};

const byNewestFavorite = (a: FavoriteRecord, b: FavoriteRecord) =>
  b.createdAt.localeCompare(a.createdAt);

const toSortedIds = (favoritesByReviewId: Record<string, FavoriteRecord>) =>
  Object.values(favoritesByReviewId).sort(byNewestFavorite).map((favorite) => favorite.reviewId);

const upsertFavoriteRecord = (
  favoritesByReviewId: Record<string, FavoriteRecord>,
  favorite: FavoriteRecord
) => ({
  ...favoritesByReviewId,
  [favorite.reviewId]: favorite,
});

const removeFavoriteRecord = (
  favoritesByReviewId: Record<string, FavoriteRecord>,
  reviewId: string
) => {
  if (!favoritesByReviewId[reviewId]) {
    return favoritesByReviewId;
  }
  const next = { ...favoritesByReviewId };
  delete next[reviewId];
  return next;
};

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favoritesByReviewId: {},
  favoriteReviewIds: [],
  hydratedUserId: null,
  isHydrating: false,
  hydrateError: null,
  hydrateFavorites: async ({ userId, limit = 120, force = false }) => {
    const state = get();
    const isDifferentUser = state.hydratedUserId && state.hydratedUserId !== userId;
    const alreadyHydrated = state.hydratedUserId === userId && !force;

    if (isDifferentUser) {
      set({
        favoritesByReviewId: {},
        favoriteReviewIds: [],
        hydratedUserId: null,
        hydrateError: null,
      });
    }

    if (get().isHydrating || alreadyHydrated) {
      return;
    }

    set({ isHydrating: true, hydrateError: null });

    try {
      const records = await listFavorites({ userId, limit });

      set(() => {
        const nextByReviewId = records.reduce<Record<string, FavoriteRecord>>((acc, favorite) => {
          acc[favorite.reviewId] = favorite;
          return acc;
        }, {});

        return {
          favoritesByReviewId: nextByReviewId,
          favoriteReviewIds: toSortedIds(nextByReviewId),
          hydratedUserId: userId,
          isHydrating: false,
          hydrateError: null,
        };
      });
    } catch (error) {
      set({
        isHydrating: false,
        hydrateError: error instanceof Error ? error.message : 'favorites-hydrate-failed',
      });
      throw error;
    }
  },
  refreshFavorites: async ({ userId, limit = 120 }) => {
    await get().hydrateFavorites({ userId, limit, force: true });
  },
  toggleFavorite: async ({ userId, review }) => {
    const existingFavorite = get().favoritesByReviewId[review.id];

    if (existingFavorite) {
      await removeFavorite({ userId, reviewId: review.id });
      set((state) => {
        const nextByReviewId = removeFavoriteRecord(state.favoritesByReviewId, review.id);
        return {
          favoritesByReviewId: nextByReviewId,
          favoriteReviewIds: toSortedIds(nextByReviewId),
        };
      });
      return false;
    }

    const createdAt = new Date().toISOString();
    const savedFavorite = await saveFavorite({
      userId,
      reviewId: review.id,
      createdAt,
      snapshot: toFavoriteSnapshot(review),
    });

    set((state) => {
      const nextByReviewId = upsertFavoriteRecord(state.favoritesByReviewId, savedFavorite);
      return {
        favoritesByReviewId: nextByReviewId,
        favoriteReviewIds: toSortedIds(nextByReviewId),
      };
    });

    return true;
  },
  removeFavoriteAndStore: async ({ userId, reviewId }) => {
    await removeFavorite({ userId, reviewId });
    set((state) => {
      const nextByReviewId = removeFavoriteRecord(state.favoritesByReviewId, reviewId);
      return {
        favoritesByReviewId: nextByReviewId,
        favoriteReviewIds: toSortedIds(nextByReviewId),
      };
    });
  },
  clearFavorites: () => {
    set({
      favoritesByReviewId: {},
      favoriteReviewIds: [],
      hydratedUserId: null,
      isHydrating: false,
      hydrateError: null,
    });
  },
}));
