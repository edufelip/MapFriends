import React from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import MapHomeScreen from '../MapHomeScreen';

const mockMapTab = jest.fn(() => null);
const mockFeedTab = jest.fn(() => null);
const mockBottomNav = jest.fn(() => null);

const mockRequestAndroidLocationPermissions = jest.fn();
const mockGetLastKnownLocation = jest.fn();
const mockAddListener = jest.fn();
const mockRemoveListener = jest.fn();

jest.mock('@rnmapbox/maps', () => ({
  setAccessToken: jest.fn(),
  MapView: () => null,
  Camera: () => null,
  StyleURL: { Dark: 'dark', Light: 'light' },
  requestAndroidLocationPermissions: () => mockRequestAndroidLocationPermissions(),
  locationManager: {
    getLastKnownLocation: () => mockGetLastKnownLocation(),
    addListener: (listener: unknown) => mockAddListener(listener),
    removeListener: (listener: unknown) => mockRemoveListener(listener),
  },
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

jest.mock('../../../services/feed', () => ({
  getFeedPosts: () => [],
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
    mockGetLastKnownLocation.mockResolvedValue(null);
  });

  it('shows a location explanation before requesting Android permission when not granted', async () => {
    (PermissionsAndroid.check as jest.Mock).mockResolvedValue(false);
    mockGetLastKnownLocation.mockResolvedValue({
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
    mockGetLastKnownLocation.mockResolvedValue({
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
});
