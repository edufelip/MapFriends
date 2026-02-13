import React from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import MapHomeScreen from '../MapHomeScreen';
import { Routes } from '../../../app/routes';

const mockMapTab = jest.fn(() => null);
const mockFeedTab = jest.fn(() => null);
const mockBottomNav = jest.fn(() => null);

const mockRequestAndroidLocationPermissions = jest.fn();
const mockGetForegroundPermissionsAsync = jest.fn();
const mockRequestForegroundPermissionsAsync = jest.fn();
const mockGetLastKnownPositionAsync = jest.fn();
const mockGetCurrentPositionAsync = jest.fn();
const mockRefreshReviews = jest.fn();

jest.mock('@rnmapbox/maps', () => ({
  setAccessToken: jest.fn(),
  MapView: () => null,
  Camera: () => null,
  StyleURL: { Dark: 'dark', Light: 'light' },
  requestAndroidLocationPermissions: () => mockRequestAndroidLocationPermissions(),
  locationManager: {},
}));

jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 'balanced',
  },
  getForegroundPermissionsAsync: () => mockGetForegroundPermissionsAsync(),
  requestForegroundPermissionsAsync: () => mockRequestForegroundPermissionsAsync(),
  getLastKnownPositionAsync: () => mockGetLastKnownPositionAsync(),
  getCurrentPositionAsync: () => mockGetCurrentPositionAsync(),
}));

jest.mock('../components/MapTab', () => (props: unknown) => mockMapTab(props));
jest.mock('../components/FeedTab', () => (props: unknown) => mockFeedTab(props));
jest.mock('../components/BottomNav', () => (props: unknown) => mockBottomNav(props));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../../services/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
  }),
}));

jest.mock('../../../state/reviews', () => ({
  useHydrateReviewState: jest.fn(),
  useRefreshReviews: () => mockRefreshReviews,
  useReviewHydrating: () => false,
  useReviewFeedPosts: () => [],
  useReviewPins: () => [],
}));

jest.mock('../../../localization/strings', () => ({
  getStrings: () => ({
    home: {
      tabFeed: 'Feed',
      tabMap: 'Map',
      filterPeopleAll: 'People: All',
      filterContentPremium: 'Content: Premium',
      youLabel: 'You',
      sampleQuote: 'Sample quote',
      mapTokenMissing: 'Missing token',
      feedTitle: 'SocialMap',
      feedMore: 'more',
      feedPremiumLabel: 'Premium',
      feedPremiumTitle: 'Premium title',
      feedPremiumDesc: 'Premium desc',
      feedPremiumCta: 'Subscribe',
      navHome: 'Home',
      navExplore: 'Explore',
      navActivity: 'Activity',
      navProfile: 'Profile',
      locationPromptTitle: 'Enable location',
      locationPromptMessage: 'Need location to show specific content.',
      locationPromptAllow: 'Allow',
      locationPromptNotNow: 'Not now',
    },
  }),
}));

describe('MapHomeScreen', () => {
  const navigation = { navigate: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'android' });
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockRequestAndroidLocationPermissions.mockResolvedValue(false);
    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetLastKnownPositionAsync.mockResolvedValue(null);
    mockGetCurrentPositionAsync.mockResolvedValue(null);
    mockRefreshReviews.mockResolvedValue(undefined);
  });

  it('shows a location explanation before requesting Android permission when not granted', async () => {
    (PermissionsAndroid.check as jest.Mock).mockResolvedValue(false);
    mockGetLastKnownPositionAsync.mockResolvedValue({
      coords: {
        longitude: -46.633308,
        latitude: -23.55052,
      },
    });
    (Alert.alert as jest.Mock).mockImplementation((_title, _message, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    mockRequestAndroidLocationPermissions.mockResolvedValue(true);

    render(<MapHomeScreen navigation={navigation} route={{ key: 'MapHome', name: 'MapHome' }} />);

    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    await waitFor(() => expect(mockRequestAndroidLocationPermissions).toHaveBeenCalled());
  });

  it('focuses map on current user location when Android location permission is already granted', async () => {
    mockGetLastKnownPositionAsync.mockResolvedValue({
      coords: {
        longitude: -46.633308,
        latitude: -23.55052,
      },
    });

    render(<MapHomeScreen navigation={navigation} route={{ key: 'MapHome', name: 'MapHome' }} />);

    await waitFor(() =>
      expect(mockMapTab).toHaveBeenLastCalledWith(
        expect.objectContaining({
          userCoordinate: [-46.633308, -23.55052],
        })
      )
    );
  });

  it('supports controlled home mode and emits mode changes', async () => {
    const onHomeModeChange = jest.fn();

    const screen = render(
      <MapHomeScreen
        navigation={navigation}
        route={{ key: 'MapHome', name: 'MapHome' }}
        homeMode="feed"
        onHomeModeChange={onHomeModeChange}
      />
    );

    expect(mockFeedTab).toHaveBeenCalled();
    fireEvent.press(screen.getByText('Map'));
    expect(onHomeModeChange).toHaveBeenCalledWith('map');
  });

  it('re-triggers map fit after feed refresh', async () => {
    render(<MapHomeScreen navigation={navigation} route={{ key: 'MapHome', name: 'MapHome' }} />);

    const feedProps = mockFeedTab.mock.calls.at(-1)?.[0];
    expect(feedProps).toBeTruthy();

    await act(async () => {
      await feedProps.onRefresh();
    });

    expect(mockRefreshReviews).toHaveBeenCalled();
    expect(mockMapTab).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fitTrigger: 1,
      })
    );
  });

  it('navigates to review detail when map context card opens a review', () => {
    render(<MapHomeScreen navigation={navigation} route={{ key: 'MapHome', name: 'MapHome' }} />);

    const mapProps = mockMapTab.mock.calls.at(-1)?.[0];
    expect(mapProps).toBeTruthy();

    mapProps.onOpenReview('review-123');

    expect(navigation.navigate).toHaveBeenCalledWith(Routes.ReviewDetail, { reviewId: 'review-123' });
  });
});
