import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  label: string;
  theme: {
    surface: string;
    border: string;
    primary: string;
    textPrimary: string;
  };
  onRemove?: () => void;
  size?: 'default' | 'large';
};

export default function LocationChip({ label, theme, onRemove, size = 'default' }: Props) {
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.container,
        isLarge && styles.containerLarge,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <MaterialIcons name="location-on" size={isLarge ? 20 : 18} color={theme.primary} />
      <Text
        style={[styles.text, isLarge && styles.textLarge, { color: theme.textPrimary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityLabel="Remove selected place"
          style={[styles.removeButton, isLarge && styles.removeButtonLarge]}
        >
          <MaterialIcons name="close" size={isLarge ? 16 : 14} color={theme.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  containerLarge: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  text: {
    fontSize: 12,
    fontFamily: 'NotoSans-Medium',
    maxWidth: 200,
  },
  textLarge: {
    fontSize: 13,
    maxWidth: 240,
  },
  removeButton: {
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonLarge: {
    marginLeft: 4,
  },
});
