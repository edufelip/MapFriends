import { listFavorites, removeFavorite, saveFavorite } from '../../../services/favorites';
import { useFavoriteStore } from '../favoritesStore';

jest.mock('../../../services/favorites', () => ({
  listFavorites: jest.fn(),
  saveFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

const mockListFavorites = listFavorites as jest.MockedFunction<typeof listFavorites>;
const mockSaveFavorite = saveFavorite as jest.MockedFunction<typeof saveFavorite>;
const mockRemoveFavorite = removeFavorite as jest.MockedFunction<typeof removeFavorite>;

describe('favoritesStore', () => {
  beforeEach(() => {
    useFavoriteStore.getState().clearFavorites();
    mockListFavorites.mockReset();
    mockSaveFavorite.mockReset();
    mockRemoveFavorite.mockReset();
  });

  it('hydrates favorites for a user sorted by newest createdAt', async () => {
    mockListFavorites.mockResolvedValueOnce([
      {
        reviewId: 'review-1',
        userId: 'user-1',
        createdAt: '2026-02-10T10:00:00.000Z',
        snapshot: {
          placeId: 'place-1',
          placeTitle: 'Old Place',
          reviewTitle: 'Old',
          reviewNotes: 'Old notes',
          reviewRating: 7,
          reviewPhotoUrl: null,
          reviewAuthorId: 'author-1',
          reviewAuthorName: 'A',
          reviewAuthorHandle: 'a',
          reviewAuthorAvatar: null,
        },
      },
      {
        reviewId: 'review-2',
        userId: 'user-1',
        createdAt: '2026-02-10T12:00:00.000Z',
        snapshot: {
          placeId: 'place-2',
          placeTitle: 'New Place',
          reviewTitle: 'New',
          reviewNotes: 'New notes',
          reviewRating: 9,
          reviewPhotoUrl: null,
          reviewAuthorId: 'author-2',
          reviewAuthorName: 'B',
          reviewAuthorHandle: 'b',
          reviewAuthorAvatar: null,
        },
      },
    ] as any);

    await useFavoriteStore.getState().hydrateFavorites({ userId: 'user-1' });

    expect(useFavoriteStore.getState().favoriteReviewIds).toEqual(['review-2', 'review-1']);
    expect(useFavoriteStore.getState().hydratedUserId).toBe('user-1');
  });

  it('adds favorite when toggling non-favorited review', async () => {
    mockSaveFavorite.mockResolvedValueOnce({
      reviewId: 'review-1',
      userId: 'user-1',
      createdAt: '2026-02-10T12:00:00.000Z',
      snapshot: {
        placeId: 'place-1',
        placeTitle: 'A',
        reviewTitle: 'A',
        reviewNotes: 'Great',
        reviewRating: 8,
        reviewPhotoUrl: null,
        reviewAuthorId: 'author-1',
        reviewAuthorName: 'A',
        reviewAuthorHandle: 'a',
        reviewAuthorAvatar: null,
      },
    } as any);

    const isFavorited = await useFavoriteStore.getState().toggleFavorite({
      userId: 'user-1',
      review: {
        id: 'review-1',
        placeId: 'place-1',
        placeTitle: 'A',
        placeCoordinates: null,
        title: 'A',
        notes: 'Great',
        rating: 8,
        visibility: 'followers',
        userId: 'author-1',
        userName: 'A',
        userHandle: 'a',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: '2026-02-10T10:00:00.000Z',
        updatedAt: '2026-02-10T10:00:00.000Z',
      },
    });

    expect(isFavorited).toBe(true);
    expect(useFavoriteStore.getState().favoriteReviewIds).toEqual(['review-1']);
    expect(mockSaveFavorite).toHaveBeenCalled();
  });

  it('removes favorite when toggling an existing favorite', async () => {
    useFavoriteStore.setState({
      favoritesByReviewId: {
        'review-1': {
          reviewId: 'review-1',
          userId: 'user-1',
          createdAt: '2026-02-10T10:00:00.000Z',
          snapshot: {
            placeId: 'place-1',
            placeTitle: 'A',
            reviewTitle: 'A',
            reviewNotes: 'Great',
            reviewRating: 8,
            reviewPhotoUrl: null,
            reviewAuthorId: 'author-1',
            reviewAuthorName: 'A',
            reviewAuthorHandle: 'a',
            reviewAuthorAvatar: null,
          },
        },
      },
      favoriteReviewIds: ['review-1'],
    });

    mockRemoveFavorite.mockResolvedValueOnce(undefined as never);

    const isFavorited = await useFavoriteStore.getState().toggleFavorite({
      userId: 'user-1',
      review: {
        id: 'review-1',
        placeId: 'place-1',
        placeTitle: 'A',
        placeCoordinates: null,
        title: 'A',
        notes: 'Great',
        rating: 8,
        visibility: 'followers',
        userId: 'author-1',
        userName: 'A',
        userHandle: 'a',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: '2026-02-10T10:00:00.000Z',
        updatedAt: '2026-02-10T10:00:00.000Z',
      },
    });

    expect(isFavorited).toBe(false);
    expect(useFavoriteStore.getState().favoriteReviewIds).toEqual([]);
    expect(mockRemoveFavorite).toHaveBeenCalledWith({
      userId: 'user-1',
      reviewId: 'review-1',
    });
  });
});
