import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  title: string;
  onBack?: () => void;
  theme: {
    background: string;
    border: string;
    textPrimary: string;
    surface: string;
  };
  topInset: number;
};

export default function ProfileHeader({ title, onBack, theme, topInset }: Props) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
          paddingTop: 12 + topInset,
        },
      ]}
    >
      <Pressable
        style={[styles.backButton, { backgroundColor: theme.surface }]}
        onPress={onBack}
        disabled={!onBack}
      >
        <MaterialIcons name="arrow-back-ios-new" size={18} color={theme.textPrimary} />
      </Pressable>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  spacer: {
    width: 40,
  },
});
