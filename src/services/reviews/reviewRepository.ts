import * as Crypto from 'expo-crypto';
import { getFirestoreDb, isFirebaseConfigured } from '../firebase';
import { runFirestoreOperation } from '../firebaseDbLogger';
import { ReviewRecord } from './types';

type ReviewRepository = {
  createReviewId: () => string;
  loadReview: (reviewId: string) => Promise<ReviewRecord | null>;
  writeReviewPair: (review: ReviewRecord) => Promise<void>;
  deleteReviewPair: (review: ReviewRecord) => Promise<void>;
  listReviewsForPlace: (placeId: string) => Promise<ReviewRecord[]>;
  listRecentReviews: (limitCount: number) => Promise<ReviewRecord[]>;
};

const localReviews: ReviewRecord[] = [];
const REVIEW_LIST_LIMIT = 50;

const createReviewIdentifier = () => {
  try {
    return `review-${Crypto.randomUUID()}`;
  } catch {
    return `review-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toPhoto = (value: unknown) => {
  if (!isRecord(value) || typeof value.path !== 'string' || typeof value.url !== 'string') {
    return null;
  }
  return {
    path: value.path,
    url: value.url,
  };
};

const toCoordinates = (value: unknown): [number, number] | null => {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const longitude = Number(value[0]);
  const latitude = Number(value[1]);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return [longitude, latitude];
};

const toReviewRecord = (id: string, raw: unknown): ReviewRecord | null => {
  if (!isRecord(raw)) {
    return null;
  }

  const photos = Array.isArray(raw.photos) ? raw.photos.map(toPhoto).filter((photo) => photo !== null) : [];
  const visibility = raw.visibility === 'subscribers' ? 'subscribers' : 'followers';

  if (
    typeof raw.placeId !== 'string' ||
    typeof raw.placeTitle !== 'string' ||
    typeof raw.title !== 'string' ||
    typeof raw.notes !== 'string' ||
    typeof raw.rating !== 'number' ||
    typeof raw.userId !== 'string' ||
    typeof raw.userName !== 'string' ||
    typeof raw.userHandle !== 'string' ||
    typeof raw.createdAt !== 'string' ||
    typeof raw.updatedAt !== 'string'
  ) {
    return null;
  }

  return {
    id,
    placeId: raw.placeId,
    placeTitle: raw.placeTitle,
    placeCoordinates: toCoordinates(raw.placeCoordinates),
    title: raw.title,
    notes: raw.notes,
    rating: raw.rating,
    visibility,
    userId: raw.userId,
    userName: raw.userName,
    userHandle: raw.userHandle,
    userAvatar: typeof raw.userAvatar === 'string' ? raw.userAvatar : null,
    photos,
    photoUrls: photos.map((photo) => photo.url),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

const byRecent = (a: ReviewRecord, b: ReviewRecord) => b.createdAt.localeCompare(a.createdAt);

function createLocalReviewRepository(): ReviewRepository {
  return {
    createReviewId: () => createReviewIdentifier(),
    loadReview: async (reviewId) => localReviews.find((review) => review.id === reviewId) || null,
    writeReviewPair: async (review) => {
      const index = localReviews.findIndex((item) => item.id === review.id);
      if (index >= 0) {
        localReviews[index] = review;
      } else {
        localReviews.unshift(review);
      }
    },
    deleteReviewPair: async (review) => {
      const index = localReviews.findIndex((item) => item.id === review.id);
      if (index >= 0) {
        localReviews.splice(index, 1);
      }
    },
    listReviewsForPlace: async (placeId) =>
      localReviews
        .filter((review) => review.placeId === placeId)
        .sort(byRecent)
        .slice(0, REVIEW_LIST_LIMIT),
    listRecentReviews: async (limitCount) =>
      localReviews
        .slice()
        .sort(byRecent)
        .slice(0, Math.max(1, limitCount)),
  };
}

function createFirestoreReviewRepository(): ReviewRepository {
  return {
    createReviewId: () => createReviewIdentifier(),
    loadReview: async (reviewId) => {
      const { doc, getDoc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const reviewRef = doc(db, 'reviews', reviewId);
      const snapshot = await runFirestoreOperation(
        'reviews.loadReview',
        {
          reviewId,
          path: reviewRef.path,
        },
        () => getDoc(reviewRef)
      );
      if (!snapshot.exists()) {
        return null;
      }
      return toReviewRecord(snapshot.id, snapshot.data());
    },
    writeReviewPair: async (review) => {
      const { doc, writeBatch } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const reviewRef = doc(db, 'reviews', review.id);
      const projectionRef = doc(db, 'userReviews', review.userId, 'items', review.id);
      const payload = {
        id: review.id,
        placeId: review.placeId,
        placeTitle: review.placeTitle,
        placeCoordinates: review.placeCoordinates,
        title: review.title,
        notes: review.notes,
        rating: review.rating,
        visibility: review.visibility,
        userId: review.userId,
        userName: review.userName,
        userHandle: review.userHandle,
        userAvatar: review.userAvatar,
        photos: review.photos,
        photoUrls: review.photoUrls,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      };

      const batch = writeBatch(db);
      batch.set(reviewRef, payload);
      batch.set(projectionRef, payload);
      await runFirestoreOperation(
        'reviews.writeReviewPair',
        {
          reviewId: review.id,
          userId: review.userId,
          reviewPath: reviewRef.path,
          projectionPath: projectionRef.path,
        },
        () => batch.commit()
      );
    },
    deleteReviewPair: async (review) => {
      const { doc, writeBatch } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const reviewRef = doc(db, 'reviews', review.id);
      const projectionRef = doc(db, 'userReviews', review.userId, 'items', review.id);
      const batch = writeBatch(db);
      batch.delete(reviewRef);
      batch.delete(projectionRef);
      await runFirestoreOperation(
        'reviews.deleteReviewPair',
        {
          reviewId: review.id,
          userId: review.userId,
          reviewPath: reviewRef.path,
          projectionPath: projectionRef.path,
        },
        () => batch.commit()
      );
    },
    listReviewsForPlace: async (placeId) => {
      const { collection, getDocs, limit, orderBy, query, where } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('placeId', '==', placeId),
        orderBy('createdAt', 'desc'),
        limit(REVIEW_LIST_LIMIT)
      );
      const snapshot = await runFirestoreOperation(
        'reviews.listReviewsForPlace',
        {
          placeId,
        },
        () => getDocs(reviewsQuery)
      );
      const reviews: ReviewRecord[] = [];
      snapshot.forEach((item) => {
        const review = toReviewRecord(item.id, item.data());
        if (review) {
          reviews.push(review);
        }
      });
      return reviews;
    },
    listRecentReviews: async (limitCount) => {
      const { collection, getDocs, limit, orderBy, query } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const boundedLimit = Math.max(1, limitCount);
      const reviewsQuery = query(
        collection(db, 'reviews'),
        orderBy('createdAt', 'desc'),
        limit(boundedLimit)
      );
      const snapshot = await runFirestoreOperation(
        'reviews.listRecentReviews',
        {
          limit: boundedLimit,
        },
        () => getDocs(reviewsQuery)
      );
      const reviews: ReviewRecord[] = [];
      snapshot.forEach((item) => {
        const review = toReviewRecord(item.id, item.data());
        if (review) {
          reviews.push(review);
        }
      });
      return reviews;
    },
  };
}

export function createReviewRepository(): ReviewRepository {
  if (!isFirebaseConfigured) {
    return createLocalReviewRepository();
  }

  return createFirestoreReviewRepository();
}
