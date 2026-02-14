import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import BlockedUsersScreen from '../BlockedUsersScreen';

const mockUseAuth = jest.fn();
const mockUnblockBlockedUser = jest.fn();
const mockHydrateFollowing = jest.fn();
const mockRefreshReviews = jest.fn();
const mockRefreshBlockedUsers = jest.fn();

const mockUseBlockedUserRecords = jest.fn();
const mockUseBlockedUsersHydrating = jest.fn();
const mockUseBlockedUsersError = jest.fn();
const mockUsePendingUnblockIds = jest.fn();

jest.mock('../../../services/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../state/blocks', () => ({
  useHydrateBlockedUsersState: jest.fn(),
  useBlockedUserRecords: () => mockUseBlockedUserRecords(),
  useBlockedUsersHydrating: () => mockUseBlockedUsersHydrating(),
  useBlockedUsersError: () => mockUseBlockedUsersError(),
  usePendingUnblockIds: () => mockUsePendingUnblockIds(),
  useUnblockBlockedUser: () => mockUnblockBlockedUser,
  useBlockedUsersStore: (selector: (state: any) => unknown) =>
    selector({
      refreshBlockedUsers: mockRefreshBlockedUsers,
    }),
}));

jest.mock('../../../state/reviews', () => ({
  useRefreshReviews: () => mockRefreshReviews,
}));

jest.mock('../../../state/following', () => ({
  useFollowingStore: (selector: (state: any) => unknown) =>
    selector({
      hydrateFollowing: mockHydrateFollowing,
    }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('BlockedUsersScreen', () => {
  const navigation = {
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    mockUseAuth.mockReturnValue({
      user: {
        id: 'viewer-1',
        name: 'Viewer',
        handle: 'viewer',
      },
    });

    mockUseBlockedUserRecords.mockReturnValue([
      {
        userId: 'viewer-1',
        blockedUserId: 'user-2',
        blockedName: 'Blocked Person',
        blockedHandle: 'blocked_person',
        blockedAvatar: null,
        createdAt: '2026-02-13T22:00:00.000Z',
      },
    ]);
    mockUseBlockedUsersHydrating.mockReturnValue(false);
    mockUseBlockedUsersError.mockReturnValue(null);
    mockUsePendingUnblockIds.mockReturnValue({});

    mockUnblockBlockedUser.mockResolvedValue(undefined);
    mockHydrateFollowing.mockResolvedValue(undefined);
    mockRefreshReviews.mockResolvedValue(undefined);
    mockRefreshBlockedUsers.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('asks confirmation and unblocks selected user', async () => {
    const screen = render(
      <BlockedUsersScreen navigation={navigation as never} route={{ key: 'blocked', name: 'BlockedUsers' } as never} />
    );

    fireEvent.press(screen.getByTestId('blocked-user-unblock-user-2'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0] as [string, string, Array<any>];

    await act(async () => {
      buttons[1]?.onPress?.();
    });

    expect(mockUnblockBlockedUser).toHaveBeenCalledWith({
      userId: 'viewer-1',
      blockedUserId: 'user-2',
    });
    expect(mockRefreshReviews).toHaveBeenCalled();
    expect(mockHydrateFollowing).toHaveBeenCalledWith('viewer-1', { force: true });
  });

  it('renders empty state when there are no blocked users', () => {
    mockUseBlockedUserRecords.mockReturnValue([]);

    const screen = render(
      <BlockedUsersScreen navigation={navigation as never} route={{ key: 'blocked', name: 'BlockedUsers' } as never} />
    );

    expect(screen.getByText('No blocked users')).toBeTruthy();
  });
});
