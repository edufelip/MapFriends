import React from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, View } from 'react-native';
import { FeedPost } from '../../../services/feed';
import FeedCard from './FeedCard';
import FeedEmptyState from './FeedEmptyState';
import PremiumFeedCard from './PremiumFeedCard';

const keyExtractor = (item: FeedPost) => item.id;
const FEED_MEDIA_PREFETCH_LIMIT = 12;

const toPrefetchUrls = (posts: FeedPost[]) => {
  const unique = new Set<string>();

  posts.forEach((post) => {
    if (post.avatar) {
      unique.add(post.avatar);
    }

    if (post.image) {
      unique.add(post.image);
    }
  });

  return Array.from(unique).slice(0, FEED_MEDIA_PREFETCH_LIMIT);
};

type Props = {
  posts: FeedPost[];
  onCreate: () => void;
  onRefresh: () => void;
  onOpenReview: (reviewId: string) => void;
  refreshing: boolean;
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
    premiumLabel: string;
    premiumTitle: string;
    premiumDesc: string;
    premiumCta: string;
    emptyTitle: string;
    emptySubtitle: string;
    emptyCta: string;
    emptyFootnote: string;
  };
  topInset: number;
  bottomInset: number;
};

export default function FeedTab({
  posts,
  onCreate,
  onRefresh,
  onOpenReview,
  refreshing,
  theme,
  strings,
  topInset,
  bottomInset,
}: Props) {
  const modeSwitcherBandHeight = 56;
  const isEmpty = posts.length === 0;
  const refreshOffset = modeSwitcherBandHeight + 24 + topInset;
  const refreshIndicatorTop = modeSwitcherBandHeight + 10 + topInset;

  React.useEffect(() => {
    if (typeof Image.prefetch !== 'function') {
      return;
    }

    const urls = toPrefetchUrls(posts);
    if (urls.length === 0) {
      return;
    }

    void Promise.allSettled(urls.map((url) => Image.prefetch(url)));
  }, [posts]);

  const contentContainerStyle = React.useMemo(
    () => [
      styles.list,
      { paddingTop: 84 + topInset, paddingBottom: 80 + bottomInset },
      isEmpty ? styles.listEmpty : null,
    ],
    [bottomInset, isEmpty, topInset]
  );

  const listEmptyComponent = React.useMemo(
    () =>
      refreshing ? null : (
        <FeedEmptyState
          onCreate={onCreate}
          theme={{
            background: theme.background,
            surface: theme.surface,
            textPrimary: theme.textPrimary,
            textMuted: theme.textMuted,
            primary: theme.primary,
            border: theme.border,
          }}
          strings={{
            title: strings.emptyTitle,
            subtitle: strings.emptySubtitle,
            cta: strings.emptyCta,
            footnote: strings.emptyFootnote,
          }}
        />
      ),
    [
      onCreate,
      refreshing,
      strings.emptyCta,
      strings.emptyFootnote,
      strings.emptySubtitle,
      strings.emptyTitle,
      theme.background,
      theme.border,
      theme.primary,
      theme.surface,
      theme.textMuted,
      theme.textPrimary,
    ]
  );

  const refreshControl = React.useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={theme.primary}
        colors={[theme.primary]}
        progressViewOffset={refreshOffset}
      />
    ),
    [onRefresh, refreshOffset, refreshing, theme.primary]
  );

  const renderItem = ({ item }: { item: FeedPost }) => {
    const handleOpenReview = item.reviewId
      ? () => onOpenReview(item.reviewId)
      : undefined;

    return item.premium ? (
      <PremiumFeedCard
        post={item}
        onPress={handleOpenReview}
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
        onPress={handleOpenReview}
        theme={{
          textPrimary: theme.textPrimary,
          textMuted: theme.textMuted,
          primary: theme.primary,
          border: theme.border,
          surface: theme.surface,
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {refreshing ? (
        <View
          pointerEvents="none"
          style={[
            styles.refreshHintWrap,
            {
              top: refreshIndicatorTop,
            },
          ]}
          testID="feed-refresh-indicator"
        >
          <View
            style={[
              styles.refreshHintCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        </View>
      ) : null}
      <FlatList
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={contentContainerStyle}
        ListEmptyComponent={listEmptyComponent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        windowSize={7}
        removeClippedSubviews
        refreshControl={refreshControl}
        alwaysBounceVertical
        bounces
        testID="feed-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  refreshHintWrap: {
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 40,
  },
  refreshHintCard: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  listEmpty: {
    flexGrow: 1,
  },
});
