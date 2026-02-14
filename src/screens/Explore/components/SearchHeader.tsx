import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  query: string;
  onChangeQuery: (next: string) => void;
  placeholder: string;
  cancelLabel: string;
  theme: {
    background: string;
    surfaceMuted: string;
    textMuted: string;
    textPrimary: string;
    primary: string;
    border: string;
  };
  topInset: number;
};

export default function SearchHeader({
  query,
  onChangeQuery,
  placeholder,
  cancelLabel,
  theme,
  topInset,
}: Props) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, borderBottomColor: theme.border, paddingTop: 12 + topInset },
      ]}
    >
      <View style={styles.inputRow}>
        <View style={[styles.inputWrap, { backgroundColor: theme.surfaceMuted }]}>
          <MaterialIcons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            value={query}
            onChangeText={onChangeQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        <Pressable onPress={() => onChangeQuery('')} hitSlop={8}>
          <Text style={[styles.cancel, { color: theme.primary }]}>{cancelLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputWrap: {
    flex: 1,
    height: 48,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontFamily: 'NotoSans-Medium',
    fontSize: 14,
  },
  cancel: {
    fontFamily: 'NotoSans-Bold',
    fontSize: 13,
  },
});
