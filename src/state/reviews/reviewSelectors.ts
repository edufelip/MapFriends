import React from 'react';
import { FeedPost } from '../../services/feed';
import { ReviewRecord } from '../../services/reviews';
import { useShallow } from 'zustand/react/shallow';
import { useEngagementStore } from '../engagement';
import { logReviewPinDebug } from './reviewPinLogger';
import { ReviewMapPin, resolveReviewCoordinates, toFeedPost } from './reviewViewModels';
import { filterReviewsByAuthorIds, ReviewAuthorFilter } from './reviewAuthorFilter';
import { useReviewStore } from './reviewsStore';

const selectReviewRecords = (state: {
  reviewIds: string[];
  reviewsById: Record<string, ReviewRecord>;
}) => state.reviewIds.map((id) => state.reviewsById[id]).filter(Boolean);

const selectHydrationGate = (state: {
  isHydrating: boolean;
  hydrateError: string | null;
  lastHydratedAt: number | null;
}) => ({
  isHydrating: state.isHydrating,
  hydrateError: state.hydrateError,
  lastHydratedAt: state.lastHydratedAt,
});

export type { ReviewAuthorFilter } from './reviewAuthorFilter';
export { filterReviewsByAuthorIds } from './reviewAuthorFilter';

export function useReviewRecords(filter: ReviewAuthorFilter = {}): ReviewRecord[] {
  const records = useReviewStore(useShallow(selectReviewRecords));

  return React.useMemo(
    () => filterReviewsByAuthorIds(records, filter),
    [filter.authorIds, filter.requireAuthorFilter, records]
  );
}

export function useReviewFeedPosts(filter: ReviewAuthorFilter = {}): FeedPost[] {
  const reviewRecords = useReviewRecords(filter);
  const likeCountByReviewId = useEngagementStore((state) => state.likeCountByReviewId);
  const commentCountByReviewId = useEngagementStore((state) => state.commentCountByReviewId);
  const commentsByReviewId = useEngagementStore((state) => state.commentsByReviewId);

  return React.useMemo(
    () =>
      reviewRecords.map((review) => {
        const hydratedCommentCount = commentsByReviewId[review.id]?.items.length ?? 0;
        const commentCount = commentCountByReviewId[review.id] ?? hydratedCommentCount;
        const likeCount = likeCountByReviewId[review.id] ?? 0;

        return toFeedPost(review, {
          likeCount,
          commentCount,
        });
      }),
    [commentCountByReviewId, commentsByReviewId, likeCountByReviewId, reviewRecords]
  );
}

export function useReviewPins(filter: ReviewAuthorFilter = {}): ReviewMapPin[] {
  const reviewRecords = useReviewRecords(filter);

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

export function useHydrateReviewState(limit = 120, enabled = true, staleMs = 2 * 60 * 1000) {
  const { isHydrating, hydrateError, lastHydratedAt } = useReviewStore(useShallow(selectHydrationGate));
  const hydrateReviews = useReviewStore((state) => state.hydrateReviews);

  React.useEffect(() => {
    if (!enabled || isHydrating || hydrateError) {
      return;
    }

    const hasFreshData =
      typeof lastHydratedAt === 'number' &&
      Date.now() - lastHydratedAt < staleMs;

    if (hasFreshData) {
      return;
    }

    void hydrateReviews(limit, { staleMs });
  }, [enabled, hydrateError, hydrateReviews, isHydrating, lastHydratedAt, limit, staleMs]);
}

export function useReviewHydrating() {
  return useReviewStore((state) => state.isHydrating);
}

export function useRefreshReviews(limit = 120) {
  const refreshReviews = useReviewStore((state) => state.refreshReviews);

  return React.useCallback(() => refreshReviews(limit), [refreshReviews, limit]);
}
