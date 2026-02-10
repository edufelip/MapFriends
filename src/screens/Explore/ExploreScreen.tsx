import React from 'react';
import { ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../services/auth';
import {
  getRecentPeople,
  getRecentPlaces,
  getTrendingPeople,
  getTrendingPlaces,
} from '../../services/search';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import SearchHeader from './components/SearchHeader';
import SectionHeader from './components/SectionHeader';
import RecentRow from './components/RecentRow';
import TrendingCard from './components/TrendingCard';
import InfoCallout from './components/InfoCallout';
import PlaceRow from './components/PlaceRow';
import PlaceCard from './components/PlaceCard';
import BottomNav from '../Map/components/BottomNav';

type Props = NativeStackScreenProps<any>;

type ScreenProps = Props & { hideBottomNav?: boolean };

export default function ExploreScreen({ navigation, hideBottomNav = false }: ScreenProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = React.useState<'people' | 'places'>('people');
  const [recentPeople, setRecentPeople] = React.useState(() => getRecentPeople());
  const [recentPlaces, setRecentPlaces] = React.useState(() => getRecentPlaces());

  const trendingPeople = React.useMemo(() => getTrendingPeople(), []);
  const trendingPlaces = React.useMemo(() => getTrendingPlaces(), []);

  const removeRecentPerson = (id: string) => {
    setRecentPeople((prev) => prev.filter((person) => person.id !== id));
  };

  const clearRecentPeople = () => {
    setRecentPeople([]);
  };

  const clearRecentPlaces = () => {
    setRecentPlaces([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <SearchHeader
        value={activeTab}
        onChange={setActiveTab}
        placeholder={strings.search.placeholder}
        cancelLabel={strings.search.cancel}
        tabPeople={strings.search.tabPeople}
        tabPlaces={strings.search.tabPlaces}
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
        {activeTab === 'people' ? (
          <View>
            {recentPeople.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  title={strings.search.recentTitle}
                  actionLabel={strings.search.clearAll}
                  onAction={clearRecentPeople}
                  theme={{ textPrimary: theme.textPrimary, textMuted: theme.textMuted }}
                />
                <View style={styles.list}>
                  {recentPeople.map((person) => (
                    <RecentRow
                      key={person.id}
                      person={person}
                      onRemove={() => removeRecentPerson(person.id)}
                      theme={{
                        surface: theme.surface,
                        textPrimary: theme.textPrimary,
                        textMuted: theme.textMuted,
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionHeader
                title={strings.search.trendingTitle}
                theme={{ textPrimary: theme.textPrimary, textMuted: theme.textMuted }}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {trendingPeople.map((person) => (
                  <TrendingCard
                    key={person.id}
                    person={person}
                    labels={{
                      follow: strings.search.follow,
                      following: strings.search.following,
                      pro: strings.search.proBadge,
                    }}
                    theme={{
                      background: theme.background,
                      surface: theme.surface,
                      textPrimary: theme.textPrimary,
                      textMuted: theme.textMuted,
                      primary: theme.primary,
                      accentGold: theme.accentGold,
                    }}
                  />
                ))}
              </ScrollView>
            </View>

            <InfoCallout message={strings.search.infoMessage} theme={theme} />
          </View>
        ) : (
          <View>
            {recentPlaces.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  title={strings.search.recentPlacesTitle}
                  actionLabel={strings.search.clearAll}
                  onAction={clearRecentPlaces}
                  theme={{ textPrimary: theme.textPrimary, textMuted: theme.textMuted }}
                />
                <View style={styles.list}>
                  {recentPlaces.map((place) => (
                    <PlaceRow
                      key={place.id}
                      place={place}
                      theme={{
                        surface: theme.surface,
                        textPrimary: theme.textPrimary,
                        textMuted: theme.textMuted,
                        primary: theme.primary,
                        accentGold: theme.accentGold,
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionHeader
                title={strings.search.trendingPlacesTitle}
                theme={{ textPrimary: theme.textPrimary, textMuted: theme.textMuted }}
              />
              <View>
                {trendingPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    theme={{
                      surface: theme.surface,
                      textPrimary: theme.textPrimary,
                      textMuted: theme.textMuted,
                      primary: theme.primary,
                      accentGold: theme.accentGold,
                      border: theme.border,
                    }}
                  />
                ))}
              </View>
            </View>

            <InfoCallout message={strings.search.infoMessage} theme={theme} />
          </View>
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
    gap: 16,
    paddingRight: 12,
  },
});
