import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (next: boolean) => void;
  toggleA11yLabel?: string;
  theme: {
    textPrimary: string;
    textMuted: string;
    border: string;
    surface: string;
    primary: string;
  };
};

export default function ToggleRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  value,
  onToggle,
  toggleA11yLabel,
  theme,
}: Props) {
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}> 
          <MaterialIcons name={icon} size={18} color={iconColor} />
        </View>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
        </View>
      </View>
      <Pressable
        onPress={() => onToggle(!value)}
        accessibilityLabel={toggleA11yLabel}
        style={[
          styles.toggle,
          { backgroundColor: value ? '#22c55e' : theme.border },
        ]}
      >
        <View
          style={[
            styles.knob,
            {
              transform: [{ translateX: value ? 18 : 2 }],
              backgroundColor: theme.surface,
            },
          ]}
        />
      </Pressable>
    </View>
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
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'NotoSans-Medium',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'NotoSans-Regular',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
