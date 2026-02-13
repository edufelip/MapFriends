import { create } from 'zustand';
import {
  CreateReviewInput,
  createReview,
  deleteReview,
  getRecentReviews,
  getReviewById,
  ReviewMutationProgress,
  ReviewRecord,
  UpdateReviewInput,
  updateReview,
} from '../../services/reviews';
import { logReviewPinDebug, logReviewPinError } from './reviewPinLogger';

type ReviewsById = Record<string, ReviewRecord>;

type ReviewHydrateOptions = {
  staleMs?: number;
  force?: boolean;
};

type ReviewDetailFetchOptions = {
  staleMs?: number;
  force?: boolean;
};

const DEFAULT_HYDRATION_STALE_MS = 2 * 60 * 1000;
const DEFAULT_REVIEW_DETAIL_STALE_MS = 2 * 60 * 1000;
const detailReviewInFlightRequests = new Map<string, Promise<ReviewRecord | null>>();

const byNewestCreatedAt = (a: ReviewRecord, b: ReviewRecord) =>
  b.createdAt.localeCompare(a.createdAt);

const toSortedIds = (reviewsById: ReviewsById) =>
  Object.values(reviewsById).sort(byNewestCreatedAt).map((review) => review.id);

const isFreshTimestamp = (timestamp: number | null | undefined, staleMs: number) => {
  if (typeof timestamp !== 'number') {
    return false;
  }

  return Date.now() - timestamp < staleMs;
};

type ReviewState = {
  reviewsById: ReviewsById;
  reviewIds: string[];
  hydrated: boolean;
  isHydrating: boolean;
  hydrateError: string | null;
  lastHydratedAt: number | null;
  reviewFetchedAtById: Record<string, number>;
  hydrateReviews: (limit?: number, options?: ReviewHydrateOptions) => Promise<void>;
  refreshReviews: (limit?: number) => Promise<void>;
  fetchReviewByIdCached: (
    reviewId: string,
    options?: ReviewDetailFetchOptions
  ) => Promise<ReviewRecord | null>;
  upsertReview: (review: ReviewRecord) => void;
  upsertReviews: (reviews: ReviewRecord[]) => void;
  removeReview: (reviewId: string) => void;
  createReviewAndStore: (
    input: CreateReviewInput,
    options?: { onProgress?: (progress: ReviewMutationProgress) => void }
  ) => Promise<ReviewRecord>;
  updateReviewAndStore: (
    input: UpdateReviewInput,
    options?: { onProgress?: (progress: ReviewMutationProgress) => void }
  ) => Promise<ReviewRecord>;
  deleteReviewAndStore: (input: { reviewId: string; authorId: string }) => Promise<void>;
  clearReviews: () => void;
};

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviewsById: {},
  reviewIds: [],
  hydrated: false,
  isHydrating: false,
  hydrateError: null,
  lastHydratedAt: null,
  reviewFetchedAtById: {},
  hydrateReviews: async (limit = 120, options: ReviewHydrateOptions = {}) => {
    const staleMs = Math.max(0, options.staleMs ?? DEFAULT_HYDRATION_STALE_MS);
    const force = options.force === true;
    const stateAtStart = get();
    const fresh = isFreshTimestamp(stateAtStart.lastHydratedAt, staleMs);

    logReviewPinDebug('step8-hydrate-requested', {
      limit,
      staleMs,
      force,
      hydrated: stateAtStart.hydrated,
      isHydrating: stateAtStart.isHydrating,
      lastHydratedAt: stateAtStart.lastHydratedAt,
      isFresh: fresh,
      existingReviewCount: stateAtStart.reviewIds.length,
    });

    if (stateAtStart.isHydrating || (!force && fresh)) {
      logReviewPinDebug('step8-hydrate-skipped', {
        limit,
        staleMs,
        force,
        hydrated: stateAtStart.hydrated,
        isHydrating: stateAtStart.isHydrating,
        lastHydratedAt: stateAtStart.lastHydratedAt,
        isFresh: fresh,
      });
      return;
    }

    set({ isHydrating: true, hydrateError: null });
    logReviewPinDebug('step8-hydrate-started', {
      limit,
      staleMs,
      force,
    });

    try {
      const reviews = await getRecentReviews(limit);
      const fetchedAt = Date.now();

      set((state) => {
        const nextById = { ...state.reviewsById };
        const nextFetchedAtById = { ...state.reviewFetchedAtById };

        reviews.forEach((review) => {
          const existing = nextById[review.id];
          if (!existing || existing.updatedAt.localeCompare(review.updatedAt) <= 0) {
            nextById[review.id] = review;
          }
          nextFetchedAtById[review.id] = fetchedAt;
        });

        return {
          reviewsById: nextById,
          reviewIds: toSortedIds(nextById),
          hydrated: true,
          isHydrating: false,
          hydrateError: null,
          lastHydratedAt: fetchedAt,
          reviewFetchedAtById: nextFetchedAtById,
        };
      });
      logReviewPinDebug('step8-hydrate-success', {
        limit,
        staleMs,
        force,
        fetchedReviews: reviews.length,
        totalReviewsAfterHydrate: get().reviewIds.length,
        lastHydratedAt: get().lastHydratedAt,
      });
    } catch (error) {
      set({
        isHydrating: false,
        hydrateError: error instanceof Error ? error.message : 'reviews-hydrate-failed',
      });
      logReviewPinError('step8-hydrate-error', error, {
        limit,
        staleMs,
        force,
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
      const fetchedAt = Date.now();

      set((state) => {
        const nextById = { ...state.reviewsById };
        const nextFetchedAtById = { ...state.reviewFetchedAtById };

        reviews.forEach((review) => {
          const existing = nextById[review.id];
          if (!existing || existing.updatedAt.localeCompare(review.updatedAt) <= 0) {
            nextById[review.id] = review;
          }
          nextFetchedAtById[review.id] = fetchedAt;
        });

        return {
          reviewsById: nextById,
          reviewIds: toSortedIds(nextById),
          hydrated: true,
          isHydrating: false,
          hydrateError: null,
          lastHydratedAt: fetchedAt,
          reviewFetchedAtById: nextFetchedAtById,
        };
      });
      logReviewPinDebug('step8-refresh-success', {
        limit,
        fetchedReviews: reviews.length,
        totalReviewsAfterRefresh: get().reviewIds.length,
        lastHydratedAt: get().lastHydratedAt,
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
  fetchReviewByIdCached: async (reviewId, options: ReviewDetailFetchOptions = {}) => {
    if (!reviewId) {
      return null;
    }

    const staleMs = Math.max(0, options.staleMs ?? DEFAULT_REVIEW_DETAIL_STALE_MS);
    const force = options.force === true;
    const stateAtStart = get();
    const cached = stateAtStart.reviewsById[reviewId] || null;
    const lastFetchedAt = stateAtStart.reviewFetchedAtById[reviewId];
    const isFresh = isFreshTimestamp(lastFetchedAt, staleMs);

    logReviewPinDebug('step8-review-detail-requested', {
      reviewId,
      staleMs,
      force,
      hasCached: Boolean(cached),
      lastFetchedAt,
      isFresh,
    });

    if (!force && cached && isFresh) {
      logReviewPinDebug('step8-review-detail-cache-hit', {
        reviewId,
        staleMs,
        lastFetchedAt,
      });
      return cached;
    }

    const inFlightRequest = detailReviewInFlightRequests.get(reviewId);
    if (inFlightRequest) {
      logReviewPinDebug('step8-review-detail-join-inflight', {
        reviewId,
      });
      return inFlightRequest;
    }

    const request = (async () => {
      try {
        const remote = await getReviewById(reviewId);
        const fetchedAt = Date.now();

        set((state) => {
          const nextById = { ...state.reviewsById };
          if (remote) {
            const existing = nextById[reviewId];
            if (!existing || existing.updatedAt.localeCompare(remote.updatedAt) <= 0) {
              nextById[reviewId] = remote;
            }
          } else {
            delete nextById[reviewId];
          }

          return {
            reviewsById: nextById,
            reviewIds: toSortedIds(nextById),
            reviewFetchedAtById: {
              ...state.reviewFetchedAtById,
              [reviewId]: fetchedAt,
            },
          };
        });

        const resolved = get().reviewsById[reviewId] || null;

        logReviewPinDebug('step8-review-detail-success', {
          reviewId,
          fromRemote: true,
          found: Boolean(remote),
          hasResolved: Boolean(resolved),
        });

        return resolved;
      } catch (error) {
        logReviewPinError('step8-review-detail-error', error, {
          reviewId,
        });
        throw error;
      } finally {
        detailReviewInFlightRequests.delete(reviewId);
      }
    })();

    detailReviewInFlightRequests.set(reviewId, request);
    return request;
  },
  upsertReview: (review) => {
    const fetchedAt = Date.now();

    set((state) => {
      const nextById = {
        ...state.reviewsById,
        [review.id]: review,
      };
      return {
        reviewsById: nextById,
        reviewIds: toSortedIds(nextById),
        reviewFetchedAtById: {
          ...state.reviewFetchedAtById,
          [review.id]: fetchedAt,
        },
      };
    });
    logReviewPinDebug('step8-upsert-review', {
      reviewId: review.id,
      hasCoordinates: Array.isArray(review.placeCoordinates),
      totalReviews: get().reviewIds.length,
    });
  },
  upsertReviews: (reviews) => {
    const fetchedAt = Date.now();

    set((state) => {
      const nextById = { ...state.reviewsById };
      const nextFetchedAtById = { ...state.reviewFetchedAtById };

      reviews.forEach((review) => {
        const existing = nextById[review.id];
        if (!existing || existing.updatedAt.localeCompare(review.updatedAt) <= 0) {
          nextById[review.id] = review;
        }
        nextFetchedAtById[review.id] = fetchedAt;
      });

      return {
        reviewsById: nextById,
        reviewIds: toSortedIds(nextById),
        reviewFetchedAtById: nextFetchedAtById,
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

      const nextFetchedAtById = { ...state.reviewFetchedAtById };
      delete nextFetchedAtById[reviewId];

      return {
        reviewsById: nextById,
        reviewIds: state.reviewIds.filter((id) => id !== reviewId),
        reviewFetchedAtById: nextFetchedAtById,
      };
    });
    logReviewPinDebug('step8-remove-review', {
      reviewId,
      totalReviews: get().reviewIds.length,
    });
  },
  createReviewAndStore: async (input, options) => {
    logReviewPinDebug('step8-create-review-start', {
      placeId: input.place.id,
      hasCoordinates: Array.isArray(input.place.coordinates),
    });
    try {
      const created = await createReview(input, options);
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
  updateReviewAndStore: async (input, options) => {
    logReviewPinDebug('step8-update-review-start', {
      reviewId: input.reviewId,
      placeId: input.place.id,
      hasCoordinates: Array.isArray(input.place.coordinates),
    });
    try {
      const updated = await updateReview(input, options);
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
    detailReviewInFlightRequests.clear();
    set({
      reviewsById: {},
      reviewIds: [],
      hydrated: false,
      isHydrating: false,
      hydrateError: null,
      lastHydratedAt: null,
      reviewFetchedAtById: {},
    });
    logReviewPinDebug('step8-clear-reviews', {
      totalReviews: 0,
    });
  },
}));
