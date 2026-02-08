import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { MaterialIcons } from '@expo/vector-icons';
import SegmentedControl from './SegmentedControl';

const MAP_CENTER: [number, number] = [-122.4194, 37.7749];

type Props = {
  theme: {
    background: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
    accentGold: string;
    border: string;
    glass: string;
  };
  activeTab: 'feed' | 'map';
  onChangeTab: (tab: 'feed' | 'map') => void;
  strings: {
    tabFeed: string;
    tabMap: string;
    filterPeopleAll: string;
    filterContentPremium: string;
    youLabel: string;
    sampleQuote: string;
    mapTokenMissing: string;
  };
  hasToken: boolean;
  isDark: boolean;
  topInset: number;
  userCoordinate: [number, number] | null;
  onPlacePress: () => void;
};

export default function MapTab({
  theme,
  activeTab,
  onChangeTab,
  strings,
  hasToken,
  isDark,
  topInset,
  userCoordinate,
  onPlacePress,
}: Props) {
  return (
    <View style={styles.container}>
      {hasToken ? (
        <Mapbox.MapView
          style={StyleSheet.absoluteFillObject}
          styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light}
          logoEnabled={false}
          compassEnabled={false}
          attributionEnabled={false}
        >
          <Mapbox.Camera
            zoomLevel={userCoordinate ? 14 : 12}
            centerCoordinate={userCoordinate || MAP_CENTER}
          />
        </Mapbox.MapView>
      ) : (
        <View style={[styles.mapFallback, { backgroundColor: theme.background }]}> 
          <Text style={[styles.mapFallbackText, { color: theme.textMuted }]}>
            {strings.mapTokenMissing}
          </Text>
        </View>
      )}

      <View style={styles.mapOverlay} pointerEvents="box-none">
        <View style={[styles.topOverlay, { paddingTop: 16 + topInset }]} pointerEvents="box-none">
          <View
            style={[
              styles.segmentedWrap,
              { backgroundColor: theme.glass, borderColor: theme.border },
            ]}
          >
            <SegmentedControl
              value={activeTab}
              onChange={onChangeTab}
              labels={{ feed: strings.tabFeed, map: strings.tabMap }}
              textColor={theme.textMuted}
              activeTextColor="#ffffff"
              activeBackground={theme.primary}
              background="transparent"
            />
          </View>
          <View style={styles.filterRow} pointerEvents="auto">
            <Pressable style={[styles.filterChip, { backgroundColor: theme.glass }]}> 
              <Text style={[styles.filterText, { color: theme.textPrimary }]}> 
                {strings.filterPeopleAll}
              </Text>
            </Pressable>
            <Pressable style={[styles.filterChip, { backgroundColor: theme.glass }]}> 
              <Text style={[styles.filterText, { color: theme.accentGold }]}> 
                {strings.filterContentPremium}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.pinLayer} pointerEvents="none">
          <View style={[styles.userPulse, { borderColor: theme.primary }]} />
          <View style={[styles.userDot, { backgroundColor: theme.primary }]} />
          <Text style={styles.userLabel}>{strings.youLabel}</Text>

          <View style={[styles.friendPin, { left: '18%', top: '30%' }]}> 
            <View style={[styles.friendAvatar, { borderColor: theme.primary }]} />
            <View style={[styles.pinTip, { backgroundColor: theme.primary }]} />
          </View>

          <View style={[styles.friendPin, { right: '20%', top: '40%' }]}> 
            <View style={[styles.premiumAvatar, { borderColor: theme.accentGold }]} />
            <View style={[styles.pinTip, { backgroundColor: theme.accentGold }]} />
          </View>

          <View style={[styles.clusterPin, { left: '12%', bottom: '38%' }]}> 
            <Text style={[styles.clusterText, { color: theme.textPrimary }]}>+4</Text>
          </View>
        </View>

        <View style={styles.bottomOverlay} pointerEvents="box-none">
          <Pressable style={[styles.fab, { backgroundColor: theme.glass }]} onPress={() => {}}>
            <MaterialIcons name="my-location" size={20} color={theme.primary} />
          </Pressable>

          <View style={[styles.contextCard, { backgroundColor: theme.glass }]}> 
            <View style={styles.contextContent}>
              <View style={styles.contextImage} />
              <View style={styles.contextInfo}>
                <View style={styles.contextRow}>
                  <Text style={[styles.contextTitle, { color: theme.textPrimary }]}>Midnight Ramen</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>9.2</Text>
                  </View>
                </View>
                <Text style={[styles.contextMeta, { color: theme.textMuted }]}>Japanese · 0.2 mi away</Text>
                <Text style={[styles.contextQuote, { color: theme.textMuted }]}>
                  {strings.sampleQuote}
                </Text>
              </View>
              <Pressable style={[styles.contextAction, { backgroundColor: theme.primary }]} onPress={onPlacePress}>
                <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFallbackText: {
    fontSize: 13,
    fontFamily: 'NotoSans-Medium',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    paddingHorizontal: 16,
    gap: 12,
  },
  segmentedWrap: {
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
    width: 200,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'NotoSans-Medium',
  },
  pinLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    opacity: 0.3,
  },
  userDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userLabel: {
    position: 'absolute',
    bottom: '45%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#ffffff',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  friendPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: '#1c1f27',
  },
  premiumAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    backgroundColor: '#1c1f27',
  },
  pinTip: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  clusterPin: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1c1f27',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  clusterText: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 110,
    gap: 14,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  contextCard: {
    borderRadius: 16,
    padding: 14,
  },
  contextContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  contextImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#2c2f3a',
  },
  contextInfo: {
    flex: 1,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextTitle: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  ratingBadge: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    color: '#22c55e',
    fontSize: 11,
    fontFamily: 'BeVietnamPro-Bold',
  },
  contextMeta: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
  contextQuote: {
    fontSize: 11,
    marginTop: 6,
    fontFamily: 'NotoSans-Regular',
  },
  contextAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
