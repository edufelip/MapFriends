import { FeedPost } from '../../services/feed';
import { getPlaceById } from '../../services/map';
import { ReviewRecord } from '../../services/reviews';

export type ReviewMapPin = {
  id: string;
  reviewId: string;
  placeId: string;
  title: string;
  rating: number;
  coordinates: [number, number];
};

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCyce5iNs54aPcVWL6IwovROAZizITVhbasawFGEGmLnyFfxYUNUjG9BPxSE_SYKxKC-o5Dj8hKrGJgNNvgqSmlXOIpedAZi3cz07KLSDYw3y4KSHm3HRlh1z9rAhmqVFJUB1LWLPUNwS5JfQp7q39BTBjhmExzvKQeL8s1avF-Zf0dIJfDqr7hbfPByggfYoROYoHEL_Ug5djjL8mrLOAX4opcLe-sLFmF5FvlbX1LowS9b1xb-8nHE83XziVmp7B6WQrl4ASWyOQ';

const DEFAULT_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBiHZql1FJihO-yZVmDa2uGJFQhUCujZqt9pBJ2NQYILrjw48I9_04a9gp7EqNskjGgygZv2guEMk2FokbnscNZDtprrGMNTwdopIbz1Y-Q4hUi8dMbfaAjAXJDATh_mKzlUBqf6qOkXrunRCHk3AMf0DLTG0JXq8RFq8v2S-vXvYUKmR4Azzg3NruWS7IekfKVLaLhvOKAwk-SEfWARuNIsXFt6ljSYpzm3kBQQD76HZgZBXgbaQZPq6gl4MB4BSQNYm037PBOVgI';

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

function resolveCoordinates(review: ReviewRecord): [number, number] | null {
  if (isCoordinate(review.placeCoordinates)) {
    return review.placeCoordinates;
  }

  const place = getPlaceById(review.placeId);
  if (isCoordinate(place?.coordinates)) {
    return place.coordinates;
  }

  return null;
}

export function toFeedPost(review: ReviewRecord): FeedPost {
  return {
    id: `review-${review.id}`,
    author: review.userName,
    time: toRelativeTime(review.createdAt),
    avatar: review.userAvatar || DEFAULT_AVATAR,
    image: review.photoUrls[0] || DEFAULT_IMAGE,
    rating: review.rating.toFixed(1),
    title: review.placeTitle,
    body: review.notes,
    likes: '0',
    comments: '0',
    premium: false,
  };
}

export function toReviewPin(review: ReviewRecord): ReviewMapPin | null {
  const coordinates = resolveCoordinates(review);
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
  };
}
