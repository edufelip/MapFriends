import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SearchPerson } from '../../../services/search';

type Props = {
  person: SearchPerson;
  labels: {
    follow: string;
    following: string;
    pro: string;
  };
  theme: {
    background: string;
    surface: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
    accentGold: string;
  };
};

export default function TrendingCard({ person, labels, theme }: Props) {
  const isFollowing = person.isFollowing;
  const hasAvatar = Boolean(person.avatar);

  return (
    <View style={styles.card}>
      <View style={[styles.avatarShell, { backgroundColor: person.isPro ? theme.primary : theme.surface }]}> 
        <View style={[styles.avatarInner, { backgroundColor: theme.background }]}> 
          {hasAvatar ? (
            <Image source={{ uri: person.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]} />
          )}
        </View>
        {person.isPro ? (
          <View style={[styles.proBadge, { backgroundColor: theme.accentGold }]}>
            <Text style={styles.proText}>{labels.pro}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
        {person.name}
      </Text>
      <Pressable
        style={[
          styles.followButton,
          isFollowing
            ? { borderColor: theme.primary, backgroundColor: 'transparent' }
            : { backgroundColor: theme.primary },
        ]}
      >
        <Text
          style={[
            styles.followText,
            { color: isFollowing ? theme.primary : '#ffffff' },
          ]}
        >
          {isFollowing ? labels.following : labels.follow}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 132,
    alignItems: 'center',
  },
  avatarShell: {
    width: 84,
    height: 84,
    borderRadius: 20,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  avatarFallback: {
    backgroundColor: '#dbe4ee',
  },
  proBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proText: {
    fontSize: 10,
    fontFamily: 'BeVietnamPro-Bold',
    color: '#0f172a',
  },
  name: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
    textAlign: 'center',
  },
  followButton: {
    marginTop: 8,
    width: '100%',
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  followText: {
    fontSize: 11,
    fontFamily: 'NotoSans-Bold',
  },
});
