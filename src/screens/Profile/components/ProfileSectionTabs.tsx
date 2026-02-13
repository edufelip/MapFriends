import React from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

type TabKey = 'settings' | 'favorites';

type Props = {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  labels: {
    settings: string;
    favorites: string;
  };
  theme: {
    surface: string;
    border: string;
    primary: string;
    textPrimary: string;
    textMuted: string;
  };
};

export default function ProfileSectionTabs({ activeTab, onChangeTab, labels, theme }: Props) {
  const indicatorProgress = React.useRef(new Animated.Value(activeTab === 'favorites' ? 0 : 1)).current;
  const [wrapWidth, setWrapWidth] = React.useState(0);

  React.useEffect(() => {
    Animated.timing(indicatorProgress, {
      toValue: activeTab === 'favorites' ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, indicatorProgress]);

  const indicatorWidth = React.useMemo(() => {
    if (wrapWidth <= 8) {
      return 0;
    }

    return (wrapWidth - 8) / 2;
  }, [wrapWidth]);

  return (
    <View
      style={[styles.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onLayout={(event) => {
        setWrapWidth(event.nativeEvent.layout.width);
      }}
    >
      {indicatorWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeTabIndicator,
            {
              width: indicatorWidth,
              backgroundColor: `${theme.primary}18`,
              transform: [
                {
                  translateX: indicatorProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, indicatorWidth],
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        testID="profile-section-tab-favorites"
        onPress={() => onChangeTab('favorites')}
        style={styles.tab}
      >
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'favorites' ? theme.primary : theme.textMuted },
          ]}
        >
          {labels.favorites}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        testID="profile-section-tab-settings"
        onPress={() => onChangeTab('settings')}
        style={styles.tab}
      >
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'settings' ? theme.primary : theme.textMuted },
          ]}
        >
          {labels.settings}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    flexDirection: 'row',
    alignSelf: 'center',
    width: '100%',
    position: 'relative',
  },
  activeTabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: 'NotoSans-Bold',
  },
});
