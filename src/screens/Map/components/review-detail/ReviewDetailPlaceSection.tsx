import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  placeTitle: string;
  placeMeta: string;
  address: string;
  onPressMap: () => void;
  labels: {
    location: string;
    mapAction: string;
  };
  theme: {
    textPrimary: string;
    textMuted: string;
    primary: string;
    surfaceMuted: string;
    border: string;
  };
};

export default function ReviewDetailPlaceSection({
  placeTitle,
  placeMeta,
  address,
  onPressMap,
  labels,
  theme,
}: Props) {
  return (
    <View>
      <Text style={[styles.placeTitle, { color: theme.textPrimary }]}>{placeTitle}</Text>
      {placeMeta ? <Text style={[styles.placeMeta, { color: theme.textMuted }]}>{placeMeta}</Text> : null}

      <View style={[styles.locationCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}> 
        <View style={styles.locationInfo}>
          <View style={[styles.locationIconWrap, { backgroundColor: `${theme.primary}12` }]}> 
            <MaterialIcons name="location-on" size={18} color={theme.primary} />
          </View>
          <View style={styles.locationTextWrap}>
            <Text style={[styles.locationLabel, { color: theme.textMuted }]}>{labels.location}</Text>
            <Text style={[styles.locationAddress, { color: theme.textPrimary }]} numberOfLines={2}>
              {address}
            </Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={onPressMap} style={styles.mapAction}>
          <Text style={[styles.mapActionText, { color: theme.primary }]}>{labels.mapAction}</Text>
          <MaterialIcons name="open-in-new" size={14} color={theme.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeTitle: {
    marginTop: 12,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.1,
    fontFamily: 'BeVietnamPro-Bold',
  },
  placeMeta: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'NotoSans-Medium',
  },
  locationCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrap: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'NotoSans-Bold',
  },
  locationAddress: {
    marginTop: 1,
    fontSize: 13,
    fontFamily: 'NotoSans-Medium',
  },
  mapAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 2,
  },
  mapActionText: {
    fontSize: 13,
    fontFamily: 'NotoSans-Bold',
  },
});
