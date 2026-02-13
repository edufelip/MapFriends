import React from 'react';
import { Animated, Easing, StyleSheet, View, useColorScheme } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../services/auth';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import { Routes } from '../../app/routes';
import BottomNav from '../Map/components/BottomNav';
import MapHomeScreen from '../Map/MapHomeScreen';
import ExploreScreen from '../Explore/ExploreScreen';
import NotificationsScreen from '../Notifications/NotificationsScreen';
import ProfileScreen from '../Profile/ProfileScreen';

type Props = NativeStackScreenProps<any>;
type MainTab = 'home' | 'explore' | 'activity' | 'profile';
type MainTabVisitState = Record<MainTab, boolean>;

const MAIN_TABS: MainTab[] = ['home', 'explore', 'activity', 'profile'];

export const shouldRenderMainTabLayer = (
  visitedTabs: MainTabVisitState,
  tab: MainTab,
  activeTab: MainTab
) => visitedTabs[tab] || tab === activeTab;

export default function MainShellScreen({ navigation, route }: Props) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<MainTab>('home');
  const [homeMode, setHomeMode] = React.useState<'feed' | 'map'>('map');
  const [visitedTabs, setVisitedTabs] = React.useState<MainTabVisitState>({
    home: true,
    explore: false,
    activity: false,
    profile: false,
  });
  const contentOpacity = React.useRef(new Animated.Value(1)).current;
  const navBackgroundTransition = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev[activeTab]) {
        return prev;
      }

      return {
        ...prev,
        [activeTab]: true,
      };
    });
  }, [activeTab]);

  React.useEffect(() => {
    contentOpacity.setValue(0);
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, contentOpacity]);

  React.useEffect(() => {
    const toValue = activeTab === 'home' && homeMode === 'feed' ? 1 : 0;
    Animated.timing(navBackgroundTransition, {
      toValue,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeTab, homeMode, navBackgroundTransition]);

  const navGlassColor = navBackgroundTransition.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.glass || 'rgba(16,22,34,0.8)', '#ffffff'],
  });

  const bottomNavTheme = React.useMemo(
    () => ({
      glass: navGlassColor,
      border: theme.border,
      primary: theme.primary,
      textMuted: theme.textMuted,
      surface: theme.surface,
      textPrimary: theme.textPrimary,
    }),
    [navGlassColor, theme.border, theme.primary, theme.surface, theme.textMuted, theme.textPrimary]
  );

  const bottomNavLabels = React.useMemo(
    () => ({
      home: strings.home.navHome,
      explore: strings.home.navExplore,
      activity: strings.home.navActivity,
      profile: strings.home.navProfile,
    }),
    [
      strings.home.navActivity,
      strings.home.navExplore,
      strings.home.navHome,
      strings.home.navProfile,
    ]
  );

  const handleMainTabSelect = React.useCallback((nextTab: MainTab) => {
    setVisitedTabs((prev) => {
      if (prev[nextTab]) {
        return prev;
      }
      return {
        ...prev,
        [nextTab]: true,
      };
    });
    setActiveTab(nextTab);
  }, []);

  const renderTabContent = React.useCallback(
    (tab: MainTab) => {
      switch (tab) {
        case 'home':
          return (
            <MapHomeScreen
              navigation={navigation}
              route={route}
              hideBottomNav
              homeMode={homeMode}
              onHomeModeChange={setHomeMode}
            />
          );
        case 'explore':
          return <ExploreScreen navigation={navigation} route={route} hideBottomNav />;
        case 'activity':
          return <NotificationsScreen navigation={navigation} route={route} variant="panel" />;
        case 'profile':
        default:
          return <ProfileScreen navigation={navigation} route={route} hideBottomNav />;
      }
    },
    [homeMode, navigation, route]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      {MAIN_TABS.map((tab) => {
        if (!shouldRenderMainTabLayer(visitedTabs, tab, activeTab)) {
          return null;
        }

        const isActive = activeTab === tab;

        return (
          <Animated.View
            key={tab}
            style={[styles.contentLayer, { opacity: isActive ? contentOpacity : 0 }]}
            pointerEvents={isActive ? 'auto' : 'none'}
            testID={`main-shell-tab-${tab}`}
          >
            {renderTabContent(tab)}
          </Animated.View>
        );
      })}

      <BottomNav
        active={activeTab}
        onSelect={handleMainTabSelect}
        onPrimaryPress={() => navigation.navigate(Routes.ShareReview)}
        theme={bottomNavTheme}
        labels={bottomNavLabels}
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
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
