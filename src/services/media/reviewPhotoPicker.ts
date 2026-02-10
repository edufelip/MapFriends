import * as ImagePicker from 'expo-image-picker';

export type ReviewPhotoPickerResult =
  | { status: 'success'; uris: string[] }
  | { status: 'permission-denied' }
  | { status: 'cancelled' }
  | { status: 'error' };

export const pickReviewPhotosFromLibrary = async (
  maxSelection = 10
): Promise<ReviewPhotoPickerResult> => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      return { status: 'permission-denied' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: maxSelection,
      quality: 0.8,
    });

    if (result.canceled) {
      return { status: 'cancelled' };
    }

    const uris = (result.assets || [])
      .map((asset) => asset?.uri)
      .filter((uri): uri is string => Boolean(uri));

    if (uris.length === 0) {
      return { status: 'error' };
    }

    return { status: 'success', uris };
  } catch {
    return { status: 'error' };
  }
};
