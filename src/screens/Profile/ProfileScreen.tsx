import React from 'react';
import { ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../services/auth';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import BottomNav from '../Map/components/BottomNav';
import ProfileHeader from './components/ProfileHeader';
import ProfileHero from './components/ProfileHero';
import SettingsSection from './components/SettingsSection';
import SettingsRow from './components/SettingsRow';
import LogoutRow from './components/LogoutRow';
import { Routes } from '../../app/routes';

type Props = NativeStackScreenProps<any>;

type ScreenProps = Props & { hideBottomNav?: boolean };

export default function ProfileScreen({ navigation, hideBottomNav = false }: ScreenProps) {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const insets = useSafeAreaInsets();

  const handle = `${strings.profile.handlePrefix}${user?.handle || 'alex_explorer'}`;
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ProfileHeader
        title={strings.profile.title}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        theme={{
          background: theme.background,
          border: theme.border,
          textPrimary: theme.textPrimary,
          surface: theme.surface,
        }}
        topInset={insets.top}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 140 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero
          handle={handle}
          subtitle={user?.bio?.trim() || strings.profile.subtitle}
          avatar={user?.avatar || undefined}
          onEdit={() => navigation.navigate(Routes.EditProfile)}
          editLabel={strings.profile.editProfile}
          theme={{
            primary: theme.primary,
            textPrimary: theme.textPrimary,
            textMuted: theme.textMuted,
            surface: theme.surface,
            border: theme.border,
            background: theme.background,
          }}
        />

        <View style={styles.sectionGroup}>
          <SettingsSection
            title={strings.profile.sectionCreator}
            theme={{ textMuted: theme.textMuted, surface: theme.surface, border: theme.border }}
          >
            <SettingsRow
              icon="palette"
              iconBg="rgba(147,51,234,0.15)"
              iconColor="#a855f7"
              label={strings.profile.creatorSettings}
              theme={{
                textPrimary: theme.textPrimary,
                textMuted: theme.textMuted,
                border: theme.border,
              }}
            />
            <SettingsRow
              icon="groups"
              iconBg="rgba(245,158,11,0.15)"
              iconColor="#f59e0b"
              label={strings.profile.subscriberManagement}
              badge={strings.profile.subscriberCount}
              theme={{
                textPrimary: theme.textPrimary,
                textMuted: theme.textMuted,
                border: theme.border,
              }}
            />
          </SettingsSection>

          <SettingsSection
            title={strings.profile.sectionPreferences}
            theme={{ textMuted: theme.textMuted, surface: theme.surface, border: theme.border }}
          >
            <SettingsRow
              icon="loyalty"
              iconBg="rgba(34,197,94,0.15)"
              iconColor="#22c55e"
              label={strings.profile.manageSubscriptions}
              theme={{
                textPrimary: theme.textPrimary,
                textMuted: theme.textMuted,
                border: theme.border,
              }}
            />
            <SettingsRow
              icon="block"
              iconBg="rgba(100,116,139,0.15)"
              iconColor="#94a3b8"
              label={strings.profile.blockedUsers}
              theme={{
                textPrimary: theme.textPrimary,
                textMuted: theme.textMuted,
                border: theme.border,
              }}
            />
          </SettingsSection>
        </View>

        <LogoutRow
          label={strings.profile.logout}
          version={strings.profile.versionLabel}
          onLogout={signOut}
          theme={{ danger: theme.danger, textMuted: theme.textMuted }}
        />
      </ScrollView>

      {!hideBottomNav ? (
        <BottomNav
          navigation={navigation}
          active="profile"
          theme={{
            glass: theme.glass || 'rgba(16,22,34,0.8)',
            border: theme.border,
            primary: theme.primary,
            textMuted: theme.textMuted,
            surface: theme.surface,
            textPrimary: theme.textPrimary,
          }}
          labels={{
            home: strings.home.navHome,
            explore: strings.home.navExplore,
            activity: strings.home.navActivity,
            profile: strings.home.navProfile,
          }}
          user={user}
          bottomInset={insets.bottom}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 24,
  },
  sectionGroup: {
    gap: 20,
  },
});
