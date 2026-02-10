import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import ProfileScreen from '../ProfileScreen';
import { Routes } from '../../../app/routes';
import { getStrings } from '../../../localization/strings';

const mockUseAuth = jest.fn();

jest.mock('../../../services/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../components/ProfileHeader', () => {
  const { Text } = require('react-native');
  return () => <Text>profile-header</Text>;
});
jest.mock('../components/SettingsSection', () => ({ children }: { children: ReactNode }) => <>{children}</>);
jest.mock('../components/SettingsRow', () => {
  const { Text } = require('react-native');
  return () => <Text>settings-row</Text>;
});
jest.mock('../components/ToggleRow', () => {
  const { Text } = require('react-native');
  return () => <Text>toggle-row</Text>;
});
jest.mock('../components/LogoutRow', () => {
  const { Text } = require('react-native');
  return () => <Text>logout-row</Text>;
});
jest.mock('../../Map/components/BottomNav', () => {
  const { Text } = require('react-native');
  return () => <Text>bottom-nav</Text>;
});
jest.mock('../components/ProfileHero', () => {
  const { Pressable, Text } = require('react-native');
  return ({ onEdit, editLabel }: { onEdit?: () => void; editLabel: string }) => (
    <Pressable onPress={onEdit}>
      <Text>{editLabel}</Text>
    </Pressable>
  );
});

describe('ProfileScreen', () => {
  it('navigates to edit profile screen when edit action is pressed', () => {
    const strings = getStrings();
    const navigation = {
      navigate: jest.fn(),
      canGoBack: () => false,
      goBack: jest.fn(),
    };

    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Alex',
        handle: 'alex',
        avatar: null,
        bio: 'bio',
        visibility: 'open',
      },
      signOut: jest.fn(),
      updateVisibility: jest.fn(),
    });

    const screen = render(<ProfileScreen navigation={navigation as never} route={{} as never} />);

    fireEvent.press(screen.getByText(strings.profile.editProfile));

    expect(navigation.navigate).toHaveBeenCalledWith(Routes.EditProfile);
  });
});
