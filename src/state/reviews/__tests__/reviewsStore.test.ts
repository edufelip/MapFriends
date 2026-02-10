import {
  createReview,
  deleteReview,
  getRecentReviews,
  updateReview,
} from '../../../services/reviews';
import { useReviewStore } from '../reviewsStore';

jest.mock('../../../services/reviews', () => ({
  createReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
  getRecentReviews: jest.fn(),
}));

const mockCreateReview = createReview as jest.MockedFunction<typeof createReview>;
const mockUpdateReview = updateReview as jest.MockedFunction<typeof updateReview>;
const mockDeleteReview = deleteReview as jest.MockedFunction<typeof deleteReview>;
const mockGetRecentReviews = getRecentReviews as jest.MockedFunction<typeof getRecentReviews>;

describe('reviewsStore', () => {
  beforeEach(() => {
    useReviewStore.getState().clearReviews();
    mockCreateReview.mockReset();
    mockUpdateReview.mockReset();
    mockDeleteReview.mockReset();
    mockGetRecentReviews.mockReset();
  });

  it('hydrates and sorts reviews by newest createdAt', async () => {
    mockGetRecentReviews.mockResolvedValueOnce([
      {
        id: 'review-1',
        placeId: 'place-1',
        placeTitle: 'A',
        placeCoordinates: [-122.4, 37.7],
        title: 'A',
        notes: 'Old',
        rating: 7,
        visibility: 'followers',
        userId: 'user-1',
        userName: 'A',
        userHandle: 'a',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: '2026-02-09T10:00:00.000Z',
        updatedAt: '2026-02-09T10:00:00.000Z',
      },
      {
        id: 'review-2',
        placeId: 'place-2',
        placeTitle: 'B',
        placeCoordinates: [-122.5, 37.8],
        title: 'B',
        notes: 'New',
        rating: 9,
        visibility: 'followers',
        userId: 'user-2',
        userName: 'B',
        userHandle: 'b',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: '2026-02-10T10:00:00.000Z',
        updatedAt: '2026-02-10T10:00:00.000Z',
      },
    ] as any);

    await useReviewStore.getState().hydrateReviews();

    expect(useReviewStore.getState().reviewIds).toEqual(['review-2', 'review-1']);
    expect(useReviewStore.getState().hydrated).toBe(true);
  });

  it('stores create result only after create call succeeds', async () => {
    let resolveCreate: ((value: any) => void) | null = null;
    const pendingCreate = new Promise((resolve) => {
      resolveCreate = resolve;
    });

    mockCreateReview.mockReturnValueOnce(pendingCreate as never);

    const creationPromise = useReviewStore.getState().createReviewAndStore({
      author: { id: 'user-1', name: 'A', handle: 'a', avatar: null },
      place: { id: 'place-1', title: 'A' },
      notes: 'Test',
      rating: 8,
      visibility: 'followers',
      photos: [],
    });

    expect(useReviewStore.getState().reviewIds).toEqual([]);

    resolveCreate?.({
      id: 'review-1',
      placeId: 'place-1',
      placeTitle: 'A',
      placeCoordinates: null,
      title: 'A',
      notes: 'Test',
      rating: 8,
      visibility: 'followers',
      userId: 'user-1',
      userName: 'A',
      userHandle: 'a',
      userAvatar: null,
      photos: [],
      photoUrls: [],
      createdAt: '2026-02-10T10:00:00.000Z',
      updatedAt: '2026-02-10T10:00:00.000Z',
    });

    await creationPromise;

    expect(useReviewStore.getState().reviewIds).toEqual(['review-1']);
  });

  it('removes review after delete succeeds', async () => {
    useReviewStore.getState().upsertReview({
      id: 'review-1',
      placeId: 'place-1',
      placeTitle: 'A',
      placeCoordinates: null,
      title: 'A',
      notes: 'Test',
      rating: 8,
      visibility: 'followers',
      userId: 'user-1',
      userName: 'A',
      userHandle: 'a',
      userAvatar: null,
      photos: [],
      photoUrls: [],
      createdAt: '2026-02-10T10:00:00.000Z',
      updatedAt: '2026-02-10T10:00:00.000Z',
    });

    mockDeleteReview.mockResolvedValueOnce(undefined as never);

    await useReviewStore.getState().deleteReviewAndStore({
      reviewId: 'review-1',
      authorId: 'user-1',
    });

    expect(useReviewStore.getState().reviewIds).toEqual([]);
    expect(mockDeleteReview).toHaveBeenCalledWith({ reviewId: 'review-1', authorId: 'user-1' });
  });

  it('updates stored review after update succeeds', async () => {
    useReviewStore.getState().upsertReview({
      id: 'review-1',
      placeId: 'place-1',
      placeTitle: 'A',
      placeCoordinates: null,
      title: 'A',
      notes: 'Old',
      rating: 8,
      visibility: 'followers',
      userId: 'user-1',
      userName: 'A',
      userHandle: 'a',
      userAvatar: null,
      photos: [],
      photoUrls: [],
      createdAt: '2026-02-10T10:00:00.000Z',
      updatedAt: '2026-02-10T10:00:00.000Z',
    });

    mockUpdateReview.mockResolvedValueOnce({
      id: 'review-1',
      placeId: 'place-1',
      placeTitle: 'A',
      placeCoordinates: null,
      title: 'A',
      notes: 'Updated',
      rating: 9,
      visibility: 'followers',
      userId: 'user-1',
      userName: 'A',
      userHandle: 'a',
      userAvatar: null,
      photos: [],
      photoUrls: [],
      createdAt: '2026-02-10T10:00:00.000Z',
      updatedAt: '2026-02-10T12:00:00.000Z',
    } as any);

    await useReviewStore.getState().updateReviewAndStore({
      reviewId: 'review-1',
      author: { id: 'user-1', name: 'A', handle: 'a', avatar: null },
      place: { id: 'place-1', title: 'A' },
      notes: 'Updated',
      rating: 9,
      visibility: 'followers',
      photos: [],
    });

    expect(useReviewStore.getState().reviewsById['review-1']?.notes).toBe('Updated');
  });
});
