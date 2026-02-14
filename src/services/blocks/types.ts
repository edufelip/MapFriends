export type BlockedUserRecord = {
  userId: string;
  blockedUserId: string;
  blockedName: string;
  blockedHandle: string;
  blockedAvatar: string | null;
  createdAt: string;
};
