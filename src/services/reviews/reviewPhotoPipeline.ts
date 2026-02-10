import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import { getFirebaseStorage, isFirebaseConfigured } from '../firebase';
import { ReviewPhoto } from './types';

type CompressedPhoto = {
  uri: string;
  contentType: string;
};

export async function compressReviewPhoto(uri: string): Promise<CompressedPhoto> {
  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: 1440 } }],
    {
      compress: 0.45,
      format: SaveFormat.JPEG,
    }
  );

  return {
    uri: manipulated.uri,
    contentType: 'image/jpeg',
  };
}

async function toBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('review-photo-fetch-failed');
  }
  return response.blob();
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
  if (!isFirebaseConfigured) {
    return {
      path: storagePath,
      url: sourceUri,
    };
  }

  const { getDownloadURL, ref, uploadBytes } = await import('firebase/storage');
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, storagePath);
  const blob = await toBlob(sourceUri);
  await uploadBytes(storageRef, blob, {
    contentType,
    cacheControl: 'public,max-age=31536000',
  });
  const url = await getDownloadURL(storageRef);
  return {
    path: storagePath,
    url,
  };
}

export async function deleteReviewPhoto(storagePath: string) {
  if (!isFirebaseConfigured) {
    return;
  }

  const { deleteObject, ref } = await import('firebase/storage');
  const storage = getFirebaseStorage();
  await deleteObject(ref(storage, storagePath));
}
