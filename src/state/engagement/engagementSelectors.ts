import React from 'react';
import { useEngagementStore } from './engagementStore';

export function useReviewLikeState(reviewId: string | null | undefined) {
  return useEngagementStore(
    React.useCallback(
      (state) => {
        if (!reviewId) {
          return {
            liked: false,
            likeCount: 0,
            isHydrating: false,
          };
        }

        return {
          liked: Boolean(state.likedByReviewId[reviewId]),
          likeCount: state.likeCountByReviewId[reviewId] || 0,
          isHydrating: Boolean(state.likeHydratingByReviewId[reviewId]),
        };
      },
      [reviewId]
    )
  );
}

export function useHydrateReviewLikeState(
  reviewId: string | null | undefined,
  userId: string | null | undefined
) {
  const hydrateLikeState = useEngagementStore((state) => state.hydrateLikeState);

  React.useEffect(() => {
    if (!reviewId || !userId) {
      return;
    }

    void hydrateLikeState({ reviewId, userId });
  }, [hydrateLikeState, reviewId, userId]);
}

export function useToggleReviewLike() {
  const toggleLike = useEngagementStore((state) => state.toggleLike);
  return React.useCallback(
    async (input: { reviewId: string; userId: string }) => toggleLike(input),
    [toggleLike]
  );
}

export function useReviewComments(reviewId: string | null | undefined) {
  return useEngagementStore(
    React.useCallback(
      (state) => {
        if (!reviewId) {
          return {
            items: [],
            isHydrating: false,
            isPosting: false,
            hydrated: false,
            hasMore: false,
            error: null,
            deletingById: {},
          };
        }

        return (
          state.commentsByReviewId[reviewId] || {
            items: [],
            isHydrating: false,
            isPosting: false,
            hydrated: false,
            hasMore: false,
            error: null,
            deletingById: {},
          }
        );
      },
      [reviewId]
    )
  );
}

export function useHydrateReviewComments(reviewId: string | null | undefined, limit = 50) {
  const hydrateComments = useEngagementStore((state) => state.hydrateComments);

  React.useEffect(() => {
    if (!reviewId) {
      return;
    }

    void hydrateComments({ reviewId, limit });
  }, [hydrateComments, limit, reviewId]);
}

export function usePostReviewComment() {
  const postComment = useEngagementStore((state) => state.postComment);
  return React.useCallback(
    async (input: {
      reviewId: string;
      userId: string;
      userName: string;
      userHandle: string;
      userAvatar: string | null;
      text: string;
    }) => postComment(input),
    [postComment]
  );
}

export function useDeleteReviewComment() {
  const deleteCommentAndStore = useEngagementStore((state) => state.deleteCommentAndStore);
  return React.useCallback(
    async (input: { reviewId: string; commentId: string; userId: string }) =>
      deleteCommentAndStore(input),
    [deleteCommentAndStore]
  );
}
