import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SearchPerson } from '../../../services/search';

type Props = {
  person: SearchPerson;
  followLabel: string;
  lockLabel: string;
  postsLabel: string;
  pending?: boolean;
  buttonVariant?: 'filled' | 'outline';
  onPress: () => void;
  onFollowPress: () => void;
  theme: {
    background: string;
    surface: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
    border: string;
  };
};

const avatarFallbackFromHandle = (handle: string) => {
  const trimmed = (handle || '').replace(/^@+/, '').trim();
  if (!trimmed) {
    return '?';
  }

  return trimmed[0].toUpperCase();
};

export default function TrendingCard({
  person,
  followLabel,
  lockLabel,
  postsLabel,
  pending = false,
  buttonVariant = 'filled',
  onPress,
  onFollowPress,
  theme,
}: Props) {
  const hasAvatar = Boolean(person.avatar);
  const isOutline = buttonVariant === 'outline';

  return (
    <Pressable
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      testID={`trending-person-${person.id}`}
    >
      <View style={[styles.avatarShell, { backgroundColor: theme.background }]}> 
        {hasAvatar ? (
          <Image source={{ uri: person.avatar || '' }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackText}>{avatarFallbackFromHandle(person.handle)}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
        {person.name}
      </Text>
      <Text style={[styles.handle, { color: theme.textMuted }]} numberOfLines={1}>
        @{person.handle}
      </Text>

      {person.visibility === 'locked' ? (
        <View style={styles.metaRow}>
          <MaterialIcons name="lock" size={12} color={theme.textMuted} />
          <Text style={[styles.metaText, { color: theme.textMuted }]}>{lockLabel}</Text>
        </View>
      ) : null}

      {typeof person.postCount === 'number' ? (
        <Text style={[styles.posts, { color: theme.textMuted }]}>{postsLabel.replace('{count}', String(person.postCount))}</Text>
      ) : null}

      <Pressable
        style={[
          styles.followButton,
          {
            borderColor: theme.primary,
            backgroundColor: isOutline ? 'transparent' : theme.primary,
            opacity: pending ? 0.6 : 1,
          },
        ]}
        onPress={onFollowPress}
        disabled={pending}
        hitSlop={6}
      >
        <Text style={[styles.followText, { color: isOutline ? theme.primary : '#ffffff' }]}>{followLabel}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  avatarShell: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  avatarFallback: {
    backgroundColor: '#dbe4ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 22,
    color: '#475569',
    fontFamily: 'BeVietnamPro-Bold',
  },
  name: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: 'BeVietnamPro-Bold',
    textAlign: 'center',
  },
  handle: {
    marginTop: 3,
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    fontFamily: 'NotoSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  posts: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: 'NotoSans-Medium',
  },
  followButton: {
    marginTop: 10,
    width: '100%',
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  followText: {
    fontSize: 11,
    fontFamily: 'NotoSans-Bold',
  },
});
