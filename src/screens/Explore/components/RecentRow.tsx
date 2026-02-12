import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SearchPerson } from '../../../services/search';

type Props = {
  person: SearchPerson;
  onRemove?: () => void;
  theme: {
    surface: string;
    textPrimary: string;
    textMuted: string;
  };
};

export default function RecentRow({ person, onRemove, theme }: Props) {
  const hasAvatar = Boolean(person.avatar);

  return (
    <View style={styles.row}>
      <View style={[styles.avatarWrap, { backgroundColor: theme.surface }]}> 
        {hasAvatar ? (
          <Image source={{ uri: person.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]} />
        )}
      </View>
      <View style={styles.meta}>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{person.name}</Text>
        <Text style={[styles.handle, { color: theme.textMuted }]}>{person.handle}</Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={8}>
        <MaterialIcons name="close" size={20} color={theme.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    backgroundColor: '#dbe4ee',
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro-Bold',
  },
  handle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
});
