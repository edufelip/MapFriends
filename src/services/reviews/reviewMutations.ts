import {
  CreateReviewInput,
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
};

const makePhotoStoragePath = (authorId: string, reviewId: string, index: number) =>
  `reviews/${authorId}/${reviewId}/photo-${Date.now()}-${index + 1}.jpg`;

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
  startingIndex = 0
) {
  const uploaded: ReviewPhoto[] = [];

  try {
    for (let index = 0; index < photos.length; index += 1) {
      const draft = photos[index];
      if (draft.storagePath) {
        continue;
      }

      const compressed = await deps.compressPhoto(draft.uri);
      const uploadedPhoto = await deps.uploadPhoto({
        sourceUri: compressed.uri,
        contentType: compressed.contentType,
        storagePath: makePhotoStoragePath(authorId, reviewId, startingIndex + uploaded.length),
      });
      uploaded.push(uploadedPhoto);
    }
  } catch (error) {
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
  const createReview = async (input: CreateReviewInput): Promise<ReviewRecord> => {
    const reviewId = deps.createReviewId();
    const now = deps.nowIso();
    let uploaded: ReviewPhoto[] = [];

    try {
      uploaded = await uploadNewPhotos(deps, input.photos, input.author.id, reviewId);
      const review: ReviewRecord = {
        id: reviewId,
        placeId: input.place.id,
        placeTitle: input.place.title,
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

      await deps.writeReviewPair(review);
      return review;
    } catch (error) {
      const uploadedFromError = getUploadedFromError(error);
      const rollbackTargets = uploaded.length > 0 ? uploaded : uploadedFromError;
      await rollbackUploadedPhotos(deps, rollbackTargets);
      throw getCauseFromError(error);
    }
  };

  const updateReview = async (input: UpdateReviewInput): Promise<ReviewRecord> => {
    const existing = await deps.loadReview(input.reviewId);
    if (!existing) {
      throw new Error('review-not-found');
    }

    if (existing.userId !== input.author.id) {
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
        retainedPhotos.length
      );

      const mergedPhotos = [...retainedPhotos, ...uploaded];
      const updated: ReviewRecord = {
        ...existing,
        placeId: input.place.id,
        placeTitle: input.place.title,
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

      await deps.writeReviewPair(updated);
      await Promise.allSettled(removedPaths.map((path) => deps.deletePhoto(path)));
      return updated;
    } catch (error) {
      const uploadedFromError = getUploadedFromError(error);
      const rollbackTargets = uploaded.length > 0 ? uploaded : uploadedFromError;
      await rollbackUploadedPhotos(deps, rollbackTargets);
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
