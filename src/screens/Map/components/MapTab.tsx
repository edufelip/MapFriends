import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { MaterialIcons } from '@expo/vector-icons';
import type { FeatureCollection, Point } from 'geojson';
import { ReviewMapPin } from '../../../state/reviews';

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
  strings: {
    sampleQuote: string;
    mapTokenMissing: string;
  };
  hasToken: boolean;
  isDark: boolean;
  userCoordinate: [number, number] | null;
  locationResolved: boolean;
  reviewPins: ReviewMapPin[];
  onPlacePress: () => void;
};

export default function MapTab({
  theme,
  strings,
  hasToken,
  isDark,
  userCoordinate,
  locationResolved,
  reviewPins,
  onPlacePress,
}: Props) {
  const [mapLayout, setMapLayout] = React.useState<{ width: number; height: number } | null>(null);
  const cameraCenter = userCoordinate || MAP_CENTER;
  const cameraZoom = userCoordinate ? 14 : 12;
  const cameraKey = `${cameraCenter[0]}:${cameraCenter[1]}:${cameraZoom}`;

  const handleLayout = React.useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = event.nativeEvent.layout;
      if (width <= 0 || height <= 0) {
        setMapLayout(null);
        return;
      }
      setMapLayout((prev) => {
        if (prev && prev.width === width && prev.height === height) {
          return prev;
        }
        return { width, height };
      });
    },
    []
  );

  const userPinShape = React.useMemo(() => {
    if (!userCoordinate) {
      return null;
    }
    const featureCollection: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'user-location-pin',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: userCoordinate,
          },
        },
      ],
    };
    return featureCollection;
  }, [userCoordinate]);

  const reviewPinsShape = React.useMemo(() => {
    if (reviewPins.length === 0) {
      return null;
    }

    const featureCollection: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: reviewPins.map((pin) => ({
        type: 'Feature',
        id: pin.id,
        properties: {
          title: pin.title,
          rating: pin.rating,
          reviewId: pin.reviewId,
          placeId: pin.placeId,
        },
        geometry: {
          type: 'Point',
          coordinates: pin.coordinates,
        },
      })),
    };

    return featureCollection;
  }, [reviewPins]);

  return (
    <View style={styles.container} onLayout={handleLayout} testID="map-tab-root">
      {hasToken && mapLayout && locationResolved ? (
        <Mapbox.MapView
          style={[styles.mapView, { width: mapLayout.width, height: mapLayout.height }]}
          styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light}
          logoEnabled={false}
          compassEnabled={false}
          attributionEnabled={false}
        >
          <Mapbox.Camera
            key={cameraKey}
            defaultSettings={{
              centerCoordinate: cameraCenter,
              zoomLevel: cameraZoom,
            }}
            animationDuration={0}
          />
          {userPinShape ? (
            <Mapbox.ShapeSource id="user-location-source" shape={userPinShape}>
              <Mapbox.CircleLayer
                id="user-location-ring"
                style={{
                  circleRadius: 10,
                  circleColor: 'rgba(19,91,236,0.28)',
                  circleStrokeWidth: 0,
                  circlePitchAlignment: 'map',
                }}
              />
              <Mapbox.CircleLayer
                id="user-location-dot"
                style={{
                  circleRadius: 5,
                  circleColor: '#135bec',
                  circleStrokeColor: '#ffffff',
                  circleStrokeWidth: 2,
                  circlePitchAlignment: 'map',
                }}
              />
            </Mapbox.ShapeSource>
          ) : null}
          {reviewPinsShape ? (
            <Mapbox.ShapeSource id="review-pins-source" shape={reviewPinsShape}>
              <Mapbox.CircleLayer
                id="review-pin-shadow"
                style={{
                  circleRadius: 10,
                  circleColor: 'rgba(0,0,0,0.2)',
                  circleTranslate: [0, 2],
                  circlePitchAlignment: 'map',
                }}
              />
              <Mapbox.CircleLayer
                id="review-pin-dot"
                style={{
                  circleRadius: 8,
                  circleColor: '#f59e0b',
                  circleStrokeColor: '#ffffff',
                  circleStrokeWidth: 2,
                  circlePitchAlignment: 'map',
                }}
              />
              <Mapbox.CircleLayer
                id="review-pin-core"
                style={{
                  circleRadius: 2.5,
                  circleColor: '#ffffff',
                  circlePitchAlignment: 'map',
                }}
              />
            </Mapbox.ShapeSource>
          ) : null}
        </Mapbox.MapView>
      ) : (
        <>
          {!hasToken ? (
            <View style={[styles.mapFallback, { backgroundColor: theme.background }]}>
              <Text style={[styles.mapFallbackText, { color: theme.textMuted }]}>
                {strings.mapTokenMissing}
              </Text>
            </View>
          ) : (
            <View style={[styles.mapLoading, { backgroundColor: theme.background }]}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          )}
        </>
      )}

      <View style={styles.mapOverlay} pointerEvents="box-none">
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
  mapView: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoading: {
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
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 126,
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
