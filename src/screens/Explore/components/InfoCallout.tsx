import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  message: string;
  theme: {
    primary: string;
    textMuted: string;
  };
};

export default function InfoCallout({ message, theme }: Props) {
  return (
    <View style={[styles.container, { borderColor: `${theme.primary}22`, backgroundColor: `${theme.primary}14` }]}>
      <MaterialIcons name="info" size={18} color={theme.primary} />
      <Text style={[styles.text, { color: theme.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'NotoSans-Medium',
  },
});
