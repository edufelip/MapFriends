import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  onPress?: () => void;
  badge?: string;
  theme: {
    textPrimary: string;
    textMuted: string;
    border: string;
  };
};

export default function SettingsRow({
  icon,
  iconBg,
  iconColor,
  label,
  onPress,
  badge,
  theme,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}> 
          <MaterialIcons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[styles.label, { color: theme.textPrimary }]}>{label}</Text>
      </View>
      <View style={styles.right}>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: 'NotoSans-Medium',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(19,91,236,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'NotoSans-Bold',
    color: '#135bec',
  },
});
