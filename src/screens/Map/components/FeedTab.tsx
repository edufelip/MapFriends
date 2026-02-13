import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, Share, StyleSheet, View } from 'react-native';
import { FeedPost } from '../../../services/feed';
import { buildReviewDeepLink } from '../../../services/deepLinks';
import { useToggleReviewLike, useEngagementStore } from '../../../state/engagement';
import { useFavoriteStore, useHydrateFavoriteState, useToggleFavoriteReview } from '../../../state/favorites';
import { useReviewStore } from '../../../state/reviews';
import FeedCard from './FeedCard';
import FeedEmptyState from './FeedEmptyState';
import PremiumFeedCard from './PremiumFeedCard';
import FeedShareSheet from './FeedShareSheet';

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
  viewer: {
    id: string;
  } | null;
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
    feedActionAuthTitle: string;
    feedActionAuthMessage: string;
    feedShareTitle: string;
    feedShareSubtitlePrefix: string;
    feedShareSystem: string;
    feedShareCopyLink: string;
    feedShareCopySuccessTitle: string;
    feedShareCopySuccessMessage: string;
    feedShareCopyErrorTitle: string;
    feedShareCopyErrorMessage: string;
    feedShareCancel: string;
    likeErrorTitle: string;
    likeErrorMessage: string;
    favoriteErrorTitle: string;
    favoriteErrorMessage: string;
    shareErrorTitle: string;
    shareErrorMessage: string;
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
  viewer,
  theme,
  strings,
  topInset,
  bottomInset,
}: Props) {
  const modeSwitcherBandHeight = 56;
  const isEmpty = posts.length === 0;
  const refreshOffset = modeSwitcherBandHeight + 24 + topInset;
  const refreshIndicatorTop = modeSwitcherBandHeight + 10 + topInset;
  const reviewIds = React.useMemo(
    () => posts.map((post) => post.reviewId).filter((value): value is string => Boolean(value)),
    [posts]
  );

  const hydrateLikeState = useEngagementStore((state) => state.hydrateLikeState);
  const likedByReviewId = useEngagementStore((state) => state.likedByReviewId);
  const likeHydratingByReviewId = useEngagementStore((state) => state.likeHydratingByReviewId);
  const toggleLike = useToggleReviewLike();

  useHydrateFavoriteState(viewer?.id, Boolean(viewer?.id), 120);
  const favoritesByReviewId = useFavoriteStore((state) => state.favoritesByReviewId);
  const toggleFavorite = useToggleFavoriteReview();

  const reviewsById = useReviewStore((state) => state.reviewsById);

  const [likeBusyByReviewId, setLikeBusyByReviewId] = React.useState<Record<string, boolean>>({});
  const [favoriteBusyByReviewId, setFavoriteBusyByReviewId] = React.useState<Record<string, boolean>>({});
  const [shareTarget, setShareTarget] = React.useState<FeedPost | null>(null);
  const [isSystemSharing, setIsSystemSharing] = React.useState(false);
  const [isCopyingLink, setIsCopyingLink] = React.useState(false);

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

  React.useEffect(() => {
    if (!viewer?.id || reviewIds.length === 0) {
      return;
    }

    reviewIds.forEach((reviewId) => {
      void hydrateLikeState({ reviewId, userId: viewer.id });
    });
  }, [hydrateLikeState, reviewIds, viewer?.id]);

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

  const handleLikePress = React.useCallback(
    async (reviewId: string) => {
      if (!viewer?.id) {
        Alert.alert(strings.feedActionAuthTitle, strings.feedActionAuthMessage);
        return;
      }

      const likeBusy = Boolean(likeBusyByReviewId[reviewId] || likeHydratingByReviewId[reviewId]);
      if (likeBusy) {
        return;
      }

      setLikeBusyByReviewId((prev) => ({
        ...prev,
        [reviewId]: true,
      }));

      try {
        await toggleLike({ reviewId, userId: viewer.id });
      } catch {
        Alert.alert(strings.likeErrorTitle, strings.likeErrorMessage);
      } finally {
        setLikeBusyByReviewId((prev) => ({
          ...prev,
          [reviewId]: false,
        }));
      }
    },
    [
      likeBusyByReviewId,
      likeHydratingByReviewId,
      strings.feedActionAuthMessage,
      strings.feedActionAuthTitle,
      strings.likeErrorMessage,
      strings.likeErrorTitle,
      toggleLike,
      viewer?.id,
    ]
  );

  const handleFavoritePress = React.useCallback(
    async (reviewId: string) => {
      if (!viewer?.id) {
        Alert.alert(strings.feedActionAuthTitle, strings.feedActionAuthMessage);
        return;
      }

      if (favoriteBusyByReviewId[reviewId]) {
        return;
      }

      const review = reviewsById[reviewId];
      if (!review) {
        return;
      }

      setFavoriteBusyByReviewId((prev) => ({
        ...prev,
        [reviewId]: true,
      }));

      try {
        await toggleFavorite({ userId: viewer.id, review });
      } catch {
        Alert.alert(strings.favoriteErrorTitle, strings.favoriteErrorMessage);
      } finally {
        setFavoriteBusyByReviewId((prev) => ({
          ...prev,
          [reviewId]: false,
        }));
      }
    },
    [
      favoriteBusyByReviewId,
      reviewsById,
      strings.favoriteErrorMessage,
      strings.favoriteErrorTitle,
      strings.feedActionAuthMessage,
      strings.feedActionAuthTitle,
      toggleFavorite,
      viewer?.id,
    ]
  );

  const handleSystemShare = React.useCallback(async () => {
    if (!shareTarget?.reviewId) {
      return;
    }

    const deepLink = buildReviewDeepLink(shareTarget.reviewId);
    setIsSystemSharing(true);
    try {
      await Share.share({
        message: `${shareTarget.title}\n\n${shareTarget.body}\n\n${deepLink}`,
      });
      setShareTarget(null);
    } catch {
      Alert.alert(strings.shareErrorTitle, strings.shareErrorMessage);
    } finally {
      setIsSystemSharing(false);
    }
  }, [shareTarget, strings.shareErrorMessage, strings.shareErrorTitle]);

  const handleCopyLink = React.useCallback(async () => {
    if (!shareTarget?.reviewId) {
      return;
    }

    const deepLink = buildReviewDeepLink(shareTarget.reviewId);
    setIsCopyingLink(true);
    try {
      await Clipboard.setStringAsync(deepLink);
      Alert.alert(strings.feedShareCopySuccessTitle, strings.feedShareCopySuccessMessage);
      setShareTarget(null);
    } catch {
      Alert.alert(strings.feedShareCopyErrorTitle, strings.feedShareCopyErrorMessage);
    } finally {
      setIsCopyingLink(false);
    }
  }, [
    shareTarget,
    strings.feedShareCopyErrorMessage,
    strings.feedShareCopyErrorTitle,
    strings.feedShareCopySuccessMessage,
    strings.feedShareCopySuccessTitle,
  ]);

  const renderItem = ({ item }: { item: FeedPost }) => {
    const reviewId = item.reviewId;
    const canOpenReview = Boolean(reviewId);

    const handleOpenReview = reviewId ? () => onOpenReview(reviewId) : undefined;

    if (item.premium) {
      return (
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
      );
    }

    const liked = reviewId ? Boolean(likedByReviewId[reviewId]) : false;
    const favorited = reviewId ? Boolean(favoritesByReviewId[reviewId]) : false;
    const likeDisabled =
      !reviewId ||
      !viewer?.id ||
      Boolean(likeBusyByReviewId[reviewId] || likeHydratingByReviewId[reviewId]);
    const favoriteDisabled = !reviewId || !viewer?.id || Boolean(favoriteBusyByReviewId[reviewId]);

    return (
      <FeedCard
        post={item}
        onPress={handleOpenReview}
        onCommentPress={handleOpenReview}
        onSendPress={canOpenReview ? () => setShareTarget(item) : undefined}
        onLikePress={reviewId ? () => void handleLikePress(reviewId) : undefined}
        onFavoritePress={reviewId ? () => void handleFavoritePress(reviewId) : undefined}
        liked={liked}
        favorited={favorited}
        likeDisabled={likeDisabled}
        favoriteDisabled={favoriteDisabled}
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

      <FeedShareSheet
        visible={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        onSystemShare={() => {
          void handleSystemShare();
        }}
        onCopyLink={() => {
          void handleCopyLink();
        }}
        isSystemSharing={isSystemSharing}
        isCopying={isCopyingLink}
        reviewTitle={shareTarget?.title || ''}
        reviewAuthor={shareTarget?.author || ''}
        labels={{
          title: strings.feedShareTitle,
          subtitlePrefix: strings.feedShareSubtitlePrefix,
          share: strings.feedShareSystem,
          copyLink: strings.feedShareCopyLink,
          cancel: strings.feedShareCancel,
        }}
        theme={{
          background: theme.background,
          surface: theme.surface,
          border: theme.border,
          textPrimary: theme.textPrimary,
          textMuted: theme.textMuted,
          primary: theme.primary,
        }}
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
