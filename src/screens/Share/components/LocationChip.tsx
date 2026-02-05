import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  label: string;
  theme: {
    surface: string;
    border: string;
    primary: string;
    textPrimary: string;
  };
};

export default function LocationChip({ label, theme }: Props) {
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
      <MaterialIcons name="location-on" size={18} color={theme.primary} />
      <Text style={[styles.text, { color: theme.textPrimary }]} numberOfLines={1}>
        {label}
      </Text>
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
  text: {
    fontSize: 12,
    fontFamily: 'NotoSans-Medium',
    maxWidth: 200,
  },
});
