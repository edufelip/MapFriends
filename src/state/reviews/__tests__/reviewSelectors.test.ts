import { ReviewRecord } from '../../../services/reviews';
import { filterReviewsByAuthorIds } from '../reviewAuthorFilter';

const makeReview = (id: string, userId: string): ReviewRecord => ({
  id,
  placeId: `place-${id}`,
  placeTitle: `Place ${id}`,
  placeCoordinates: null,
  title: `Title ${id}`,
  notes: `Notes ${id}`,
  rating: 8,
  visibility: 'followers',
  userId,
  userName: `User ${userId}`,
  userHandle: `handle_${userId}`,
  userAvatar: null,
  photos: [],
  photoUrls: [],
  createdAt: '2026-02-13T10:00:00.000Z',
  updatedAt: '2026-02-13T10:00:00.000Z',
});

describe('reviewSelectors.filterReviewsByAuthorIds', () => {
  const reviews = [makeReview('r1', 'user-1'), makeReview('r2', 'user-2'), makeReview('r3', 'user-3')];

  it('returns only reviews authored by allowed users', () => {
    const filtered = filterReviewsByAuthorIds(reviews, {
      authorIds: ['user-2', 'user-3'],
      requireAuthorFilter: true,
    });

    expect(filtered.map((review) => review.id)).toEqual(['r2', 'r3']);
  });

  it('returns empty list when author filter is required but no authors are provided', () => {
    const filtered = filterReviewsByAuthorIds(reviews, {
      authorIds: [],
      requireAuthorFilter: true,
    });

    expect(filtered).toEqual([]);
  });

  it('returns all reviews when filter is optional and no authors are provided', () => {
    const filtered = filterReviewsByAuthorIds(reviews, {
      authorIds: [],
      requireAuthorFilter: false,
    });

    expect(filtered.map((review) => review.id)).toEqual(['r1', 'r2', 'r3']);
  });
});
