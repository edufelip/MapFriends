import React from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { MaterialIcons } from '@expo/vector-icons';
import type { FeatureCollection, Point } from 'geojson';
import { ReviewMapPin } from '../../../state/reviews';
import { logReviewPinDebug, logReviewPinError } from '../../../state/reviews/reviewPinLogger';
import { buildFitCoordinates, calculateFitBounds } from './mapFitBounds';
import MapReviewContextCard from './MapReviewContextCard';
import ReviewPinSvg from './ReviewPinSvg';

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
    mapTokenMissing: string;
  };
  hasToken: boolean;
  isDark: boolean;
  userCoordinate: [number, number] | null;
  locationResolved: boolean;
  reviewPins: ReviewMapPin[];
  fitTrigger?: number;
};

export default function MapTab({
  theme,
  strings,
  hasToken,
  isDark,
  userCoordinate,
  locationResolved,
  reviewPins,
  fitTrigger = 0,
}: Props) {
  const [mapLayout, setMapLayout] = React.useState<{ width: number; height: number } | null>(null);
  const cameraRef = React.useRef<{
    setCamera: (config: {
      type?: 'CameraStop';
      centerCoordinate?: [number, number];
      zoomLevel?: number;
      animationDuration?: number;
      animationMode?: 'easeTo' | 'flyTo' | 'linearTo' | 'moveTo' | 'none';
    }) => void;
    fitBounds: (
      ne: [number, number],
      sw: [number, number],
      paddingConfig?: number | number[],
      animationDuration?: number
    ) => void;
  } | null>(null);
  const lastAppliedFitKeyRef = React.useRef<string | null>(null);
  const cameraCenter = userCoordinate || MAP_CENTER;
  const cameraZoom = userCoordinate ? 14 : 12;
  const cameraKey = `${cameraCenter[0]}:${cameraCenter[1]}:${cameraZoom}`;
  const hasReviewPins = reviewPins.length > 0;
  const canRenderMap = Boolean(hasToken && mapLayout && locationResolved);
  const [selectedReviewId, setSelectedReviewId] = React.useState<string | null>(null);
  const [isContextCardMounted, setIsContextCardMounted] = React.useState(false);
  const [contextReview, setContextReview] = React.useState<ReviewMapPin | null>(null);
  const [contextCardHeight, setContextCardHeight] = React.useState(112);
  const contextCardAnimation = React.useRef(new Animated.Value(0)).current;
  const animationRunIdRef = React.useRef(0);

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

  const fitCoordinates = React.useMemo(
    () => buildFitCoordinates(reviewPins, userCoordinate),
    [reviewPins, userCoordinate]
  );

  const fitBounds = React.useMemo(() => calculateFitBounds(fitCoordinates), [fitCoordinates]);
  const selectedReview = React.useMemo(() => {
    if (!selectedReviewId) {
      return null;
    }

    return reviewPins.find((pin) => pin.reviewId === selectedReviewId) || null;
  }, [reviewPins, selectedReviewId]);

  const fitRequestKey = React.useMemo(() => {
    if (!canRenderMap || !hasReviewPins || !fitBounds || !mapLayout) {
      return null;
    }

    return [
      fitTrigger,
      mapLayout.width,
      mapLayout.height,
      fitBounds.sw[0],
      fitBounds.sw[1],
      fitBounds.ne[0],
      fitBounds.ne[1],
      fitBounds.pointCount,
    ].join(':');
  }, [canRenderMap, fitBounds, fitTrigger, hasReviewPins, mapLayout]);

  React.useEffect(() => {
    logReviewPinDebug('step6-map-render-gate', {
      hasToken,
      locationResolved,
      hasMapLayout: Boolean(mapLayout),
      layout: mapLayout ? `${mapLayout.width}x${mapLayout.height}` : null,
      canRenderMap,
      reviewPinsReceived: reviewPins.length,
    });
  }, [canRenderMap, hasToken, locationResolved, mapLayout, reviewPins.length]);

  React.useEffect(() => {
    logReviewPinDebug('step6-camera-state', {
      centerCoordinate: cameraCenter,
      zoomLevel: cameraZoom,
      hasUserCoordinate: Boolean(userCoordinate),
    });
  }, [cameraCenter, cameraZoom, userCoordinate]);

  React.useEffect(() => {
    if (reviewPins.length === 0) {
      logReviewPinDebug('step6-review-shape-source', {
        featureCount: 0,
        reason: 'no-review-pins',
      });
      return;
    }

    logReviewPinDebug('step6-review-shape-source', {
      featureCount: reviewPins.length,
      sampleReviewIds: reviewPins
        .slice(0, 8)
        .map((pin) => String(pin.reviewId || pin.id || 'unknown')),
    });
  }, [reviewPins]);

  React.useEffect(() => {
    if (!fitRequestKey || !fitBounds || !canRenderMap || !hasReviewPins) {
      return;
    }

    if (lastAppliedFitKeyRef.current === fitRequestKey) {
      return;
    }

    const camera = cameraRef.current;
    if (!camera) {
      logReviewPinDebug('step6-fit-bounds-skipped', {
        reason: 'camera-not-ready',
        fitRequestKey,
        pointCount: fitBounds.pointCount,
      });
      return;
    }

    const padding: [number, number, number, number] = [132, 44, 264, 44];

    try {
      camera.fitBounds(fitBounds.ne, fitBounds.sw, padding, 0);
      lastAppliedFitKeyRef.current = fitRequestKey;
      logReviewPinDebug('step6-fit-bounds-applied', {
        fitRequestKey,
        pointCount: fitBounds.pointCount,
        sw: fitBounds.sw,
        ne: fitBounds.ne,
        includesUserCoordinate: Boolean(userCoordinate),
        padding,
      });
    } catch (error) {
      logReviewPinError('step6-fit-bounds-error', error, {
        fitRequestKey,
        pointCount: fitBounds.pointCount,
      });
    }
  }, [canRenderMap, fitBounds, fitRequestKey, hasReviewPins, userCoordinate]);

  React.useEffect(() => {
    if (!selectedReviewId || selectedReview) {
      return;
    }

    setSelectedReviewId(null);
    logReviewPinDebug('step6-review-card-cleared', {
      reason: 'selected-review-not-in-current-pins',
      reviewId: selectedReviewId,
    });
  }, [selectedReview, selectedReviewId]);

  React.useEffect(() => {
    if (!selectedReview) {
      return;
    }
    setContextReview(selectedReview);
  }, [selectedReview]);

  React.useEffect(() => {
    const hasSelection = Boolean(selectedReview);
    const runId = animationRunIdRef.current + 1;
    animationRunIdRef.current = runId;

    contextCardAnimation.stopAnimation();

    if (hasSelection) {
      if (!isContextCardMounted) {
        setIsContextCardMounted(true);
      }
      Animated.timing(contextCardAnimation, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    if (!isContextCardMounted) {
      setContextReview(null);
      return;
    }

    Animated.timing(contextCardAnimation, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || animationRunIdRef.current !== runId) {
        return;
      }
      setIsContextCardMounted(false);
      setContextReview(null);
    });
  }, [contextCardAnimation, isContextCardMounted, selectedReview]);

  const handleMyLocationPress = React.useCallback(() => {
    if (!userCoordinate) {
      logReviewPinDebug('step6-my-location-pressed', {
        hasUserCoordinate: false,
        recentered: false,
      });
      return;
    }

    const camera = cameraRef.current;
    if (!camera) {
      logReviewPinDebug('step6-my-location-pressed', {
        hasUserCoordinate: true,
        recentered: false,
        reason: 'camera-not-ready',
      });
      return;
    }

    camera.setCamera({
      type: 'CameraStop',
      centerCoordinate: userCoordinate,
      zoomLevel: 14,
      animationDuration: 420,
      animationMode: 'easeTo',
    });
    logReviewPinDebug('step6-my-location-pressed', {
      hasUserCoordinate: true,
      recentered: true,
      centerCoordinate: userCoordinate,
      zoomLevel: 14,
    });
  }, [userCoordinate]);

  const handleReviewPinPress = React.useCallback((reviewId: string) => {
    setSelectedReviewId(reviewId);
    logReviewPinDebug('step6-review-pin-selected', {
      reviewId,
    });
  }, []);

  const handleCloseReviewCard = React.useCallback(() => {
    setSelectedReviewId(null);
  }, []);

  const contextCardAnimatedStyle = React.useMemo(
    () => ({
      opacity: contextCardAnimation,
      transform: [
        {
          translateY: contextCardAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 0],
          }),
        },
      ],
    }),
    [contextCardAnimation]
  );

  const fabAnimatedStyle = React.useMemo(
    () => ({
      transform: [
        {
          translateY: contextCardAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -(contextCardHeight + 14)],
          }),
        },
      ],
    }),
    [contextCardAnimation, contextCardHeight]
  );

  const handleContextCardLayout = React.useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const nextHeight = event.nativeEvent.layout.height;
      if (nextHeight <= 0) {
        return;
      }
      setContextCardHeight((prev) =>
        Math.abs(prev - nextHeight) < 1 ? prev : nextHeight
      );
    },
    []
  );

  return (
    <View style={styles.container} onLayout={handleLayout} testID="map-tab-root">
      {canRenderMap && mapLayout ? (
        <Mapbox.MapView
          style={[styles.mapView, { width: mapLayout.width, height: mapLayout.height }]}
          styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light}
          logoEnabled={false}
          compassEnabled={false}
          attributionEnabled={false}
        >
          <Mapbox.Camera
            ref={cameraRef}
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
          {reviewPins.map((pin) => (
            <Mapbox.MarkerView
              key={pin.id}
              coordinate={pin.coordinates}
              anchor={{ x: 0.5, y: 1 }}
              allowOverlap
            >
              <Pressable
                testID={`map-review-pin-${pin.reviewId}`}
                onPress={() => handleReviewPinPress(pin.reviewId)}
                hitSlop={12}
                style={styles.reviewPinPressable}
              >
                <ReviewPinSvg width={38} height={38} />
              </Pressable>
            </Mapbox.MarkerView>
          ))}
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
          <Animated.View testID="map-my-location-fab-animated" style={fabAnimatedStyle}>
            <Pressable
              testID="map-my-location-fab"
              style={[styles.fab, { backgroundColor: theme.glass }]}
              onPress={handleMyLocationPress}
            >
              <MaterialIcons name="my-location" size={20} color={theme.primary} />
            </Pressable>
          </Animated.View>
          {isContextCardMounted && contextReview ? (
            <Animated.View
              testID="map-review-context-card-animated"
              style={[styles.contextCardSlot, contextCardAnimatedStyle]}
              onLayout={handleContextCardLayout}
              pointerEvents={selectedReview ? 'auto' : 'none'}
            >
              <MapReviewContextCard
                theme={{
                  glass: theme.glass,
                  textPrimary: theme.textPrimary,
                  textMuted: theme.textMuted,
                }}
                review={contextReview}
                onClose={handleCloseReviewCard}
              />
            </Animated.View>
          ) : null}
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
    minHeight: 48,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  reviewPinPressable: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextCardSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
