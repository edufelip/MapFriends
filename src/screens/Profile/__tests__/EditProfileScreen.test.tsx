import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import EditProfileScreen from '../EditProfileScreen';
import { getStrings } from '../../../localization/strings';

const mockUseAuth = jest.fn();

jest.mock('../../../services/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('EditProfileScreen', () => {
  it('updates profile details and goes back on save', async () => {
    const updateProfileDetails = jest.fn().mockResolvedValue(undefined);
    const navigation = {
      goBack: jest.fn(),
    };
    const strings = getStrings();

    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Alex',
        handle: 'alex',
        avatar: null,
        bio: 'Traveler',
        visibility: 'open',
      },
      updateProfileDetails,
      isAuthActionLoading: false,
    });

    const screen = render(<EditProfileScreen navigation={navigation as never} route={{} as never} />);

    fireEvent.changeText(screen.getByLabelText(strings.profile.editNameLabel), 'Alex Santos');
    fireEvent.changeText(screen.getByLabelText(strings.profile.editBioLabel), 'Coffee and ramen scout');
    fireEvent.press(screen.getByText(strings.profile.editSave));

    await waitFor(() => {
      expect(updateProfileDetails).toHaveBeenCalledWith({
        name: 'Alex Santos',
        bio: 'Coffee and ramen scout',
        avatar: null,
        visibility: 'open',
      });
      expect(navigation.goBack).toHaveBeenCalled();
    });
  });

  it('persists locked visibility when changed in edit profile', async () => {
    const updateProfileDetails = jest.fn().mockResolvedValue(undefined);
    const navigation = {
      goBack: jest.fn(),
    };
    const strings = getStrings();

    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Alex',
        handle: 'alex',
        avatar: null,
        bio: 'Traveler',
        visibility: 'open',
      },
      updateProfileDetails,
      isAuthActionLoading: false,
    });

    const screen = render(<EditProfileScreen navigation={navigation as never} route={{} as never} />);

    fireEvent.press(screen.getByLabelText(strings.profile.visibilityTitle));
    fireEvent.press(screen.getByText(strings.profile.editSave));

    await waitFor(() => {
      expect(updateProfileDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'locked',
        })
      );
    });
  });
});
