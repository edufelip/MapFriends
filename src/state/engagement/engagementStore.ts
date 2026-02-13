import { create } from 'zustand';
import {
  createReviewComment,
  deleteReviewComment,
  getLikeState,
  listReviewComments,
  setReviewLiked,
  ReviewCommentRecord,
} from '../../services/engagement';

type CommentState = {
  items: ReviewCommentRecord[];
  isHydrating: boolean;
  isPosting: boolean;
  hydrated: boolean;
  hasMore: boolean;
  error: string | null;
  deletingById: Record<string, boolean>;
};

type EngagementState = {
  likedByReviewId: Record<string, boolean>;
  likeCountByReviewId: Record<string, number>;
  likeHydratingByReviewId: Record<string, boolean>;
  commentsByReviewId: Record<string, CommentState>;
  hydrateLikeState: (input: { reviewId: string; userId: string; force?: boolean }) => Promise<void>;
  toggleLike: (input: { reviewId: string; userId: string }) => Promise<boolean>;
  hydrateComments: (input: { reviewId: string; limit?: number; force?: boolean }) => Promise<void>;
  postComment: (input: {
    reviewId: string;
    userId: string;
    userName: string;
    userHandle: string;
    userAvatar: string | null;
    text: string;
  }) => Promise<void>;
  deleteCommentAndStore: (input: { reviewId: string; commentId: string; userId: string }) => Promise<void>;
  clearEngagement: () => void;
};

const DEFAULT_COMMENT_STATE: CommentState = {
  items: [],
  isHydrating: false,
  isPosting: false,
  hydrated: false,
  hasMore: false,
  error: null,
  deletingById: {},
};

const MAX_COMMENT_LENGTH = 200;

const toNextCommentsState = (
  state: EngagementState,
  reviewId: string,
  partial: Partial<CommentState>
): Record<string, CommentState> => ({
  ...state.commentsByReviewId,
  [reviewId]: {
    ...(state.commentsByReviewId[reviewId] || DEFAULT_COMMENT_STATE),
    ...partial,
  },
});

const byNewestComment = (a: ReviewCommentRecord, b: ReviewCommentRecord) =>
  b.createdAt.localeCompare(a.createdAt);

export const useEngagementStore = create<EngagementState>((set, get) => ({
  likedByReviewId: {},
  likeCountByReviewId: {},
  likeHydratingByReviewId: {},
  commentsByReviewId: {},
  hydrateLikeState: async ({ reviewId, userId, force = false }) => {
    if (!reviewId || !userId) {
      return;
    }

    const currentHydrating = get().likeHydratingByReviewId[reviewId];
    const alreadyLoaded = Object.prototype.hasOwnProperty.call(get().likedByReviewId, reviewId);

    if (currentHydrating || (!force && alreadyLoaded)) {
      return;
    }

    set((state) => ({
      likeHydratingByReviewId: {
        ...state.likeHydratingByReviewId,
        [reviewId]: true,
      },
    }));

    try {
      const likeState = await getLikeState({ reviewId, userId });
      set((state) => ({
        likedByReviewId: {
          ...state.likedByReviewId,
          [reviewId]: likeState.liked,
        },
        likeCountByReviewId: {
          ...state.likeCountByReviewId,
          [reviewId]: Math.max(0, likeState.likeCount),
        },
        likeHydratingByReviewId: {
          ...state.likeHydratingByReviewId,
          [reviewId]: false,
        },
      }));
    } catch (error) {
      set((state) => ({
        likeHydratingByReviewId: {
          ...state.likeHydratingByReviewId,
          [reviewId]: false,
        },
      }));
      throw error;
    }
  },
  toggleLike: async ({ reviewId, userId }) => {
    if (!reviewId || !userId) {
      return false;
    }

    const prevLiked = Boolean(get().likedByReviewId[reviewId]);
    const prevCount = get().likeCountByReviewId[reviewId] || 0;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    set((state) => ({
      likedByReviewId: {
        ...state.likedByReviewId,
        [reviewId]: nextLiked,
      },
      likeCountByReviewId: {
        ...state.likeCountByReviewId,
        [reviewId]: nextCount,
      },
    }));

    try {
      await setReviewLiked({ reviewId, userId, liked: nextLiked });
      return nextLiked;
    } catch (error) {
      set((state) => ({
        likedByReviewId: {
          ...state.likedByReviewId,
          [reviewId]: prevLiked,
        },
        likeCountByReviewId: {
          ...state.likeCountByReviewId,
          [reviewId]: prevCount,
        },
      }));
      throw error;
    }
  },
  hydrateComments: async ({ reviewId, limit = 50, force = false }) => {
    if (!reviewId) {
      return;
    }

    const current = get().commentsByReviewId[reviewId] || DEFAULT_COMMENT_STATE;
    if (current.isHydrating || (!force && current.hydrated)) {
      return;
    }

    set((state) => ({
      commentsByReviewId: toNextCommentsState(state, reviewId, {
        isHydrating: true,
        error: null,
      }),
    }));

    try {
      const result = await listReviewComments({ reviewId, limit });
      set((state) => ({
        commentsByReviewId: toNextCommentsState(state, reviewId, {
          items: result.items.sort(byNewestComment),
          isHydrating: false,
          hydrated: true,
          hasMore: result.hasMore,
          error: null,
        }),
      }));
    } catch (error) {
      set((state) => ({
        commentsByReviewId: toNextCommentsState(state, reviewId, {
          isHydrating: false,
          error: error instanceof Error ? error.message : 'engagement-comments-hydrate-failed',
        }),
      }));
      throw error;
    }
  },
  postComment: async ({ reviewId, userId, userName, userHandle, userAvatar, text }) => {
    if (!reviewId || !userId) {
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('engagement-comment-empty');
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      throw new Error('engagement-comment-too-long');
    }

    set((state) => ({
      commentsByReviewId: toNextCommentsState(state, reviewId, {
        isPosting: true,
        error: null,
      }),
    }));

    try {
      const created = await createReviewComment({
        reviewId,
        userId,
        userName,
        userHandle,
        userAvatar,
        text: trimmed,
      });

      set((state) => {
        const current = state.commentsByReviewId[reviewId] || DEFAULT_COMMENT_STATE;
        return {
          commentsByReviewId: toNextCommentsState(state, reviewId, {
            items: [created, ...current.items].sort(byNewestComment),
            isPosting: false,
            hydrated: true,
            error: null,
          }),
        };
      });
    } catch (error) {
      set((state) => ({
        commentsByReviewId: toNextCommentsState(state, reviewId, {
          isPosting: false,
          error: error instanceof Error ? error.message : 'engagement-comment-post-failed',
        }),
      }));
      throw error;
    }
  },
  deleteCommentAndStore: async ({ reviewId, commentId, userId }) => {
    if (!reviewId || !commentId || !userId) {
      return;
    }

    const existingState = get().commentsByReviewId[reviewId] || DEFAULT_COMMENT_STATE;
    const existingComment = existingState.items.find((item) => item.id === commentId);
    if (!existingComment || existingComment.userId !== userId) {
      throw new Error('engagement-comment-delete-forbidden');
    }

    set((state) => {
      const current = state.commentsByReviewId[reviewId] || DEFAULT_COMMENT_STATE;
      return {
        commentsByReviewId: toNextCommentsState(state, reviewId, {
          deletingById: {
            ...current.deletingById,
            [commentId]: true,
          },
          error: null,
        }),
      };
    });

    try {
      await deleteReviewComment({ reviewId, commentId, userId });
      set((state) => {
        const current = state.commentsByReviewId[reviewId] || DEFAULT_COMMENT_STATE;
        const nextDeleting = { ...current.deletingById };
        delete nextDeleting[commentId];
        return {
          commentsByReviewId: toNextCommentsState(state, reviewId, {
            items: current.items.filter((item) => item.id !== commentId),
            deletingById: nextDeleting,
            error: null,
          }),
        };
      });
    } catch (error) {
      set((state) => {
        const current = state.commentsByReviewId[reviewId] || DEFAULT_COMMENT_STATE;
        const nextDeleting = { ...current.deletingById };
        delete nextDeleting[commentId];
        return {
          commentsByReviewId: toNextCommentsState(state, reviewId, {
            deletingById: nextDeleting,
            error: error instanceof Error ? error.message : 'engagement-comment-delete-failed',
          }),
        };
      });
      throw error;
    }
  },
  clearEngagement: () => {
    set({
      likedByReviewId: {},
      likeCountByReviewId: {},
      likeHydratingByReviewId: {},
      commentsByReviewId: {},
    });
  },
}));
