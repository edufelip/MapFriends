export type FollowingListState = {
  userId: string;
  followedUserIds: string[];
};

export type FollowerListState = {
  userId: string;
  followerUserIds: string[];
};

export type FollowRequestRecord = {
  targetUserId: string;
  requesterUserId: string;
  requesterName: string;
  requesterHandle: string;
  requesterAvatar: string | null;
  createdAt: string;
};
