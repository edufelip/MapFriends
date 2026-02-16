import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Routes } from '../../app/routes';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import ProfileHeader from './components/ProfileHeader';

type Props = NativeStackScreenProps<Record<string, object | undefined>, typeof Routes.ManageSubscriptions>;

export default function ManageSubscriptionsScreen({ navigation }: Props) {
  const strings = getStrings();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;

  const canGoBack = typeof navigation.canGoBack === 'function' ? navigation.canGoBack() : true;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ProfileHeader
        title={strings.profile.manageSubscriptions}
        onBack={canGoBack ? navigation.goBack : undefined}
        backTestID="manage-subscriptions-back"
        theme={{
          background: theme.background,
          border: theme.border,
          textPrimary: theme.textPrimary,
          surface: theme.surface,
        }}
        topInset={insets.top}
      />

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}14` }]}>
            <MaterialIcons name="subscriptions" size={26} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {strings.profile.manageSubscriptionsComingSoon}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {strings.profile.manageSubscriptionsComingSoonSubtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'BeVietnamPro-Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
