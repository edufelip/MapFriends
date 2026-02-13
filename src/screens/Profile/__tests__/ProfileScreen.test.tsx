import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Alert, InteractionManager } from 'react-native';
import ProfileScreen from '../ProfileScreen';
import { Routes } from '../../../app/routes';
import { getStrings } from '../../../localization/strings';

const mockUseAuth = jest.fn();
const mockRemoveFavoriteAndStore = jest.fn();

jest.mock('../../../services/auth', () => ({
  useAuth: () => mockUseAuth(),
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
  const { Text } = require('react-native');
  return () => <Text>settings-row</Text>;
});
jest.mock('../components/ToggleRow', () => {
  const { Text } = require('react-native');
  return () => <Text>toggle-row</Text>;
});
jest.mock('../components/LogoutRow', () => {
  const { Pressable, Text } = require('react-native');
  return ({ onLogout, label }: { onLogout?: () => void; label: string }) => (
    <Pressable testID="profile-logout-button" onPress={onLogout}>
      <Text>{label}</Text>
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
    const strings = getStrings();
    const screen = render(<ProfileScreen navigation={navigation as never} route={{} as never} />);

    fireEvent.press(screen.getByText(strings.profile.editProfile));

    expect(navigation.navigate).toHaveBeenCalledWith(Routes.EditProfile);
  });

  it('opens favorites section by default and switches to settings on tab press', () => {
    const screen = render(<ProfileScreen navigation={navigation as never} route={{} as never} />);

    expect(screen.getByText('favorites-section')).toBeTruthy();
    expect(screen.queryByText('settings-row')).toBeNull();

    fireEvent.press(screen.getByTestId('profile-section-tab-settings'));

    expect(screen.getAllByText('settings-row').length).toBeGreaterThan(0);
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
