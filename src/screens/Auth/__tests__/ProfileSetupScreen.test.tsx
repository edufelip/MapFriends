import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ProfileSetupScreen from '../ProfileSetupScreen';
import { getStrings } from '../../../localization/strings';

const mockCompleteProfile = jest.fn();
const mockPickAvatarFromLibrary = jest.fn();
const mockClearAuthError = jest.fn();
const mockCheckHandleAvailability = jest.fn(async () => 'available');

jest.mock('../../../services/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      name: '',
      handle: '',
      bio: '',
      avatar: null,
      visibility: 'open',
    },
    completeProfile: mockCompleteProfile,
    authError: null,
    clearAuthError: mockClearAuthError,
    isAuthActionLoading: false,
    checkHandleAvailability: (...args: unknown[]) => mockCheckHandleAvailability(...args),
  }),
}));

jest.mock('../../../services/media/avatarPicker', () => ({
  pickAvatarFromLibrary: () => mockPickAvatarFromLibrary(),
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

describe('ProfileSetupScreen', () => {
  const strings = getStrings();

  beforeEach(() => {
    mockCompleteProfile.mockReset();
    mockPickAvatarFromLibrary.mockReset();
    mockClearAuthError.mockReset();
    mockCheckHandleAvailability.mockClear();
  });

  it('picks avatar and submits it in completeProfile payload', async () => {
    mockPickAvatarFromLibrary.mockResolvedValue({
      status: 'success',
      uri: 'file://picked-avatar.jpg',
    });

    const screen = render(<ProfileSetupScreen />);

    fireEvent.press(screen.getByLabelText(strings.profileSetup.avatarAddA11yLabel));
    await waitFor(() => expect(mockPickAvatarFromLibrary).toHaveBeenCalled());
    fireEvent.changeText(screen.getByLabelText(strings.profileSetup.displayNameLabel), 'Alex');
    fireEvent.changeText(screen.getByLabelText(strings.profileSetup.handleLabel), 'alex_01');
    fireEvent.changeText(screen.getByLabelText(strings.profileSetup.bioLabel), 'Explorer and food hunter');

    fireEvent.press(screen.getByLabelText(strings.profileSetup.continueA11yLabel));

    expect(mockCompleteProfile).toHaveBeenCalledWith({
      name: 'Alex',
      handle: 'alex_01',
      bio: 'Explorer and food hunter',
      visibility: 'open',
      avatar: 'file://picked-avatar.jpg',
    });
  });

  it('shows a helper when unsupported handle chars are removed', () => {
    const screen = render(<ProfileSetupScreen />);

    fireEvent.changeText(screen.getByLabelText(strings.profileSetup.handleLabel), 'Abc!');

    expect(screen.getByText(strings.profileSetup.handleSanitizedHelper)).toBeTruthy();
  });

  it('shows feedback when photo permission is denied', async () => {
    mockPickAvatarFromLibrary.mockResolvedValue({ status: 'permission-denied' });

    const screen = render(<ProfileSetupScreen />);

    fireEvent.press(screen.getByLabelText(strings.profileSetup.avatarAddA11yLabel));

    expect(await screen.findByText(strings.profileSetup.avatarPermissionDenied)).toBeTruthy();
  });

  it('shows feedback when picker fails unexpectedly', async () => {
    mockPickAvatarFromLibrary.mockResolvedValue({ status: 'error' });

    const screen = render(<ProfileSetupScreen />);

    fireEvent.press(screen.getByLabelText(strings.profileSetup.avatarAddA11yLabel));

    expect(await screen.findByText(strings.profileSetup.avatarPickerError)).toBeTruthy();
  });

  it('does not show avatar feedback when picker is cancelled', async () => {
    mockPickAvatarFromLibrary.mockResolvedValue({ status: 'cancelled' });

    const screen = render(<ProfileSetupScreen />);

    fireEvent.press(screen.getByLabelText(strings.profileSetup.avatarAddA11yLabel));

    expect(screen.queryByText(strings.profileSetup.avatarPermissionDenied)).toBeNull();
    expect(screen.queryByText(strings.profileSetup.avatarPickerError)).toBeNull();
  });

  it('keeps the handle row tappable so taps can focus the handle input', () => {
    const screen = render(<ProfileSetupScreen />);

    fireEvent.press(screen.getByTestId('profile-setup-handle-row'));
    fireEvent.changeText(screen.getByLabelText(strings.profileSetup.handleLabel), 'new_handle');

    expect(screen.getByDisplayValue('new_handle')).toBeTruthy();
  });
});
