import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  title: string;
  clearLabel: string;
  onBack: () => void;
  onClear: () => void;
  colors: {
    background: string;
    border: string;
    text: string;
    primary: string;
    muted: string;
  };
};

export default function NotificationsHeader({ title, clearLabel, onBack, onClear, colors }: Props) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}> 
      <Pressable style={styles.button} onPress={onBack}>
        <MaterialIcons name="chevron-left" size={22} color={colors.muted} />
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Pressable style={styles.button} onPress={onClear}>
        <Text style={[styles.clear, { color: colors.primary }]}>{clearLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  button: {
    padding: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  clear: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
});
