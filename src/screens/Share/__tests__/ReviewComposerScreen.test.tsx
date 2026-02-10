import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ReviewComposerScreen from '../ReviewComposerScreen';
import { getStrings } from '../../../localization/strings';

const mockSearchPlaces = jest.fn();
const mockPickReviewPhotosFromLibrary = jest.fn();

jest.mock('../../../services/map', () => ({
  getPlaceById: jest.fn(() => null),
}));

jest.mock('../../../services/locationSearch', () => ({
  searchLocationHints: (...args: unknown[]) => mockSearchPlaces(...args),
}));

jest.mock('../../../services/media/reviewPhotoPicker', () => ({
  pickReviewPhotosFromLibrary: (...args: unknown[]) => mockPickReviewPhotosFromLibrary(...args),
}));

jest.mock('../../../services/reviews', () => ({
  createReview: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('ReviewComposerScreen location picker flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSearchPlaces.mockReset();
    mockPickReviewPhotosFromLibrary.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces location search and shows selectable hints', async () => {
    const strings = getStrings();
    mockSearchPlaces.mockResolvedValueOnce([
      {
        id: 'place-002',
        title: 'Old Town Market',
        subtitle: 'Food · Old Town',
        coordinates: null,
      },
    ]);

    const screen = render(
      <ReviewComposerScreen
        navigation={{ goBack: jest.fn() } as never}
        route={{ key: 'review', name: 'ShareReview', params: {} } as never}
      />
    );

    fireEvent.changeText(
      screen.getByLabelText(strings.reviewComposer.locationSearchPlaceholder),
      'market'
    );

    expect(mockSearchPlaces).not.toHaveBeenCalled();
    jest.advanceTimersByTime(280);

    await waitFor(() => {
      expect(mockSearchPlaces).toHaveBeenCalledWith('market', { limit: 6 });
      expect(screen.getByText('Old Town Market')).toBeTruthy();
    });
  });

  it('switches to location chip after selecting hint and allows clearing it', async () => {
    const strings = getStrings();
    mockSearchPlaces.mockResolvedValueOnce([
      {
        id: 'place-002',
        title: 'Old Town Market',
        subtitle: 'Food · Old Town',
        coordinates: null,
      },
    ]);

    const screen = render(
      <ReviewComposerScreen
        navigation={{ goBack: jest.fn() } as never}
        route={{ key: 'review', name: 'ShareReview', params: {} } as never}
      />
    );

    fireEvent.changeText(
      screen.getByLabelText(strings.reviewComposer.locationSearchPlaceholder),
      'market'
    );
    jest.advanceTimersByTime(280);

    await waitFor(() => {
      expect(screen.getByText('Old Town Market')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Old Town Market'));
    expect(screen.getByLabelText('Remove selected place')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Remove selected place'));
    expect(screen.queryByLabelText('Remove selected place')).toBeNull();
  });

  it('caps notes input at 400 chars and shows counter', () => {
    const strings = getStrings();
    const screen = render(
      <ReviewComposerScreen
        navigation={{ goBack: jest.fn() } as never}
        route={{ key: 'review', name: 'ShareReview', params: {} } as never}
      />
    );

    fireEvent.changeText(
      screen.getByPlaceholderText(strings.reviewComposer.placeholder),
      'a'.repeat(450)
    );

    expect(screen.getByText('400/400')).toBeTruthy();
  });

  it('adds photos when add tile is pressed', async () => {
    const strings = getStrings();
    mockPickReviewPhotosFromLibrary.mockResolvedValueOnce({
      status: 'success',
      uris: ['file://photo-1.jpg', 'file://photo-2.jpg'],
    });

    const screen = render(
      <ReviewComposerScreen
        navigation={{ goBack: jest.fn() } as never}
        route={{ key: 'review', name: 'ShareReview', params: {} } as never}
      />
    );

    fireEvent.press(screen.getByTestId('photo-strip-add'));

    await waitFor(() => {
      expect(mockPickReviewPhotosFromLibrary).toHaveBeenCalledWith(10);
      expect(screen.getByText(strings.reviewComposer.photosCount.replace('{count}', '2'))).toBeTruthy();
    });
  });

  it('limits added photos to max 10', async () => {
    const strings = getStrings();
    mockPickReviewPhotosFromLibrary.mockResolvedValueOnce({
      status: 'success',
      uris: Array.from({ length: 12 }, (_, idx) => `file://photo-${idx + 1}.jpg`),
    });

    const screen = render(
      <ReviewComposerScreen
        navigation={{ goBack: jest.fn() } as never}
        route={{ key: 'review', name: 'ShareReview', params: {} } as never}
      />
    );

    fireEvent.press(screen.getByTestId('photo-strip-add'));

    await waitFor(() => {
      expect(screen.getByText(strings.reviewComposer.photosCount.replace('{count}', '10'))).toBeTruthy();
    });
  });
});
