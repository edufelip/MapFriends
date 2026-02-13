import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  return (
    <View style={[styles.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChangeTab('settings')}
        style={[
          styles.tab,
          activeTab === 'settings' && { backgroundColor: `${theme.primary}18` },
        ]}
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
      <Pressable
        accessibilityRole="button"
        onPress={() => onChangeTab('favorites')}
        style={[
          styles.tab,
          activeTab === 'favorites' && { backgroundColor: `${theme.primary}18` },
        ]}
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
