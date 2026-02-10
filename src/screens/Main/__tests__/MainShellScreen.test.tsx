import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import MainShellScreen from '../MainShellScreen';

jest.mock('../../../services/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Alex' },
  }),
}));

jest.mock('../../../localization/strings', () => ({
  getStrings: () => ({
    home: {
      navHome: 'Home',
      navExplore: 'Explore',
      navActivity: 'Activity',
      navProfile: 'Profile',
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../Map/MapHomeScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>home-tab-content</Text>;
});

jest.mock('../../Explore/ExploreScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>explore-tab-content</Text>;
});

jest.mock('../../Notifications/NotificationsScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>activity-tab-content</Text>;
});

jest.mock('../../Profile/ProfileScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>profile-tab-content</Text>;
});

jest.mock('../../Map/components/BottomNav', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return ({ onSelect }: { onSelect: (tab: 'home' | 'explore' | 'activity' | 'profile') => void }) => (
    <View>
      <Pressable onPress={() => onSelect('home')}>
        <Text>select-home</Text>
      </Pressable>
      <Pressable onPress={() => onSelect('explore')}>
        <Text>select-explore</Text>
      </Pressable>
      <Pressable onPress={() => onSelect('activity')}>
        <Text>select-activity</Text>
      </Pressable>
      <Pressable onPress={() => onSelect('profile')}>
        <Text>select-profile</Text>
      </Pressable>
    </View>
  );
});

describe('MainShellScreen', () => {
  beforeEach(() => {
    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: (callback?: (result: { finished: boolean }) => void) =>
        callback?.({ finished: true }),
      stop: jest.fn(),
      reset: jest.fn(),
    } as never);
  });

  afterEach(() => {
    (Animated.timing as jest.Mock).mockRestore();
  });

  it('renders only the active tab content tree', () => {
    const navigation = { navigate: jest.fn() } as never;
    const route = { key: 'MainShell', name: 'MainShell' } as never;
    const screen = render(<MainShellScreen navigation={navigation} route={route} />);

    expect(screen.getByText('home-tab-content')).toBeTruthy();
    expect(screen.queryByText('explore-tab-content')).toBeNull();
    expect(screen.queryByText('activity-tab-content')).toBeNull();
    expect(screen.queryByText('profile-tab-content')).toBeNull();

    fireEvent.press(screen.getByText('select-explore'));

    expect(screen.getByText('explore-tab-content')).toBeTruthy();
    expect(screen.queryByText('home-tab-content')).toBeNull();
  });
});
