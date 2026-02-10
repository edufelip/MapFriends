import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { createReview } from '../../services/reviews';
import { getPlaceById } from '../../services/map';
import { LocationHint } from '../../services/locationSearch';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import { pickReviewPhotosFromLibrary } from '../../services/media/reviewPhotoPicker';
import RatingSlider from './components/RatingSlider';
import PhotoStrip from './components/PhotoStrip';
import VisibilitySelector from './components/VisibilitySelector';
import LocationPicker from './components/LocationPicker';

const DEFAULT_PHOTOS: string[] = [];
const MAX_NOTES_LENGTH = 400;
const MAX_REVIEW_PHOTOS = 10;

export default function ReviewComposerScreen({ route, navigation }: NativeStackScreenProps<any>) {
  const initialPlaceId = route.params?.placeId;
  const [selectedPlace, setSelectedPlace] = React.useState<LocationHint | null>(() => {
    const place = initialPlaceId ? getPlaceById(initialPlaceId) : null;
    if (!place) {
      return null;
    }
    return {
      id: place.id,
      title: place.name,
      subtitle: `${place.category} · ${place.address}`,
      coordinates: null,
    };
  });
  const [notes, setNotes] = React.useState('');
  const [rating, setRating] = React.useState(8);
  const [photos, setPhotos] = React.useState<string[]>(DEFAULT_PHOTOS);
  const [visibility, setVisibility] = React.useState<'followers' | 'subscribers'>('followers');

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const insets = useSafeAreaInsets();

  const handleSubmit = () => {
    if (!selectedPlace?.id) return;
    createReview({
      placeId: selectedPlace.id,
      title: selectedPlace.title || strings.reviewComposer.defaultTitle,
      notes: notes.trim() || strings.reviewComposer.defaultNotes,
      rating,
    });
    navigation.goBack();
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddPhotos = React.useCallback(async () => {
    const remaining = Math.max(0, MAX_REVIEW_PHOTOS - photos.length);
    if (remaining === 0) {
      return;
    }

    const result = await pickReviewPhotosFromLibrary(remaining);

    if (result.status === 'permission-denied') {
      Alert.alert(strings.reviewComposer.photosLabel, strings.reviewComposer.photosPermissionDenied);
      return;
    }

    if (result.status === 'error') {
      Alert.alert(strings.reviewComposer.photosLabel, strings.reviewComposer.photosPickerError);
      return;
    }

    if (result.status !== 'success') {
      return;
    }

    setPhotos((prev) => {
      const next = [...prev, ...result.uris];
      return next.slice(0, MAX_REVIEW_PHOTOS);
    });
  }, [
    photos.length,
    strings.reviewComposer.photosLabel,
    strings.reviewComposer.photosPermissionDenied,
    strings.reviewComposer.photosPickerError,
  ]);

  const handleNotesChange = React.useCallback((value: string) => {
    setNotes(value.slice(0, MAX_NOTES_LENGTH));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={[
          styles.backButton,
          {
            top: insets.top + 8,
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <MaterialIcons name="arrow-back-ios-new" size={16} color={theme.textPrimary} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 64, paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LocationPicker
          selectedHint={selectedPlace}
          onSelectHint={setSelectedPlace}
          onClearHint={() => setSelectedPlace(null)}
          theme={{
            surface: theme.surface,
            border: theme.border,
            textPrimary: theme.textPrimary,
            textMuted: theme.textMuted,
            primary: theme.primary,
          }}
          strings={{
            searchPlaceholder: strings.reviewComposer.locationSearchPlaceholder,
            empty: strings.reviewComposer.locationSuggestionsEmpty,
          }}
        />

        <View style={styles.compactSection}>
          <RatingSlider
            label={strings.reviewComposer.ratingLabel}
            value={rating}
            onChange={setRating}
            max={10}
            theme={{
              primary: theme.primary,
              textPrimary: theme.textPrimary,
              textMuted: theme.textMuted,
              surfaceMuted: theme.surfaceMuted,
              border: theme.border,
            }}
          />
        </View>

        <View style={styles.section}>
          <View style={[styles.notesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.textArea, { color: theme.textPrimary }]}
              placeholder={strings.reviewComposer.placeholder}
              placeholderTextColor={theme.textMuted}
              multiline
              value={notes}
              onChangeText={handleNotesChange}
              textAlignVertical="top"
              maxLength={MAX_NOTES_LENGTH}
            />
            <Text style={[styles.notesCount, { color: theme.textMuted }]}>{`${notes.length}/${MAX_NOTES_LENGTH}`}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <PhotoStrip
            photos={photos}
            onRemove={handleRemovePhoto}
            onAdd={handleAddPhotos}
            label={strings.reviewComposer.photosLabel}
            countLabel={strings.reviewComposer.photosCount.replace('{count}', String(photos.length))}
            theme={{
              border: theme.border,
              surfaceMuted: theme.surfaceMuted,
              textPrimary: theme.textPrimary,
              textMuted: theme.textMuted,
              primary: theme.primary,
            }}
          />
        </View>

        <View style={styles.section}>
          <VisibilitySelector
            label={strings.reviewComposer.visibilityLabel}
            optionFollowers={strings.reviewComposer.visibilityFollowers}
            optionSubscribers={strings.reviewComposer.visibilitySubscribers}
            helper={strings.reviewComposer.visibilityHelper}
            value={visibility}
            onChange={setVisibility}
            theme={{
              primary: theme.primary,
              textPrimary: theme.textPrimary,
              textMuted: theme.textMuted,
              surfaceMuted: theme.surfaceMuted,
              surface: theme.surface,
              border: theme.border,
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  content: {
    paddingHorizontal: 16,
  },
  compactSection: {
    marginTop: 12,
  },
  section: {
    marginTop: 24,
  },
  notesCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  textArea: {
    minHeight: 160,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
  },
  notesCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
});
