import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FeedPost } from '../../../services/feed';

type Props = {
  post: FeedPost;
  theme: {
    textPrimary: string;
    textMuted: string;
    primary: string;
    border: string;
    surface: string;
  };
};

function FeedCard({ post, theme }: Props) {
  const avatarUri = post.avatar || undefined;
  const imageUri = post.image || undefined;
  const hasAvatar = Boolean(avatarUri);
  const hasImage = Boolean(imageUri);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
      <View style={styles.header}>
        <View style={styles.authorRow}>
          {hasAvatar ? (
            <Image
              source={{ uri: avatarUri }}
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
          <Image source={{ uri: imageUri }} style={styles.hero} testID="feed-card-image" />
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
      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <View style={styles.actionGroup}>
          <Pressable style={styles.action}>
            <MaterialIcons name="favorite-border" size={20} color={theme.textMuted} />
            <Text style={[styles.actionText, { color: theme.textMuted }]}>{post.likes}</Text>
          </Pressable>
          <Pressable style={styles.action}>
            <MaterialIcons name="chat-bubble-outline" size={20} color={theme.textMuted} />
            <Text style={[styles.actionText, { color: theme.textMuted }]}>{post.comments}</Text>
          </Pressable>
          <MaterialIcons name="send" size={20} color={theme.textMuted} />
        </View>
        <MaterialIcons name="bookmark-border" size={20} color={theme.textMuted} />
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
