import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { getFirebaseAuth, getFirebaseStorage, isFirebaseConfigured } from '../firebase';
import { ReviewPhoto } from './types';

type CompressedPhoto = {
  uri: string;
  contentType: string;
};

type NativeUploadResponse = {
  name?: string;
  bucket?: string;
  downloadTokens?: string;
  metadata?: {
    downloadTokens?: string;
  };
  error?: {
    message?: string;
  };
};

const LOG_PREFIX = '[review-photo-pipeline]';
const isLoggingEnabled = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
const FILE_READ_TIMEOUT_MS = 20_000;
const TOKEN_TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 90_000;
const DOWNLOAD_URL_TIMEOUT_MS = 20_000;

const logPhotoPipeline = (
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

const withTimeout = async <T>(
  operation: string,
  timeoutMs: number,
  task: Promise<T>,
  onTimeout?: () => void
) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      try {
        onTimeout?.();
      } catch {
        // no-op
      }
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

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const safeJsonParse = (value: string): NativeUploadResponse | null => {
  try {
    return JSON.parse(value) as NativeUploadResponse;
  } catch {
    return null;
  }
};

const isUnauthorizedStatus = (status: number) => status === 401 || status === 403;

const buildDownloadUrlFromUploadResponse = (
  payload: NativeUploadResponse | null,
  fallbackBucket: string,
  fallbackPath: string
): string | null => {
  if (!payload) {
    return null;
  }

  const bucket = typeof payload.bucket === 'string' && payload.bucket.trim() ? payload.bucket : fallbackBucket;
  const objectName = typeof payload.name === 'string' && payload.name.trim() ? payload.name : fallbackPath;
  const rawTokens =
    typeof payload.downloadTokens === 'string'
      ? payload.downloadTokens
      : typeof payload.metadata?.downloadTokens === 'string'
        ? payload.metadata.downloadTokens
        : '';

  const token = rawTokens
    .split(',')
    .map((item) => item.trim())
    .find(Boolean);

  if (!token) {
    return null;
  }

  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(
    objectName
  )}?alt=media&token=${encodeURIComponent(token)}`;
};

const getStorageBucketOrThrow = () => {
  const storage = getFirebaseStorage();
  const bucket = storage.app.options.storageBucket?.trim() || '';
  if (!bucket) {
    throw new Error('review-photo-storage-bucket-missing');
  }
  return bucket;
};

async function getCurrentUserIdToken() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('review-photo-auth-user-missing');
  }

  return withTimeout('review-photo-auth-token', TOKEN_TIMEOUT_MS, user.getIdToken());
}

export async function compressReviewPhoto(uri: string): Promise<CompressedPhoto> {
  const startedAt = Date.now();
  logPhotoPipeline('start', 'reviews.compressReviewPhoto', { sourceUri: uri });

  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: 1440 } }],
    {
      compress: 0.45,
      format: SaveFormat.JPEG,
    }
  );

  logPhotoPipeline('success', 'reviews.compressReviewPhoto', {
    sourceUri: uri,
    durationMs: Date.now() - startedAt,
  });

  return {
    uri: manipulated.uri,
    contentType: 'image/jpeg',
  };
}

async function readFileAsBase64(uri: string): Promise<{ base64: string; sizeBytesEstimate: number }> {
  logPhotoPipeline('start', 'reviews.readReviewPhotoBase64', {
    sourceUri: uri,
    timeoutMs: FILE_READ_TIMEOUT_MS,
  });

  const base64 = await withTimeout(
    'review-photo-read-base64',
    FILE_READ_TIMEOUT_MS,
    FileSystemLegacy.readAsStringAsync(uri, {
      encoding: FileSystemLegacy.EncodingType.Base64,
    })
  );

  const sizeBytesEstimate = Math.floor((base64.length * 3) / 4);
  logPhotoPipeline('success', 'reviews.readReviewPhotoBase64', {
    sourceUri: uri,
    sizeBytesEstimate,
  });

  return {
    base64,
    sizeBytesEstimate,
  };
}

async function resolveUploadedPhotoUrl(storagePath: string, provider: string): Promise<string> {
  const { getDownloadURL, ref } = await import('firebase/storage');
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, storagePath);

  logPhotoPipeline('start', 'reviews.resolveUploadedPhotoUrl', {
    storagePath,
    timeoutMs: DOWNLOAD_URL_TIMEOUT_MS,
    provider,
  });

  const url = await withTimeout(
    'review-photo-download-url',
    DOWNLOAD_URL_TIMEOUT_MS,
    getDownloadURL(storageRef)
  );

  logPhotoPipeline('success', 'reviews.resolveUploadedPhotoUrl', {
    storagePath,
    provider,
  });

  return url;
}

async function uploadWithFirebaseJsStorage({
  sourceUri,
  storagePath,
  contentType,
}: {
  sourceUri: string;
  storagePath: string;
  contentType: string;
}): Promise<ReviewPhoto> {
  const { ref, uploadString } = await import('firebase/storage');
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, storagePath);

  const { base64, sizeBytesEstimate } = await readFileAsBase64(sourceUri);

  logPhotoPipeline('start', 'reviews.uploadReviewPhotoBytes', {
    storagePath,
    sizeBytes: sizeBytesEstimate,
    timeoutMs: UPLOAD_TIMEOUT_MS,
    provider: 'firebase-web-sdk',
  });

  await withTimeout(
    'review-photo-upload',
    UPLOAD_TIMEOUT_MS,
    uploadString(storageRef, base64, 'base64', {
      contentType,
      cacheControl: 'public,max-age=31536000',
    })
  );

  logPhotoPipeline('success', 'reviews.uploadReviewPhotoBytes', {
    storagePath,
    sizeBytes: sizeBytesEstimate,
    progressPercent: 100,
    provider: 'firebase-web-sdk',
  });

  const url = await resolveUploadedPhotoUrl(storagePath, 'firebase-web-sdk');

  return {
    path: storagePath,
    url,
  };
}

async function uploadBinaryToNativeStorage({
  endpoint,
  sourceUri,
  contentType,
  authHeader,
}: {
  endpoint: string;
  sourceUri: string;
  contentType: string;
  authHeader: string;
}) {
  const fileResponse = await withTimeout(
    'review-photo-read-binary',
    FILE_READ_TIMEOUT_MS,
    fetch(sourceUri)
  );

  if (!fileResponse.ok) {
    throw new Error(`review-photo-read-binary-http-${fileResponse.status}`);
  }

  const fileBlob = await withTimeout(
    'review-photo-read-binary-body',
    FILE_READ_TIMEOUT_MS,
    fileResponse.blob()
  );

  const sizeBytes = typeof fileBlob.size === 'number' ? fileBlob.size : undefined;

  logPhotoPipeline('start', 'reviews.uploadReviewPhotoRequest', {
    provider: 'firebase-native-rest',
    endpoint,
    sizeBytes,
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });

  const response = await withTimeout(
    'review-photo-upload',
    UPLOAD_TIMEOUT_MS,
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: fileBlob,
    })
  );

  const body = await withTimeout(
    'review-photo-upload-response-read',
    FILE_READ_TIMEOUT_MS,
    response.text()
  );

  return {
    status: response.status,
    body,
  };
}

async function uploadWithNativeRestStorage({
  sourceUri,
  storagePath,
  contentType,
}: {
  sourceUri: string;
  storagePath: string;
  contentType: string;
}): Promise<ReviewPhoto> {
  const bucket = getStorageBucketOrThrow();
  const token = await getCurrentUserIdToken();
  const endpoint = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
    bucket
  )}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;

  logPhotoPipeline('start', 'reviews.uploadReviewPhotoBytes', {
    storagePath,
    timeoutMs: UPLOAD_TIMEOUT_MS,
    provider: 'firebase-native-rest',
  });

  let result = await uploadBinaryToNativeStorage({
    endpoint,
    sourceUri,
    contentType,
    authHeader: `Bearer ${token}`
  });

  if (isUnauthorizedStatus(result.status)) {
    logPhotoPipeline('start', 'reviews.uploadReviewPhotoRetryAuthScheme', {
      storagePath,
      provider: 'firebase-native-rest',
      from: 'Bearer',
      to: 'Firebase',
      status: result.status,
    });

    result = await uploadBinaryToNativeStorage({
      endpoint,
      sourceUri,
      contentType,
      authHeader: `Firebase ${token}`
    });
  }

  const responseBody = safeJsonParse(result.body);

  if (result.status < 200 || result.status >= 300) {
    const serverMessage =
      responseBody?.error?.message || (typeof result.body === 'string' ? result.body.slice(0, 240) : '');
    throw new Error(`review-photo-upload-http-${result.status}${serverMessage ? `: ${serverMessage}` : ''}`);
  }

  logPhotoPipeline('success', 'reviews.uploadReviewPhotoBytes', {
    storagePath,
    provider: 'firebase-native-rest',
    status: result.status,
    progressPercent: 100,
  });

  const directUrl = buildDownloadUrlFromUploadResponse(responseBody, bucket, storagePath);
  if (directUrl) {
    return {
      path: storagePath,
      url: directUrl,
    };
  }

  const resolvedUrl = await resolveUploadedPhotoUrl(storagePath, 'firebase-native-rest');
  return {
    path: storagePath,
    url: resolvedUrl,
  };
}

export async function uploadReviewPhoto({
  sourceUri,
  storagePath,
  contentType,
}: {
  sourceUri: string;
  storagePath: string;
  contentType: string;
}): Promise<ReviewPhoto> {
  const startedAt = Date.now();
  const provider = Platform.OS === 'web' ? 'firebase-web-sdk' : 'firebase-native-rest';

  logPhotoPipeline('start', 'reviews.uploadReviewPhoto', {
    storagePath,
    sourceUri,
    contentType,
    isFirebaseConfigured,
    platform: Platform.OS,
    provider,
  });

  if (!isFirebaseConfigured) {
    logPhotoPipeline('success', 'reviews.uploadReviewPhoto', {
      storagePath,
      durationMs: Date.now() - startedAt,
      provider: 'local-fallback',
    });

    return {
      path: storagePath,
      url: sourceUri,
    };
  }

  try {
    const photo =
      Platform.OS === 'web'
        ? await uploadWithFirebaseJsStorage({ sourceUri, storagePath, contentType })
        : await uploadWithNativeRestStorage({ sourceUri, storagePath, contentType });

    logPhotoPipeline('success', 'reviews.uploadReviewPhoto', {
      storagePath,
      durationMs: Date.now() - startedAt,
      provider,
    });

    return photo;
  } catch (error) {
    logPhotoPipeline('error', 'reviews.uploadReviewPhoto', {
      storagePath,
      durationMs: Date.now() - startedAt,
      provider,
      error: toErrorMessage(error),
    });
    throw error;
  }
}

export async function deleteReviewPhoto(storagePath: string) {
  if (!isFirebaseConfigured) {
    return;
  }

  const { deleteObject, ref } = await import('firebase/storage');
  const storage = getFirebaseStorage();
  await deleteObject(ref(storage, storagePath));
}
