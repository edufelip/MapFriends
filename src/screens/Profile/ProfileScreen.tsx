import React from 'react';
import {
  Alert,
  Animated,
  Easing,
  InteractionManager,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../services/auth';
import { formatAppVersionLabel, getAppVersionInfo } from '../../services/appVersion';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import BottomNav from '../Map/components/BottomNav';
import ProfileHeader from './components/ProfileHeader';
import ProfileHero from './components/ProfileHero';
import SettingsSection from './components/SettingsSection';
import SettingsRow from './components/SettingsRow';
import LogoutRow from './components/LogoutRow';
import FavoritesSection from './components/FavoritesSection';
import ProfileSectionTabs from './components/ProfileSectionTabs';
import { Routes } from '../../app/routes';
import {
  useFavoriteHydrating,
  useFavoriteRecords,
  useHydrateFavoriteState,
  useFavoriteStore,
} from '../../state/favorites';

type Props = NativeStackScreenProps<any>;

type ScreenProps = Props & { hideBottomNav?: boolean };

type ProfileSectionTab = 'settings' | 'favorites';

export default function ProfileScreen({ navigation, hideBottomNav = false }: ScreenProps) {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = React.useState<ProfileSectionTab>('favorites');
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const sectionTransitionProgress = React.useRef(new Animated.Value(1)).current;
  const isFirstRenderRef = React.useRef(true);
  const isMountedRef = React.useRef(true);

  useHydrateFavoriteState(user?.id, Boolean(user?.id), 120);
  const favoriteRecords = useFavoriteRecords();
  const isFavoriteHydrating = useFavoriteHydrating();
  const removeFavoriteAndStore = useFavoriteStore((state) => state.removeFavoriteAndStore);

  const handle = `${strings.profile.handlePrefix}${user?.handle || 'alex_explorer'}`;
  const appVersionInfo = React.useMemo(() => getAppVersionInfo(), []);
  const appVersionLabel = React.useMemo(
    () => formatAppVersionLabel(strings.profile.versionLabel, appVersionInfo),
    [appVersionInfo, strings.profile.versionLabel]
  );

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    sectionTransitionProgress.setValue(0);
    Animated.timing(sectionTransitionProgress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeSection, sectionTransitionProgress]);

  const sectionDirection = activeSection === 'settings' ? 1 : -1;
  const sectionAnimatedStyle = React.useMemo(
    () => ({
      opacity: sectionTransitionProgress,
      transform: [
        {
          translateX: sectionTransitionProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [sectionDirection * 14, 0],
          }),
        },
      ],
    }),
    [sectionDirection, sectionTransitionProgress]
  );

  const handleSectionChange = React.useCallback((nextTab: ProfileSectionTab) => {
    setActiveSection((currentTab) => (currentTab === nextTab ? currentTab : nextTab));
  }, []);

  const executeLogout = React.useCallback(() => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    navigation.push(Routes.AuthLogin);

    InteractionManager.runAfterInteractions(() => {
      void signOut()
        .catch(() => {
          Alert.alert(strings.profile.logoutErrorTitle, strings.profile.logoutErrorMessage);
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            setIsLoggingOut(false);
          }
        });
    });
  }, [
    isLoggingOut,
    navigation,
    signOut,
    strings.profile.logoutErrorMessage,
    strings.profile.logoutErrorTitle,
  ]);

  const handleLogoutPress = React.useCallback(() => {
    if (isLoggingOut) {
      return;
    }

    Alert.alert(strings.profile.logoutConfirmTitle, strings.profile.logoutConfirmMessage, [
      {
        text: strings.profile.logoutConfirmCancel,
        style: 'cancel',
      },
      {
        text: strings.profile.logoutConfirmConfirm,
        style: 'destructive',
        onPress: executeLogout,
      },
    ]);
  }, [
    executeLogout,
    isLoggingOut,
    strings.profile.logoutConfirmCancel,
    strings.profile.logoutConfirmConfirm,
    strings.profile.logoutConfirmMessage,
    strings.profile.logoutConfirmTitle,
  ]);

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

        <ProfileSectionTabs
          activeTab={activeSection}
          onChangeTab={handleSectionChange}
          labels={{
            settings: strings.profile.tabSettings,
            favorites: strings.profile.tabFavorites,
          }}
          theme={{
            surface: theme.surface,
            border: theme.border,
            primary: theme.primary,
            textPrimary: theme.textPrimary,
            textMuted: theme.textMuted,
          }}
        />

        <Animated.View style={sectionAnimatedStyle}>
          {activeSection === 'settings' ? (
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
                  onPress={() => navigation.navigate(Routes.BlockedUsers)}
                  theme={{
                    textPrimary: theme.textPrimary,
                    textMuted: theme.textMuted,
                    border: theme.border,
                  }}
                />
              </SettingsSection>
            </View>
          ) : (
            <FavoritesSection
              favorites={favoriteRecords}
              isHydrating={isFavoriteHydrating}
              onOpenReview={(reviewId) => navigation.navigate(Routes.ReviewDetail, { reviewId })}
              onRemoveFavorite={async (reviewId) => {
                if (!user?.id) {
                  return;
                }
                try {
                  await removeFavoriteAndStore({ userId: user.id, reviewId });
                } catch {
                  // Keep interactions resilient if network or permissions fail.
                }
              }}
              strings={{
                title: strings.profile.favoritesTitle,
                subtitle: strings.profile.favoritesSubtitle,
                emptyTitle: strings.profile.favoritesEmptyTitle,
                emptySubtitle: strings.profile.favoritesEmptySubtitle,
                removeLabel: strings.profile.favoritesRemoveLabel,
              }}
              theme={{
                surface: theme.surface,
                border: theme.border,
                textPrimary: theme.textPrimary,
                textMuted: theme.textMuted,
                primary: theme.primary,
              }}
            />
          )}
        </Animated.View>

        <LogoutRow
          label={isLoggingOut ? strings.profile.loggingOut : strings.profile.logout}
          version={appVersionLabel}
          onLogout={handleLogoutPress}
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
