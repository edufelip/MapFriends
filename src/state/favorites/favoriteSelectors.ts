import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ReviewRecord } from '../../services/reviews';
import { FavoriteRecord } from '../../services/favorites';
import { useFavoriteStore } from './favoritesStore';

const selectFavoriteRecords = (state: {
  favoriteReviewIds: string[];
  favoritesByReviewId: Record<string, FavoriteRecord>;
}) => state.favoriteReviewIds.map((reviewId) => state.favoritesByReviewId[reviewId]).filter(Boolean);

const selectFavoriteHydrationGate = (state: {
  hydratedUserId: string | null;
  isHydrating: boolean;
  hydrateError: string | null;
}) => ({
  hydratedUserId: state.hydratedUserId,
  isHydrating: state.isHydrating,
  hydrateError: state.hydrateError,
});

export function useFavoriteRecords() {
  return useFavoriteStore(useShallow(selectFavoriteRecords));
}

export function useIsReviewFavorited(reviewId: string | null | undefined) {
  return useFavoriteStore((state) => {
    if (!reviewId) {
      return false;
    }
    return Boolean(state.favoritesByReviewId[reviewId]);
  });
}

export function useHydrateFavoriteState(userId: string | null | undefined, enabled = true, limit = 120) {
  const { hydratedUserId, isHydrating, hydrateError } = useFavoriteStore(useShallow(selectFavoriteHydrationGate));
  const hydrateFavorites = useFavoriteStore((state) => state.hydrateFavorites);
  const clearFavorites = useFavoriteStore((state) => state.clearFavorites);

  React.useEffect(() => {
    if (!enabled || !userId) {
      clearFavorites();
      return;
    }

    if (isHydrating || hydrateError) {
      return;
    }

    if (hydratedUserId === userId) {
      return;
    }

    void hydrateFavorites({ userId, limit });
  }, [clearFavorites, enabled, hydrateError, hydrateFavorites, hydratedUserId, isHydrating, limit, userId]);
}

export function useFavoriteHydrating() {
  return useFavoriteStore((state) => state.isHydrating);
}

export function useToggleFavoriteReview() {
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  return React.useCallback(
    async (input: { userId: string; review: ReviewRecord }) => toggleFavorite(input),
    [toggleFavorite]
  );
}
