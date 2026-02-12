import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SearchPlace } from '../../../services/search';

type Props = {
  place: SearchPlace;
  theme: {
    surface: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
    accentGold: string;
    border: string;
  };
};

export default function PlaceCard({ place, theme }: Props) {
  const hasImage = Boolean(place.image);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.imageWrap}>
        {hasImage ? (
          <Image source={{ uri: place.image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}
        {place.isPremium ? (
          <View style={[styles.premiumBadge, { backgroundColor: theme.accentGold }]}>
            <MaterialIcons name="star" size={12} color="#0f172a" />
          </View>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={[styles.category, { color: theme.textMuted }]} numberOfLines={1}>
          {place.category} · {place.location}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageWrap: {
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: '#dbe4ee',
  },
  premiumBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    borderRadius: 999,
    padding: 6,
  },
  meta: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  category: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'NotoSans-Medium',
  },
});
