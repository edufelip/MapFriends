import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SearchPerson } from '../../../services/search';

type Props = {
  person: SearchPerson;
  followLabel: string;
  lockLabel: string;
  pending?: boolean;
  buttonVariant?: 'filled' | 'outline';
  onPress: () => void;
  onFollowPress: () => void;
  theme: {
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

export default function SearchResultRow({
  person,
  followLabel,
  lockLabel,
  pending = false,
  buttonVariant = 'filled',
  onPress,
  onFollowPress,
  theme,
}: Props) {
  const hasAvatar = Boolean(person.avatar);
  const isOutline = buttonVariant === 'outline';

  return (
    <View
      style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
      testID={`search-result-${person.id}`}
    >
      <Pressable style={styles.profileTap} onPress={onPress}>
        <View style={styles.avatarWrap}>
          {hasAvatar ? (
            <Image source={{ uri: person.avatar || '' }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>{avatarFallbackFromHandle(person.handle)}</Text>
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
            {person.name}
          </Text>
          <View style={styles.handleRow}>
            <Text style={[styles.handle, { color: theme.textMuted }]} numberOfLines={1}>
              @{person.handle}
            </Text>
            {person.visibility === 'locked' ? (
              <View style={styles.lockWrap}>
                <MaterialIcons name="lock" size={12} color={theme.textMuted} />
                <Text style={[styles.lockLabel, { color: theme.textMuted }]}>{lockLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarFallback: {
    backgroundColor: '#dbe4ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 15,
    color: '#475569',
    fontFamily: 'BeVietnamPro-Bold',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  handleRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handle: {
    fontSize: 12,
    fontFamily: 'NotoSans-Medium',
  },
  lockWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  lockLabel: {
    fontSize: 10,
    fontFamily: 'NotoSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  followButton: {
    minWidth: 84,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  followText: {
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
});
