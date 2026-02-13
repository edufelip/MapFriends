import { ReviewRecord } from '../../services/reviews';
import { FavoriteReviewSnapshot } from '../../services/favorites';

export const toFavoriteSnapshot = (review: ReviewRecord): FavoriteReviewSnapshot => ({
  placeId: review.placeId,
  placeTitle: review.placeTitle,
  reviewTitle: review.title,
  reviewNotes: review.notes,
  reviewRating: review.rating,
  reviewPhotoUrl: review.photoUrls[0] || null,
  reviewAuthorId: review.userId,
  reviewAuthorName: review.userName,
  reviewAuthorHandle: review.userHandle,
  reviewAuthorAvatar: review.userAvatar,
});
