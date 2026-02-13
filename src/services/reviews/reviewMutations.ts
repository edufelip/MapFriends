import {
  CreateReviewInput,
  ReviewMutationOperation,
  ReviewMutationOptions,
  ReviewPhoto,
  ReviewPhotoDraft,
  ReviewRecord,
  UpdateReviewInput,
} from './types';

type CompressedPhoto = {
  uri: string;
  contentType: string;
};

type UploadPhotoInput = {
  sourceUri: string;
  storagePath: string;
  contentType: string;
};

type ReviewMutationsDeps = {
  nowIso: () => string;
  createReviewId: () => string;
  loadReview: (reviewId: string) => Promise<ReviewRecord | null>;
  writeReviewPair: (review: ReviewRecord) => Promise<void>;
  deleteReviewPair: (review: ReviewRecord) => Promise<void>;
  compressPhoto: (uri: string) => Promise<CompressedPhoto>;
  uploadPhoto: (input: UploadPhotoInput) => Promise<ReviewPhoto>;
  deletePhoto: (storagePath: string) => Promise<void>;
  stepTimeoutMs?: number;
};

const makePhotoStoragePath = (authorId: string, reviewId: string, index: number) =>
  `reviews/${authorId}/${reviewId}/photo-${Date.now()}-${index + 1}.jpg`;
const DEFAULT_STEP_TIMEOUT_MS = 90_000;
const LOG_PREFIX = '[review-mutations]';
const isLoggingEnabled = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

const logMutation = (
  phase: 'start' | 'success' | 'error',
  operation: string,
  details: Record<string, unknown>
) => {
  if (!isLoggingEnabled) {
    return;
  }
  const payload = {
    at: new Date().toISOString(),
    operation,
    ...details,
  };

  if (phase === 'error') {
    console.error(`${LOG_PREFIX} XX ${operation}`, payload);
    return;
  }

  const prefix = phase === 'start' ? '>>' : 'OK';
  console.log(`${LOG_PREFIX} ${prefix} ${operation}`, payload);
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
};

const withTimeout = async <T>(operation: string, timeoutMs: number, task: Promise<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${operation}-timeout`));
    }, timeoutMs);

    task
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });

const emitProgress = (
  options: ReviewMutationOptions | undefined,
  payload: {
    operation: ReviewMutationOperation;
    stage: 'compressing' | 'uploading' | 'saving';
    completed: number;
    total: number;
    reviewId: string;
  }
) => {
  options?.onProgress?.(payload);
};

const toRetainedPhoto = (photo: ReviewPhotoDraft): ReviewPhoto | null => {
  if (!photo.storagePath) {
    return null;
  }

  return {
    path: photo.storagePath,
    url: photo.uri,
  };
};

async function uploadNewPhotos(
  deps: ReviewMutationsDeps,
  photos: ReviewPhotoDraft[],
  authorId: string,
  reviewId: string,
  startingIndex = 0,
  operation: ReviewMutationOperation,
  options?: ReviewMutationOptions
) {
  const uploaded: ReviewPhoto[] = [];
  const stepTimeoutMs = deps.stepTimeoutMs ?? DEFAULT_STEP_TIMEOUT_MS;
  const totalNewPhotos = photos.filter((photo) => !photo.storagePath).length;
  if (totalNewPhotos === 0) {
    return uploaded;
  }

  try {
    for (let index = 0; index < photos.length; index += 1) {
      const draft = photos[index];
      if (draft.storagePath) {
        continue;
      }

      const photoIndex = startingIndex + uploaded.length + 1;
      const storagePath = makePhotoStoragePath(authorId, reviewId, startingIndex + uploaded.length);
      const compressStartedAt = Date.now();
      emitProgress(options, {
        operation,
        stage: 'compressing',
        completed: uploaded.length,
        total: totalNewPhotos,
        reviewId,
      });
      logMutation('start', 'reviews.compressPhoto', {
        reviewId,
        photoIndex,
        sourceUri: draft.uri,
      });
      const compressed = await withTimeout(
        'reviews.compressPhoto',
        stepTimeoutMs,
        deps.compressPhoto(draft.uri)
      );
      logMutation('success', 'reviews.compressPhoto', {
        reviewId,
        photoIndex,
        durationMs: Date.now() - compressStartedAt,
      });

      const uploadStartedAt = Date.now();
      emitProgress(options, {
        operation,
        stage: 'uploading',
        completed: uploaded.length,
        total: totalNewPhotos,
        reviewId,
      });
      logMutation('start', 'reviews.uploadPhoto', {
        reviewId,
        photoIndex,
        storagePath,
      });
      const uploadedPhoto = await withTimeout(
        'reviews.uploadPhoto',
        stepTimeoutMs,
        deps.uploadPhoto({
          sourceUri: compressed.uri,
          contentType: compressed.contentType,
          storagePath,
        })
      );
      logMutation('success', 'reviews.uploadPhoto', {
        reviewId,
        photoIndex,
        storagePath,
        durationMs: Date.now() - uploadStartedAt,
      });
      uploaded.push(uploadedPhoto);
      emitProgress(options, {
        operation,
        stage: 'uploading',
        completed: uploaded.length,
        total: totalNewPhotos,
        reviewId,
      });
    }
  } catch (error) {
    logMutation('error', 'reviews.uploadNewPhotos', {
      reviewId,
      uploadedCount: uploaded.length,
      error: toErrorMessage(error),
    });
    throw {
      kind: 'upload-failed',
      uploaded,
      cause: error,
    };
  }

  return uploaded;
}

async function rollbackUploadedPhotos(deps: ReviewMutationsDeps, uploaded: ReviewPhoto[]) {
  await Promise.allSettled(uploaded.map((photo) => deps.deletePhoto(photo.path)));
}

const getUploadedFromError = (error: unknown): ReviewPhoto[] => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    (error as { kind: string }).kind === 'upload-failed' &&
    'uploaded' in error &&
    Array.isArray((error as { uploaded: unknown }).uploaded)
  ) {
    return (error as { uploaded: ReviewPhoto[] }).uploaded;
  }
  return [];
};

const getCauseFromError = (error: unknown): unknown => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    (error as { kind: string }).kind === 'upload-failed' &&
    'cause' in error
  ) {
    return (error as { cause: unknown }).cause;
  }
  return error;
};

export function createReviewMutations(deps: ReviewMutationsDeps) {
  const stepTimeoutMs = deps.stepTimeoutMs ?? DEFAULT_STEP_TIMEOUT_MS;
  const createReview = async (
    input: CreateReviewInput,
    options?: ReviewMutationOptions
  ): Promise<ReviewRecord> => {
    const reviewId = deps.createReviewId();
    const now = deps.nowIso();
    let uploaded: ReviewPhoto[] = [];
    logMutation('start', 'reviews.createReview', {
      reviewId,
      placeId: input.place.id,
      photoDrafts: input.photos.length,
    });

    try {
      uploaded = await uploadNewPhotos(
        deps,
        input.photos,
        input.author.id,
        reviewId,
        0,
        'create',
        options
      );
      const review: ReviewRecord = {
        id: reviewId,
        placeId: input.place.id,
        placeTitle: input.place.title,
        placeCoordinates: input.place.coordinates ?? null,
        title: input.place.title,
        notes: input.notes,
        rating: input.rating,
        visibility: input.visibility,
        userId: input.author.id,
        userName: input.author.name,
        userHandle: input.author.handle,
        userAvatar: input.author.avatar,
        photos: uploaded,
        photoUrls: uploaded.map((photo) => photo.url),
        createdAt: now,
        updatedAt: now,
      };

      const writeStartedAt = Date.now();
      emitProgress(options, {
        operation: 'create',
        stage: 'saving',
        completed: uploaded.length,
        total: Math.max(uploaded.length, 1),
        reviewId,
      });
      logMutation('start', 'reviews.writeReviewPair', {
        reviewId,
        userId: review.userId,
      });
      await deps.writeReviewPair(review);
      logMutation('success', 'reviews.writeReviewPair', {
        reviewId,
        userId: review.userId,
        durationMs: Date.now() - writeStartedAt,
      });
      logMutation('success', 'reviews.createReview', {
        reviewId,
        uploadedPhotos: review.photos.length,
      });
      return review;
    } catch (error) {
      const uploadedFromError = getUploadedFromError(error);
      const rollbackTargets = uploaded.length > 0 ? uploaded : uploadedFromError;
      await rollbackUploadedPhotos(deps, rollbackTargets);
      logMutation('error', 'reviews.createReview', {
        reviewId,
        uploadedBeforeRollback: rollbackTargets.length,
        error: toErrorMessage(getCauseFromError(error)),
      });
      throw getCauseFromError(error);
    }
  };

  const updateReview = async (
    input: UpdateReviewInput,
    options?: ReviewMutationOptions
  ): Promise<ReviewRecord> => {
    logMutation('start', 'reviews.updateReview', {
      reviewId: input.reviewId,
      placeId: input.place.id,
      photoDrafts: input.photos.length,
    });
    const existing = await withTimeout(
      'reviews.loadReview',
      stepTimeoutMs,
      deps.loadReview(input.reviewId)
    );
    if (!existing) {
      logMutation('error', 'reviews.updateReview', {
        reviewId: input.reviewId,
        error: 'review-not-found',
      });
      throw new Error('review-not-found');
    }

    if (existing.userId !== input.author.id) {
      logMutation('error', 'reviews.updateReview', {
        reviewId: input.reviewId,
        userId: input.author.id,
        ownerId: existing.userId,
        error: 'review-forbidden',
      });
      throw new Error('review-forbidden');
    }

    const retainedPhotos = input.photos
      .map(toRetainedPhoto)
      .filter((photo): photo is ReviewPhoto => Boolean(photo));

    let uploaded: ReviewPhoto[] = [];

    const retainedPaths = new Set(retainedPhotos.map((photo) => photo.path));
    const removedPaths = existing.photos
      .map((photo) => photo.path)
      .filter((path) => !retainedPaths.has(path));

    try {
      uploaded = await uploadNewPhotos(
        deps,
        input.photos,
        input.author.id,
        input.reviewId,
        retainedPhotos.length,
        'update',
        options
      );

      const mergedPhotos = [...retainedPhotos, ...uploaded];
      const updated: ReviewRecord = {
        ...existing,
        placeId: input.place.id,
        placeTitle: input.place.title,
        placeCoordinates: input.place.coordinates ?? existing.placeCoordinates ?? null,
        title: input.place.title,
        notes: input.notes,
        rating: input.rating,
        visibility: input.visibility,
        userName: input.author.name,
        userHandle: input.author.handle,
        userAvatar: input.author.avatar,
        photos: mergedPhotos,
        photoUrls: mergedPhotos.map((photo) => photo.url),
        updatedAt: deps.nowIso(),
      };

      const writeStartedAt = Date.now();
      emitProgress(options, {
        operation: 'update',
        stage: 'saving',
        completed: retainedPhotos.length + uploaded.length,
        total: Math.max(retainedPhotos.length + uploaded.length, 1),
        reviewId: updated.id,
      });
      logMutation('start', 'reviews.writeReviewPair', {
        reviewId: updated.id,
        userId: updated.userId,
      });
      await deps.writeReviewPair(updated);
      logMutation('success', 'reviews.writeReviewPair', {
        reviewId: updated.id,
        userId: updated.userId,
        durationMs: Date.now() - writeStartedAt,
      });
      await Promise.allSettled(removedPaths.map((path) => deps.deletePhoto(path)));
      logMutation('success', 'reviews.updateReview', {
        reviewId: updated.id,
        retainedPhotos: retainedPhotos.length,
        uploadedPhotos: uploaded.length,
        removedPhotos: removedPaths.length,
      });
      return updated;
    } catch (error) {
      const uploadedFromError = getUploadedFromError(error);
      const rollbackTargets = uploaded.length > 0 ? uploaded : uploadedFromError;
      await rollbackUploadedPhotos(deps, rollbackTargets);
      logMutation('error', 'reviews.updateReview', {
        reviewId: input.reviewId,
        uploadedBeforeRollback: rollbackTargets.length,
        error: toErrorMessage(getCauseFromError(error)),
      });
      throw getCauseFromError(error);
    }
  };

  const deleteReview = async ({ reviewId, authorId }: { reviewId: string; authorId: string }) => {
    const existing = await deps.loadReview(reviewId);
    if (!existing) {
      return;
    }

    if (existing.userId !== authorId) {
      throw new Error('review-forbidden');
    }

    await deps.deleteReviewPair(existing);
    await Promise.allSettled(existing.photos.map((photo) => deps.deletePhoto(photo.path)));
  };

  return {
    createReview,
    updateReview,
    deleteReview,
  };
}
