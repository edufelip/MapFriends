import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Routes } from '../../../app/routes';

type Props = {
  navigation?: any;
  active: 'home' | 'explore' | 'activity' | 'profile';
  onSelect?: (tab: 'home' | 'explore' | 'activity' | 'profile') => void;
  onPrimaryPress?: () => void;
  theme: {
    glass: string | Animated.AnimatedInterpolation<string>;
    border: string;
    primary: string;
    textMuted: string;
    surface: string;
    textPrimary: string;
  };
  labels: {
    home: string;
    explore: string;
    activity: string;
    profile: string;
  };
  user?: { name?: string; avatar?: string | null } | null;
  bottomInset: number;
};

function BottomNav({
  navigation,
  active,
  onSelect,
  onPrimaryPress,
  theme,
  labels,
  bottomInset,
}: Props) {
  const selectorX = React.useRef(new Animated.Value(0)).current;
  const [selectorWidth, setSelectorWidth] = React.useState(52);
  const [tabLayouts, setTabLayouts] = React.useState<Partial<Record<Props['active'], { x: number; width: number }>>>({});

  const updateTabLayout = React.useCallback(
    (tab: Props['active'], x: number, width: number) => {
      setTabLayouts((prev) => {
        const existing = prev[tab];
        if (existing && existing.x === x && existing.width === width) {
          return prev;
        }
        return { ...prev, [tab]: { x, width } };
      });
    },
    []
  );

  React.useEffect(() => {
    const target = tabLayouts[active];
    if (!target) {
      return;
    }
    setSelectorWidth(target.width);
    Animated.timing(selectorX, {
      toValue: target.x,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [active, selectorX, tabLayouts]);

  const colorFor = (key: Props['active']) => (active === key ? theme.primary : theme.textMuted);
  const selectTab = React.useCallback(
    (tab: Props['active']) => {
      if (onSelect) {
        onSelect(tab);
        return;
      }

      if (!navigation) {
        return;
      }

      const routeByTab: Record<Props['active'], string> = {
        home: Routes.MainShell,
        explore: Routes.Explore,
        activity: Routes.Notifications,
        profile: Routes.Profile,
      };
      navigation.navigate(routeByTab[tab]);
    },
    [navigation, onSelect]
  );

  const handlePrimaryPress = React.useCallback(() => {
    if (onPrimaryPress) {
      onPrimaryPress();
      return;
    }
    if (navigation) {
      navigation.navigate(Routes.ShareReview);
    }
  }, [navigation, onPrimaryPress]);

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: 16 + bottomInset },
      ]}
      testID="bottom-nav-wrapper"
    >
      <Animated.View
        style={[
          styles.track,
          { backgroundColor: theme.glass, borderColor: theme.border },
        ]}
        testID="bottom-nav-track"
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.selector,
            {
              width: selectorWidth,
              backgroundColor: `${theme.primary}22`,
              transform: [{ translateX: selectorX }],
            },
          ]}
        />
        <Pressable
          style={styles.navItem}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            updateTabLayout('home', x, width);
          }}
          onPress={() => selectTab('home')}
        >
          <MaterialIcons name="map" size={22} color={colorFor('home')} />
          <Text style={[styles.navLabel, { color: colorFor('home') }]}>{labels.home}</Text>
        </Pressable>
        <Pressable
          style={styles.navItem}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            updateTabLayout('explore', x, width);
          }}
          onPress={() => selectTab('explore')}
        >
          <MaterialIcons name="search" size={22} color={colorFor('explore')} />
          <Text style={[styles.navLabel, { color: colorFor('explore') }]}>{labels.explore}</Text>
        </Pressable>
        <View style={styles.centerSpacer} />
        <Pressable
          style={styles.navItem}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            updateTabLayout('activity', x, width);
          }}
          onPress={() => selectTab('activity')}
        >
          <MaterialIcons name="notifications" size={22} color={colorFor('activity')} />
          <Text style={[styles.navLabel, { color: colorFor('activity') }]}>{labels.activity}</Text>
        </Pressable>
        <Pressable
          style={styles.navItem}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            updateTabLayout('profile', x, width);
          }}
          onPress={() => selectTab('profile')}
        >
          <View style={styles.navIconShell}>
            <MaterialIcons name="person" size={20} color={colorFor('profile')} />
          </View>
          <Text style={[styles.navLabel, { color: colorFor('profile') }]}>{labels.profile}</Text>
        </Pressable>
      </Animated.View>

      <Pressable
        style={[styles.navPrimary, { backgroundColor: theme.primary }]}
        onPress={handlePrimaryPress}
        testID="bottom-nav-primary"
      >
        <MaterialIcons name="add-location-alt" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
}

export default React.memo(BottomNav);

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    overflow: 'visible',
  },
  track: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  centerSpacer: {
    width: 52,
  },
  selector: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 0,
    borderRadius: 14,
  },
  navItem: {
    alignItems: 'center',
    width: 52,
    gap: 4,
    zIndex: 1,
  },
  navLabel: {
    fontSize: 10,
    fontFamily: 'NotoSans-Medium',
  },
  navPrimary: {
    position: 'absolute',
    left: '50%',
    marginLeft: -26,
    top: -14,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 4,
  },
  navIconShell: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
