import React from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LocationChip from './LocationChip';
import { LocationHint } from '../../../services/locationSearch';
import { useLocationHints } from '../hooks/useLocationHints';

type Props = {
  selectedHint: LocationHint | null;
  onSelectHint: (hint: LocationHint) => void;
  onClearHint: () => void;
  theme: {
    surface: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
  };
  strings: {
    searchPlaceholder: string;
    empty: string;
  };
};

export default function LocationPicker({
  selectedHint,
  onSelectHint,
  onClearHint,
  theme,
  strings,
}: Props) {
  const [query, setQuery] = React.useState('');
  const chipAnim = React.useRef(new Animated.Value(selectedHint ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(chipAnim, {
      toValue: selectedHint ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [chipAnim, selectedHint]);

  const showSuggestions = !selectedHint && query.trim().length > 0;
  const { hints, isLoading } = useLocationHints({
    query,
    enabled: !selectedHint,
  });

  const inputOpacity = chipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const inputTranslateY = chipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const chipOpacity = chipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const chipTranslateY = chipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  const handleSelect = React.useCallback(
    (hint: LocationHint) => {
      onSelectHint(hint);
      setQuery('');
    },
    [onSelectHint]
  );

  const handleClear = React.useCallback(() => {
    onClearHint();
  }, [onClearHint]);

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents={selectedHint ? 'none' : 'auto'}
        style={[
          styles.inputWrap,
          {
            opacity: inputOpacity,
            transform: [{ translateY: inputTranslateY }],
          },
        ]}
      >
        <View style={[styles.searchInputShell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialIcons name="search" size={18} color={theme.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={strings.searchPlaceholder}
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.textPrimary }]}
            accessibilityLabel={strings.searchPlaceholder}
          />
        </View>
        {showSuggestions ? (
          <View style={[styles.suggestionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {isLoading ? (
              <Text style={[styles.suggestionEmptyText, { color: theme.textMuted }]}>…</Text>
            ) : hints.length > 0 ? (
              hints.map((hint) => (
                <Pressable
                  key={hint.id}
                  onPress={() => handleSelect(hint)}
                  style={styles.suggestionRow}
                >
                  <MaterialIcons name="storefront" size={16} color={theme.primary} />
                  <View style={styles.suggestionTextWrap}>
                    <Text style={[styles.suggestionTitle, { color: theme.textPrimary }]}>{hint.title}</Text>
                    <Text style={[styles.suggestionMeta, { color: theme.textMuted }]}>{hint.subtitle}</Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={[styles.suggestionEmptyText, { color: theme.textMuted }]}>
                {strings.empty}
              </Text>
            )}
          </View>
        ) : null}
      </Animated.View>

      <Animated.View
        pointerEvents={selectedHint ? 'auto' : 'none'}
        style={[
          styles.chipWrap,
          {
            opacity: chipOpacity,
            transform: [{ translateY: chipTranslateY }],
          },
        ]}
      >
        {selectedHint ? (
          <LocationChip
            label={selectedHint.title}
            onRemove={handleClear}
            size="large"
            theme={{
              surface: theme.surface,
              border: theme.border,
              primary: theme.primary,
              textPrimary: theme.textPrimary,
            }}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
  },
  inputWrap: {
    zIndex: 1,
  },
  searchInputShell: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'NotoSans-Medium',
    paddingVertical: 0,
  },
  suggestionsCard: {
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 8,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionTextWrap: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 13,
    fontFamily: 'NotoSans-Bold',
  },
  suggestionMeta: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'NotoSans-Regular',
  },
  suggestionEmptyText: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
  },
  chipWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
