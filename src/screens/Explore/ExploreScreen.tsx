import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../services/auth';
import {
  SearchPerson,
  clearRecentPeople,
  getTrendingPeople,
  listRecentPeople,
  removeRecentPerson,
  saveRecentPerson,
  searchPeople,
} from '../../services/search';
import {
  createFollowLink,
  createFollowRequest,
  listOutgoingFollowRequestTargetUserIds,
} from '../../services/following';
import { createNotification } from '../../services/notifications';
import { normalizeSearchQuery } from '../../services/searchIndex';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import { useFollowedUserIds, useFollowingStore, useHydrateFollowing } from '../../state/following';
import SearchHeader from './components/SearchHeader';
import SectionHeader from './components/SectionHeader';
import RecentRow from './components/RecentRow';
import TrendingCard from './components/TrendingCard';
import InfoCallout from './components/InfoCallout';
import SearchResultRow from './components/SearchResultRow';
import BottomNav from '../Map/components/BottomNav';

type Props = NativeStackScreenProps<any>;

type ScreenProps = Props & { hideBottomNav?: boolean };

const DEBOUNCE_MS = 260;

const toPersonMap = (items: SearchPerson[]) => {
  const map: Record<string, SearchPerson> = {};
  items.forEach((item) => {
    map[item.id] = item;
  });
  return map;
};

export default function ExploreScreen({ navigation, hideBottomNav = false }: ScreenProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [recentPeople, setRecentPeople] = React.useState<SearchPerson[]>([]);
  const [trendingPeople, setTrendingPeople] = React.useState<SearchPerson[]>([]);
  const [searchResults, setSearchResults] = React.useState<SearchPerson[]>([]);
  const [requestedTargetIds, setRequestedTargetIds] = React.useState<string[]>([]);
  const [pendingFollowByUserId, setPendingFollowByUserId] = React.useState<Record<string, boolean>>({});
  const [isRecentLoading, setIsRecentLoading] = React.useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = React.useState(false);
  const [isSearchLoading, setIsSearchLoading] = React.useState(false);

  const followedUserIds = useFollowedUserIds(user?.id);
  const hydrateFollowing = useFollowingStore((state) => state.hydrateFollowing);
  useHydrateFollowing(user?.id, Boolean(user?.id), 120_000);

  const followedSet = React.useMemo(() => new Set(followedUserIds), [followedUserIds]);
  const requestedSet = React.useMemo(() => new Set(requestedTargetIds), [requestedTargetIds]);

  const normalizedDebouncedQuery = React.useMemo(
    () => normalizeSearchQuery(debouncedQuery),
    [debouncedQuery]
  );

  const isSearchMode = normalizedDebouncedQuery.length >= 2;

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [query]);

  React.useEffect(() => {
    if (!user?.id) {
      setRecentPeople([]);
      return;
    }

    let cancelled = false;
    setIsRecentLoading(true);

    void listRecentPeople({ userId: user.id, limit: 5 })
      .then((people) => {
        if (!cancelled) {
          setRecentPeople(people);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsRecentLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  React.useEffect(() => {
    let cancelled = false;
    setIsTrendingLoading(true);

    void getTrendingPeople({
      viewerUserId: user?.id,
      limit: 10,
      timespanDays: 7,
    })
      .then((people) => {
        if (!cancelled) {
          setTrendingPeople(people);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsTrendingLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  React.useEffect(() => {
    if (normalizedDebouncedQuery.length < 2) {
      setSearchResults([]);
      setIsSearchLoading(false);
      return;
    }

    let cancelled = false;
    setIsSearchLoading(true);

    void searchPeople({
      query: debouncedQuery,
      limit: 20,
      excludeUserId: user?.id,
    })
      .then((people) => {
        if (!cancelled) {
          setSearchResults(people);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSearchLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, normalizedDebouncedQuery.length, user?.id]);

  const lockedProfileIdsToInspect = React.useMemo(() => {
    if (!user?.id) {
      return [] as string[];
    }

    const byId = toPersonMap([...searchResults, ...trendingPeople]);
    return Object.values(byId)
      .filter((person) => person.id !== user.id)
      .filter((person) => person.visibility === 'locked')
      .filter((person) => !followedSet.has(person.id))
      .map((person) => person.id);
  }, [followedSet, searchResults, trendingPeople, user?.id]);

  React.useEffect(() => {
    if (!user?.id) {
      setRequestedTargetIds([]);
      return;
    }

    if (lockedProfileIdsToInspect.length === 0) {
      setRequestedTargetIds([]);
      return;
    }

    let cancelled = false;

    void listOutgoingFollowRequestTargetUserIds({
      requesterUserId: user.id,
      targetUserIds: lockedProfileIdsToInspect,
    }).then((targetIds) => {
      if (!cancelled) {
        setRequestedTargetIds(targetIds);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [lockedProfileIdsToInspect, user?.id]);

  const applyRecentLocally = React.useCallback((person: SearchPerson) => {
    setRecentPeople((previous) => {
      const next = [person, ...previous.filter((entry) => entry.id !== person.id)];
      return next.slice(0, 5);
    });
  }, []);

  const handleProfilePress = React.useCallback(
    async (person: SearchPerson, source: 'search' | 'recent' | 'trending') => {
      if (!user?.id || source !== 'search') {
        return;
      }

      applyRecentLocally(person);
      try {
        await saveRecentPerson({
          userId: user.id,
          person,
        });
      } catch {
        // Keep local recent UX responsive even when remote persistence fails.
      }
    },
    [applyRecentLocally, user?.id]
  );

  const handleRemoveRecent = React.useCallback(
    (searchedUserId: string) => {
      setRecentPeople((previous) => previous.filter((entry) => entry.id !== searchedUserId));

      if (!user?.id) {
        return;
      }

      void removeRecentPerson({
        userId: user.id,
        searchedUserId,
      });
    },
    [user?.id]
  );

  const handleClearRecent = React.useCallback(() => {
    setRecentPeople([]);

    if (!user?.id) {
      return;
    }

    void clearRecentPeople({ userId: user.id });
  }, [user?.id]);

  const getFollowLabel = React.useCallback(
    (person: SearchPerson) => {
      if (followedSet.has(person.id)) {
        return strings.search.following;
      }

      if (person.visibility === 'locked') {
        return requestedSet.has(person.id) ? strings.search.requested : strings.search.request;
      }

      return strings.search.follow;
    },
    [followedSet, requestedSet, strings.search.follow, strings.search.following, strings.search.request, strings.search.requested]
  );

  const getFollowButtonVariant = React.useCallback(
    (person: SearchPerson) => {
      if (followedSet.has(person.id)) {
        return 'outline' as const;
      }

      if (person.visibility === 'locked' && requestedSet.has(person.id)) {
        return 'outline' as const;
      }

      return 'filled' as const;
    },
    [followedSet, requestedSet]
  );

  const handleFollowPress = React.useCallback(
    async (person: SearchPerson) => {
      if (!user?.id) {
        Alert.alert(strings.search.followErrorTitle, strings.search.followErrorMessage);
        return;
      }

      if (person.id === user.id || followedSet.has(person.id) || requestedSet.has(person.id)) {
        return;
      }

      setPendingFollowByUserId((previous) => ({
        ...previous,
        [person.id]: true,
      }));

      const nowIso = new Date().toISOString();

      try {
        if (person.visibility === 'locked') {
          await createFollowRequest({
            targetUserId: person.id,
            requesterUserId: user.id,
            requesterName: user.name,
            requesterHandle: user.handle,
            requesterAvatar: user.avatar,
            createdAt: nowIso,
          });

          await createNotification({
            userId: person.id,
            type: 'follow_request',
            actorUserId: user.id,
            actorName: user.name,
            actorHandle: user.handle,
            actorAvatar: user.avatar,
            requestStatus: 'pending',
            createdAt: nowIso,
          });

          setRequestedTargetIds((previous) => {
            if (previous.includes(person.id)) {
              return previous;
            }
            return [...previous, person.id];
          });

          return;
        }

        await createFollowLink({
          userId: user.id,
          followedUserId: person.id,
          createdAt: nowIso,
        });

        await createNotification({
          userId: person.id,
          type: 'follow_started',
          actorUserId: user.id,
          actorName: user.name,
          actorHandle: user.handle,
          actorAvatar: user.avatar,
          createdAt: nowIso,
        });

        await hydrateFollowing(user.id, { force: true });
      } catch {
        Alert.alert(strings.search.followErrorTitle, strings.search.followErrorMessage);
      } finally {
        setPendingFollowByUserId((previous) => {
          const next = { ...previous };
          delete next[person.id];
          return next;
        });
      }
    },
    [
      followedSet,
      hydrateFollowing,
      requestedSet,
      strings.search.followErrorMessage,
      strings.search.followErrorTitle,
      user?.avatar,
      user?.handle,
      user?.id,
      user?.name,
    ]
  );

  const renderSearchResults = () => {
    if (normalizedDebouncedQuery.length > 0 && normalizedDebouncedQuery.length < 2) {
      return (
        <View style={[styles.emptyCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{strings.search.minQueryTitle}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>{strings.search.minQuerySubtitle}</Text>
        </View>
      );
    }

    if (isSearchLoading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={[styles.emptyCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{strings.search.resultsEmptyTitle}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>{strings.search.resultsEmptySubtitle}</Text>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {searchResults.map((person) => (
          <SearchResultRow
            key={person.id}
            person={person}
            followLabel={getFollowLabel(person)}
            lockLabel={strings.search.locked}
            pending={Boolean(pendingFollowByUserId[person.id])}
            buttonVariant={getFollowButtonVariant(person)}
            onPress={() => {
              void handleProfilePress(person, 'search');
            }}
            onFollowPress={() => {
              void handleFollowPress(person);
            }}
            theme={{
              surface: theme.surface,
              textPrimary: theme.textPrimary,
              textMuted: theme.textMuted,
              primary: theme.primary,
              border: theme.border,
            }}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <SearchHeader
        query={query}
        onChangeQuery={setQuery}
        placeholder={strings.search.placeholder}
        cancelLabel={strings.search.cancel}
        theme={{
          background: theme.background,
          surfaceMuted: theme.surfaceMuted,
          textMuted: theme.textMuted,
          textPrimary: theme.textPrimary,
          primary: theme.primary,
          border: theme.border,
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
        {isSearchMode ? (
          <View style={styles.section}>
            <SectionHeader
              title={strings.search.resultsTitle}
              theme={{ textPrimary: theme.textPrimary, textMuted: theme.textMuted }}
            />
            {renderSearchResults()}
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader
                title={strings.search.recentTitle}
                actionLabel={recentPeople.length > 0 ? strings.search.clearAll : undefined}
                onAction={handleClearRecent}
                theme={{ textPrimary: theme.textPrimary, textMuted: theme.textMuted }}
              />

              {isRecentLoading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : recentPeople.length > 0 ? (
                <View style={styles.list}>
                  {recentPeople.map((person) => (
                    <RecentRow
                      key={person.id}
                      person={person}
                      lockLabel={strings.search.locked}
                      onPress={() => {
                        void handleProfilePress(person, 'recent');
                      }}
                      onRemove={() => handleRemoveRecent(person.id)}
                      theme={{
                        surface: theme.surface,
                        textPrimary: theme.textPrimary,
                        textMuted: theme.textMuted,
                        border: theme.border,
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View style={[styles.emptyCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
                  <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{strings.search.recentEmptyTitle}</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>{strings.search.recentEmptySubtitle}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader
                title={strings.search.trendingTitle}
                theme={{ textPrimary: theme.textPrimary, textMuted: theme.textMuted }}
              />

              {isTrendingLoading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : trendingPeople.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {trendingPeople.map((person) => (
                    <TrendingCard
                      key={person.id}
                      person={person}
                      followLabel={getFollowLabel(person)}
                      lockLabel={strings.search.locked}
                      postsLabel={strings.search.postsThisWeek}
                      pending={Boolean(pendingFollowByUserId[person.id])}
                      buttonVariant={getFollowButtonVariant(person)}
                      onPress={() => {
                        void handleProfilePress(person, 'trending');
                      }}
                      onFollowPress={() => {
                        void handleFollowPress(person);
                      }}
                      theme={{
                        background: theme.background,
                        surface: theme.surface,
                        textPrimary: theme.textPrimary,
                        textMuted: theme.textMuted,
                        primary: theme.primary,
                        border: theme.border,
                      }}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={[styles.emptyCard, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
                  <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{strings.search.trendingEmptyTitle}</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>{strings.search.trendingEmptySubtitle}</Text>
                </View>
              )}
            </View>

            <InfoCallout message={strings.search.infoMessage} theme={theme} />
          </>
        )}
      </ScrollView>

      {!hideBottomNav ? (
        <BottomNav
          navigation={navigation}
          active="explore"
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
  section: {
    marginBottom: 24,
  },
  list: {
    gap: 12,
  },
  horizontalList: {
    gap: 12,
    paddingRight: 12,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro-Bold',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'NotoSans-Medium',
    lineHeight: 18,
  },
  loadingWrap: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
