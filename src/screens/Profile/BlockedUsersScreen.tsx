import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import ProfileHeader from './components/ProfileHeader';
import {
  useBlockedUserRecords,
  useBlockedUsersError,
  useBlockedUsersHydrating,
  useBlockedUsersStore,
  useHydrateBlockedUsersState,
  usePendingUnblockIds,
  useUnblockBlockedUser,
} from '../../state/blocks';
import { useRefreshReviews } from '../../state/reviews';
import { useFollowingStore } from '../../state/following';
import { BlockedUserRecord } from '../../services/blocks';

type Props = NativeStackScreenProps<any>;

const INVALID_AVATAR_VALUES = new Set(['null', 'undefined', 'none', 'n/a']);
const KNOWN_PLACEHOLDER_AVATAR_PATTERNS = [
  'default-user',
  'default_profile',
  '/avatar/00000000000000000000000000000000',
];

const normalizeAvatarUri = (value: string | null | undefined) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (INVALID_AVATAR_VALUES.has(normalized.toLowerCase())) {
    return null;
  }

  const lower = normalized.toLowerCase();
  if (KNOWN_PLACEHOLDER_AVATAR_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return null;
  }

  return normalized;
};

const toInitial = (name: string, handle: string) => {
  const source = name.trim() || handle.replace(/^@+/, '').trim() || 'U';
  return source.slice(0, 1).toUpperCase();
};

const formatBlockedOn = (createdAt: string, fallback: string) => {
  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) {
    return fallback;
  }

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

type BlockedUserCardProps = {
  blockedUser: BlockedUserRecord;
  pending: boolean;
  onUnblock: (blockedUser: BlockedUserRecord) => void;
  strings: {
    unblockLabel: string;
    blockedOnPrefix: string;
    blockedRecently: string;
  };
  theme: {
    surface: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
    background: string;
  };
};

function BlockedUserCard({ blockedUser, pending, onUnblock, strings, theme }: BlockedUserCardProps) {
  const avatarUri = React.useMemo(() => normalizeAvatarUri(blockedUser.blockedAvatar), [blockedUser.blockedAvatar]);
  const [avatarLoadError, setAvatarLoadError] = React.useState(false);
  const [avatarLoaded, setAvatarLoaded] = React.useState(false);

  React.useEffect(() => {
    setAvatarLoadError(false);
    setAvatarLoaded(false);
  }, [avatarUri]);

  const blockedOnLabel = React.useMemo(() => {
    const formatted = formatBlockedOn(blockedUser.createdAt, strings.blockedRecently);
    return `${strings.blockedOnPrefix} ${formatted}`;
  }, [blockedUser.createdAt, strings.blockedOnPrefix, strings.blockedRecently]);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardMain}>
        <View style={[styles.avatarWrap, { borderColor: theme.border, backgroundColor: theme.background }]}> 
          <View style={[styles.avatarFallback, { backgroundColor: `${theme.primary}14` }]}>
            <Text style={[styles.avatarInitial, { color: theme.textPrimary }]}>
              {toInitial(blockedUser.blockedName, blockedUser.blockedHandle)}
            </Text>
          </View>
          {avatarUri && !avatarLoadError ? (
            <Image
              source={{ uri: avatarUri, cache: 'force-cache' }}
              style={[styles.avatarImage, !avatarLoaded && styles.avatarHidden]}
              onLoad={() => setAvatarLoaded(true)}
              onError={() => setAvatarLoadError(true)}
            />
          ) : null}
        </View>

        <View style={styles.textWrap}>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
            {blockedUser.blockedName}
          </Text>
          <Text style={[styles.handle, { color: theme.textMuted }]} numberOfLines={1}>
            @{blockedUser.blockedHandle}
          </Text>
          <Text style={[styles.meta, { color: theme.textMuted }]}>{blockedOnLabel}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={pending}
        onPress={() => onUnblock(blockedUser)}
        testID={`blocked-user-unblock-${blockedUser.blockedUserId}`}
        style={({ pressed }) => [
          styles.unblockButton,
          {
            borderColor: theme.border,
            backgroundColor: pending ? theme.surface : `${theme.primary}12`,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {pending ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <MaterialIcons name="person-add-alt-1" size={16} color={theme.primary} />
        )}
        <Text style={[styles.unblockLabel, { color: theme.primary }]}>{strings.unblockLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function BlockedUsersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const strings = getStrings();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;

  useHydrateBlockedUsersState(user?.id, Boolean(user?.id), 120);

  const blockedUsers = useBlockedUserRecords();
  const isHydrating = useBlockedUsersHydrating();
  const hydrateError = useBlockedUsersError();
  const pendingUnblockById = usePendingUnblockIds();
  const unblockBlockedUser = useUnblockBlockedUser();
  const refreshBlockedUsers = useBlockedUsersStore((state) => state.refreshBlockedUsers);
  const refreshReviews = useRefreshReviews();
  const hydrateFollowing = useFollowingStore((state) => state.hydrateFollowing);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    if (!user?.id || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await refreshBlockedUsers({ userId: user.id, limit: 120 });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshBlockedUsers, user?.id]);

  const executeUnblock = React.useCallback(
    async (blockedUser: BlockedUserRecord) => {
      if (!user?.id) {
        return;
      }

      try {
        await unblockBlockedUser({
          userId: user.id,
          blockedUserId: blockedUser.blockedUserId,
        });

        await Promise.allSettled([
          refreshReviews(),
          hydrateFollowing(user.id, { force: true }),
        ]);
      } catch {
        Alert.alert(
          strings.profile.blockedUsersUnblockErrorTitle,
          strings.profile.blockedUsersUnblockErrorMessage
        );
      }
    },
    [
      hydrateFollowing,
      refreshReviews,
      strings.profile.blockedUsersUnblockErrorMessage,
      strings.profile.blockedUsersUnblockErrorTitle,
      unblockBlockedUser,
      user?.id,
    ]
  );

  const confirmUnblock = React.useCallback(
    (blockedUser: BlockedUserRecord) => {
      Alert.alert(
        strings.profile.blockedUsersUnblockConfirmTitle,
        strings.profile.blockedUsersUnblockConfirmMessage.replace(
          '{handle}',
          `@${blockedUser.blockedHandle}`
        ),
        [
          {
            text: strings.profile.blockedUsersUnblockConfirmCancel,
            style: 'cancel',
          },
          {
            text: strings.profile.blockedUsersUnblockConfirmAction,
            onPress: () => {
              void executeUnblock(blockedUser);
            },
          },
        ]
      );
    },
    [
      executeUnblock,
      strings.profile.blockedUsersUnblockConfirmAction,
      strings.profile.blockedUsersUnblockConfirmCancel,
      strings.profile.blockedUsersUnblockConfirmMessage,
      strings.profile.blockedUsersUnblockConfirmTitle,
    ]
  );

  const renderEmpty = React.useCallback(() => {
    if (hydrateError) {
      return (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {strings.profile.blockedUsersErrorTitle}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            {strings.profile.blockedUsersErrorSubtitle}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
          {strings.profile.blockedUsersEmptyTitle}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
          {strings.profile.blockedUsersEmptySubtitle}
        </Text>
      </View>
    );
  }, [
    hydrateError,
    strings.profile.blockedUsersEmptySubtitle,
    strings.profile.blockedUsersEmptyTitle,
    strings.profile.blockedUsersErrorSubtitle,
    strings.profile.blockedUsersErrorTitle,
    theme.border,
    theme.surface,
    theme.textMuted,
    theme.textPrimary,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <ProfileHeader
        title={strings.profile.blockedUsers}
        onBack={navigation.goBack}
        theme={{
          background: theme.background,
          border: theme.border,
          textPrimary: theme.textPrimary,
          surface: theme.surface,
        }}
        topInset={insets.top}
      />

      <View style={[styles.introCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.introIconWrap, { backgroundColor: `${theme.primary}14` }]}>
          <MaterialIcons name="block" size={18} color={theme.primary} />
        </View>
        <View style={styles.introTextWrap}>
          <Text style={[styles.introTitle, { color: theme.textPrimary }]}>
            {strings.profile.blockedUsersTitle}
          </Text>
          <Text style={[styles.introSubtitle, { color: theme.textMuted }]}>
            {strings.profile.blockedUsersSubtitle}
          </Text>
        </View>
      </View>

      {isHydrating && blockedUsers.length === 0 ? (
        <View style={[styles.loadingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.blockedUserId}
          contentContainerStyle={[styles.listContent, { paddingBottom: 28 + insets.bottom }]}
          renderItem={({ item }) => (
            <BlockedUserCard
              blockedUser={item}
              pending={Boolean(pendingUnblockById[item.blockedUserId])}
              onUnblock={confirmUnblock}
              strings={{
                unblockLabel: strings.profile.blockedUsersUnblockLabel,
                blockedOnPrefix: strings.profile.blockedUsersBlockedOnPrefix,
                blockedRecently: strings.profile.blockedUsersBlockedRecently,
              }}
              theme={{
                surface: theme.surface,
                border: theme.border,
                textPrimary: theme.textPrimary,
                textMuted: theme.textMuted,
                primary: theme.primary,
                background: theme.background,
              }}
            />
          )}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  introCard: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  introIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTextWrap: {
    flex: 1,
    gap: 3,
  },
  introTitle: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  introSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'NotoSans-Regular',
  },
  loadingCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  separator: {
    height: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  avatarFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  avatarImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  avatarHidden: {
    opacity: 0,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  handle: {
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
  meta: {
    fontSize: 10,
    fontFamily: 'NotoSans-Regular',
  },
  unblockButton: {
    borderWidth: 1,
    borderRadius: 999,
    minHeight: 34,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  unblockLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'BeVietnamPro-Bold',
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'NotoSans-Regular',
  },
});
