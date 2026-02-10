jest.mock('../firebase', () => ({
  isFirebaseConfigured: false,
  getFirestoreDb: jest.fn(),
  getFirebaseStorage: jest.fn(),
}));

import { createReview } from '../reviews';

describe('reviews service', () => {
  it('creates review with id and createdAt', async () => {
    const review = await createReview({
      author: {
        id: 'user-1',
        name: 'Alex',
        handle: 'alex',
        avatar: null,
      },
      place: {
        id: 'place-1',
        title: 'Great spot',
      },
      notes: 'Loved the vibe.',
      rating: 8,
      visibility: 'followers',
      photos: [],
    });

    expect(review.id).toBeDefined();
    expect(review.createdAt).toBeDefined();
    expect(review.rating).toBe(8);
  });
});
