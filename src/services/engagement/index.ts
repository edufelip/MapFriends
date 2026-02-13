import { createEngagementRepository } from './engagementRepository';
import {
  CreateReviewCommentInput,
  ListReviewCommentsResult,
  ReviewCommentRecord,
  ReviewLikeState,
} from './types';

const repository = createEngagementRepository();

export type {
  CreateReviewCommentInput,
  ListReviewCommentsResult,
  ReviewCommentRecord,
  ReviewLikeState,
};

export async function getLikeState(input: {
  reviewId: string;
  userId: string;
}): Promise<ReviewLikeState> {
  return repository.getLikeState(input);
}

export async function setReviewLiked(input: {
  reviewId: string;
  userId: string;
  liked: boolean;
}): Promise<void> {
  return repository.setLiked(input);
}

export async function listReviewComments(input: {
  reviewId: string;
  limit?: number;
}): Promise<ListReviewCommentsResult> {
  return repository.listComments({
    reviewId: input.reviewId,
    limit: input.limit ?? 50,
  });
}

export async function createReviewComment(
  input: CreateReviewCommentInput
): Promise<ReviewCommentRecord> {
  return repository.createComment(input);
}

export async function deleteReviewComment(input: {
  reviewId: string;
  commentId: string;
  userId: string;
}): Promise<void> {
  return repository.deleteComment(input);
}
