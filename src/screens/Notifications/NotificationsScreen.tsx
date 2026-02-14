import React from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../services/auth';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import { Routes } from '../../app/routes';
import NotificationsHeader from './components/NotificationsHeader';
import NotificationSectionHeader from './components/NotificationSectionHeader';
import NotificationRow from './components/NotificationRow';
import { buildNotificationListState } from './notificationsViewModel';
import {
  useAcceptFollowRequestNotification,
  useClearNotifications,
  useDeclineFollowRequestNotification,
  useFollowBackNotification,
  useHydrateNotificationsState,
  useMarkNotificationRead,
  useNotificationRecords,
  useNotificationsClearing,
  useNotificationsHydrating,
  usePendingNotificationActions,
  useRefreshNotifications,
} from '../../state/notifications';
import { useFollowingStore } from '../../state/following';

type Props = NativeStackScreenProps<any>;

type ScreenProps = Props & { variant?: 'screen' | 'panel' };

export default function NotificationsScreen({ navigation, variant = 'screen' }: ScreenProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  useHydrateNotificationsState(user?.id, Boolean(user?.id), 120);

  const records = useNotificationRecords();
  const isHydrating = useNotificationsHydrating();
  const isClearing = useNotificationsClearing();
  const pendingActionById = usePendingNotificationActions();
  const refreshNotifications = useRefreshNotifications();
  const clearAllNotifications = useClearNotifications();
  const markRead = useMarkNotificationRead();
  const acceptRequest = useAcceptFollowRequestNotification();
  const declineRequest = useDeclineFollowRequestNotification();
  const followBack = useFollowBackNotification();
  const hydrateFollowing = useFollowingStore((state) => state.hydrateFollowing);

  const { recordsById, sections: listSections } = React.useMemo(
    () => buildNotificationListState(records, strings.notifications),
    [records, strings.notifications]
  );

  const handleRefresh = React.useCallback(async () => {
    if (!user?.id) {
      return;
    }

    await refreshNotifications({ userId: user.id, limit: 120 });
  }, [refreshNotifications, user?.id]);

  const handleClear = React.useCallback(() => {
    if (!user?.id || isClearing) {
      return;
    }

    Alert.alert(
      strings.notifications.clearConfirmTitle,
      strings.notifications.clearConfirmMessage,
      [
        {
          text: strings.notifications.clearConfirmCancel,
          style: 'cancel',
        },
        {
          text: strings.notifications.clearConfirmConfirm,
          style: 'destructive',
          onPress: () => {
            void clearAllNotifications({ userId: user.id }).catch(() => {
              Alert.alert(strings.notifications.clearErrorTitle, strings.notifications.clearErrorMessage);
            });
          },
        },
      ]
    );
  }, [
    clearAllNotifications,
    isClearing,
    strings.notifications.clearConfirmCancel,
    strings.notifications.clearConfirmConfirm,
    strings.notifications.clearConfirmMessage,
    strings.notifications.clearConfirmTitle,
    strings.notifications.clearErrorMessage,
    strings.notifications.clearErrorTitle,
    user?.id,
  ]);

  const handleRowPress = React.useCallback(
    async (notificationId: string) => {
      if (!user?.id) {
        return;
      }

      const record = recordsById[notificationId];
      if (!record) {
        return;
      }

      if (!record.readAt) {
        void markRead({ userId: user.id, notificationId });
      }

      if (record.type === 'review_published' && record.targetReviewId) {
        navigation.navigate(Routes.ReviewDetail, { reviewId: record.targetReviewId });
      }
    },
    [markRead, navigation, recordsById, user?.id]
  );

  const handleAccept = React.useCallback(
    async (notificationId: string) => {
      if (!user?.id) {
        return;
      }

      try {
        await acceptRequest({
          userId: user.id,
          notificationId,
          actor: {
            id: user.id,
            name: user.name,
            handle: user.handle,
            avatar: user.avatar,
          },
        });
      } catch {
        Alert.alert(strings.notifications.actionErrorTitle, strings.notifications.actionErrorMessage);
      }
    },
    [
      acceptRequest,
      strings.notifications.actionErrorMessage,
      strings.notifications.actionErrorTitle,
      user?.avatar,
      user?.handle,
      user?.id,
      user?.name,
    ]
  );

  const handleDecline = React.useCallback(
    async (notificationId: string) => {
      if (!user?.id) {
        return;
      }

      try {
        await declineRequest({
          userId: user.id,
          notificationId,
        });
      } catch {
        Alert.alert(strings.notifications.actionErrorTitle, strings.notifications.actionErrorMessage);
      }
    },
    [
      declineRequest,
      strings.notifications.actionErrorMessage,
      strings.notifications.actionErrorTitle,
      user?.id,
    ]
  );

  const handleFollowBack = React.useCallback(
    async (notificationId: string) => {
      if (!user?.id) {
        return;
      }

      try {
        await followBack({
          userId: user.id,
          notificationId,
          actor: {
            id: user.id,
            name: user.name,
            handle: user.handle,
            avatar: user.avatar,
          },
        });

        await hydrateFollowing(user.id, { force: true });
      } catch {
        Alert.alert(strings.notifications.actionErrorTitle, strings.notifications.actionErrorMessage);
      }
    },
    [
      followBack,
      hydrateFollowing,
      strings.notifications.actionErrorMessage,
      strings.notifications.actionErrorTitle,
      user?.avatar,
      user?.handle,
      user?.id,
      user?.name,
    ]
  );

  const listEmptyComponent = React.useMemo(() => {
    if (isHydrating) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      );
    }

    return (
      <View style={[styles.emptyCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{strings.notifications.emptyTitle}</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
          {strings.notifications.emptySubtitle}
        </Text>
      </View>
    );
  }, [
    isHydrating,
    strings.notifications.emptySubtitle,
    strings.notifications.emptyTitle,
    theme.border,
    theme.primary,
    theme.surface,
    theme.textMuted,
    theme.textPrimary,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      {variant === 'screen' ? (
        <NotificationsHeader
          title={strings.notifications.title}
          clearLabel={isClearing ? '...' : strings.notifications.clear}
          onBack={() => navigation.goBack()}
          onClear={handleClear}
          colors={{
            background: theme.background,
            border: theme.border,
            text: theme.textPrimary,
            primary: theme.primary,
            muted: theme.textMuted,
          }}
        />
      ) : (
        <View style={[styles.panelHeader, { paddingTop: 68 + insets.top, borderBottomColor: theme.border }]}> 
          <Text style={[styles.panelTitle, { color: theme.textPrimary }]}>{strings.notifications.title}</Text>
          <Text style={[styles.panelClear, { color: theme.primary }]} onPress={handleClear}>
            {isClearing ? '...' : strings.notifications.clear}
          </Text>
        </View>
      )}
      <SectionList
        sections={listSections}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={listEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isHydrating}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        renderSectionHeader={({ section }) => (
          <NotificationSectionHeader
            title={section.title}
            background={theme.surfaceMuted}
            textColor={theme.textMuted}
          />
        )}
        renderItem={({ item }) => (
          <NotificationRow
            item={item}
            onPress={handleRowPress}
            onAcceptPress={(notificationId) => {
              void handleAccept(notificationId);
            }}
            onDeclinePress={(notificationId) => {
              void handleDecline(notificationId);
            }}
            onFollowPress={(notificationId) => {
              void handleFollowBack(notificationId);
            }}
            pendingAction={Boolean(pendingActionById[item.id])}
            theme={{
              background: theme.background,
              surfaceMuted: theme.surfaceMuted,
              border: theme.border,
              textPrimary: theme.textPrimary,
              textMuted: theme.textMuted,
              primary: theme.primary,
            }}
            labels={{
              accept: strings.notifications.accept,
              decline: strings.notifications.decline,
              follow: strings.notifications.followBack,
              accepted: strings.notifications.accepted,
              declined: strings.notifications.declined,
              premiumTitle: strings.notifications.premiumTitle,
              premiumSubtitle: strings.notifications.premiumSubtitle,
              premiumCta: strings.notifications.premiumCta,
            }}
          />
        )}
        contentContainerStyle={[styles.list, variant === 'panel' && { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  panelHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: 20,
    fontFamily: 'BeVietnamPro-Bold',
  },
  panelClear: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
  loadingWrap: {
    paddingTop: 28,
    alignItems: 'center',
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
    lineHeight: 18,
  },
});
