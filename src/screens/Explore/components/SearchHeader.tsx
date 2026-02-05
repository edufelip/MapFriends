import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  value: 'people' | 'places';
  onChange: (next: 'people' | 'places') => void;
  placeholder: string;
  tabPeople: string;
  tabPlaces: string;
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
  value,
  onChange,
  placeholder,
  tabPeople,
  tabPlaces,
  cancelLabel,
  theme,
  topInset,
}: Props) {
  const [query, setQuery] = React.useState('');

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
            onChangeText={setQuery}
          />
        </View>
        <Pressable onPress={() => setQuery('')}>
          <Text style={[styles.cancel, { color: theme.primary }]}>{cancelLabel}</Text>
        </Pressable>
      </View>
      <View style={[styles.tabs, { borderBottomColor: theme.border }]}> 
        <Pressable
          style={[styles.tab, value === 'people' && { borderBottomColor: theme.primary }]}
          onPress={() => onChange('people')}
        >
          <Text
            style={[
              styles.tabText,
              { color: value === 'people' ? theme.primary : theme.textMuted },
            ]}
          >
            {tabPeople}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, value === 'places' && { borderBottomColor: theme.primary }]}
          onPress={() => onChange('places')}
        >
          <Text
            style={[
              styles.tabText,
              { color: value === 'places' ? theme.primary : theme.textMuted },
            ]}
          >
            {tabPlaces}
          </Text>
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
  tabs: {
    marginTop: 16,
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontFamily: 'NotoSans-Bold',
    fontSize: 13,
  },
});
