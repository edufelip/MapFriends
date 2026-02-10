import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import PlaceDetailScreen from '../PlaceDetailScreen';
import { Routes } from '../../../app/routes';

const mockGetPlaceById = jest.fn();
const mockGetReviewsForPlace = jest.fn();
const mockDeleteReview = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../../services/map', () => ({
  getPlaceById: (...args: unknown[]) => mockGetPlaceById(...args),
}));

jest.mock('../../../services/reviews', () => ({
  getReviewsForPlace: (...args: unknown[]) => mockGetReviewsForPlace(...args),
  deleteReview: (...args: unknown[]) => mockDeleteReview(...args),
}));

jest.mock('../../../services/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

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

describe('PlaceDetailScreen owner actions', () => {
  beforeEach(() => {
    mockGetPlaceById.mockReset();
    mockGetReviewsForPlace.mockReset();
    mockDeleteReview.mockReset();
    mockUseAuth.mockReset();

    mockUseAuth.mockReturnValue({
      user: { id: 'user-001' },
    });

    mockGetPlaceById.mockReturnValue({
      id: 'place-001',
      name: 'Midnight Ramen',
      category: 'Japanese',
      rating: 9.2,
      summary: 'Late night ramen bar.',
      address: '1 Main Street',
      tags: ['ramen', 'late-night'],
    });
  });

  it('shows edit/delete for owner review and navigates to edit composer', async () => {
    const navigation = { navigate: jest.fn() };
    mockGetReviewsForPlace.mockResolvedValueOnce([
      {
        id: 'review-001',
        placeId: 'place-001',
        placeTitle: 'Midnight Ramen',
        title: 'Midnight Ramen',
        notes: 'Great broth',
        rating: 9,
        visibility: 'followers',
        userId: 'user-001',
        userName: 'Alex',
        userHandle: 'alex',
        userAvatar: null,
        createdAt: '2026-02-10T09:00:00.000Z',
        updatedAt: '2026-02-10T09:00:00.000Z',
        photos: [],
        photoUrls: [],
      },
    ]);

    const screen = render(
      <PlaceDetailScreen
        navigation={navigation as never}
        route={{ key: 'place', name: Routes.PlaceDetail, params: { placeId: 'place-001' } } as never}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeTruthy();
      expect(screen.getByText('Delete')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Edit'));
    expect(navigation.navigate).toHaveBeenCalledWith(Routes.ShareReview, { reviewId: 'review-001' });
  });

  it('deletes review and reloads list when confirmed', async () => {
    const navigation = { navigate: jest.fn() };
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockGetReviewsForPlace
      .mockResolvedValueOnce([
        {
          id: 'review-001',
          placeId: 'place-001',
          placeTitle: 'Midnight Ramen',
          title: 'Midnight Ramen',
          notes: 'Great broth',
          rating: 9,
          visibility: 'followers',
          userId: 'user-001',
          userName: 'Alex',
          userHandle: 'alex',
          userAvatar: null,
          createdAt: '2026-02-10T09:00:00.000Z',
          updatedAt: '2026-02-10T09:00:00.000Z',
          photos: [],
          photoUrls: [],
        },
      ])
      .mockResolvedValueOnce([]);
    mockDeleteReview.mockResolvedValueOnce(undefined);

    const screen = render(
      <PlaceDetailScreen
        navigation={navigation as never}
        route={{ key: 'place', name: Routes.PlaceDetail, params: { placeId: 'place-001' } } as never}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Delete'));
    expect(alertSpy).toHaveBeenCalled();

    const alertButtons = (alertSpy.mock.calls[0]?.[2] || []) as Array<{ text?: string; onPress?: () => void }>;
    const confirmDelete = alertButtons.find((button) => button.text === 'Delete');
    expect(confirmDelete?.onPress).toBeDefined();
    await confirmDelete?.onPress?.();

    await waitFor(() => {
      expect(mockDeleteReview).toHaveBeenCalledWith({
        reviewId: 'review-001',
        authorId: 'user-001',
      });
      expect(mockGetReviewsForPlace).toHaveBeenCalledTimes(2);
    });

    alertSpy.mockRestore();
  });
});
