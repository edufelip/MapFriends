import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type SocialProofUser = {
  id: string;
  name: string;
  avatar: string | null;
};

type Props = {
  users: SocialProofUser[];
  hiddenCount: number;
  labels: {
    title: string;
    fallback: string;
  };
  theme: {
    textPrimary: string;
    textMuted: string;
    border: string;
    surface: string;
    background: string;
  };
};

export default function ReviewDetailSocialProofSection({ users, hiddenCount, labels, theme }: Props) {
  if (users.length === 0 && hiddenCount <= 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      <Text style={[styles.title, { color: theme.textPrimary }]}>{labels.title}</Text>

      <View style={styles.row}>
        <View style={styles.avatarStack}>
          {users.map((user, index) => (
            <View
              key={user.id}
              style={[
                styles.avatarWrap,
                {
                  marginLeft: index === 0 ? 0 : -12,
                  borderColor: theme.background,
                  backgroundColor: theme.surface,
                },
              ]}
            >
              {user.avatar ? <Image source={{ uri: user.avatar }} style={styles.avatar} /> : null}
            </View>
          ))}
          {hiddenCount > 0 ? (
            <View
              style={[
                styles.remainingWrap,
                {
                  borderColor: theme.background,
                  marginLeft: users.length === 0 ? 0 : -12,
                  backgroundColor: theme.surface,
                },
              ]}
            >
              <Text style={[styles.remainingText, { color: theme.textMuted }]}>+{hiddenCount}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.fallbackText, { color: theme.textMuted }]} numberOfLines={2}>
          {labels.fallback}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 30,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 18,
  },
  title: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  row: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  remainingWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    fontSize: 11,
    fontFamily: 'NotoSans-Bold',
  },
  fallbackText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'NotoSans-Regular',
  },
});
