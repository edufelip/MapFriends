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
    accentGold: string;
    surface: string;
  };
  labels: {
    premium: string;
    title: string;
    desc: string;
    cta: string;
  };
};

function PremiumFeedCard({ post, theme, labels }: Props) {
  const avatarUri = post.avatar || undefined;
  const imageUri = post.image || undefined;
  const hasAvatar = Boolean(avatarUri);
  const hasImage = Boolean(imageUri);

  return (
    <View style={styles.card}>
      <View style={styles.glow} />
      <View style={[styles.inner, { backgroundColor: theme.surface }]}> 
        <View style={styles.header}>
          <View style={styles.authorRow}>
            {hasAvatar ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <MaterialIcons name="person" size={18} color={theme.textMuted} />
              </View>
            )}
            <View>
              <View style={styles.nameRow}>
                <Text style={[styles.author, { color: theme.textPrimary }]}>{post.author}</Text>
                <MaterialIcons name="verified" size={14} color={theme.accentGold} />
              </View>
              <Text style={[styles.time, { color: theme.textMuted }]}>{post.time}</Text>
            </View>
          </View>
          <View style={styles.badge}>
            <MaterialIcons name="lock" size={12} color={theme.accentGold} />
            <Text style={[styles.badgeText, { color: theme.accentGold }]}>{labels.premium}</Text>
          </View>
        </View>

        <View style={styles.media}>
          {hasImage ? (
            <Image source={{ uri: imageUri }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroFallback]} />
          )}
          <View style={styles.overlay}>
            <View style={styles.iconWrap}>
              <MaterialIcons name="lock-open" size={26} color={theme.accentGold} />
            </View>
            <Text style={styles.title}>{labels.title}</Text>
            <Text style={styles.desc}>{labels.desc}</Text>
            <Pressable style={[styles.cta, { backgroundColor: theme.primary }]}> 
              <Text style={styles.ctaText}>{labels.cta}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actionsDisabled}>
          <MaterialIcons name="favorite" size={18} color={theme.textMuted} />
          <MaterialIcons name="chat-bubble" size={18} color={theme.textMuted} />
        </View>
      </View>
    </View>
  );
}

export default React.memo(PremiumFeedCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(251,191,36,0.2)',
  },
  inner: {
    borderRadius: 15,
    padding: 16,
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
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    backgroundColor: 'rgba(251,191,36,0.1)',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'BeVietnamPro-Bold',
    textTransform: 'uppercase',
  },
  media: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  hero: {
    width: '100%',
    height: 180,
  },
  heroFallback: {
    backgroundColor: '#1f2937',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(28,31,39,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  desc: {
    color: '#e2e8f0',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 10,
    fontFamily: 'NotoSans-Regular',
  },
  cta: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
  actionsDisabled: {
    flexDirection: 'row',
    gap: 16,
    opacity: 0.5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 10,
  },
});
