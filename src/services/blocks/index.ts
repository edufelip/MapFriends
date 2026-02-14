import { createBlocksRepository } from './blocksRepository';
import { BlockedUserRecord } from './types';

const repository = createBlocksRepository();

export type { BlockedUserRecord };

export async function listBlockedUsers(input: {
  userId: string;
  limit?: number;
}): Promise<BlockedUserRecord[]> {
  return repository.listBlockedUsers({
    userId: input.userId,
    limit: input.limit ?? 120,
  });
}

export async function removeBlockedUser(input: {
  userId: string;
  blockedUserId: string;
}): Promise<void> {
  return repository.removeBlockedUser(input);
}
