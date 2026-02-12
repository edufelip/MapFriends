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
import { logReviewPinDebug, logReviewPinError } from './reviewPinLogger';

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
  refreshReviews: (limit?: number) => Promise<void>;
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
    logReviewPinDebug('step8-hydrate-requested', {
      limit,
      hydrated: get().hydrated,
      isHydrating: get().isHydrating,
      existingReviewCount: get().reviewIds.length,
    });

    if (get().isHydrating || get().hydrated) {
      logReviewPinDebug('step8-hydrate-skipped', {
        limit,
        hydrated: get().hydrated,
        isHydrating: get().isHydrating,
      });
      return;
    }

    set({ isHydrating: true, hydrateError: null });
    logReviewPinDebug('step8-hydrate-started', {
      limit,
    });

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
      logReviewPinDebug('step8-hydrate-success', {
        limit,
        fetchedReviews: reviews.length,
        totalReviewsAfterHydrate: get().reviewIds.length,
      });
    } catch (error) {
      set({
        isHydrating: false,
        hydrateError: error instanceof Error ? error.message : 'reviews-hydrate-failed',
      });
      logReviewPinError('step8-hydrate-error', error, {
        limit,
      });
    }
  },
  refreshReviews: async (limit = 120) => {
    logReviewPinDebug('step8-refresh-requested', {
      limit,
      isHydrating: get().isHydrating,
      existingReviewCount: get().reviewIds.length,
    });

    if (get().isHydrating) {
      logReviewPinDebug('step8-refresh-skipped', {
        limit,
        reason: 'already-hydrating',
      });
      return;
    }

    set({ isHydrating: true, hydrateError: null });
    logReviewPinDebug('step8-refresh-started', {
      limit,
    });

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
      logReviewPinDebug('step8-refresh-success', {
        limit,
        fetchedReviews: reviews.length,
        totalReviewsAfterRefresh: get().reviewIds.length,
      });
    } catch (error) {
      set({
        isHydrating: false,
        hydrateError: error instanceof Error ? error.message : 'reviews-refresh-failed',
      });
      logReviewPinError('step8-refresh-error', error, {
        limit,
      });
    }
  },
  upsertReview: (review) => {
    set((state) => {
      const nextById = {
        ...state.reviewsById,
        [review.id]: review,
      };
      return {
        reviewsById: nextById,
        reviewIds: toSortedIds(nextById),
      };
    });
    logReviewPinDebug('step8-upsert-review', {
      reviewId: review.id,
      hasCoordinates: Array.isArray(review.placeCoordinates),
      totalReviews: get().reviewIds.length,
    });
  },
  upsertReviews: (reviews) => {
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
    });
    logReviewPinDebug('step8-upsert-reviews-batch', {
      batchedReviews: reviews.length,
      totalReviews: get().reviewIds.length,
    });
  },
  removeReview: (reviewId) => {
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
    });
    logReviewPinDebug('step8-remove-review', {
      reviewId,
      totalReviews: get().reviewIds.length,
    });
  },
  createReviewAndStore: async (input) => {
    logReviewPinDebug('step8-create-review-start', {
      placeId: input.place.id,
      hasCoordinates: Array.isArray(input.place.coordinates),
    });
    try {
      const created = await createReview(input);
      get().upsertReview(created);
      logReviewPinDebug('step8-create-review-success', {
        reviewId: created.id,
        placeId: created.placeId,
        hasCoordinates: Array.isArray(created.placeCoordinates),
        totalReviews: get().reviewIds.length,
      });
      return created;
    } catch (error) {
      logReviewPinError('step8-create-review-error', error, {
        placeId: input.place.id,
      });
      throw error;
    }
  },
  updateReviewAndStore: async (input) => {
    logReviewPinDebug('step8-update-review-start', {
      reviewId: input.reviewId,
      placeId: input.place.id,
      hasCoordinates: Array.isArray(input.place.coordinates),
    });
    try {
      const updated = await updateReview(input);
      get().upsertReview(updated);
      logReviewPinDebug('step8-update-review-success', {
        reviewId: updated.id,
        placeId: updated.placeId,
        hasCoordinates: Array.isArray(updated.placeCoordinates),
        totalReviews: get().reviewIds.length,
      });
      return updated;
    } catch (error) {
      logReviewPinError('step8-update-review-error', error, {
        reviewId: input.reviewId,
      });
      throw error;
    }
  },
  deleteReviewAndStore: async ({ reviewId, authorId }) => {
    logReviewPinDebug('step8-delete-review-start', {
      reviewId,
      authorId,
    });
    try {
      await deleteReview({ reviewId, authorId });
      get().removeReview(reviewId);
      logReviewPinDebug('step8-delete-review-success', {
        reviewId,
        totalReviews: get().reviewIds.length,
      });
    } catch (error) {
      logReviewPinError('step8-delete-review-error', error, {
        reviewId,
      });
      throw error;
    }
  },
  clearReviews: () => {
    set({
      reviewsById: {},
      reviewIds: [],
      hydrated: false,
      isHydrating: false,
      hydrateError: null,
    });
    logReviewPinDebug('step8-clear-reviews', {
      totalReviews: 0,
    });
  },
}));
