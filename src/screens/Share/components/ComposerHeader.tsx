import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  cancelLabel: string;
  postLabel: string;
  onCancel: () => void;
  onPost: () => void;
  theme: {
    background: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
  };
  topInset: number;
};

export default function ComposerHeader({
  title,
  cancelLabel,
  postLabel,
  onCancel,
  onPost,
  theme,
  topInset,
}: Props) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, borderBottomColor: theme.border, paddingTop: 10 + topInset },
      ]}
    >
      <Pressable onPress={onCancel}>
        <Text style={[styles.cancel, { color: theme.textMuted }]}>{cancelLabel}</Text>
      </Pressable>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <Pressable style={[styles.postButton, { backgroundColor: theme.primary }]} onPress={onPost}>
        <Text style={styles.postText}>{postLabel}</Text>
      </Pressable>
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
    justifyContent: 'space-between',
  },
  cancel: {
    fontSize: 13,
    fontFamily: 'NotoSans-Medium',
  },
  title: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  postButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  postText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
});
