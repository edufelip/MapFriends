import React from 'react';
import { SectionList, StyleSheet, View, useColorScheme } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getNotificationSections } from '../../services/notifications';
import { getStrings } from '../../localization/strings';
import { palette } from '../../theme/palette';
import NotificationsHeader from './components/NotificationsHeader';
import NotificationSectionHeader from './components/NotificationSectionHeader';
import NotificationRow from './components/NotificationRow';

type Props = NativeStackScreenProps<any>;

type Section = {
  title: string;
  data: ReturnType<typeof getNotificationSections>[keyof ReturnType<typeof getNotificationSections>];
};

export default function NotificationsScreen({ navigation }: Props) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();

  const [sections, setSections] = React.useState(getNotificationSections());

  const clearAll = () => {
    setSections({ newRequests: [], earlier: [], week: [] });
  };

  const listSections: Section[] = [
    { title: strings.notifications.sectionNew, data: sections.newRequests },
    { title: strings.notifications.sectionEarlier, data: sections.earlier },
    { title: strings.notifications.sectionWeek, data: sections.week },
  ].filter((section) => section.data.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <NotificationsHeader
        title={strings.notifications.title}
        clearLabel={strings.notifications.clear}
        onBack={() => navigation.goBack()}
        onClear={clearAll}
        colors={{
          background: theme.background,
          border: theme.border,
          text: theme.textPrimary,
          primary: theme.primary,
          muted: theme.textMuted,
        }}
      />
      <SectionList
        sections={listSections}
        keyExtractor={(item) => item.id}
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
              premiumTitle: strings.notifications.premiumTitle,
              premiumSubtitle: strings.notifications.premiumSubtitle,
              premiumCta: strings.notifications.premiumCta,
            }}
          />
        )}
        contentContainerStyle={styles.list}
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
  },
});
