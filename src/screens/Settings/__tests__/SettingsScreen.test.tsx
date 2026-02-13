import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert, InteractionManager } from 'react-native';
import SettingsScreen from '../SettingsScreen';
import { Routes } from '../../../app/routes';

const mockUseAuth = jest.fn();

jest.mock('../../../services/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createNavigation = () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
  });

  const baseUser = {
    id: 'user-1',
    name: 'Alex',
    handle: 'alex',
    avatar: null,
    bio: '',
    visibility: 'open',
  };

  it('opens confirmation popup before logout', () => {
    const signOut = jest.fn();
    mockUseAuth.mockReturnValue({
      user: baseUser,
      signOut,
    });

    const navigation = createNavigation();
    const screen = render(<SettingsScreen navigation={navigation as never} route={{} as never} />);

    fireEvent.press(screen.getByTestId('settings-logout-button'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('does not logout when cancel is pressed in confirmation popup', () => {
    const signOut = jest.fn();
    mockUseAuth.mockReturnValue({
      user: baseUser,
      signOut,
    });

    const navigation = createNavigation();
    const screen = render(<SettingsScreen navigation={navigation as never} route={{} as never} />);

    fireEvent.press(screen.getByTestId('settings-logout-button'));

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0] as [string, string, Array<any>];
    buttons[0]?.onPress?.();

    expect(signOut).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('navigates with push to auth login and then signs out after confirmation', async () => {
    const signOut = jest.fn(async () => undefined);
    mockUseAuth.mockReturnValue({
      user: baseUser,
      signOut,
    });

    jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((task: any) => {
      task?.();
      return { cancel: jest.fn() } as any;
    });

    const navigation = createNavigation();
    const screen = render(<SettingsScreen navigation={navigation as never} route={{} as never} />);

    fireEvent.press(screen.getByTestId('settings-logout-button'));

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0] as [string, string, Array<any>];

    await act(async () => {
      buttons[1]?.onPress?.();
    });

    expect(navigation.push).toHaveBeenCalledWith(Routes.AuthLogin);
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
