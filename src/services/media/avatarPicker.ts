import * as ImagePicker from 'expo-image-picker';

export type AvatarPickerResult =
  | { status: 'success'; uri: string }
  | { status: 'permission-denied' }
  | { status: 'cancelled' }
  | { status: 'error' };

export const pickAvatarFromLibrary = async (): Promise<AvatarPickerResult> => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      return { status: 'permission-denied' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return { status: 'cancelled' };
    }

    const uri = result.assets?.[0]?.uri;

    if (!uri) {
      return { status: 'error' };
    }

    return { status: 'success', uri };
  } catch {
    return { status: 'error' };
  }
};
