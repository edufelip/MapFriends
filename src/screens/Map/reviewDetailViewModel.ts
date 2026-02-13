import { ReviewRecord } from '../../services/reviews';
import { Place } from '../../services/types';

export type ReviewDetailSocialProofUser = {
  id: string;
  name: string;
  avatar: string | null;
};

const toRelativeTimeLabel = (dateIso: string) => {
  const timestamp = Date.parse(dateIso);
  if (Number.isNaN(timestamp)) {
    return 'now';
  }

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (elapsedMinutes < 1) {
    return 'now';
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
};

const buildSocialProofUsers = (review: ReviewRecord, records: ReviewRecord[]) => {
  const dedupedByUser = new Map<string, ReviewDetailSocialProofUser>();

  records.forEach((item) => {
    if (item.id === review.id || item.placeId !== review.placeId || item.userId === review.userId) {
      return;
    }
    if (dedupedByUser.has(item.userId)) {
      return;
    }

    dedupedByUser.set(item.userId, {
      id: item.userId,
      name: item.userName,
      avatar: item.userAvatar,
    });
  });

  const users = Array.from(dedupedByUser.values());
  return {
    visibleUsers: users.slice(0, 3),
    hiddenCount: Math.max(0, users.length - 3),
  };
};

export function toReviewDetailViewModel({
  review,
  place,
  reviewRecords,
}: {
  review: ReviewRecord;
  place: Place | null;
  reviewRecords: ReviewRecord[];
}) {
  const socialProof = buildSocialProofUsers(review, reviewRecords);

  return {
    placeTitle: review.placeTitle,
    placeMeta: place ? `${place.category} • ${place.rating.toFixed(1)}` : '',
    address: place?.address || 'Address not available',
    imageUris: review.photoUrls.filter(Boolean),
    isPremium: review.visibility === 'subscribers',
    reviewerName: review.userName,
    reviewerMeta: `${toRelativeTimeLabel(review.createdAt)} • @${review.userHandle}`,
    reviewerAvatar: review.userAvatar,
    ratingLabel: review.rating.toFixed(1),
    experienceNotes: review.notes,
    socialProofUsers: socialProof.visibleUsers,
    socialProofHiddenCount: socialProof.hiddenCount,
  };
}
