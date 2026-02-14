import { listFollowingUserIds } from '../../../services/following';
import { useFollowingStore } from '../followingStore';

jest.mock('../../../services/following', () => ({
  listFollowingUserIds: jest.fn(),
}));

const mockListFollowingUserIds = listFollowingUserIds as jest.MockedFunction<typeof listFollowingUserIds>;

describe('followingStore', () => {
  beforeEach(() => {
    useFollowingStore.getState().clearFollowing();
    mockListFollowingUserIds.mockReset();
  });

  it('hydrates followed user ids for a signed-in user', async () => {
    mockListFollowingUserIds.mockResolvedValue({
      userId: 'viewer-1',
      followedUserIds: ['user-2', 'user-3'],
    });

    await useFollowingStore.getState().hydrateFollowing('viewer-1');

    expect(useFollowingStore.getState().followedUserIdsByUserId['viewer-1']).toEqual(['user-2', 'user-3']);
  });

  it('skips refresh when hydration data is still fresh', async () => {
    mockListFollowingUserIds.mockResolvedValue({
      userId: 'viewer-1',
      followedUserIds: ['user-2'],
    });

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

    try {
      await useFollowingStore.getState().hydrateFollowing('viewer-1', { staleMs: 60_000 });
      nowSpy.mockReturnValue(1_030_000);
      await useFollowingStore.getState().hydrateFollowing('viewer-1', { staleMs: 60_000 });
    } finally {
      nowSpy.mockRestore();
    }

    expect(mockListFollowingUserIds).toHaveBeenCalledTimes(1);
  });
});
