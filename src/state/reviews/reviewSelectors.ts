import React from 'react';
import { FeedPost } from '../../services/feed';
import { ReviewRecord } from '../../services/reviews';
import { useShallow } from 'zustand/react/shallow';
import { logReviewPinDebug } from './reviewPinLogger';
import { ReviewMapPin, resolveReviewCoordinates, toFeedPost } from './reviewViewModels';
import { useReviewStore } from './reviewsStore';

const selectReviewRecords = (state: {
  reviewIds: string[];
  reviewsById: Record<string, ReviewRecord>;
}) => state.reviewIds.map((id) => state.reviewsById[id]).filter(Boolean);

const selectHydrationGate = (state: {
  hydrated: boolean;
  isHydrating: boolean;
  hydrateError: string | null;
}) => ({
  hydrated: state.hydrated,
  isHydrating: state.isHydrating,
  hydrateError: state.hydrateError,
});

export function useReviewRecords(): ReviewRecord[] {
  return useReviewStore(useShallow(selectReviewRecords));
}

export function useReviewFeedPosts(): FeedPost[] {
  const reviewRecords = useReviewRecords();

  return React.useMemo(() => reviewRecords.map(toFeedPost), [reviewRecords]);
}

export function useReviewPins(): ReviewMapPin[] {
  const reviewRecords = useReviewRecords();

  const computation = React.useMemo(
    () => {
      const pins: ReviewMapPin[] = [];
      const droppedReviewIds: string[] = [];
      let fromReviewCoordinates = 0;
      let fromSeedCoordinates = 0;

      reviewRecords.forEach((review) => {
        const resolved = resolveReviewCoordinates(review);
        if (!resolved.coordinates) {
          droppedReviewIds.push(review.id);
          return;
        }

        if (resolved.source === 'review') {
          fromReviewCoordinates += 1;
        } else if (resolved.source === 'seed') {
          fromSeedCoordinates += 1;
        }

        pins.push({
          id: `review-pin-${review.id}`,
          reviewId: review.id,
          placeId: review.placeId,
          title: review.placeTitle,
          rating: review.rating,
          coordinates: resolved.coordinates,
          notes: review.notes,
          userName: review.userName,
          userHandle: review.userHandle,
          visibility: review.visibility,
        });
      });

      return {
        pins,
        debug: {
          totalReviews: reviewRecords.length,
          renderedPins: pins.length,
          droppedReviews: droppedReviewIds.length,
          fromReviewCoordinates,
          fromSeedCoordinates,
          droppedReviewIds: droppedReviewIds.slice(0, 8),
        },
      };
    },
    [reviewRecords]
  );

  React.useEffect(() => {
    logReviewPinDebug('step5-review-to-pin', computation.debug);
  }, [computation]);

  return computation.pins;
}

export function useHydrateReviewState(limit = 120, enabled = true) {
  const { hydrated, isHydrating, hydrateError } = useReviewStore(useShallow(selectHydrationGate));
  const hydrateReviews = useReviewStore((state) => state.hydrateReviews);

  React.useEffect(() => {
    if (!enabled || hydrated || isHydrating || hydrateError) {
      return;
    }

    void hydrateReviews(limit);
  }, [enabled, hydrateError, hydrateReviews, hydrated, isHydrating, limit]);
}

export function useReviewHydrating() {
  return useReviewStore((state) => state.isHydrating);
}

export function useRefreshReviews(limit = 120) {
  const refreshReviews = useReviewStore((state) => state.refreshReviews);

  return React.useCallback(() => refreshReviews(limit), [refreshReviews, limit]);
}
