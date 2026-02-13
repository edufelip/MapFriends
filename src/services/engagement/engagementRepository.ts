import { getFirestoreDb, isFirebaseConfigured } from '../firebase';
import { runFirestoreOperation } from '../firebaseDbLogger';
import {
  CreateReviewCommentInput,
  ListReviewCommentsResult,
  ReviewCommentRecord,
  ReviewLikeState,
} from './types';

type EngagementRepository = {
  getLikeState: (input: { reviewId: string; userId: string }) => Promise<ReviewLikeState>;
  setLiked: (input: { reviewId: string; userId: string; liked: boolean }) => Promise<void>;
  listComments: (input: { reviewId: string; limit: number }) => Promise<ListReviewCommentsResult>;
  createComment: (input: CreateReviewCommentInput) => Promise<ReviewCommentRecord>;
  deleteComment: (input: { reviewId: string; commentId: string; userId: string }) => Promise<void>;
};

const localLikesByReviewId: Record<string, Set<string>> = {};
const localCommentsByReviewId: Record<string, Record<string, ReviewCommentRecord>> = {};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

const toReviewComment = (commentId: string, raw: unknown): ReviewCommentRecord | null => {
  if (!isRecord(raw)) {
    return null;
  }

  if (
    typeof raw.reviewId !== 'string' ||
    typeof raw.userId !== 'string' ||
    typeof raw.userName !== 'string' ||
    typeof raw.userHandle !== 'string' ||
    typeof raw.text !== 'string' ||
    typeof raw.createdAt !== 'string' ||
    typeof raw.updatedAt !== 'string'
  ) {
    return null;
  }

  return {
    id: commentId,
    reviewId: raw.reviewId,
    userId: raw.userId,
    userName: raw.userName,
    userHandle: raw.userHandle,
    userAvatar: toNullableString(raw.userAvatar),
    text: raw.text,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

const byNewestComment = (a: ReviewCommentRecord, b: ReviewCommentRecord) =>
  b.createdAt.localeCompare(a.createdAt);

function createLocalEngagementRepository(): EngagementRepository {
  return {
    getLikeState: async ({ reviewId, userId }) => {
      const users = localLikesByReviewId[reviewId] || new Set<string>();
      return {
        reviewId,
        userId,
        liked: users.has(userId),
        likeCount: users.size,
      };
    },
    setLiked: async ({ reviewId, userId, liked }) => {
      const users = localLikesByReviewId[reviewId] || new Set<string>();
      if (liked) {
        users.add(userId);
      } else {
        users.delete(userId);
      }
      localLikesByReviewId[reviewId] = users;
    },
    listComments: async ({ reviewId, limit }) => {
      const boundedLimit = Math.max(1, limit);
      const items = Object.values(localCommentsByReviewId[reviewId] || {})
        .sort(byNewestComment)
        .slice(0, boundedLimit);
      return {
        items,
        hasMore: false,
      };
    },
    createComment: async (input) => {
      const commentId = `${input.userId}-${Date.now()}`;
      const now = new Date().toISOString();
      const comment: ReviewCommentRecord = {
        id: commentId,
        reviewId: input.reviewId,
        userId: input.userId,
        userName: input.userName,
        userHandle: input.userHandle,
        userAvatar: input.userAvatar,
        text: input.text,
        createdAt: now,
        updatedAt: now,
      };

      const current = localCommentsByReviewId[input.reviewId] || {};
      localCommentsByReviewId[input.reviewId] = {
        ...current,
        [commentId]: comment,
      };

      return comment;
    },
    deleteComment: async ({ reviewId, commentId, userId }) => {
      const current = localCommentsByReviewId[reviewId];
      if (!current || !current[commentId]) {
        return;
      }

      if (current[commentId].userId !== userId) {
        throw new Error('engagement-comment-delete-forbidden');
      }

      const next = { ...current };
      delete next[commentId];
      localCommentsByReviewId[reviewId] = next;
    },
  };
}

function createFirestoreEngagementRepository(): EngagementRepository {
  return {
    getLikeState: async ({ reviewId, userId }) => {
      const { collection, doc, getCountFromServer, getDoc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const likeRef = doc(db, 'reviewLikes', reviewId, 'users', userId);
      const likesRef = collection(db, 'reviewLikes', reviewId, 'users');

      const [likedSnapshot, countSnapshot] = await Promise.all([
        runFirestoreOperation(
          'engagement.getLikeState.liked',
          { reviewId, userId, path: likeRef.path },
          () => getDoc(likeRef)
        ),
        runFirestoreOperation(
          'engagement.getLikeState.count',
          { reviewId, path: likesRef.path },
          () => getCountFromServer(likesRef)
        ),
      ]);

      return {
        reviewId,
        userId,
        liked: likedSnapshot.exists(),
        likeCount: countSnapshot.data().count,
      };
    },
    setLiked: async ({ reviewId, userId, liked }) => {
      const { deleteDoc, doc, setDoc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const likeRef = doc(db, 'reviewLikes', reviewId, 'users', userId);

      if (liked) {
        await runFirestoreOperation(
          'engagement.setLiked.like',
          { reviewId, userId, path: likeRef.path },
          () =>
            setDoc(likeRef, {
              reviewId,
              userId,
              createdAt: new Date().toISOString(),
            })
        );
        return;
      }

      await runFirestoreOperation(
        'engagement.setLiked.unlike',
        { reviewId, userId, path: likeRef.path },
        () => deleteDoc(likeRef)
      );
    },
    listComments: async ({ reviewId, limit }) => {
      const { collection, getDocs, limit: limitFn, orderBy, query } = await import('firebase/firestore');
      const boundedLimit = Math.max(1, limit);
      const db = getFirestoreDb();
      const commentsQuery = query(
        collection(db, 'reviewComments', reviewId, 'items'),
        orderBy('createdAt', 'desc'),
        limitFn(boundedLimit)
      );

      const snapshot = await runFirestoreOperation(
        'engagement.listComments',
        { reviewId, limit: boundedLimit },
        () => getDocs(commentsQuery)
      );

      const items: ReviewCommentRecord[] = [];
      snapshot.forEach((item) => {
        const parsed = toReviewComment(item.id, item.data());
        if (parsed) {
          items.push(parsed);
        }
      });

      return {
        items,
        hasMore: items.length >= boundedLimit,
      };
    },
    createComment: async (input) => {
      const { addDoc, collection } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const commentsRef = collection(db, 'reviewComments', input.reviewId, 'items');

      const now = new Date().toISOString();
      const payload = {
        reviewId: input.reviewId,
        userId: input.userId,
        userName: input.userName,
        userHandle: input.userHandle,
        userAvatar: input.userAvatar,
        text: input.text,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await runFirestoreOperation(
        'engagement.createComment',
        { reviewId: input.reviewId, userId: input.userId, path: commentsRef.path },
        () => addDoc(commentsRef, payload)
      );

      return {
        id: docRef.id,
        ...payload,
      };
    },
    deleteComment: async ({ reviewId, commentId, userId }) => {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const commentRef = doc(db, 'reviewComments', reviewId, 'items', commentId);

      await runFirestoreOperation(
        'engagement.deleteComment',
        { reviewId, commentId, userId, path: commentRef.path },
        () => deleteDoc(commentRef)
      );
    },
  };
}

export function createEngagementRepository(): EngagementRepository {
  if (!isFirebaseConfigured) {
    return createLocalEngagementRepository();
  }

  return createFirestoreEngagementRepository();
}
