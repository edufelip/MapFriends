import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Alert, InteractionManager } from 'react-native';
import ProfileScreen from '../ProfileScreen';
import { Routes } from '../../../app/routes';

const mockUseAuth = jest.fn();
const mockRemoveFavoriteAndStore = jest.fn();

jest.mock('../../../services/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../services/appVersion', () => ({
  getAppVersionInfo: () => ({
    version: '1.0.0',
    build: '77',
  }),
  formatAppVersionLabel: (template: string, info: { version: string; build: string }) =>
    template
      .replace('{{version}}', info.version)
      .replace('{{build}}', info.build),
}));

jest.mock('../../../state/favorites', () => ({
  useFavoriteHydrating: () => false,
  useFavoriteRecords: () => [],
  useHydrateFavoriteState: jest.fn(),
  useFavoriteStore: (selector: (state: any) => unknown) =>
    selector({
      removeFavoriteAndStore: mockRemoveFavoriteAndStore,
    }),
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
  const { Pressable, Text } = require('react-native');
  return ({ label, onPress }: { label: string; onPress?: () => void }) => (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Text>{label}</Text>
    </Pressable>
  );
});
jest.mock('../components/ToggleRow', () => {
  const { Text } = require('react-native');
  return () => <Text>toggle-row</Text>;
});
jest.mock('../components/LogoutRow', () => {
  const { Pressable, Text } = require('react-native');
  return ({
    onLogout,
    label,
    version,
  }: {
    onLogout?: () => void;
    label: string;
    version: string;
  }) => (
    <Pressable testID="profile-logout-button" onPress={onLogout}>
      <Text>{label}</Text>
      <Text>{version}</Text>
    </Pressable>
  );
});
jest.mock('../components/FavoritesSection', () => {
  const { Text } = require('react-native');
  return () => <Text>favorites-section</Text>;
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
  const navigation = {
    navigate: jest.fn(),
    push: jest.fn(),
    canGoBack: () => false,
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Alex',
        handle: 'alex',
        avatar: null,
        bio: 'bio',
        visibility: 'open',
      },
      signOut: jest.fn(async () => undefined),
      updateVisibility: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('navigates to edit profile screen when edit action is pressed', () => {
    const screen = render(<ProfileScreen navigation={navigation as never} route={{} as never} />);

    fireEvent.press(screen.getByText('Edit Profile'));

    expect(navigation.navigate).toHaveBeenCalledWith(Routes.EditProfile);
  });

  it('opens favorites section by default and switches to settings on tab press', () => {
    const screen = render(<ProfileScreen navigation={navigation as never} route={{} as never} />);

    expect(screen.getByText('favorites-section')).toBeTruthy();
    expect(screen.queryByText('Blocked Users')).toBeNull();

    fireEvent.press(screen.getByTestId('profile-section-tab-settings'));

    expect(screen.getByText('Blocked Users')).toBeTruthy();
  });

  it('navigates to blocked users screen when blocked users row is pressed', () => {
    const screen = render(<ProfileScreen navigation={navigation as never} route={{} as never} />);

    fireEvent.press(screen.getByTestId('profile-section-tab-settings'));
    fireEvent.press(screen.getByText('Blocked Users'));

    expect(navigation.navigate).toHaveBeenCalledWith(Routes.BlockedUsers);
  });

  it('navigates to manage subscriptions screen when manage subscriptions row is pressed', () => {
    const screen = render(<ProfileScreen navigation={navigation as never} route={{} as never} />);

    fireEvent.press(screen.getByTestId('profile-section-tab-settings'));
    fireEvent.press(screen.getByText('Manage My Subscriptions'));

    expect(navigation.navigate).toHaveBeenCalledWith(Routes.ManageSubscriptions);
  });

  it('renders version label using runtime app metadata', () => {
    const screen = render(<ProfileScreen navigation={navigation as never} route={{} as never} />);

    expect(screen.getByText('Version 1.0.0 (Build 77)')).toBeTruthy();
  });

  it('asks for confirmation before logout and only signs out after confirm', async () => {
    const signOut = jest.fn(async () => undefined);
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Alex',
        handle: 'alex',
        avatar: null,
        bio: 'bio',
        visibility: 'open',
      },
      signOut,
      updateVisibility: jest.fn(),
    });

    jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((task: any) => {
      task?.();
      return { cancel: jest.fn() } as any;
    });

    const screen = render(<ProfileScreen navigation={navigation as never} route={{} as never} />);

    fireEvent.press(screen.getByTestId('profile-logout-button'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0] as [string, string, Array<any>];

    await act(async () => {
      buttons[1]?.onPress?.();
    });

    expect(navigation.push).toHaveBeenCalledWith(Routes.AuthLogin);
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
