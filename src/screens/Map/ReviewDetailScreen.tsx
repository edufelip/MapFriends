import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Routes } from '../../app/routes';
import { getStrings } from '../../localization/strings';
import { useAuth } from '../../services/auth';
import { palette } from '../../theme/palette';
import { getPlaceById } from '../../services/map';
import { prefetchReviewImages } from '../../services/media/reviewMediaCache';
import { useReviewRecords, useReviewStore } from '../../state/reviews';
import {
  useHydrateFavoriteState,
  useIsReviewFavorited,
  useToggleFavoriteReview,
} from '../../state/favorites';
import {
  useDeleteReviewComment,
  useHydrateReviewComments,
  useHydrateReviewLikeState,
  usePostReviewComment,
  useReviewComments,
  useReviewLikeState,
  useToggleReviewLike,
} from '../../state/engagement';
import ReviewDetailBottomActionBar from './components/review-detail/ReviewDetailBottomActionBar';
import ReviewDetailCommentsSection from './components/review-detail/ReviewDetailCommentsSection';
import ReviewDetailExperienceSection from './components/review-detail/ReviewDetailExperienceSection';
import ReviewDetailGallery from './components/review-detail/ReviewDetailGallery';
import ReviewDetailHeaderOverlay from './components/review-detail/ReviewDetailHeaderOverlay';
import ReviewDetailPlaceSection from './components/review-detail/ReviewDetailPlaceSection';
import ReviewDetailReviewerRow from './components/review-detail/ReviewDetailReviewerRow';
import ReviewDetailSocialProofSection from './components/review-detail/ReviewDetailSocialProofSection';
import { toReviewDetailViewModel } from './reviewDetailViewModel';

type Props = NativeStackScreenProps<any>;

export default function ReviewDetailScreen({ route, navigation }: Props) {
  const reviewId = route.params?.reviewId as string | undefined;
  const strings = getStrings();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const cachedReview = useReviewStore(
    React.useCallback(
      (state) => (reviewId ? state.reviewsById[reviewId] || null : null),
      [reviewId]
    )
  );
  const reviewRecords = useReviewRecords();
  const fetchReviewByIdCached = useReviewStore((state) => state.fetchReviewByIdCached);
  const deleteReviewAndStore = useReviewStore((state) => state.deleteReviewAndStore);

  useHydrateFavoriteState(user?.id, Boolean(user?.id), 120);
  useHydrateReviewLikeState(reviewId, user?.id);
  useHydrateReviewComments(reviewId, 50);

  const isFavorited = useIsReviewFavorited(reviewId);
  const toggleFavorite = useToggleFavoriteReview();
  const { liked } = useReviewLikeState(reviewId);
  const toggleLike = useToggleReviewLike();
  const commentsState = useReviewComments(reviewId);
  const postComment = usePostReviewComment();
  const deleteComment = useDeleteReviewComment();

  const [review, setReview] = React.useState(cachedReview);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = React.useState(false);
  const [isTogglingLike, setIsTogglingLike] = React.useState(false);

  React.useEffect(() => {
    if (cachedReview) {
      setReview(cachedReview);
    }
  }, [cachedReview]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const run = async () => {
        if (!reviewId) {
          if (isActive) {
            setReview(null);
            setIsLoading(false);
          }
          return;
        }

        if (isActive) {
          setIsLoading(true);
        }

        try {
          const resolved = await fetchReviewByIdCached(reviewId, {
            staleMs: 120000,
          });
          if (!isActive) {
            return;
          }

          setReview(resolved);
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      void run();

      return () => {
        isActive = false;
      };
    }, [fetchReviewByIdCached, reviewId])
  );

  const isOwner = Boolean(review?.userId && user?.id && review.userId === user.id);

  const viewModel = React.useMemo(() => {
    if (!review) {
      return null;
    }

    return toReviewDetailViewModel({
      review,
      place: getPlaceById(review.placeId),
      reviewRecords,
    });
  }, [review, reviewRecords]);

  React.useEffect(() => {
    if (!viewModel || viewModel.imageUris.length === 0) {
      return;
    }

    void prefetchReviewImages(viewModel.imageUris);
  }, [viewModel]);

  const handleEdit = React.useCallback(() => {
    if (!review) {
      return;
    }

    navigation.navigate(Routes.ShareReview, { reviewId: review.id });
  }, [navigation, review]);

  const handleDelete = React.useCallback(() => {
    if (!review || !user?.id || isDeleting) {
      return;
    }

    Alert.alert(
      strings.reviewDetail.deleteTitle,
      strings.reviewDetail.deleteMessage,
      [
        { text: strings.reviewDetail.cancel, style: 'cancel' },
        {
          text: strings.reviewDetail.delete,
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteReviewAndStore({
                reviewId: review.id,
                authorId: user.id,
              });
              navigation.goBack();
            } catch {
              setIsDeleting(false);
              Alert.alert(strings.reviewDetail.deleteTitle, strings.reviewDetail.deleteError);
            }
          },
        },
      ]
    );
  }, [
    deleteReviewAndStore,
    isDeleting,
    navigation,
    review,
    strings.reviewDetail.cancel,
    strings.reviewDetail.delete,
    strings.reviewDetail.deleteError,
    strings.reviewDetail.deleteMessage,
    strings.reviewDetail.deleteTitle,
    user?.id,
  ]);

  const handleOpenOwnerActions = React.useCallback(() => {
    if (!isOwner || isDeleting) {
      return;
    }

    Alert.alert(strings.reviewDetail.title, undefined, [
      {
        text: strings.reviewDetail.edit,
        onPress: handleEdit,
      },
      {
        text: strings.reviewDetail.delete,
        style: 'destructive',
        onPress: handleDelete,
      },
      {
        text: strings.reviewDetail.cancel,
        style: 'cancel',
      },
    ]);
  }, [
    handleDelete,
    handleEdit,
    isDeleting,
    isOwner,
    strings.reviewDetail.cancel,
    strings.reviewDetail.delete,
    strings.reviewDetail.edit,
    strings.reviewDetail.title,
  ]);

  const handleToggleLike = React.useCallback(async () => {
    if (!reviewId || !user?.id || isTogglingLike) {
      return;
    }

    setIsTogglingLike(true);
    try {
      await toggleLike({ reviewId, userId: user.id });
    } catch {
      Alert.alert(strings.reviewDetail.likeErrorTitle, strings.reviewDetail.likeErrorMessage);
    } finally {
      setIsTogglingLike(false);
    }
  }, [isTogglingLike, reviewId, strings.reviewDetail.likeErrorMessage, strings.reviewDetail.likeErrorTitle, toggleLike, user?.id]);

  const handleToggleFavorite = React.useCallback(async () => {
    if (!review || !user?.id || isSavingFavorite) {
      return;
    }

    setIsSavingFavorite(true);
    try {
      await toggleFavorite({
        userId: user.id,
        review,
      });
    } catch {
      Alert.alert(strings.reviewDetail.favoriteErrorTitle, strings.reviewDetail.favoriteErrorMessage);
    } finally {
      setIsSavingFavorite(false);
    }
  }, [
    isSavingFavorite,
    review,
    strings.reviewDetail.favoriteErrorMessage,
    strings.reviewDetail.favoriteErrorTitle,
    toggleFavorite,
    user?.id,
  ]);

  const handleSubmitComment = React.useCallback(
    async (text: string) => {
      if (!reviewId || !user?.id) {
        return;
      }

      await postComment({
        reviewId,
        userId: user.id,
        userName: user.name || user.handle || 'User',
        userHandle: user.handle || 'user',
        userAvatar: user.avatar || null,
        text,
      });
    },
    [postComment, reviewId, user?.avatar, user?.handle, user?.id, user?.name]
  );

  const handleDeleteComment = React.useCallback(
    async (commentId: string) => {
      if (!reviewId || !user?.id) {
        return;
      }

      await deleteComment({
        reviewId,
        commentId,
        userId: user.id,
      });
    },
    [deleteComment, reviewId, user?.id]
  );

  const handleShare = React.useCallback(async () => {
    if (!review) {
      return;
    }

    try {
      await Share.share({
        message: `${review.placeTitle} • ${review.rating.toFixed(1)}/10\n\n${review.notes}`,
      });
    } catch {
      Alert.alert(strings.reviewDetail.shareErrorTitle, strings.reviewDetail.shareErrorMessage);
    }
  }, [review, strings.reviewDetail.shareErrorMessage, strings.reviewDetail.shareErrorTitle]);

  const handleOpenMap = React.useCallback(async () => {
    if (!review) {
      return;
    }

    const coordinates = review.placeCoordinates;
    const hasCoordinates =
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      typeof coordinates[0] === 'number' &&
      typeof coordinates[1] === 'number';

    const query = viewModel?.address || review.placeTitle;
    const googleMapsAppUrl = hasCoordinates
      ? `comgooglemaps://?q=${coordinates[1]},${coordinates[0]}`
      : `comgooglemaps://?q=${encodeURIComponent(query)}`;
    const googleMapsWebUrl = hasCoordinates
      ? `https://www.google.com/maps/search/?api=1&query=${coordinates[1]},${coordinates[0]}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

    try {
      const canOpenGoogleMapsApp = await Linking.canOpenURL(googleMapsAppUrl);
      await Linking.openURL(canOpenGoogleMapsApp ? googleMapsAppUrl : googleMapsWebUrl);
    } catch {
      Alert.alert(strings.reviewDetail.mapOpenErrorTitle, strings.reviewDetail.mapOpenErrorMessage);
    }
  }, [
    review,
    strings.reviewDetail.mapOpenErrorMessage,
    strings.reviewDetail.mapOpenErrorTitle,
    viewModel?.address,
  ]);

  if (!reviewId || (!isLoading && !review)) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
          {strings.reviewDetail.placeNotFound}
        </Text>
        <Pressable
          onPress={navigation.goBack}
          style={[styles.emptyBackButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.emptyBackText}>{strings.reviewDetail.backToMap}</Text>
        </Pressable>
      </View>
    );
  }

  if (!viewModel) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 114 + insets.bottom }}
      >
        <ReviewDetailGallery
          imageUris={viewModel.imageUris}
          premium={viewModel.isPremium}
          premiumLabel={strings.reviewDetail.premiumBadge}
          noPhotoLabel={strings.reviewDetail.noPhoto}
          theme={{
            surfaceMuted: theme.surfaceMuted,
            textMuted: theme.textMuted,
          }}
        />

        <View style={styles.body}>
          <ReviewDetailReviewerRow
            avatarUri={viewModel.reviewerAvatar}
            reviewerName={viewModel.reviewerName}
            reviewerMeta={viewModel.reviewerMeta}
            ratingLabel={viewModel.ratingLabel}
            theme={{
              primary: theme.primary,
              textPrimary: theme.textPrimary,
              textMuted: theme.textMuted,
            }}
          />

          <ReviewDetailPlaceSection
            placeTitle={viewModel.placeTitle}
            placeMeta={viewModel.placeMeta}
            address={viewModel.address}
            onPressMap={handleOpenMap}
            labels={{
              location: strings.reviewDetail.locationLabel,
              mapAction: strings.reviewDetail.mapAction,
            }}
            theme={{
              textPrimary: theme.textPrimary,
              textMuted: theme.textMuted,
              primary: theme.primary,
              surfaceMuted: theme.surfaceMuted,
              border: theme.border,
            }}
          />

          <ReviewDetailExperienceSection
            sectionTitle={strings.reviewDetail.experienceLabel}
            notes={viewModel.experienceNotes}
            theme={{ textPrimary: theme.textPrimary, textMuted: theme.textMuted }}
          />

          <ReviewDetailSocialProofSection
            users={viewModel.socialProofUsers}
            hiddenCount={viewModel.socialProofHiddenCount}
            labels={{
              title: strings.reviewDetail.socialProofTitle,
              fallback: strings.reviewDetail.socialProofFallback,
            }}
            theme={{
              textPrimary: theme.textPrimary,
              textMuted: theme.textMuted,
              border: theme.border,
              surface: theme.surface,
              background: theme.background,
            }}
          />

          <ReviewDetailCommentsSection
            userId={user?.id}
            comments={commentsState.items}
            isHydrating={commentsState.isHydrating}
            isPosting={commentsState.isPosting}
            deletingById={commentsState.deletingById}
            onSubmit={handleSubmitComment}
            onDelete={handleDeleteComment}
            labels={{
              title: strings.reviewDetail.commentsTitle,
              empty: strings.reviewDetail.commentsEmpty,
              placeholder: strings.reviewDetail.commentsPlaceholder,
              submit: strings.reviewDetail.commentsSubmit,
              submitting: strings.reviewDetail.commentsSubmitting,
              delete: strings.reviewDetail.delete,
              deleteTitle: strings.reviewDetail.commentDeleteTitle,
              deleteMessage: strings.reviewDetail.commentDeleteMessage,
              deleteErrorTitle: strings.reviewDetail.commentDeleteErrorTitle,
              deleteErrorMessage: strings.reviewDetail.commentDeleteErrorMessage,
              cancel: strings.reviewDetail.cancel,
            }}
            theme={{
              textPrimary: theme.textPrimary,
              textMuted: theme.textMuted,
              border: theme.border,
              surface: theme.surface,
              primary: theme.primary,
              danger: theme.danger,
              background: theme.background,
            }}
          />
        </View>
      </ScrollView>

      <ReviewDetailHeaderOverlay
        topInset={insets.top}
        onBack={navigation.goBack}
        onMorePress={handleOpenOwnerActions}
        showMoreButton={isOwner}
        theme={{
          textPrimary: '#ffffff',
          glass: 'rgba(16,22,34,0.72)',
        }}
      />

      <ReviewDetailBottomActionBar
        bottomInset={insets.bottom}
        isLiked={liked}
        isTogglingLike={isTogglingLike}
        onToggleLike={handleToggleLike}
        isFavorited={isFavorited}
        isSavingFavorite={isSavingFavorite}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShare}
        labels={{
          like: strings.reviewDetail.like,
          save: strings.reviewDetail.saveToFavorites,
          saved: strings.reviewDetail.savedToFavorites,
        }}
        theme={{
          primary: theme.primary,
          surface: theme.surface,
          border: theme.border,
          textPrimary: theme.textPrimary,
          textMuted: theme.textMuted,
          danger: theme.danger,
          glass: theme.glass,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'BeVietnamPro-Bold',
  },
  emptyBackButton: {
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyBackText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'BeVietnamPro-Bold',
  },
  body: {
    marginTop: 16,
    paddingHorizontal: 18,
  },
});
