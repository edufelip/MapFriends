import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  children: React.ReactNode;
  overlay?: {
    label: string;
    backgroundColor: string;
    textColor: string;
    badgeBackgroundColor?: string;
    badgeBorderColor?: string;
  };
  theme: {
    textMuted: string;
    surface: string;
    border: string;
  };
};

export default function SettingsSection({ title, children, overlay, theme }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textMuted }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
        {overlay ? (
          <View style={[styles.overlay, { backgroundColor: overlay.backgroundColor }]}> 
            <View
              style={[
                styles.overlayBadge,
                {
                  backgroundColor: overlay.badgeBackgroundColor ?? 'rgba(255,255,255,0.72)',
                  borderColor: overlay.badgeBorderColor ?? 'rgba(255,255,255,0.34)',
                },
              ]}
            >
              <Text style={[styles.overlayLabel, { color: overlay.textColor }]}>{overlay.label}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  title: {
    fontSize: 11,
    fontFamily: 'NotoSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  overlayBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  overlayLabel: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
});
