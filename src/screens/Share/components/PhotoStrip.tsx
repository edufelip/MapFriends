import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  photos: string[];
  onRemove: (index: number) => void;
  onAdd?: () => void;
  label: string;
  countLabel: string;
  theme: {
    border: string;
    surfaceMuted: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
  };
};

export default function PhotoStrip({
  photos,
  onRemove,
  onAdd,
  label,
  countLabel,
  theme,
}: Props) {
  const photoEntries = React.useMemo(
    () =>
      photos
        .map((uri, index) => ({ uri, index }))
        .filter((entry) => Boolean(entry.uri)),
    [photos]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>{label}</Text>
        <View style={[styles.countBadge, { backgroundColor: theme.surfaceMuted }]}> 
          <Text style={[styles.countText, { color: theme.textMuted }]}>{countLabel}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        <Pressable
          style={[styles.addTile, { borderColor: theme.border }]}
          onPress={onAdd}
          testID="photo-strip-add"
        >
          <View style={[styles.addIconWrap, { backgroundColor: `${theme.primary}1a` }]}>
            <MaterialIcons name="add-a-photo" size={20} color={theme.primary} />
          </View>
        </Pressable>
        {photoEntries.map(({ uri, index }) => (
          <View key={`${uri}-${index}`} style={styles.photoTile}>
            <Image source={{ uri }} style={styles.photo} />
            <Pressable style={styles.removeButton} onPress={() => onRemove(index)}>
              <MaterialIcons name="close" size={16} color="#ffffff" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 11,
    fontFamily: 'NotoSans-Bold',
  },
  strip: {
    gap: 12,
    paddingRight: 12,
  },
  addTile: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTile: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 999,
    padding: 4,
  },
});
