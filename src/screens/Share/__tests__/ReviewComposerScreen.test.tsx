import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ReviewComposerScreen from '../ReviewComposerScreen';
import { getStrings } from '../../../localization/strings';

const mockSearchPlaces = jest.fn();
const mockResolveLocationHintCoordinates = jest.fn();
const mockPickReviewPhotosFromLibrary = jest.fn();
const mockCreateReviewAndStore = jest.fn();
const mockUpdateReviewAndStore = jest.fn();
const mockGetReviewById = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../../services/map', () => ({
  getPlaceById: jest.fn(() => null),
}));

jest.mock('../../../services/locationSearch', () => ({
  searchLocationHints: (...args: unknown[]) => mockSearchPlaces(...args),
  resolveLocationHintCoordinates: (...args: unknown[]) => mockResolveLocationHintCoordinates(...args),
}));

jest.mock('../../../services/media/reviewPhotoPicker', () => ({
  pickReviewPhotosFromLibrary: (...args: unknown[]) => mockPickReviewPhotosFromLibrary(...args),
}));

jest.mock('../../../services/reviews', () => ({
  getReviewById: (...args: unknown[]) => mockGetReviewById(...args),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../../services/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../state/reviews', () => ({
  useReviewStore: (selector: (state: {
    createReviewAndStore: (...args: unknown[]) => unknown;
    updateReviewAndStore: (...args: unknown[]) => unknown;
  }) => unknown) =>
    selector({
      createReviewAndStore: (...args: unknown[]) => mockCreateReviewAndStore(...args),
      updateReviewAndStore: (...args: unknown[]) => mockUpdateReviewAndStore(...args),
    }),
}));

describe('ReviewComposerScreen location picker flow', () => {
  let alertSpy: jest.SpyInstance;

  const isSubmitDisabled = (screen: ReturnType<typeof render>) =>
    Boolean(screen.getByTestId('review-submit').props.accessibilityState?.disabled);

  beforeEach(() => {
    jest.useFakeTimers();
    mockSearchPlaces.mockReset();
    mockResolveLocationHintCoordinates.mockReset();
    mockPickReviewPhotosFromLibrary.mockReset();
    mockCreateReviewAndStore.mockReset();
    mockUpdateReviewAndStore.mockReset();
    mockGetReviewById.mockReset();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-001',
        name: 'Alex',
        handle: 'alex',
        avatar: null,
      },
    });
    mockResolveLocationHintCoordinates.mockImplementation(async (hint: {
      id: string;
      title: string;
      subtitle: string;
      coordinates: [number, number] | null;
    }) => ({
      ...hint,
      coordinates: hint.coordinates || [-46.633308, -23.55052],
    }));
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
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

  it('shows empty-state message when search request fails', async () => {
    const strings = getStrings();
    mockSearchPlaces.mockRejectedValueOnce(new Error('network-down'));

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
      expect(screen.getByText(strings.reviewComposer.locationSuggestionsEmpty)).toBeTruthy();
    });
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

  it('keeps submit disabled until location and review body are filled', async () => {
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

    expect(isSubmitDisabled(screen)).toBe(true);

    fireEvent.changeText(
      screen.getByLabelText(strings.reviewComposer.locationSearchPlaceholder),
      'market'
    );
    jest.advanceTimersByTime(280);
    await waitFor(() => {
      expect(screen.getByText('Old Town Market')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Old Town Market'));

    expect(isSubmitDisabled(screen)).toBe(true);

    fireEvent.changeText(screen.getByPlaceholderText(strings.reviewComposer.placeholder), 'Great food');
    expect(isSubmitDisabled(screen)).toBe(false);
  });

  it('submits when valid and navigates back', async () => {
    const strings = getStrings();
    const navigation = { goBack: jest.fn() };
    mockSearchPlaces.mockResolvedValueOnce([
      {
        id: 'place-002',
        title: 'Old Town Market',
        subtitle: 'Food · Old Town',
        coordinates: null,
      },
    ]);
    mockCreateReviewAndStore.mockResolvedValueOnce({
      id: 'review-001',
    });

    const screen = render(
      <ReviewComposerScreen
        navigation={navigation as never}
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
    fireEvent.changeText(screen.getByPlaceholderText(strings.reviewComposer.placeholder), 'Loved this place');

    fireEvent.press(screen.getByTestId('review-submit'));

    await waitFor(() => {
      expect(mockCreateReviewAndStore).toHaveBeenCalled();
      expect(mockResolveLocationHintCoordinates).toHaveBeenCalled();
      expect(navigation.goBack).toHaveBeenCalled();
    });
  });

  it('blocks submit when location coordinates cannot be resolved', async () => {
    const strings = getStrings();
    const navigation = { goBack: jest.fn() };
    mockSearchPlaces.mockResolvedValueOnce([
      {
        id: 'place-002',
        title: 'Old Town Market',
        subtitle: 'Food · Old Town',
        coordinates: null,
      },
    ]);
    mockResolveLocationHintCoordinates.mockResolvedValueOnce({
      id: 'place-002',
      title: 'Old Town Market',
      subtitle: 'Food · Old Town',
      coordinates: null,
    });

    const screen = render(
      <ReviewComposerScreen
        navigation={navigation as never}
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
    fireEvent.changeText(screen.getByPlaceholderText(strings.reviewComposer.placeholder), 'Loved this place');
    fireEvent.press(screen.getByTestId('review-submit'));

    await waitFor(() => {
      expect(mockCreateReviewAndStore).not.toHaveBeenCalled();
      expect(navigation.goBack).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        strings.reviewComposer.post,
        strings.reviewComposer.locationResolveError
      );
    });
  });

  it('loads owned review in edit mode and submits update', async () => {
    const strings = getStrings();
    const navigation = { goBack: jest.fn() };
    mockGetReviewById.mockResolvedValueOnce({
      id: 'review-001',
      placeId: 'place-002',
      placeTitle: 'Old Town Market',
      placeCoordinates: null,
      title: 'Old Town Market',
      notes: 'Existing note',
      rating: 7,
      visibility: 'followers',
      userId: 'user-001',
      userName: 'Alex',
      userHandle: 'alex',
      userAvatar: null,
      createdAt: '2026-02-10T09:00:00.000Z',
      updatedAt: '2026-02-10T09:00:00.000Z',
      photos: [],
      photoUrls: [],
    });
    mockUpdateReviewAndStore.mockResolvedValueOnce({
      id: 'review-001',
    });

    const screen = render(
      <ReviewComposerScreen
        navigation={navigation as never}
        route={{ key: 'review', name: 'ShareReview', params: { reviewId: 'review-001' } } as never}
      />
    );

    await waitFor(() => {
      expect(mockGetReviewById).toHaveBeenCalledWith('review-001');
      expect(screen.getByDisplayValue('Existing note')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText(strings.reviewComposer.placeholder), 'Updated note');
    fireEvent.press(screen.getByTestId('review-submit'));

    await waitFor(() => {
      expect(mockUpdateReviewAndStore).toHaveBeenCalledWith(
        expect.objectContaining({
          reviewId: 'review-001',
          notes: 'Updated note',
          place: expect.objectContaining({ id: 'place-002', title: 'Old Town Market' }),
        }),
        expect.objectContaining({
          onProgress: expect.any(Function),
        })
      );
      expect(navigation.goBack).toHaveBeenCalled();
    });
  });

  it('returns back when edit review does not belong to current user', async () => {
    const navigation = { goBack: jest.fn() };
    mockGetReviewById.mockResolvedValueOnce({
      id: 'review-001',
      placeId: 'place-002',
      placeTitle: 'Old Town Market',
      placeCoordinates: null,
      title: 'Old Town Market',
      notes: 'Existing note',
      rating: 7,
      visibility: 'followers',
      userId: 'user-999',
      userName: 'Someone else',
      userHandle: 'else',
      userAvatar: null,
      createdAt: '2026-02-10T09:00:00.000Z',
      updatedAt: '2026-02-10T09:00:00.000Z',
      photos: [],
      photoUrls: [],
    });

    render(
      <ReviewComposerScreen
        navigation={navigation as never}
        route={{ key: 'review', name: 'ShareReview', params: { reviewId: 'review-001' } } as never}
      />
    );

    await waitFor(() => {
      expect(navigation.goBack).toHaveBeenCalled();
    });
  });

  it('ignores duplicate submit while request is pending', async () => {
    const strings = getStrings();
    const pending = new Promise(() => {
      // intentionally unresolved promise to hold submitting state
    });
    mockSearchPlaces.mockResolvedValueOnce([
      {
        id: 'place-002',
        title: 'Old Town Market',
        subtitle: 'Food · Old Town',
        coordinates: null,
      },
    ]);
    mockCreateReviewAndStore.mockReturnValueOnce(pending);

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
    fireEvent.changeText(screen.getByPlaceholderText(strings.reviewComposer.placeholder), 'Great food');

    fireEvent.press(screen.getByTestId('review-submit'));
    fireEvent.press(screen.getByTestId('review-submit'));

    await waitFor(() => {
      expect(mockCreateReviewAndStore).toHaveBeenCalledTimes(1);
    });
  });

  it('shows timeout-specific error when submit stage exceeds timeout', async () => {
    const strings = getStrings();
    mockSearchPlaces.mockResolvedValueOnce([
      {
        id: 'place-002',
        title: 'Old Town Market',
        subtitle: 'Food · Old Town',
        coordinates: null,
      },
    ]);
    mockCreateReviewAndStore.mockRejectedValueOnce(new Error('reviews.uploadPhoto-timeout'));

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
    fireEvent.changeText(screen.getByPlaceholderText(strings.reviewComposer.placeholder), 'Great food');
    fireEvent.press(screen.getByTestId('review-submit'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        strings.reviewComposer.post,
        strings.reviewComposer.submitTimeoutError
      );
    });
  });

  it('renders submit progress banner while upload is in-flight', async () => {
    const strings = getStrings();
    const pending = new Promise(() => {
      // keep submit open while we assert progress UI
    });
    mockSearchPlaces.mockResolvedValueOnce([
      {
        id: 'place-002',
        title: 'Old Town Market',
        subtitle: 'Food · Old Town',
        coordinates: null,
      },
    ]);
    mockCreateReviewAndStore.mockImplementationOnce((_payload, options) => {
      options?.onProgress?.({
        operation: 'create',
        stage: 'uploading',
        completed: 1,
        total: 3,
        reviewId: 'review-001',
      });
      return pending;
    });

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
    fireEvent.changeText(screen.getByPlaceholderText(strings.reviewComposer.placeholder), 'Great food');
    fireEvent.press(screen.getByTestId('review-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('review-submit-progress')).toBeTruthy();
      expect(
        screen.getByText(
          strings.reviewComposer.progressUploading.replace('{current}', '1').replace('{total}', '3')
        )
      ).toBeTruthy();
    });
  });
});
