import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ReviewDetailScreen from '../ReviewDetailScreen';
import { Routes } from '../../../app/routes';

const mockFetchReviewByIdCached = jest.fn();
const mockDeleteReviewAndStore = jest.fn();
const mockToggleFavoriteReview = jest.fn();
const mockUseReviewRecords = jest.fn();
const mockGetPlaceById = jest.fn();
const mockServiceGetReviewById = jest.fn();
const mockReviewDetailHeaderOverlay = jest.fn();
const mockPrefetchReviewImages = jest.fn();

let mockReviewStoreState: any;
let mockAuthUserId = 'user-1';

const makeReview = (overrides: Record<string, unknown> = {}) => ({
  id: 'review-1',
  placeId: 'place-1',
  placeTitle: 'Blue Bottle',
  placeCoordinates: null,
  title: 'Blue Bottle',
  notes: 'Nice coffee',
  rating: 9,
  visibility: 'followers',
  userId: 'user-1',
  userName: 'Alex',
  userHandle: 'alex',
  userAvatar: null,
  photos: [],
  photoUrls: [],
  createdAt: '2026-02-10T10:00:00.000Z',
  updatedAt: '2026-02-10T10:00:00.000Z',
  ...overrides,
});

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => {
      const cleanup = callback();
      return cleanup;
    }, [callback]);
  },
}));

jest.mock('../../../services/reviews', () => ({
  getReviewById: (...args: unknown[]) => mockServiceGetReviewById(...args),
}));

jest.mock('../../../state/reviews', () => ({
  useReviewStore: (selector: (state: any) => any) => selector(mockReviewStoreState),
  useReviewRecords: () => mockUseReviewRecords(),
}));

jest.mock('../../../state/favorites', () => ({
  useHydrateFavoriteState: jest.fn(),
  useIsReviewFavorited: () => false,
  useToggleFavoriteReview: () => mockToggleFavoriteReview,
}));

jest.mock('../../../services/auth', () => ({
  useAuth: () => ({ user: { id: mockAuthUserId } }),
}));

jest.mock('../../../services/map', () => ({
  getPlaceById: (...args: unknown[]) => mockGetPlaceById(...args),
}));

jest.mock('../../../services/media/reviewMediaCache', () => ({
  prefetchReviewImages: (...args: unknown[]) => mockPrefetchReviewImages(...args),
}));

jest.mock('../../../localization/strings', () => ({
  getStrings: () => ({
    reviewDetail: {
      title: 'Review',
      deleteTitle: 'Delete review',
      deleteMessage: 'Confirm delete?',
      cancel: 'Cancel',
      delete: 'Delete',
      deleteError: 'Could not delete',
      deleting: 'Deleting',
      favoriteErrorTitle: 'Favorite error',
      favoriteErrorMessage: 'Favorite failed',
      shareErrorTitle: 'Share error',
      shareErrorMessage: 'Share failed',
      mapOpenErrorTitle: 'Map error',
      mapOpenErrorMessage: 'Map failed',
      placeNotFound: 'Place not found',
      backToMap: 'Back',
      premiumBadge: 'Premium',
      noPhoto: 'No photo',
      locationLabel: 'Location',
      mapAction: 'Open map',
      experienceLabel: 'Experience',
      socialProofTitle: 'Social proof',
      socialProofFallback: 'No related reviews yet',
      edit: 'Edit',
      saveToFavorites: 'Save',
      savedToFavorites: 'Saved',
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../reviewDetailViewModel', () => ({
  toReviewDetailViewModel: ({ review }: any) => ({
    placeTitle: review.placeTitle,
    placeMeta: 'Cafe',
    address: 'Main Street',
    imageUris: ['https://cdn.example.com/review-1.jpg'],
    isPremium: false,
    reviewerName: review.userName,
    reviewerMeta: '@alex',
    reviewerAvatar: review.userAvatar,
    ratingLabel: '9.0',
    experienceNotes: review.notes,
    socialProofUsers: [],
    socialProofHiddenCount: 0,
  }),
}));

jest.mock('../components/review-detail/ReviewDetailGallery', () => () => null);
jest.mock('../components/review-detail/ReviewDetailHeaderOverlay', () => (props: unknown) => {
  mockReviewDetailHeaderOverlay(props);
  return null;
});
jest.mock('../components/review-detail/ReviewDetailReviewerRow', () => () => null);
jest.mock('../components/review-detail/ReviewDetailPlaceSection', () => () => null);
jest.mock('../components/review-detail/ReviewDetailExperienceSection', () => () => null);
jest.mock('../components/review-detail/ReviewDetailSocialProofSection', () => () => null);
jest.mock('../components/review-detail/ReviewDetailBottomActionBar', () => () => null);

describe('ReviewDetailScreen', () => {
  beforeEach(() => {
    mockFetchReviewByIdCached.mockReset();
    mockDeleteReviewAndStore.mockReset();
    mockToggleFavoriteReview.mockReset();
    mockUseReviewRecords.mockReset();
    mockGetPlaceById.mockReset();
    mockServiceGetReviewById.mockReset();
    mockReviewDetailHeaderOverlay.mockReset();
    mockPrefetchReviewImages.mockReset();
    mockAuthUserId = 'user-1';

    mockUseReviewRecords.mockReturnValue([]);
    mockGetPlaceById.mockReturnValue({
      id: 'place-1',
      category: 'Cafe',
      rating: 9.1,
      address: 'Main Street',
    });

    mockReviewStoreState = {
      reviewsById: {
        'review-1': makeReview(),
      },
      fetchReviewByIdCached: mockFetchReviewByIdCached,
      deleteReviewAndStore: mockDeleteReviewAndStore,
    };

    mockFetchReviewByIdCached.mockResolvedValue(makeReview());
  });

  it('uses store cached detail fetch API on focus with default stale window', async () => {
    render(
      <ReviewDetailScreen
        navigation={{ goBack: jest.fn(), navigate: jest.fn() } as never}
        route={{
          key: 'ReviewDetail',
          name: Routes.ReviewDetail,
          params: { reviewId: 'review-1' },
        } as never}
      />
    );

    await waitFor(() => {
      expect(mockFetchReviewByIdCached).toHaveBeenCalledWith('review-1', {
        staleMs: 120000,
      });
    });

    expect(mockServiceGetReviewById).not.toHaveBeenCalled();
    expect(mockPrefetchReviewImages).toHaveBeenCalledWith(['https://cdn.example.com/review-1.jpg']);
  });

  it('shows top-right more button only for the review owner', async () => {
    render(
      <ReviewDetailScreen
        navigation={{ goBack: jest.fn(), navigate: jest.fn() } as never}
        route={{
          key: 'ReviewDetail',
          name: Routes.ReviewDetail,
          params: { reviewId: 'review-1' },
        } as never}
      />
    );

    await waitFor(() => {
      expect(mockReviewDetailHeaderOverlay).toHaveBeenCalled();
    });

    const ownerCall = mockReviewDetailHeaderOverlay.mock.calls.at(-1)?.[0] as {
      showMoreButton?: boolean;
      onMorePress?: () => void;
    };

    expect(ownerCall?.showMoreButton).toBe(true);
    expect(typeof ownerCall?.onMorePress).toBe('function');

    mockAuthUserId = 'another-user';
    mockReviewDetailHeaderOverlay.mockClear();

    render(
      <ReviewDetailScreen
        navigation={{ goBack: jest.fn(), navigate: jest.fn() } as never}
        route={{
          key: 'ReviewDetail2',
          name: Routes.ReviewDetail,
          params: { reviewId: 'review-1' },
        } as never}
      />
    );

    await waitFor(() => {
      expect(mockReviewDetailHeaderOverlay).toHaveBeenCalled();
    });

    const nonOwnerCall = mockReviewDetailHeaderOverlay.mock.calls.at(-1)?.[0] as {
      showMoreButton?: boolean;
    };

    expect(nonOwnerCall?.showMoreButton).toBe(false);
  });
});
