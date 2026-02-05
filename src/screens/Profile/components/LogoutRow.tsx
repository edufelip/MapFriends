import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  label: string;
  version: string;
  onLogout: () => void;
  theme: {
    danger: string;
    textMuted: string;
  };
};

export default function LogoutRow({ label, version, onLogout, theme }: Props) {
  return (
    <View style={styles.container}>
      <Pressable style={[styles.button, { backgroundColor: `${theme.danger}1a` }]} onPress={onLogout}>
        <MaterialIcons name="logout" size={18} color={theme.danger} />
        <Text style={[styles.label, { color: theme.danger }]}>{label}</Text>
      </Pressable>
      <Text style={[styles.version, { color: theme.textMuted }]}>{version}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'NotoSans-Bold',
  },
  version: {
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
});
