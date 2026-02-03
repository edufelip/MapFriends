import { Review } from './types';

const reviews: Review[] = [];

export function createReview(input: Omit<Review, 'id' | 'createdAt'>) {
  const review: Review = {
    ...input,
    id: `review-${reviews.length + 1}`,
    createdAt: new Date().toISOString(),
  };
  reviews.unshift(review);
  return review;
}

export function getReviewsForPlace(placeId: string) {
  return reviews.filter((review) => review.placeId === placeId);
}
