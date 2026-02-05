import React from 'react';
import { ScrollView, StyleSheet, TextInput, View, useColorScheme } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createReview } from '../../services/reviews';
import { getPlaceById, getPlaces } from '../../services/map';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import ComposerHeader from './components/ComposerHeader';
import LocationChip from './components/LocationChip';
import RatingSlider from './components/RatingSlider';
import PhotoStrip from './components/PhotoStrip';
import VisibilitySelector from './components/VisibilitySelector';

const DEFAULT_PHOTOS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAAmZVCNh0C_V2k_W7otJEBomwl-1niSIndxf6YnNKV2xFEYZz5Eh-17BvqGqgokNtD8Jr04-oTTQrugXZBlkJ9T1FmvfKZFHnvbgsNrxtAuONeUJhtZynmJgNq8plauX5GDE9ep0KgKPdrQiY92gMsvhisbvxn8raHaKonpW2XvD7vPRn8ixoRiFlQF-iQUiQ0gpUkjoCS_ZP0JfU_6R1Iz8uh8unZYkZgfSpzGTmrCjMZT1fAY4Na5fCGbARbs4cYd-nc2oYBI4c',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuClcCKPE49Kj0H3U22DZqTrBU0sMT16BLAr6B7FYy9yHTKJeD9ukn2IsEzLR8XI-PU7F2EqU7iyVoEiuxZqhGL0iEjjDV0exomitiag5eS6qdnBlIKv_rnRWldrpLWw7VtgLDZh-nLX2p_POnAAJ_YKP0U9ZU2ZsMdD5nICDnr8mEvwAuKzd7uq1xIOGAgMPpAkTbGqqFRHzIT6tordwBl_oGLzc51s89PBJCntipPkgv6RtpzS9eQRkVOfFmrp5H_u6FX7XaEcONk',
];

export default function ReviewComposerScreen({ route, navigation }: NativeStackScreenProps<any>) {
  const initialPlaceId = route.params?.placeId ?? getPlaces()[0]?.id;
  const [placeId] = React.useState(initialPlaceId);
  const place = placeId ? getPlaceById(placeId) : null;
  const [notes, setNotes] = React.useState('');
  const [rating, setRating] = React.useState(8);
  const [photos, setPhotos] = React.useState<string[]>(DEFAULT_PHOTOS);
  const [visibility, setVisibility] = React.useState<'followers' | 'subscribers'>('subscribers');

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const insets = useSafeAreaInsets();

  const handleSubmit = () => {
    if (!placeId) return;
    createReview({
      placeId,
      title: place?.name || strings.reviewComposer.defaultTitle,
      notes: notes.trim() || strings.reviewComposer.defaultNotes,
      rating,
    });
    navigation.goBack();
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ComposerHeader
        title={strings.reviewComposer.title}
        cancelLabel={strings.reviewComposer.cancel}
        postLabel={strings.reviewComposer.post}
        onCancel={() => navigation.goBack()}
        onPost={handleSubmit}
        theme={{
          background: theme.background,
          border: theme.border,
          textPrimary: theme.textPrimary,
          textMuted: theme.textMuted,
          primary: theme.primary,
        }}
        topInset={insets.top}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <LocationChip
          label={place?.name || strings.reviewComposer.locationFallback}
          theme={{
            surface: theme.surface,
            border: theme.border,
            primary: theme.primary,
            textPrimary: theme.textPrimary,
          }}
        />

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

        <TextInput
          style={[
            styles.textArea,
            { borderBottomColor: theme.border, color: theme.textPrimary },
          ]}
          placeholder={strings.reviewComposer.placeholder}
          placeholderTextColor={theme.textMuted}
          multiline
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />

        <PhotoStrip
          photos={photos}
          onRemove={handleRemovePhoto}
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

        <VisibilitySelector
          label={strings.reviewComposer.visibilityLabel}
          infoLabel={strings.reviewComposer.visibilityInfo}
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
    paddingTop: 16,
    gap: 24,
  },
  textArea: {
    minHeight: 160,
    borderBottomWidth: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
  },
});
