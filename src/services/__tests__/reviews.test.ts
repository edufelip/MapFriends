import { createReview } from '../reviews';

describe('reviews service', () => {
  it('creates review with id and createdAt', () => {
    const review = createReview({
      placeId: 'place-1',
      title: 'Great spot',
      notes: 'Loved the vibe.',
      rating: 8,
    });

    expect(review.id).toBeDefined();
    expect(review.createdAt).toBeDefined();
    expect(review.rating).toBe(8);
  });
});
