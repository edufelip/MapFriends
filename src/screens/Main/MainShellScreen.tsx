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

const TAB_INDEX: Record<MainTab, number> = {
  home: 0,
  explore: 1,
  activity: 2,
  profile: 3,
};

export default function MainShellScreen({ navigation, route }: Props) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<MainTab>('home');
  const [homeMode, setHomeMode] = React.useState<'feed' | 'map'>('map');
  const transition = React.useRef(new Animated.Value(TAB_INDEX.home)).current;
  const navBackgroundTransition = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(transition, {
      toValue: TAB_INDEX[activeTab],
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, transition]);

  React.useEffect(() => {
    const toValue = activeTab === 'home' && homeMode === 'feed' ? 1 : 0;
    Animated.timing(navBackgroundTransition, {
      toValue,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeTab, homeMode, navBackgroundTransition]);

  const homeOpacity = transition.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [1, 0, 0, 0],
  });
  const exploreOpacity = transition.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, 1, 0, 0],
  });
  const activityOpacity = transition.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, 0, 1, 0],
  });
  const profileOpacity = transition.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, 0, 0, 1],
  });
  const navGlassColor = navBackgroundTransition.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.glass || 'rgba(16,22,34,0.8)', '#ffffff'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <Animated.View style={[styles.layer, { opacity: homeOpacity }]} pointerEvents={activeTab === 'home' ? 'auto' : 'none'}>
        <MapHomeScreen
          navigation={navigation}
          route={route}
          hideBottomNav
          homeMode={homeMode}
          onHomeModeChange={setHomeMode}
        />
      </Animated.View>

      <Animated.View style={[styles.layer, { opacity: exploreOpacity }]} pointerEvents={activeTab === 'explore' ? 'auto' : 'none'}>
        <ExploreScreen navigation={navigation} route={route} hideBottomNav />
      </Animated.View>

      <Animated.View style={[styles.layer, { opacity: activityOpacity }]} pointerEvents={activeTab === 'activity' ? 'auto' : 'none'}>
        <NotificationsScreen navigation={navigation} route={route} variant="panel" />
      </Animated.View>

      <Animated.View style={[styles.layer, { opacity: profileOpacity }]} pointerEvents={activeTab === 'profile' ? 'auto' : 'none'}>
        <ProfileScreen navigation={navigation} route={route} hideBottomNav />
      </Animated.View>

      <BottomNav
        active={activeTab}
        onSelect={setActiveTab}
        onPrimaryPress={() => navigation.navigate(Routes.ShareReview)}
        theme={{
          glass: navGlassColor,
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
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
