export type ReviewLikeState = {
  reviewId: string;
  userId: string;
  liked: boolean;
  likeCount: number;
};

export type ReviewCommentRecord = {
  id: string;
  reviewId: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string | null;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type ListReviewCommentsResult = {
  items: ReviewCommentRecord[];
  hasMore: boolean;
};

export type CreateReviewCommentInput = {
  reviewId: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string | null;
  text: string;
};
