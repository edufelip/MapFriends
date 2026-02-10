import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FeedPost } from '../../../services/feed';
import FeedCard from './FeedCard';
import PremiumFeedCard from './PremiumFeedCard';

const keyExtractor = (item: FeedPost) => item.id;

type Props = {
  posts: FeedPost[];
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
      <FlatList
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingTop: 84 + topInset, paddingBottom: 80 + bottomInset }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
