import React from 'react';
import { render } from '@testing-library/react-native';
import AppNavigator from '../AppNavigator';

const mockUseAuth = jest.fn();

jest.mock('../../services/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../screens/Auth/LoginScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>login-screen</Text>;
});
jest.mock('../../screens/Auth/SignupScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>signup-screen</Text>;
});
jest.mock('../../screens/Auth/AcceptTermsScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>terms-screen</Text>;
});
jest.mock('../../screens/Auth/ProfileSetupScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>profile-setup-screen</Text>;
});
jest.mock('../../screens/Connect/FindPeopleScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>find-people-screen</Text>;
});
jest.mock('../../screens/Main/MainShellScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>main-shell-screen</Text>;
});
jest.mock('../../screens/Map/MapHomeScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>map-home-screen</Text>;
});
jest.mock('../../screens/Explore/ExploreScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>explore-screen</Text>;
});
jest.mock('../../screens/Map/PlaceDetailScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>place-detail-screen</Text>;
});
jest.mock('../../screens/Map/ReviewDetailScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>review-detail-screen</Text>;
});
jest.mock('../../screens/Share/ReviewComposerScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>review-composer-screen</Text>;
});
jest.mock('../../screens/Notifications/NotificationsScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>notifications-screen</Text>;
});
jest.mock('../../screens/Profile/ProfileScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>profile-screen</Text>;
});
jest.mock('../../screens/Profile/EditProfileScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>edit-profile-screen</Text>;
});
jest.mock('../../screens/Settings/SettingsScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>settings-screen</Text>;
});

describe('AppNavigator', () => {
  it('shows auth stack when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isBootstrappingAuth: false,
      hasAcceptedTerms: false,
      hasCompletedProfile: false,
      hasCompletedOnboarding: false,
    });

    const screen = render(<AppNavigator />);

    expect(screen.getByText('login-screen')).toBeTruthy();
  });

  it('does not switch stacks based on bootstrap loading flag', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isBootstrappingAuth: true,
      hasAcceptedTerms: false,
      hasCompletedProfile: false,
      hasCompletedOnboarding: false,
    });

    const screen = render(<AppNavigator />);

    expect(screen.getByText('login-screen')).toBeTruthy();
  });
});
