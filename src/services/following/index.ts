import { createFollowingRepository } from './followingRepository';
import { FollowingListState } from './types';

const repository = createFollowingRepository();

export type { FollowingListState };

export async function listFollowingUserIds(input: {
  userId: string;
  limit?: number;
}): Promise<FollowingListState> {
  return repository.listFollowingUserIds({
    userId: input.userId,
    limit: input.limit ?? 300,
  });
}
