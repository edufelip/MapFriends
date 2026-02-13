import React from 'react';
import { FlatList, Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  imageUris: string[];
  premium: boolean;
  premiumLabel: string;
  noPhotoLabel: string;
  theme: {
    surfaceMuted: string;
    textMuted: string;
  };
};

export default function ReviewDetailGallery({
  imageUris,
  premium,
  premiumLabel,
  noPhotoLabel,
  theme,
}: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [galleryWidth, setGalleryWidth] = React.useState(0);

  const images = React.useMemo(() => (imageUris.length > 0 ? imageUris : [null]), [imageUris]);

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);
    if (nextWidth > 0) {
      setGalleryWidth(nextWidth);
    }
  }, []);

  const handleMomentumScroll = React.useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      if (!galleryWidth) {
        return;
      }
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / galleryWidth);
      setActiveIndex(Math.max(0, Math.min(images.length - 1, nextIndex)));
    },
    [galleryWidth, images.length]
  );

  return (
    <View style={styles.wrap} onLayout={handleLayout}>
      <FlatList
        horizontal
        pagingEnabled
        data={images}
        keyExtractor={(_, index) => `review-image-${index}`}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScroll}
        renderItem={({ item }) =>
          item ? (
            <Image
              source={{ uri: item, cache: 'force-cache' }}
              style={[styles.heroImage, galleryWidth ? { width: galleryWidth } : null]}
            />
          ) : (
            <View style={[styles.heroImage, galleryWidth ? { width: galleryWidth } : null, { backgroundColor: theme.surfaceMuted }]}>
              <MaterialIcons name="image" size={30} color={theme.textMuted} />
              <Text style={[styles.noPhotoText, { color: theme.textMuted }]}>{noPhotoLabel}</Text>
            </View>
          )
        }
      />

      <View style={styles.paginationRow}>
        {images.map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.paginationDot,
              {
                opacity: index === activeIndex ? 1 : 0.35,
              },
            ]}
          />
        ))}
      </View>

      {premium ? (
        <View style={styles.premiumBadge}>
          <MaterialIcons name="workspace-premium" size={12} color="#111827" />
          <Text style={styles.premiumBadgeText}>{premiumLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#111827',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoText: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: 'NotoSans-Medium',
  },
  paginationRow: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  premiumBadge: {
    position: 'absolute',
    left: 18,
    bottom: 20,
    borderRadius: 999,
    backgroundColor: '#facc15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumBadgeText: {
    color: '#111827',
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: 'BeVietnamPro-Bold',
  },
});
