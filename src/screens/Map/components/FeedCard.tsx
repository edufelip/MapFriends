import React from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FeedPost } from '../../../services/feed';

type Props = {
  post: FeedPost;
  onPress?: () => void;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onSendPress?: () => void;
  onFavoritePress?: () => void;
  liked?: boolean;
  favorited?: boolean;
  likeDisabled?: boolean;
  favoriteDisabled?: boolean;
  theme: {
    textPrimary: string;
    textMuted: string;
    primary: string;
    border: string;
    surface: string;
  };
};

function FeedCard({
  post,
  onPress,
  onLikePress,
  onCommentPress,
  onSendPress,
  onFavoritePress,
  liked = false,
  favorited = false,
  likeDisabled = false,
  favoriteDisabled = false,
  theme,
}: Props) {
  const avatarUri = post.avatar || undefined;
  const imageUri = post.image || undefined;
  const hasAvatar = Boolean(avatarUri);
  const hasImage = Boolean(imageUri);

  const likeScale = React.useRef(new Animated.Value(1)).current;
  const favoriteScale = React.useRef(new Animated.Value(1)).current;

  const animateTap = React.useCallback((value: Animated.Value) => {
    value.setValue(0.9);
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.16,
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(value, {
        toValue: 1,
        friction: 4,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLikePress = React.useCallback(() => {
    if (!onLikePress || likeDisabled) {
      return;
    }

    animateTap(likeScale);
    onLikePress();
  }, [animateTap, likeDisabled, likeScale, onLikePress]);

  const handleFavoritePress = React.useCallback(() => {
    if (!onFavoritePress || favoriteDisabled) {
      return;
    }

    animateTap(favoriteScale);
    onFavoritePress();
  }, [animateTap, favoriteDisabled, favoriteScale, onFavoritePress]);

  const likeColor = liked ? '#ef4444' : theme.textMuted;
  const favoriteColor = favorited ? theme.primary : theme.textMuted;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        testID={`feed-card-${post.id}`}
        style={styles.contentPressable}
      >
        <View style={styles.header}>
          <View style={styles.authorRow}>
            {hasAvatar ? (
              <Image
                source={{ uri: avatarUri, cache: 'force-cache' }}
                style={styles.avatar}
                testID="feed-card-avatar"
              />
            ) : null}
            <View>
              <Text style={[styles.author, { color: theme.textPrimary }]}>{post.author}</Text>
              <Text style={[styles.time, { color: theme.textMuted }]}>{post.time}</Text>
            </View>
          </View>
          <MaterialIcons name="more-horiz" size={20} color={theme.textMuted} />
        </View>

        {hasImage ? (
          <View style={styles.heroWrapper}>
            <Image source={{ uri: imageUri, cache: 'force-cache' }} style={styles.hero} testID="feed-card-image" />
            {post.rating ? (
              <View style={[styles.ratingBadge, { backgroundColor: theme.primary }]}> 
                <Text style={styles.ratingText}>{post.rating}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.body}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{post.title}</Text>
          <Text style={[styles.bodyText, { color: theme.textMuted }]}>{post.body}</Text>
        </View>
      </Pressable>

      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <View style={styles.actionGroup}>
          <Pressable
            style={[styles.action, { opacity: likeDisabled ? 0.55 : 1 }]}
            onPress={handleLikePress}
            disabled={!onLikePress || likeDisabled}
            testID={`feed-card-like-${post.id}`}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <MaterialIcons name={liked ? 'favorite' : 'favorite-border'} size={20} color={likeColor} />
            </Animated.View>
            <Text style={[styles.actionText, { color: likeColor }]}>{post.likes || '0'}</Text>
          </Pressable>

          <Pressable
            style={styles.action}
            onPress={onCommentPress}
            disabled={!onCommentPress}
            testID={`feed-card-comment-${post.id}`}
          >
            <MaterialIcons name="chat-bubble-outline" size={20} color={theme.textMuted} />
            <Text style={[styles.actionText, { color: theme.textMuted }]}>{post.comments || '0'}</Text>
          </Pressable>

          <Pressable
            style={styles.action}
            onPress={onSendPress}
            disabled={!onSendPress}
            testID={`feed-card-send-${post.id}`}
          >
            <MaterialIcons name="send" size={20} color={theme.textMuted} />
          </Pressable>
        </View>

        <Pressable
          onPress={handleFavoritePress}
          disabled={!onFavoritePress || favoriteDisabled}
          style={{ opacity: favoriteDisabled ? 0.55 : 1 }}
          testID={`feed-card-favorite-${post.id}`}
        >
          <Animated.View style={{ transform: [{ scale: favoriteScale }] }}>
            <MaterialIcons name={favorited ? 'bookmark' : 'bookmark-border'} size={20} color={favoriteColor} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

export default React.memo(FeedCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  contentPressable: {
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  author: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro-Bold',
  },
  time: {
    fontSize: 11,
    fontFamily: 'NotoSans-Regular',
    marginTop: 2,
  },
  heroWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  hero: {
    width: '100%',
    height: 180,
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
  body: {
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  bodyText: {
    fontSize: 13,
    fontFamily: 'NotoSans-Regular',
    lineHeight: 18,
  },
  actions: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
});
