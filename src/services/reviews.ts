import { createReviewMutations } from './reviews/reviewMutations';
import { compressReviewPhoto, deleteReviewPhoto, uploadReviewPhoto } from './reviews/reviewPhotoPipeline';
import { createReviewRepository } from './reviews/reviewRepository';
import {
  CreateReviewInput,
  ReviewPhotoDraft,
  ReviewRecord,
  ReviewVisibility,
  UpdateReviewInput,
} from './reviews/types';

const repository = createReviewRepository();

const mutations = createReviewMutations({
  nowIso: () => new Date().toISOString(),
  createReviewId: repository.createReviewId,
  loadReview: repository.loadReview,
  writeReviewPair: repository.writeReviewPair,
  deleteReviewPair: repository.deleteReviewPair,
  compressPhoto: compressReviewPhoto,
  uploadPhoto: uploadReviewPhoto,
  deletePhoto: deleteReviewPhoto,
});

export type { ReviewVisibility, ReviewPhotoDraft, ReviewRecord };

export async function createReview(input: CreateReviewInput): Promise<ReviewRecord> {
  return mutations.createReview(input);
}

export async function updateReview(input: UpdateReviewInput): Promise<ReviewRecord> {
  return mutations.updateReview(input);
}

export async function deleteReview({
  reviewId,
  authorId,
}: {
  reviewId: string;
  authorId: string;
}): Promise<void> {
  await mutations.deleteReview({
    reviewId,
    authorId,
  });
}

export async function getReviewById(reviewId: string): Promise<ReviewRecord | null> {
  return repository.loadReview(reviewId);
}

export async function getReviewsForPlace(placeId: string): Promise<ReviewRecord[]> {
  return repository.listReviewsForPlace(placeId);
}

export async function getRecentReviews(limit = 100): Promise<ReviewRecord[]> {
  return repository.listRecentReviews(limit);
}
