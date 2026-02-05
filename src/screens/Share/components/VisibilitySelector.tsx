import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  label: string;
  infoLabel: string;
  optionFollowers: string;
  optionSubscribers: string;
  helper: string;
  value: 'followers' | 'subscribers';
  onChange: (next: 'followers' | 'subscribers') => void;
  theme: {
    primary: string;
    textPrimary: string;
    textMuted: string;
    surfaceMuted: string;
    surface: string;
    border: string;
  };
};

export default function VisibilitySelector({
  label,
  infoLabel,
  optionFollowers,
  optionSubscribers,
  helper,
  value,
  onChange,
  theme,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>{label}</Text>
        <Text style={[styles.info, { color: theme.primary }]}>{infoLabel}</Text>
      </View>
      <View style={[styles.switch, { backgroundColor: theme.surfaceMuted }]}>
        <View
          style={[
            styles.switchHighlight,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              left: value === 'followers' ? 4 : '50%',
            },
          ]}
        />
        <Pressable style={styles.switchOption} onPress={() => onChange('followers')}>
          <Text
            style={[
              styles.switchText,
              { color: value === 'followers' ? theme.textPrimary : theme.textMuted },
            ]}
          >
            {optionFollowers}
          </Text>
        </Pressable>
        <Pressable style={styles.switchOption} onPress={() => onChange('subscribers')}>
          <View style={styles.optionRow}>
            <MaterialIcons name="star" size={16} color={theme.primary} />
            <Text
              style={[
                styles.switchText,
                { color: value === 'subscribers' ? theme.primary : theme.textMuted },
              ]}
            >
              {optionSubscribers}
            </Text>
          </View>
        </Pressable>
      </View>
      <View style={styles.helper}>
        <MaterialIcons name="monetization-on" size={18} color="#f59e0b" />
        <Text style={[styles.helperText, { color: theme.textMuted }]}>{helper}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  info: {
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
  switch: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    position: 'relative',
  },
  switchHighlight: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
  },
  switchOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  switchText: {
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helper: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  helperText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'NotoSans-Medium',
  },
});
