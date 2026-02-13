import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  current: number;
  total: number;
  theme: {
    primary: string;
    surface: string;
    border: string;
    textPrimary: string;
    textMuted: string;
  };
};

export default function SubmissionProgressBanner({ label, current, total, theme }: Props) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, current / total)) : 0;

  return (
    <View
      testID="review-submit-progress"
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.labelWrap}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.label, { color: theme.textPrimary }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text style={[styles.count, { color: theme.textMuted }]}>{`${Math.min(current, total)}/${total}`}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.border }]}>
        <View style={[styles.fill, { backgroundColor: theme.primary, width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  labelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: 'NotoSans-Medium',
    flex: 1,
  },
  count: {
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
  track: {
    height: 4,
    borderRadius: 999,
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
