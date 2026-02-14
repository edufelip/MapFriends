import { ReviewRecord } from '../../services/reviews';

export type ReviewAuthorFilter = {
  authorIds?: string[];
  requireAuthorFilter?: boolean;
};

export function filterReviewsByAuthorIds(
  reviewRecords: ReviewRecord[],
  filter: ReviewAuthorFilter = {}
): ReviewRecord[] {
  const authorIds = filter.authorIds || [];
  const requireAuthorFilter = filter.requireAuthorFilter === true;

  if (authorIds.length === 0) {
    return requireAuthorFilter ? [] : reviewRecords;
  }

  const allowedAuthorIds = new Set(authorIds);
  return reviewRecords.filter((review) => allowedAuthorIds.has(review.userId));
}
