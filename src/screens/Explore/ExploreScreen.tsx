import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { getStrings } from '../../localization/strings';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const strings = getStrings();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#101622' : '#f6f6f8' }]}>
      <Text style={[styles.title, { color: isDark ? '#ffffff' : '#0f172a' }]}>
        {strings.home.exploreTitle}
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
        {strings.home.exploreSubtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'BeVietnamPro-Bold',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
    textAlign: 'center',
  },
});
