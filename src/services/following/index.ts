import { createFollowingRepository } from './followingRepository';
import { FollowerListState, FollowRequestRecord, FollowingListState } from './types';

const repository = createFollowingRepository();

export type { FollowerListState, FollowRequestRecord, FollowingListState };

export async function listFollowingUserIds(input: {
  userId: string;
  limit?: number;
}): Promise<FollowingListState> {
  return repository.listFollowingUserIds({
    userId: input.userId,
    limit: input.limit ?? 300,
  });
}

export async function listFollowerUserIds(input: {
  userId: string;
  limit?: number;
}): Promise<FollowerListState> {
  return repository.listFollowerUserIds({
    userId: input.userId,
    limit: input.limit ?? 300,
  });
}

export async function createFollowLink(input: {
  userId: string;
  followedUserId: string;
  createdAt: string;
}): Promise<void> {
  return repository.createFollowLink(input);
}

export async function removeFollowLink(input: {
  userId: string;
  followedUserId: string;
}): Promise<void> {
  return repository.removeFollowLink(input);
}

export async function createFollowRequest(input: FollowRequestRecord): Promise<void> {
  return repository.createFollowRequest(input);
}

export async function listOutgoingFollowRequestTargetUserIds(input: {
  requesterUserId: string;
  targetUserIds: string[];
}): Promise<string[]> {
  return repository.listOutgoingFollowRequestTargetUserIds(input);
}

export async function listFollowRequests(input: {
  userId: string;
  limit?: number;
}): Promise<FollowRequestRecord[]> {
  return repository.listFollowRequests({
    userId: input.userId,
    limit: input.limit ?? 120,
  });
}

export async function acceptFollowRequest(input: {
  userId: string;
  requesterUserId: string;
  acceptedAt: string;
}): Promise<void> {
  return repository.acceptFollowRequest(input);
}

export async function declineFollowRequest(input: {
  userId: string;
  requesterUserId: string;
}): Promise<void> {
  return repository.declineFollowRequest(input);
}
