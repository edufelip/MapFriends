export type FavoriteReviewSnapshot = {
  placeId: string;
  placeTitle: string;
  reviewTitle: string;
  reviewNotes: string;
  reviewRating: number;
  reviewPhotoUrl: string | null;
  reviewAuthorId: string;
  reviewAuthorName: string;
  reviewAuthorHandle: string;
  reviewAuthorAvatar: string | null;
};

export type FavoriteRecord = {
  reviewId: string;
  userId: string;
  createdAt: string;
  snapshot: FavoriteReviewSnapshot;
};

export type SaveFavoriteInput = {
  userId: string;
  reviewId: string;
  createdAt: string;
  snapshot: FavoriteReviewSnapshot;
};
