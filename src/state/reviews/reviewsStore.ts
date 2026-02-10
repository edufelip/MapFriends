import { create } from 'zustand';
import {
  CreateReviewInput,
  createReview,
  deleteReview,
  getRecentReviews,
  ReviewRecord,
  UpdateReviewInput,
  updateReview,
} from '../../services/reviews';

type ReviewsById = Record<string, ReviewRecord>;

const byNewestCreatedAt = (a: ReviewRecord, b: ReviewRecord) =>
  b.createdAt.localeCompare(a.createdAt);

const toSortedIds = (reviewsById: ReviewsById) =>
  Object.values(reviewsById).sort(byNewestCreatedAt).map((review) => review.id);

type ReviewState = {
  reviewsById: ReviewsById;
  reviewIds: string[];
  hydrated: boolean;
  isHydrating: boolean;
  hydrateError: string | null;
  hydrateReviews: (limit?: number) => Promise<void>;
  upsertReview: (review: ReviewRecord) => void;
  upsertReviews: (reviews: ReviewRecord[]) => void;
  removeReview: (reviewId: string) => void;
  createReviewAndStore: (input: CreateReviewInput) => Promise<ReviewRecord>;
  updateReviewAndStore: (input: UpdateReviewInput) => Promise<ReviewRecord>;
  deleteReviewAndStore: (input: { reviewId: string; authorId: string }) => Promise<void>;
  clearReviews: () => void;
};

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviewsById: {},
  reviewIds: [],
  hydrated: false,
  isHydrating: false,
  hydrateError: null,
  hydrateReviews: async (limit = 120) => {
    if (get().isHydrating || get().hydrated) {
      return;
    }

    set({ isHydrating: true, hydrateError: null });

    try {
      const reviews = await getRecentReviews(limit);

      set((state) => {
        const nextById = { ...state.reviewsById };
        reviews.forEach((review) => {
          const existing = nextById[review.id];
          if (!existing || existing.updatedAt.localeCompare(review.updatedAt) <= 0) {
            nextById[review.id] = review;
          }
        });

        return {
          reviewsById: nextById,
          reviewIds: toSortedIds(nextById),
          hydrated: true,
          isHydrating: false,
          hydrateError: null,
        };
      });
    } catch (error) {
      set({
        isHydrating: false,
        hydrateError: error instanceof Error ? error.message : 'reviews-hydrate-failed',
      });
    }
  },
  upsertReview: (review) =>
    set((state) => {
      const nextById = {
        ...state.reviewsById,
        [review.id]: review,
      };
      return {
        reviewsById: nextById,
        reviewIds: toSortedIds(nextById),
      };
    }),
  upsertReviews: (reviews) =>
    set((state) => {
      const nextById = { ...state.reviewsById };
      reviews.forEach((review) => {
        const existing = nextById[review.id];
        if (!existing || existing.updatedAt.localeCompare(review.updatedAt) <= 0) {
          nextById[review.id] = review;
        }
      });

      return {
        reviewsById: nextById,
        reviewIds: toSortedIds(nextById),
      };
    }),
  removeReview: (reviewId) =>
    set((state) => {
      if (!state.reviewsById[reviewId]) {
        return state;
      }

      const nextById = { ...state.reviewsById };
      delete nextById[reviewId];

      return {
        reviewsById: nextById,
        reviewIds: state.reviewIds.filter((id) => id !== reviewId),
      };
    }),
  createReviewAndStore: async (input) => {
    const created = await createReview(input);
    get().upsertReview(created);
    return created;
  },
  updateReviewAndStore: async (input) => {
    const updated = await updateReview(input);
    get().upsertReview(updated);
    return updated;
  },
  deleteReviewAndStore: async ({ reviewId, authorId }) => {
    await deleteReview({ reviewId, authorId });
    get().removeReview(reviewId);
  },
  clearReviews: () =>
    set({
      reviewsById: {},
      reviewIds: [],
      hydrated: false,
      isHydrating: false,
      hydrateError: null,
    }),
}));
