import { getFirestoreDb, isFirebaseConfigured } from '../firebase';
import { runFirestoreOperation } from '../firebaseDbLogger';
import { FavoriteRecord, FavoriteReviewSnapshot, SaveFavoriteInput } from './types';

type FavoritesRepository = {
  saveFavorite: (input: SaveFavoriteInput) => Promise<FavoriteRecord>;
  removeFavorite: (input: { userId: string; reviewId: string }) => Promise<void>;
  listFavorites: (input: { userId: string; limit: number }) => Promise<FavoriteRecord[]>;
};

const localFavoritesByUser: Record<string, Record<string, FavoriteRecord>> = {};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

const toSnapshot = (value: unknown): FavoriteReviewSnapshot | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.placeId !== 'string' ||
    typeof value.placeTitle !== 'string' ||
    typeof value.reviewTitle !== 'string' ||
    typeof value.reviewNotes !== 'string' ||
    typeof value.reviewRating !== 'number' ||
    typeof value.reviewAuthorId !== 'string' ||
    typeof value.reviewAuthorName !== 'string' ||
    typeof value.reviewAuthorHandle !== 'string'
  ) {
    return null;
  }

  return {
    placeId: value.placeId,
    placeTitle: value.placeTitle,
    reviewTitle: value.reviewTitle,
    reviewNotes: value.reviewNotes,
    reviewRating: value.reviewRating,
    reviewPhotoUrl: toStringOrNull(value.reviewPhotoUrl),
    reviewAuthorId: value.reviewAuthorId,
    reviewAuthorName: value.reviewAuthorName,
    reviewAuthorHandle: value.reviewAuthorHandle,
    reviewAuthorAvatar: toStringOrNull(value.reviewAuthorAvatar),
  };
};

const toFavoriteRecord = (reviewId: string, raw: unknown): FavoriteRecord | null => {
  if (!isRecord(raw)) {
    return null;
  }

  if (
    typeof raw.userId !== 'string' ||
    typeof raw.reviewId !== 'string' ||
    typeof raw.createdAt !== 'string'
  ) {
    return null;
  }

  const snapshot = toSnapshot(raw.snapshot);
  if (!snapshot) {
    return null;
  }

  return {
    reviewId,
    userId: raw.userId,
    createdAt: raw.createdAt,
    snapshot,
  };
};

const byNewestFavorite = (a: FavoriteRecord, b: FavoriteRecord) =>
  b.createdAt.localeCompare(a.createdAt);

function createLocalFavoritesRepository(): FavoritesRepository {
  return {
    saveFavorite: async (input) => {
      const userFavorites = localFavoritesByUser[input.userId] || {};
      const nextRecord: FavoriteRecord = {
        reviewId: input.reviewId,
        userId: input.userId,
        createdAt: input.createdAt,
        snapshot: input.snapshot,
      };
      localFavoritesByUser[input.userId] = {
        ...userFavorites,
        [input.reviewId]: nextRecord,
      };
      return nextRecord;
    },
    removeFavorite: async ({ userId, reviewId }) => {
      const userFavorites = localFavoritesByUser[userId];
      if (!userFavorites || !userFavorites[reviewId]) {
        return;
      }
      const nextFavorites = { ...userFavorites };
      delete nextFavorites[reviewId];
      localFavoritesByUser[userId] = nextFavorites;
    },
    listFavorites: async ({ userId, limit }) =>
      Object.values(localFavoritesByUser[userId] || {})
        .sort(byNewestFavorite)
        .slice(0, Math.max(1, limit)),
  };
}

function createFirestoreFavoritesRepository(): FavoritesRepository {
  return {
    saveFavorite: async (input) => {
      const { doc, setDoc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const favoriteRef = doc(db, 'userFavorites', input.userId, 'items', input.reviewId);

      const payload = {
        userId: input.userId,
        reviewId: input.reviewId,
        createdAt: input.createdAt,
        snapshot: input.snapshot,
      };

      await runFirestoreOperation(
        'favorites.saveFavorite',
        {
          userId: input.userId,
          reviewId: input.reviewId,
          path: favoriteRef.path,
        },
        () => setDoc(favoriteRef, payload)
      );

      return {
        reviewId: input.reviewId,
        userId: input.userId,
        createdAt: input.createdAt,
        snapshot: input.snapshot,
      };
    },
    removeFavorite: async ({ userId, reviewId }) => {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const favoriteRef = doc(db, 'userFavorites', userId, 'items', reviewId);
      await runFirestoreOperation(
        'favorites.removeFavorite',
        {
          userId,
          reviewId,
          path: favoriteRef.path,
        },
        () => deleteDoc(favoriteRef)
      );
    },
    listFavorites: async ({ userId, limit }) => {
      const { collection, getDocs, limit: limitFn, orderBy, query } = await import('firebase/firestore');
      const boundedLimit = Math.max(1, limit);
      const db = getFirestoreDb();
      const favoritesQuery = query(
        collection(db, 'userFavorites', userId, 'items'),
        orderBy('createdAt', 'desc'),
        limitFn(boundedLimit)
      );
      const snapshot = await runFirestoreOperation(
        'favorites.listFavorites',
        {
          userId,
          limit: boundedLimit,
        },
        () => getDocs(favoritesQuery)
      );

      const records: FavoriteRecord[] = [];
      snapshot.forEach((item) => {
        const favorite = toFavoriteRecord(item.id, item.data());
        if (favorite) {
          records.push(favorite);
        }
      });
      return records;
    },
  };
}

export function createFavoritesRepository(): FavoritesRepository {
  if (!isFirebaseConfigured) {
    return createLocalFavoritesRepository();
  }

  return createFirestoreFavoritesRepository();
}
