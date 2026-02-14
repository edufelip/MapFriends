import { listBlockedUsers, removeBlockedUser } from '../../../services/blocks';
import { useBlockedUsersStore } from '../blocksStore';

jest.mock('../../../services/blocks', () => ({
  listBlockedUsers: jest.fn(),
  removeBlockedUser: jest.fn(),
}));

const mockListBlockedUsers = listBlockedUsers as jest.MockedFunction<typeof listBlockedUsers>;
const mockRemoveBlockedUser = removeBlockedUser as jest.MockedFunction<typeof removeBlockedUser>;

describe('blockedUsersStore', () => {
  beforeEach(() => {
    useBlockedUsersStore.getState().clearBlockedUsers();
    mockListBlockedUsers.mockReset();
    mockRemoveBlockedUser.mockReset();
  });

  it('hydrates blocked users sorted by newest blocked date', async () => {
    mockListBlockedUsers.mockResolvedValue([
      {
        userId: 'viewer-1',
        blockedUserId: 'user-2',
        blockedName: 'Old User',
        blockedHandle: 'old_user',
        blockedAvatar: null,
        createdAt: '2026-02-10T10:00:00.000Z',
      },
      {
        userId: 'viewer-1',
        blockedUserId: 'user-3',
        blockedName: 'New User',
        blockedHandle: 'new_user',
        blockedAvatar: null,
        createdAt: '2026-02-10T12:00:00.000Z',
      },
    ]);

    await useBlockedUsersStore.getState().hydrateBlockedUsers({ userId: 'viewer-1' });

    expect(useBlockedUsersStore.getState().blockedUserIds).toEqual(['user-3', 'user-2']);
  });

  it('removes blocked user locally after successful unblock', async () => {
    useBlockedUsersStore.setState({
      blockedUsersById: {
        'user-2': {
          userId: 'viewer-1',
          blockedUserId: 'user-2',
          blockedName: 'User Two',
          blockedHandle: 'user_two',
          blockedAvatar: null,
          createdAt: '2026-02-10T10:00:00.000Z',
        },
      },
      blockedUserIds: ['user-2'],
    });

    mockRemoveBlockedUser.mockResolvedValue(undefined as never);

    await useBlockedUsersStore.getState().unblockUserAndStore({
      userId: 'viewer-1',
      blockedUserId: 'user-2',
    });

    expect(useBlockedUsersStore.getState().blockedUserIds).toEqual([]);
    expect(mockRemoveBlockedUser).toHaveBeenCalledWith({
      userId: 'viewer-1',
      blockedUserId: 'user-2',
    });
  });

  it('rolls back blocked user when unblock request fails', async () => {
    useBlockedUsersStore.setState({
      blockedUsersById: {
        'user-2': {
          userId: 'viewer-1',
          blockedUserId: 'user-2',
          blockedName: 'User Two',
          blockedHandle: 'user_two',
          blockedAvatar: null,
          createdAt: '2026-02-10T10:00:00.000Z',
        },
      },
      blockedUserIds: ['user-2'],
    });

    mockRemoveBlockedUser.mockRejectedValue(new Error('network-failed'));

    await expect(
      useBlockedUsersStore.getState().unblockUserAndStore({
        userId: 'viewer-1',
        blockedUserId: 'user-2',
      })
    ).rejects.toThrow('network-failed');

    expect(useBlockedUsersStore.getState().blockedUserIds).toEqual(['user-2']);
  });
});
