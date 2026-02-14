import {
  createReview,
  deleteReview,
  getRecentReviews,
  getReviewById,
  type ReviewRecord,
  updateReview,
} from '../../../services/reviews';
import { listFollowerUserIds } from '../../../services/following';
import { createNotification } from '../../../services/notifications';
import { useReviewStore } from '../reviewsStore';

jest.mock('../../../services/reviews', () => ({
  createReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
  getRecentReviews: jest.fn(),
  getReviewById: jest.fn(),
}));

jest.mock('../../../services/following', () => ({
  listFollowerUserIds: jest.fn(),
}));

jest.mock('../../../services/notifications', () => ({
  createNotification: jest.fn(),
}));

const mockCreateReview = createReview as jest.MockedFunction<typeof createReview>;
const mockUpdateReview = updateReview as jest.MockedFunction<typeof updateReview>;
const mockDeleteReview = deleteReview as jest.MockedFunction<typeof deleteReview>;
const mockGetRecentReviews = getRecentReviews as jest.MockedFunction<typeof getRecentReviews>;
const mockGetReviewById = getReviewById as jest.MockedFunction<typeof getReviewById>;
const mockListFollowerUserIds = listFollowerUserIds as jest.MockedFunction<typeof listFollowerUserIds>;
const mockCreateNotification = createNotification as jest.MockedFunction<typeof createNotification>;

const makeReview = (overrides: Partial<ReviewRecord> = {}): ReviewRecord => ({
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
  ...overrides,
});

describe('reviewsStore', () => {
  beforeEach(() => {
    useReviewStore.getState().clearReviews();
    mockCreateReview.mockReset();
    mockUpdateReview.mockReset();
    mockDeleteReview.mockReset();
    mockGetRecentReviews.mockReset();
    mockGetReviewById.mockReset();
    mockListFollowerUserIds.mockReset();
    mockCreateNotification.mockReset();

    mockListFollowerUserIds.mockResolvedValue({
      userId: 'user-1',
      followerUserIds: [],
    });
    mockCreateNotification.mockResolvedValue(undefined as never);
  });

  it('hydrates and sorts reviews by newest createdAt', async () => {
    mockGetRecentReviews.mockResolvedValueOnce([
      makeReview({ id: 'review-1', notes: 'Old', createdAt: '2026-02-09T10:00:00.000Z' }),
      makeReview({
        id: 'review-2',
        placeId: 'place-2',
        placeTitle: 'B',
        userId: 'user-2',
        userName: 'B',
        userHandle: 'b',
        notes: 'New',
        rating: 9,
        createdAt: '2026-02-10T10:00:00.000Z',
      }),
    ] as any);

    await useReviewStore.getState().hydrateReviews();

    expect(useReviewStore.getState().reviewIds).toEqual(['review-2', 'review-1']);
    expect(useReviewStore.getState().hydrated).toBe(true);
  });

  it('skips hydrate fetch when recent hydration is still fresh', async () => {
    mockGetRecentReviews.mockResolvedValue([makeReview()] as any);

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

    try {
      await useReviewStore.getState().hydrateReviews(120, { staleMs: 60_000 });
      nowSpy.mockReturnValue(1_040_000);
      await useReviewStore.getState().hydrateReviews(120, { staleMs: 60_000 });
    } finally {
      nowSpy.mockRestore();
    }

    expect(mockGetRecentReviews).toHaveBeenCalledTimes(1);
  });

  it('stores create result only after create call succeeds', async () => {
    let resolveCreate: ((value: ReviewRecord) => void) | null = null;
    const pendingCreate = new Promise<ReviewRecord>((resolve) => {
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

    resolveCreate?.(makeReview());

    await creationPromise;

    expect(useReviewStore.getState().reviewIds).toEqual(['review-1']);
  });

  it('retries review notification fanout when first delivery attempt fails', async () => {
    mockCreateReview.mockResolvedValueOnce(
      makeReview({
        id: 'review-fanout',
        userId: 'author-1',
        userName: 'Author',
        userHandle: 'author',
      }) as any
    );

    mockListFollowerUserIds.mockResolvedValueOnce({
      userId: 'author-1',
      followerUserIds: ['follower-1'],
    });

    mockCreateNotification
      .mockRejectedValueOnce(new Error('temporary-notification-error'))
      .mockResolvedValueOnce(undefined as never);

    await useReviewStore.getState().createReviewAndStore({
      author: { id: 'author-1', name: 'Author', handle: 'author', avatar: null },
      place: { id: 'place-1', title: 'A' },
      notes: 'Test',
      rating: 8,
      visibility: 'followers',
      photos: [],
    });

    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    expect(mockCreateNotification).toHaveBeenNthCalledWith(1, {
      userId: 'follower-1',
      type: 'review_published',
      actorUserId: 'author-1',
      actorName: 'Author',
      actorHandle: 'author',
      actorAvatar: null,
      createdAt: expect.any(String),
      targetReviewId: 'review-fanout',
      targetReviewPlaceTitle: 'A',
      targetReviewPlaceSubtitle: null,
      targetReviewImageUrl: null,
      targetReviewVisibility: 'followers',
    });
    expect(mockCreateNotification).toHaveBeenNthCalledWith(2, {
      userId: 'follower-1',
      type: 'review_published',
      actorUserId: 'author-1',
      actorName: 'Author',
      actorHandle: 'author',
      actorAvatar: null,
      createdAt: expect.any(String),
      targetReviewId: 'review-fanout',
      targetReviewPlaceTitle: 'A',
      targetReviewPlaceSubtitle: null,
      targetReviewImageUrl: null,
      targetReviewVisibility: 'followers',
    });
  });

  it('removes review after delete succeeds', async () => {
    useReviewStore.getState().upsertReview(makeReview());

    mockDeleteReview.mockResolvedValueOnce(undefined as never);

    await useReviewStore.getState().deleteReviewAndStore({
      reviewId: 'review-1',
      authorId: 'user-1',
    });

    expect(useReviewStore.getState().reviewIds).toEqual([]);
    expect(mockDeleteReview).toHaveBeenCalledWith({ reviewId: 'review-1', authorId: 'user-1' });
  });

  it('updates stored review after update succeeds', async () => {
    useReviewStore.getState().upsertReview(makeReview({ notes: 'Old' }));

    mockUpdateReview.mockResolvedValueOnce(
      makeReview({ notes: 'Updated', rating: 9, updatedAt: '2026-02-10T12:00:00.000Z' }) as any
    );

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

  it('refreshes persisted reviews when explicitly requested', async () => {
    useReviewStore.getState().upsertReview(makeReview({ notes: 'Stale' }));

    mockGetRecentReviews.mockResolvedValueOnce([
      makeReview({ notes: 'Fresh', rating: 9, updatedAt: '2026-02-10T12:00:00.000Z' }),
    ] as any);

    await useReviewStore.getState().refreshReviews();

    expect(mockGetRecentReviews).toHaveBeenCalled();
    expect(useReviewStore.getState().reviewsById['review-1']?.notes).toBe('Fresh');
  });

  it('re-hydrates after freshness window expires', async () => {
    mockGetRecentReviews.mockResolvedValue([makeReview()] as any);

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(2_000_000);

    try {
      await useReviewStore.getState().hydrateReviews(120, { staleMs: 60_000 });
      nowSpy.mockReturnValue(2_070_000);
      await useReviewStore.getState().hydrateReviews(120, { staleMs: 60_000 });
    } finally {
      nowSpy.mockRestore();
    }

    expect(mockGetRecentReviews).toHaveBeenCalledTimes(2);
  });

  it('returns cached review detail without refetch inside freshness window', async () => {
    mockGetReviewById.mockResolvedValue(makeReview({ notes: 'Remote once' }) as any);

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(3_000_000);

    try {
      const first = await useReviewStore
        .getState()
        .fetchReviewByIdCached('review-1', { staleMs: 60_000 });
      nowSpy.mockReturnValue(3_040_000);
      const second = await useReviewStore
        .getState()
        .fetchReviewByIdCached('review-1', { staleMs: 60_000 });

      expect(first?.id).toBe('review-1');
      expect(second?.id).toBe('review-1');
    } finally {
      nowSpy.mockRestore();
    }

    expect(mockGetReviewById).toHaveBeenCalledTimes(1);
  });

  it('refetches review detail after freshness window expires', async () => {
    mockGetReviewById
      .mockResolvedValueOnce(makeReview({ notes: 'Older', updatedAt: '2026-02-10T10:00:00.000Z' }) as any)
      .mockResolvedValueOnce(makeReview({ notes: 'Newer', updatedAt: '2026-02-10T12:00:00.000Z' }) as any);

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(4_000_000);

    try {
      await useReviewStore.getState().fetchReviewByIdCached('review-1', { staleMs: 60_000 });
      nowSpy.mockReturnValue(4_070_000);
      await useReviewStore.getState().fetchReviewByIdCached('review-1', { staleMs: 60_000 });
    } finally {
      nowSpy.mockRestore();
    }

    expect(mockGetReviewById).toHaveBeenCalledTimes(2);
    expect(useReviewStore.getState().reviewsById['review-1']?.notes).toBe('Newer');
  });

  it('deduplicates in-flight review detail fetches for the same review', async () => {
    let resolveRemote: ((value: ReviewRecord | null) => void) | null = null;
    const pendingFetch = new Promise<ReviewRecord | null>((resolve) => {
      resolveRemote = resolve;
    });

    mockGetReviewById.mockReturnValueOnce(pendingFetch as never);

    const firstRequest = useReviewStore
      .getState()
      .fetchReviewByIdCached('review-1', { force: true, staleMs: 60_000 });
    const secondRequest = useReviewStore
      .getState()
      .fetchReviewByIdCached('review-1', { force: true, staleMs: 60_000 });

    expect(mockGetReviewById).toHaveBeenCalledTimes(1);

    resolveRemote?.(makeReview({ notes: 'From network' }));

    const [first, second] = await Promise.all([firstRequest, secondRequest]);

    expect(first?.id).toBe('review-1');
    expect(second?.id).toBe('review-1');
  });
});
