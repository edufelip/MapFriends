import { createReviewMutations } from '../reviewMutations';

const author = {
  id: 'user-001',
  name: 'Alex',
  handle: 'alex',
  avatar: null,
};

describe('reviewMutations', () => {
  it('creates review, uploads new photos, and writes review + projection', async () => {
    const writeReviewPair = jest.fn().mockResolvedValue(undefined);
    const uploadPhoto = jest
      .fn()
      .mockResolvedValueOnce({ path: 'reviews/user-001/review-001/photo-1.jpg', url: 'https://cdn/1.jpg' })
      .mockResolvedValueOnce({ path: 'reviews/user-001/review-001/photo-2.jpg', url: 'https://cdn/2.jpg' });

    const mutations = createReviewMutations({
      nowIso: () => '2026-02-10T10:00:00.000Z',
      createReviewId: () => 'review-001',
      loadReview: jest.fn(),
      writeReviewPair,
      deleteReviewPair: jest.fn(),
      compressPhoto: jest.fn(async (uri: string) => ({ uri: `${uri}-compressed`, contentType: 'image/jpeg' })),
      uploadPhoto,
      deletePhoto: jest.fn(),
    });

    const created = await mutations.createReview({
      author,
      place: {
        id: 'place-001',
        title: 'Midnight Ramen',
      },
      notes: 'Great noodles and broth',
      rating: 9,
      visibility: 'followers',
      photos: [
        { uri: 'file://one.jpg' },
        { uri: 'file://two.jpg' },
      ],
    });

    expect(uploadPhoto).toHaveBeenCalledTimes(2);
    expect(writeReviewPair).toHaveBeenCalledTimes(1);
    expect(created.id).toBe('review-001');
    expect(created.photos).toEqual([
      { path: 'reviews/user-001/review-001/photo-1.jpg', url: 'https://cdn/1.jpg' },
      { path: 'reviews/user-001/review-001/photo-2.jpg', url: 'https://cdn/2.jpg' },
    ]);
  });

  it('rolls back uploaded photos when review write fails', async () => {
    const deletePhoto = jest.fn().mockResolvedValue(undefined);
    const writeReviewPair = jest.fn().mockRejectedValue(new Error('firestore-down'));

    const mutations = createReviewMutations({
      nowIso: () => '2026-02-10T10:00:00.000Z',
      createReviewId: () => 'review-001',
      loadReview: jest.fn(),
      writeReviewPair,
      deleteReviewPair: jest.fn(),
      compressPhoto: jest.fn(async (uri: string) => ({ uri: `${uri}-compressed`, contentType: 'image/jpeg' })),
      uploadPhoto: jest
        .fn()
        .mockResolvedValueOnce({ path: 'reviews/user-001/review-001/photo-1.jpg', url: 'https://cdn/1.jpg' }),
      deletePhoto,
    });

    await expect(
      mutations.createReview({
        author,
        place: {
          id: 'place-001',
          title: 'Midnight Ramen',
        },
        notes: 'Great noodles and broth',
        rating: 9,
        visibility: 'followers',
        photos: [{ uri: 'file://one.jpg' }],
      })
    ).rejects.toThrow('firestore-down');

    expect(deletePhoto).toHaveBeenCalledWith('reviews/user-001/review-001/photo-1.jpg');
  });

  it('updates review, keeps retained uploaded photos, and removes deleted ones', async () => {
    const deletePhoto = jest.fn().mockResolvedValue(undefined);
    const writeReviewPair = jest.fn().mockResolvedValue(undefined);

    const mutations = createReviewMutations({
      nowIso: () => '2026-02-10T11:00:00.000Z',
      createReviewId: () => 'review-should-not-be-used',
      loadReview: jest.fn().mockResolvedValue({
        id: 'review-001',
        placeId: 'place-001',
        placeTitle: 'Midnight Ramen',
        placeCoordinates: null,
        title: 'Midnight Ramen',
        notes: 'Old notes',
        rating: 7,
        visibility: 'followers',
        userId: 'user-001',
        userName: 'Alex',
        userHandle: 'alex',
        userAvatar: null,
        createdAt: '2026-02-10T09:00:00.000Z',
        updatedAt: '2026-02-10T09:00:00.000Z',
        photos: [
          { path: 'reviews/user-001/review-001/photo-1.jpg', url: 'https://cdn/1.jpg' },
          { path: 'reviews/user-001/review-001/photo-2.jpg', url: 'https://cdn/2.jpg' },
        ],
        photoUrls: ['https://cdn/1.jpg', 'https://cdn/2.jpg'],
      }),
      writeReviewPair,
      deleteReviewPair: jest.fn(),
      compressPhoto: jest.fn(async (uri: string) => ({ uri: `${uri}-compressed`, contentType: 'image/jpeg' })),
      uploadPhoto: jest
        .fn()
        .mockResolvedValueOnce({ path: 'reviews/user-001/review-001/photo-3.jpg', url: 'https://cdn/3.jpg' }),
      deletePhoto,
    });

    const updated = await mutations.updateReview({
      reviewId: 'review-001',
      author,
      place: {
        id: 'place-001',
        title: 'Midnight Ramen',
      },
      notes: 'New notes',
      rating: 9,
      visibility: 'subscribers',
      photos: [
        { uri: 'https://cdn/2.jpg', storagePath: 'reviews/user-001/review-001/photo-2.jpg' },
        { uri: 'file://local-3.jpg' },
      ],
    });

    expect(writeReviewPair).toHaveBeenCalledTimes(1);
    expect(updated.photos).toEqual([
      { path: 'reviews/user-001/review-001/photo-2.jpg', url: 'https://cdn/2.jpg' },
      { path: 'reviews/user-001/review-001/photo-3.jpg', url: 'https://cdn/3.jpg' },
    ]);
    expect(deletePhoto).toHaveBeenCalledWith('reviews/user-001/review-001/photo-1.jpg');
  });

  it('deletes review docs and then removes uploaded assets', async () => {
    const deleteReviewPair = jest.fn().mockResolvedValue(undefined);
    const deletePhoto = jest.fn().mockResolvedValue(undefined);

    const mutations = createReviewMutations({
      nowIso: () => '2026-02-10T11:00:00.000Z',
      createReviewId: () => 'review-unused',
      loadReview: jest.fn().mockResolvedValue({
        id: 'review-001',
        placeId: 'place-001',
        placeTitle: 'Midnight Ramen',
        placeCoordinates: null,
        title: 'Midnight Ramen',
        notes: 'Old notes',
        rating: 7,
        visibility: 'followers',
        userId: 'user-001',
        userName: 'Alex',
        userHandle: 'alex',
        userAvatar: null,
        createdAt: '2026-02-10T09:00:00.000Z',
        updatedAt: '2026-02-10T09:00:00.000Z',
        photos: [
          { path: 'reviews/user-001/review-001/photo-1.jpg', url: 'https://cdn/1.jpg' },
          { path: 'reviews/user-001/review-001/photo-2.jpg', url: 'https://cdn/2.jpg' },
        ],
        photoUrls: ['https://cdn/1.jpg', 'https://cdn/2.jpg'],
      }),
      writeReviewPair: jest.fn(),
      deleteReviewPair,
      compressPhoto: jest.fn(),
      uploadPhoto: jest.fn(),
      deletePhoto,
    });

    await mutations.deleteReview({
      reviewId: 'review-001',
      authorId: 'user-001',
    });

    expect(deleteReviewPair).toHaveBeenCalledTimes(1);
    expect(deletePhoto).toHaveBeenCalledTimes(2);
  });
});
