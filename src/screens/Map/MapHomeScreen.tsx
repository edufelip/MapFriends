import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../services/auth';
import { getFeedPosts } from '../../services/feed';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import FeedTab from './components/FeedTab';
import MapTab from './components/MapTab';
import BottomNav from './components/BottomNav';
import { Routes } from '../../app/routes';

export default function MapHomeScreen({ navigation }: NativeStackScreenProps<any>) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const { user } = useAuth();
  const posts = getFeedPosts();
  const [activeTab, setActiveTab] = React.useState<'feed' | 'map'>('map');
  const insets = useSafeAreaInsets();

  const hasToken = Boolean(process.env.EXPO_PUBLIC_MAPBOX_TOKEN);
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={[styles.mapLayer, { opacity: activeTab === 'map' ? 1 : 0 }]}> 
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
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          strings={{
            tabFeed: strings.home.tabFeed,
            tabMap: strings.home.tabMap,
            filterPeopleAll: strings.home.filterPeopleAll,
            filterContentPremium: strings.home.filterContentPremium,
            youLabel: strings.home.youLabel,
            sampleQuote: strings.home.sampleQuote,
            mapTokenMissing: strings.home.mapTokenMissing,
          }}
          hasToken={hasToken}
          isDark={isDark}
          topInset={insets.top}
          onPlacePress={() => navigation.navigate(Routes.PlaceDetail, { placeId: 'place-001' })}
        />
      </View>

      <View
        style={[
          styles.feedLayer,
          {
            opacity: activeTab === 'feed' ? 1 : 0,
            pointerEvents: activeTab === 'feed' ? 'auto' : 'none',
          },
        ]}
      >
        <FeedTab
          posts={posts}
          value={activeTab}
          onChange={setActiveTab}
          onCreate={() => navigation.navigate(Routes.ShareReview)}
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
            tabFeed: strings.home.tabFeed,
            tabMap: strings.home.tabMap,
            more: strings.home.feedMore,
            premiumLabel: strings.home.feedPremiumLabel,
            premiumTitle: strings.home.feedPremiumTitle,
            premiumDesc: strings.home.feedPremiumDesc,
            premiumCta: strings.home.feedPremiumCta,
          }}
          topInset={insets.top}
          bottomInset={insets.bottom}
        />
      </View>

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
});
