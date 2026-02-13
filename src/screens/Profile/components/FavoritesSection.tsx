import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FavoriteRecord } from '../../../services/favorites';

type Props = {
  favorites: FavoriteRecord[];
  isHydrating: boolean;
  onOpenReview: (reviewId: string) => void;
  onRemoveFavorite: (reviewId: string) => void;
  strings: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptySubtitle: string;
    removeLabel: string;
  };
  theme: {
    surface: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
  };
};

const formatSavedDate = (createdAt: string) => {
  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) {
    return 'Saved recently';
  }

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (elapsedMinutes < 1) {
    return 'Saved now';
  }

  if (elapsedMinutes < 60) {
    return `Saved ${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `Saved ${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Saved ${elapsedDays}d ago`;
};

export default function FavoritesSection({
  favorites,
  isHydrating,
  onOpenReview,
  onRemoveFavorite,
  strings,
  theme,
}: Props) {
  if (isHydrating && favorites.length === 0) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{strings.emptyTitle}</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>{strings.emptySubtitle}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: theme.textPrimary }]}>{strings.title}</Text>
      <Text style={[styles.subheading, { color: theme.textMuted }]}>{strings.subtitle}</Text>
      <View style={styles.list}>
        {favorites.map((favorite) => {
          const imageUri = favorite.snapshot.reviewPhotoUrl || undefined;
          const authorAvatarUri = favorite.snapshot.reviewAuthorAvatar || undefined;

          return (
            <Pressable
              key={favorite.reviewId}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => onOpenReview(favorite.reviewId)}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.heroImage} />
              ) : (
                <View style={[styles.heroFallback, { backgroundColor: `${theme.primary}0f` }]}>
                  <MaterialIcons name="place" size={18} color={theme.primary} />
                </View>
              )}

              <View style={styles.infoWrap}>
                <View style={styles.headerRow}>
                  <Text style={[styles.placeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {favorite.snapshot.placeTitle}
                  </Text>
                  <View style={[styles.ratingChip, { backgroundColor: `${theme.primary}18` }]}>
                    <Text style={[styles.ratingText, { color: theme.primary }]}>
                      {favorite.snapshot.reviewRating.toFixed(1)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.reviewTitle, { color: theme.textMuted }]} numberOfLines={2}>
                  {favorite.snapshot.reviewNotes}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.authorRow}>
                    {authorAvatarUri ? (
                      <Image source={{ uri: authorAvatarUri }} style={styles.avatar} />
                    ) : null}
                    <Text style={[styles.metaText, { color: theme.textMuted }]} numberOfLines={1}>
                      @{favorite.snapshot.reviewAuthorHandle}
                    </Text>
                  </View>
                  <Text style={[styles.metaText, { color: theme.textMuted }]}>
                    {formatSavedDate(favorite.createdAt)}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={strings.removeLabel}
                onPress={() => onRemoveFavorite(favorite.reviewId)}
                style={styles.removeAction}
              >
                <MaterialIcons name="bookmark" size={22} color={theme.primary} />
              </Pressable>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  heading: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  subheading: {
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
  },
  list: {
    marginTop: 8,
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  heroImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  heroFallback: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoWrap: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  ratingChip: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingText: {
    fontSize: 11,
    fontFamily: 'BeVietnamPro-Bold',
  },
  reviewTitle: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'NotoSans-Regular',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  avatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 10,
    fontFamily: 'NotoSans-Regular',
  },
  removeAction: {
    padding: 6,
  },
  loadingWrap: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'BeVietnamPro-Bold',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'NotoSans-Regular',
  },
});
