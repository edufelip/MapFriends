import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FeedPost } from '../../../services/feed';
import FeedCard from './FeedCard';
import PremiumFeedCard from './PremiumFeedCard';
import SegmentedControl from './SegmentedControl';

const keyExtractor = (item: FeedPost) => item.id;

type Props = {
  posts: FeedPost[];
  value: 'feed' | 'map';
  onChange: (value: 'feed' | 'map') => void;
  onCreate: () => void;
  theme: {
    background: string;
    surface: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
    accentGold: string;
    border: string;
  };
  strings: {
    title: string;
    tabFeed: string;
    tabMap: string;
    more: string;
    premiumLabel: string;
    premiumTitle: string;
    premiumDesc: string;
    premiumCta: string;
  };
  topInset: number;
  bottomInset: number;
};

export default function FeedTab({
  posts,
  value,
  onChange,
  onCreate,
  theme,
  strings,
  topInset,
  bottomInset,
}: Props) {
  const renderItem = ({ item }: { item: FeedPost }) =>
    item.premium ? (
      <PremiumFeedCard
        post={item}
        theme={{
          textPrimary: theme.textPrimary,
          textMuted: theme.textMuted,
          primary: theme.primary,
          accentGold: theme.accentGold,
          surface: theme.surface,
        }}
        labels={{
          premium: strings.premiumLabel,
          title: strings.premiumTitle,
          desc: strings.premiumDesc,
          cta: strings.premiumCta,
        }}
      />
    ) : (
      <FeedCard
        post={item}
        theme={{
          textPrimary: theme.textPrimary,
          textMuted: theme.textMuted,
          primary: theme.primary,
          border: theme.border,
          surface: theme.surface,
        }}
        moreLabel={strings.more}
      />
    );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.background, paddingTop: 14 + topInset, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{strings.title}</Text>
          <Pressable style={styles.notification}>
            <MaterialIcons name="notifications" size={20} color={theme.textMuted} />
            <View style={styles.dot} />
          </Pressable>
        </View>
        <SegmentedControl
          value={value}
          onChange={onChange}
          labels={{ feed: strings.tabFeed, map: strings.tabMap }}
          textColor={theme.textMuted}
          activeTextColor={theme.textPrimary}
          activeBackground={theme.background}
          background={theme.surface}
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        windowSize={7}
        removeClippedSubviews
      />

      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary, bottom: 110 + bottomInset }]}
        onPress={onCreate}
      >
        <MaterialIcons name="add" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'BeVietnamPro-Bold',
  },
  notification: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#135bec',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
});
