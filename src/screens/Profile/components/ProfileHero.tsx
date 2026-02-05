import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  handle: string;
  subtitle: string;
  avatar?: string | null;
  onEdit?: () => void;
  editLabel: string;
  theme: {
    primary: string;
    textPrimary: string;
    textMuted: string;
    surface: string;
    border: string;
    background: string;
  };
};

export default function ProfileHero({
  handle,
  subtitle,
  avatar,
  onEdit,
  editLabel,
  theme,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        <View
          style={[
            styles.avatarRing,
            { borderColor: theme.primary, backgroundColor: theme.background },
          ]}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: theme.surface }]}>
              <Text style={[styles.avatarInitial, { color: theme.textPrimary }]}>
                {handle.replace('@', '').slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.verified, { backgroundColor: theme.primary, borderColor: theme.background }]}>
          <MaterialIcons name="verified" size={14} color="#ffffff" />
        </View>
      </View>
      <Text style={[styles.handle, { color: theme.textPrimary }]}>{handle}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
      <Pressable
        onPress={onEdit}
        style={[styles.editButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Text style={[styles.editText, { color: theme.textPrimary }]}>{editLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    padding: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontFamily: 'BeVietnamPro-Bold',
  },
  verified: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    borderRadius: 999,
    padding: 4,
    borderWidth: 2,
  },
  handle: {
    marginTop: 12,
    fontSize: 18,
    fontFamily: 'BeVietnamPro-Bold',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'NotoSans-Medium',
  },
  editButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  editText: {
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
});
