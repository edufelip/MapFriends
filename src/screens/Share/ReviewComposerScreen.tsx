import React from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../services/auth';
import {
  getReviewById,
  ReviewPhotoDraft,
  ReviewVisibility,
} from '../../services/reviews';
import { getPlaceById } from '../../services/map';
import { LocationHint, resolveLocationHintCoordinates } from '../../services/locationSearch';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import { pickReviewPhotosFromLibrary } from '../../services/media/reviewPhotoPicker';
import { useReviewStore } from '../../state/reviews';
import RatingSlider from './components/RatingSlider';
import PhotoStrip from './components/PhotoStrip';
import VisibilitySelector from './components/VisibilitySelector';
import LocationPicker from './components/LocationPicker';
import ComposerTopBar from './components/ComposerTopBar';

const DEFAULT_PHOTOS: ReviewPhotoDraft[] = [];
const MAX_NOTES_LENGTH = 400;
const MAX_REVIEW_PHOTOS = 10;

export default function ReviewComposerScreen({ route, navigation }: NativeStackScreenProps<any>) {
  const reviewId = route.params?.reviewId as string | undefined;
  const initialPlaceId = route.params?.placeId;
  const { user } = useAuth();
  const [selectedPlace, setSelectedPlace] = React.useState<LocationHint | null>(() => {
    const place = initialPlaceId ? getPlaceById(initialPlaceId) : null;
    if (!place) {
      return null;
    }
    return {
      id: place.id,
      title: place.name,
      subtitle: `${place.category} · ${place.address}`,
      coordinates: place.coordinates || null,
    };
  });
  const [notes, setNotes] = React.useState('');
  const [rating, setRating] = React.useState(8);
  const [photos, setPhotos] = React.useState<ReviewPhotoDraft[]>(DEFAULT_PHOTOS);
  const [visibility, setVisibility] = React.useState<ReviewVisibility>('followers');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingReview, setIsLoadingReview] = React.useState(Boolean(reviewId));
  const submitLockRef = React.useRef(false);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const insets = useSafeAreaInsets();
  const createReviewAndStore = useReviewStore((state) => state.createReviewAndStore);
  const updateReviewAndStore = useReviewStore((state) => state.updateReviewAndStore);

  React.useEffect(() => {
    let isMounted = true;

    const loadReview = async () => {
      if (!reviewId) {
        setIsLoadingReview(false);
        return;
      }

      if (!user?.id) {
        if (isMounted) {
          setIsLoadingReview(false);
        }
        return;
      }

      setIsLoadingReview(true);
      try {
        const review = await getReviewById(reviewId);
        if (!isMounted) {
          return;
        }

        if (!review || review.userId !== user.id) {
          Alert.alert(
            strings.reviewComposer.post,
            strings.reviewComposer.reviewLoadError
          );
          navigation.goBack();
          return;
        }

        setSelectedPlace({
          id: review.placeId,
          title: review.placeTitle,
          subtitle: '',
          coordinates: review.placeCoordinates,
        });
        setNotes(review.notes);
        setRating(review.rating);
        setVisibility(review.visibility);
        setPhotos(
          review.photos.map((photo) => ({
            uri: photo.url,
            storagePath: photo.path,
          }))
        );
      } catch {
        if (isMounted) {
          Alert.alert(
            strings.reviewComposer.post,
            strings.reviewComposer.reviewLoadError
          );
          navigation.goBack();
        }
      } finally {
        if (isMounted) {
          setIsLoadingReview(false);
        }
      }
    };

    void loadReview();

    return () => {
      isMounted = false;
    };
  }, [navigation, reviewId, strings.reviewComposer.post, strings.reviewComposer.reviewLoadError, user?.id]);

  const canSubmit = Boolean(selectedPlace?.id && notes.trim().length > 0 && user?.id);

  const handleSubmit = React.useCallback(async () => {
    if (submitLockRef.current || !canSubmit || !selectedPlace || !user) {
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    let resolvedPlace = selectedPlace;
    if (!resolvedPlace.coordinates) {
      resolvedPlace = await resolveLocationHintCoordinates(resolvedPlace);
    }

    if (!resolvedPlace.coordinates) {
      Alert.alert(
        strings.reviewComposer.post,
        strings.reviewComposer.locationResolveError
      );
      submitLockRef.current = false;
      setIsSubmitting(false);
      return;
    }

    const payload = {
      author: {
        id: user.id,
        name: user.name || user.handle || 'Unknown',
        handle: user.handle || 'user',
        avatar: user.avatar || null,
      },
      place: {
        id: resolvedPlace.id,
        title: resolvedPlace.title || strings.reviewComposer.defaultTitle,
        coordinates: resolvedPlace.coordinates,
      },
      notes: notes.trim(),
      rating,
      visibility,
      photos,
    };

    try {
      if (reviewId) {
        await updateReviewAndStore({
          reviewId,
          ...payload,
        });
      } else {
        await createReviewAndStore(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert(
        strings.reviewComposer.post,
        strings.reviewComposer.submitError
      );
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    canSubmit,
    navigation,
    notes,
    photos,
    rating,
    reviewId,
    selectedPlace,
    createReviewAndStore,
    strings.reviewComposer.defaultTitle,
    strings.reviewComposer.locationResolveError,
    strings.reviewComposer.post,
    strings.reviewComposer.submitError,
    updateReviewAndStore,
    user,
    visibility,
  ]);

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
      const next = [...prev, ...result.uris.map((uri) => ({ uri }))];
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
      <ComposerTopBar
        topInset={insets.top}
        onBack={() => navigation.goBack()}
        onSubmit={() => void handleSubmit()}
        submitLabel={reviewId ? strings.reviewComposer.save : strings.reviewComposer.post}
        isSubmitting={isSubmitting}
        disabled={!canSubmit || isLoadingReview}
        theme={{
          surface: theme.surface,
          border: theme.border,
          textPrimary: theme.textPrimary,
          textMuted: theme.textMuted,
          primary: theme.primary,
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 64, paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingReview ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : null}

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
            photos={photos.map((photo) => photo.uri)}
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
  content: {
    paddingHorizontal: 16,
  },
  loadingWrap: {
    paddingVertical: 16,
    alignItems: 'center',
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
