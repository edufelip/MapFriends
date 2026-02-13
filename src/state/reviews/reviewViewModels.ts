import { FeedPost } from '../../services/feed';
import { getPlaceById } from '../../services/map';
import { ReviewRecord, ReviewVisibility } from '../../services/reviews';

export type ReviewMapPin = {
  id: string;
  reviewId: string;
  placeId: string;
  title: string;
  rating: number;
  coordinates: [number, number];
  notes?: string;
  userName?: string;
  userHandle?: string;
  visibility?: ReviewVisibility;
};

export type ReviewCoordinateResolution = {
  coordinates: [number, number] | null;
  source: 'review' | 'seed' | 'none';
};

const isCoordinate = (value: unknown): value is [number, number] => {
  if (!Array.isArray(value) || value.length < 2) {
    return false;
  }

  return typeof value[0] === 'number' && typeof value[1] === 'number';
};

function toRelativeTime(dateIso: string) {
  const timestamp = Date.parse(dateIso);
  if (Number.isNaN(timestamp)) {
    return 'now';
  }

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) {
    return 'now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function resolveReviewCoordinates(review: ReviewRecord): ReviewCoordinateResolution {
  if (isCoordinate(review.placeCoordinates)) {
    return {
      coordinates: review.placeCoordinates,
      source: 'review',
    };
  }

  const place = getPlaceById(review.placeId);
  if (isCoordinate(place?.coordinates)) {
    return {
      coordinates: place.coordinates,
      source: 'seed',
    };
  }

  return {
    coordinates: null,
    source: 'none',
  };
}

export function toFeedPost(review: ReviewRecord, counts?: { likeCount?: number; commentCount?: number }): FeedPost {
  return {
    id: `review-${review.id}`,
    reviewId: review.id,
    author: review.userName,
    time: toRelativeTime(review.createdAt),
    avatar: review.userAvatar ?? null,
    image: review.photoUrls[0] ?? null,
    rating: review.rating.toFixed(1),
    title: review.placeTitle,
    body: review.notes,
    likes: String(Math.max(0, counts?.likeCount ?? 0)),
    comments: String(Math.max(0, counts?.commentCount ?? 0)),
    premium: false,
  };
}

export function toReviewPin(review: ReviewRecord): ReviewMapPin | null {
  const { coordinates } = resolveReviewCoordinates(review);
  if (!coordinates) {
    return null;
  }

  return {
    id: `review-pin-${review.id}`,
    reviewId: review.id,
    placeId: review.placeId,
    title: review.placeTitle,
    rating: review.rating,
    coordinates,
    notes: review.notes,
    userName: review.userName,
    userHandle: review.userHandle,
    visibility: review.visibility,
  };
}
