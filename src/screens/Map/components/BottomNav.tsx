import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Routes } from '../../../app/routes';

type Props = {
  navigation: any;
  theme: {
    glass: string;
    border: string;
    primary: string;
    textMuted: string;
    surface: string;
    textPrimary: string;
  };
  labels: {
    home: string;
    explore: string;
    activity: string;
    profile: string;
  };
  user?: { name?: string; avatar?: string | null } | null;
  bottomInset: number;
};

function BottomNav({ navigation, theme, labels, user, bottomInset }: Props) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.glass, borderColor: theme.border, bottom: 16 + bottomInset },
      ]}
    >
      <Pressable style={styles.navItem} onPress={() => navigation.navigate(Routes.MapHome)}>
        <MaterialIcons name="map" size={22} color={theme.primary} />
        <Text style={[styles.navLabel, { color: theme.primary }]}>{labels.home}</Text>
      </Pressable>
      <Pressable style={styles.navItem} onPress={() => navigation.navigate(Routes.Explore)}>
        <MaterialIcons name="search" size={22} color={theme.textMuted} />
        <Text style={[styles.navLabel, { color: theme.textMuted }]}>{labels.explore}</Text>
      </Pressable>
      <Pressable
        style={[styles.navPrimary, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate(Routes.ShareReview)}
      >
        <MaterialIcons name="add-location-alt" size={24} color="#ffffff" />
      </Pressable>
      <Pressable style={styles.navItem} onPress={() => navigation.navigate(Routes.Notifications)}>
        <MaterialIcons name="notifications" size={22} color={theme.textMuted} />
        <Text style={[styles.navLabel, { color: theme.textMuted }]}>{labels.activity}</Text>
      </Pressable>
      <Pressable style={styles.navItem} onPress={() => navigation.navigate(Routes.Profile)}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.navAvatar} />
        ) : (
          <View style={[styles.navAvatar, { backgroundColor: theme.surface }]}> 
            <Text style={[styles.navAvatarText, { color: theme.textPrimary }]}> 
              {user?.name?.slice(0, 1).toUpperCase() || 'M'}
            </Text>
          </View>
        )}
        <Text style={[styles.navLabel, { color: theme.textMuted }]}>{labels.profile}</Text>
      </Pressable>
    </View>
  );
}

export default React.memo(BottomNav);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navItem: {
    alignItems: 'center',
    width: 52,
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontFamily: 'NotoSans-Medium',
  },
  navPrimary: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  navAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navAvatarText: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
});
