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
  };
};

export default function PlaceRow({ place, theme }: Props) {
  const hasImage = Boolean(place.image);

  return (
    <View style={styles.row}>
      <View style={[styles.imageWrap, { backgroundColor: theme.surface }]}> 
        {hasImage ? (
          <Image source={{ uri: place.image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}
      </View>
      <View style={styles.meta}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
            {place.name}
          </Text>
          {place.isPremium ? (
            <View style={[styles.premiumBadge, { backgroundColor: theme.accentGold }]}>
              <MaterialIcons name="star" size={12} color="#0f172a" />
            </View>
          ) : null}
        </View>
        <Text style={[styles.category, { color: theme.textMuted }]} numberOfLines={1}>
          {place.category} · {place.location}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  imageWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: '#dbe4ee',
  },
  meta: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'BeVietnamPro-Bold',
  },
  category: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
  premiumBadge: {
    borderRadius: 999,
    padding: 4,
  },
});
