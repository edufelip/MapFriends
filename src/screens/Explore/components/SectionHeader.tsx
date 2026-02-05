import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  theme: {
    textPrimary: string;
    textMuted: string;
  };
};

export default function SectionHeader({ title, actionLabel, onAction, theme }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: theme.textMuted }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  action: {
    fontSize: 11,
    fontFamily: 'NotoSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
