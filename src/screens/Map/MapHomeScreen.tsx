import React from 'react';
import {
  Alert,
  Animated,
  Easing,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../../services/auth';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import FeedTab from './components/FeedTab';
import MapTab from './components/MapTab';
import BottomNav from './components/BottomNav';
import SegmentedControl from './components/SegmentedControl';
import { Routes } from '../../app/routes';
import { createLocationPermissionStrategy } from '../../services/locationPermission/createLocationPermissionStrategy';
import { ensureLocationPermission } from '../../services/locationPermission/ensureLocationPermission';
import {
  useHydrateReviewState,
  useRefreshReviews,
  useReviewFeedPosts,
  useReviewHydrating,
  useReviewPins,
} from '../../state/reviews';

type Props = NativeStackScreenProps<any> & {
  hideBottomNav?: boolean;
  homeMode?: 'feed' | 'map';
  onHomeModeChange?: (mode: 'feed' | 'map') => void;
};

export default function MapHomeScreen({
  navigation,
  hideBottomNav = false,
  homeMode,
  onHomeModeChange,
}: Props) {
  const MIN_FEED_REFRESH_VISIBILITY_MS = 550;
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const { user } = useAuth();
  useHydrateReviewState(120, Boolean(user?.id), 2 * 60 * 1000);
  const reviewFeedPosts = useReviewFeedPosts();
  const reviewPins = useReviewPins();
  const isReviewHydrating = useReviewHydrating();
  const refreshReviews = useRefreshReviews();
  const posts = reviewFeedPosts;
  const [activeTab, setActiveTab] = React.useState<'feed' | 'map'>(homeMode || 'map');
  const [mapFitTrigger, setMapFitTrigger] = React.useState(0);
  const [isFeedPullRefreshing, setIsFeedPullRefreshing] = React.useState(false);
  const [userCoordinate, setUserCoordinate] = React.useState<[number, number] | null>(null);
  const [locationResolved, setLocationResolved] = React.useState(false);
  const currentTab = homeMode ?? activeTab;
  const tabTransition = React.useRef(new Animated.Value(currentTab === 'feed' ? 1 : 0)).current;
  const locationPermissionStrategy = React.useMemo(() => createLocationPermissionStrategy(), []);
  const insets = useSafeAreaInsets();

  const hasToken = Boolean(process.env.EXPO_PUBLIC_MAPBOX_TOKEN);
  const isDark = colorScheme === 'dark';
  const mapLayerOpacity = tabTransition.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const feedLayerOpacity = tabTransition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const requestLocationEducation = React.useCallback(async () => {
    return new Promise<boolean>((resolve) => {
      let resolved = false;
      const finalize = (value: boolean) => {
        if (resolved) {
          return;
        }
        resolved = true;
        resolve(value);
      };

      Alert.alert(
        strings.home.locationPromptTitle,
        strings.home.locationPromptMessage,
        [
          {
            text: strings.home.locationPromptNotNow,
            style: 'cancel',
            onPress: () => finalize(false),
          },
          {
            text: strings.home.locationPromptAllow,
            onPress: () => finalize(true),
          },
        ],
        {
          cancelable: true,
          onDismiss: () => finalize(false),
        }
      );
    });
  }, [
    strings.home.locationPromptAllow,
    strings.home.locationPromptMessage,
    strings.home.locationPromptNotNow,
    strings.home.locationPromptTitle,
  ]);

  const parseCoordinate = React.useCallback(
    (location: { coords?: { longitude?: number; latitude?: number } } | null | undefined) => {
      const longitude = location?.coords?.longitude;
      const latitude = location?.coords?.latitude;
      if (typeof longitude !== 'number' || typeof latitude !== 'number') {
        return null;
      }
      return [longitude, latitude] as [number, number];
    },
    []
  );

  const getCurrentCoordinate = React.useCallback(async () => {
    const lastKnown = await Location.getLastKnownPositionAsync();
    const fromLastKnown = parseCoordinate(lastKnown);
    if (fromLastKnown) {
      return fromLastKnown;
    }

    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return parseCoordinate(current);
    } catch {
      return null;
    }
  }, [parseCoordinate]);

  React.useEffect(() => {
    let mounted = true;

    const resolveLocation = async () => {
      const finalize = () => {
        if (mounted) {
          setLocationResolved(true);
        }
      };

      const hasPermission = await ensureLocationPermission({
        strategy: locationPermissionStrategy,
        requestEducation: requestLocationEducation,
      });

      if (!hasPermission) {
        finalize();
        return;
      }

      const coordinate = await getCurrentCoordinate();
      if (mounted && coordinate) {
        setUserCoordinate(coordinate);
      }
      finalize();
    };

    void resolveLocation();

    return () => {
      mounted = false;
    };
  }, [getCurrentCoordinate, locationPermissionStrategy, requestLocationEducation]);

  React.useEffect(() => {
    Animated.timing(tabTransition, {
      toValue: currentTab === 'feed' ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [currentTab, tabTransition]);

  const handleTabChange = React.useCallback(
    (nextTab: 'feed' | 'map') => {
      if (homeMode === undefined) {
        setActiveTab(nextTab);
      }
      onHomeModeChange?.(nextTab);
    },
    [homeMode, onHomeModeChange]
  );

  const handleFeedRefresh = React.useCallback(async () => {
    if (!user?.id) {
      return;
    }

    if (isFeedPullRefreshing) {
      return;
    }

    setIsFeedPullRefreshing(true);
    const startedAt = Date.now();

    try {
      await refreshReviews();
      setMapFitTrigger((prev) => prev + 1);
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = MIN_FEED_REFRESH_VISIBILITY_MS - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setIsFeedPullRefreshing(false);
    }
  }, [isFeedPullRefreshing, refreshReviews, user?.id]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <Animated.View
        style={[styles.mapLayer, { opacity: mapLayerOpacity }]}
        pointerEvents={currentTab === 'map' ? 'auto' : 'none'}
      >
        <MapTab
          theme={{
            background: theme.background,
            textPrimary: theme.textPrimary,
            textMuted: theme.textMuted,
            primary: theme.primary,
            accentGold: theme.accentGold,
            border: theme.border,
            glass: theme.glass || 'rgba(16,22,34,0.8)',
          }}
          strings={{
            mapTokenMissing: strings.home.mapTokenMissing,
          }}
          hasToken={hasToken}
          isDark={isDark}
          userCoordinate={userCoordinate}
          locationResolved={locationResolved}
          reviewPins={reviewPins}
          fitTrigger={mapFitTrigger}
          onOpenReview={(reviewId) => navigation.navigate(Routes.ReviewDetail, { reviewId })}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.feedLayer,
          {
            opacity: feedLayerOpacity,
          },
        ]}
        pointerEvents={currentTab === 'feed' ? 'auto' : 'none'}
      >
        <FeedTab
          posts={posts}
          onCreate={() => navigation.navigate(Routes.ShareReview)}
          onRefresh={handleFeedRefresh}
          onOpenReview={(reviewId) => navigation.navigate(Routes.ReviewDetail, { reviewId })}
          refreshing={currentTab === 'feed' && (isReviewHydrating || isFeedPullRefreshing)}
          theme={{
            background: theme.background,
            surface: theme.surface,
            textPrimary: theme.textPrimary,
            textMuted: theme.textMuted,
            primary: theme.primary,
            accentGold: theme.accentGold,
            border: theme.border,
          }}
          strings={{
            title: strings.home.feedTitle,
            premiumLabel: strings.home.feedPremiumLabel,
            premiumTitle: strings.home.feedPremiumTitle,
            premiumDesc: strings.home.feedPremiumDesc,
            premiumCta: strings.home.feedPremiumCta,
            emptyTitle: strings.home.feedEmptyTitle,
            emptySubtitle: strings.home.feedEmptySubtitle,
            emptyCta: strings.home.feedEmptyCta,
            emptyFootnote: strings.home.feedEmptyFootnote,
          }}
          topInset={insets.top}
          bottomInset={insets.bottom}
        />
      </Animated.View>

      <View style={[styles.modeSwitcherOverlay, { paddingTop: 16 + insets.top }]} pointerEvents="box-none">
        <View style={[styles.modeSwitcherWrap, { backgroundColor: theme.glass || 'rgba(16,22,34,0.8)', borderColor: theme.border }]}>
          <SegmentedControl
            value={currentTab}
            onChange={handleTabChange}
            labels={{ feed: strings.home.tabFeed, map: strings.home.tabMap }}
            textColor={theme.textMuted}
            activeTextColor="#ffffff"
            activeBackground={theme.primary}
            background="transparent"
          />
        </View>
      </View>

      {!hideBottomNav ? (
        <BottomNav
          navigation={navigation}
          active="home"
          theme={{
            glass: theme.glass || 'rgba(16,22,34,0.8)',
            border: theme.border,
            primary: theme.primary,
            textMuted: theme.textMuted,
            surface: theme.surface,
            textPrimary: theme.textPrimary,
          }}
          labels={{
            home: strings.home.navHome,
            explore: strings.home.navExplore,
            activity: strings.home.navActivity,
            profile: strings.home.navProfile,
          }}
          user={user}
          bottomInset={insets.bottom}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  feedLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  modeSwitcherOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 20,
  },
  modeSwitcherWrap: {
    width: 200,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
});
