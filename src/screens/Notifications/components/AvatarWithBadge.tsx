import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NotificationBadge } from '../../../services/notifications';

type Props = {
  avatar?: string | null;
  badge?: NotificationBadge | null;
  background: string;
};

export default function AvatarWithBadge({ avatar, badge, background }: Props) {
  const avatarUri = avatar || undefined;
  const hasAvatar = Boolean(avatarUri);

  return (
    <View style={styles.wrapper}>
      {hasAvatar ? (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]} />
      )}
      {badge ? (
        <View style={[styles.badge, { backgroundColor: badge.color, borderColor: background }]}> 
          <MaterialIcons name={badge.icon as any} size={10} color="#ffffff" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: '#e2e8f0',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
