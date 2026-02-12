import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NotificationPreview } from '../../../services/notifications';

type Props = {
  preview: NotificationPreview;
  theme: {
    surfaceMuted: string;
    border: string;
    textPrimary: string;
    textMuted: string;
  };
};

export default function NotificationPreviewCard({ preview, theme }: Props) {
  const hasImage = Boolean(preview.image);

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}> 
      {hasImage ? (
        <Image source={{ uri: preview.image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{preview.title}</Text>
        <View style={styles.location}>
          <MaterialIcons name="location-on" size={12} color={theme.textMuted} />
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{preview.subtitle}</Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  imageFallback: {
    backgroundColor: '#dbe4ee',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'NotoSans-Regular',
  },
});
