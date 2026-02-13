import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  sectionTitle: string;
  notes: string;
  theme: {
    textPrimary: string;
    textMuted: string;
  };
};

export default function ReviewDetailExperienceSection({ sectionTitle, notes, theme }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{sectionTitle}</Text>
      <Text style={[styles.notes, { color: theme.textPrimary }]}>{notes}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 26,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'NotoSans-Bold',
  },
  notes: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 25,
    fontFamily: 'NotoSans-Regular',
  },
});
