import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  children: React.ReactNode;
  theme: {
    textMuted: string;
    surface: string;
    border: string;
  };
};

export default function SettingsSection({ title, children, theme }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textMuted }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  title: {
    fontSize: 11,
    fontFamily: 'NotoSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
