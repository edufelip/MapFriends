import React from 'react';
import { FeedPost } from '../../services/feed';
import { ReviewRecord } from '../../services/reviews';
import { ReviewMapPin, toFeedPost, toReviewPin } from './reviewViewModels';
import { useReviewStore } from './reviewsStore';

const selectReviewRecords = (state: {
  reviewIds: string[];
  reviewsById: Record<string, ReviewRecord>;
}) => state.reviewIds.map((id) => state.reviewsById[id]).filter(Boolean);

export function useReviewRecords(): ReviewRecord[] {
  return useReviewStore(selectReviewRecords);
}

export function useReviewFeedPosts(): FeedPost[] {
  const reviewRecords = useReviewRecords();

  return React.useMemo(() => reviewRecords.map(toFeedPost), [reviewRecords]);
}

export function useReviewPins(): ReviewMapPin[] {
  const reviewRecords = useReviewRecords();

  return React.useMemo(
    () => reviewRecords.map(toReviewPin).filter((pin): pin is ReviewMapPin => Boolean(pin)),
    [reviewRecords]
  );
}

export function useHydrateReviewState(limit = 120) {
  const hydrated = useReviewStore((state) => state.hydrated);
  const hydrateReviews = useReviewStore((state) => state.hydrateReviews);

  React.useEffect(() => {
    if (hydrated) {
      return;
    }

    void hydrateReviews(limit);
  }, [hydrateReviews, hydrated, limit]);
}
