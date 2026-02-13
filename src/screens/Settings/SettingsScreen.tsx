import React from 'react';
import { Image, StyleSheet, Switch, Text, View } from 'react-native';
import { useAuth } from '../../services/auth';

const INVALID_AVATAR_VALUES = new Set(['null', 'undefined', 'none', 'n/a']);
const KNOWN_PLACEHOLDER_AVATAR_PATTERNS = ['default-user', 'default_profile', '/avatar/00000000000000000000000000000000'];

const isKnownPlaceholderAvatar = (uri: string) => {
  const normalized = uri.toLowerCase();
  return KNOWN_PLACEHOLDER_AVATAR_PATTERNS.some((pattern) => normalized.includes(pattern));
};

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

  if (isKnownPlaceholderAvatar(normalized)) {
    return null;
  }

  return normalized;
};

const toAvatarInitial = (name: string | null | undefined, handle: string | null | undefined) => {
  const source = name?.trim() || handle?.trim() || 'U';
  return source.slice(0, 1).toUpperCase();
};

export default function SettingsScreen() {
  const { user } = useAuth();
  const [shareLocation, setShareLocation] = React.useState(true);
  const [weeklyDigest, setWeeklyDigest] = React.useState(false);

  const rawAvatar = user?.avatar ?? null;
  const avatarUri = React.useMemo(() => normalizeAvatarUri(rawAvatar), [rawAvatar]);
  const avatarInitial = React.useMemo(() => toAvatarInitial(user?.name, user?.handle), [user?.handle, user?.name]);

  const [avatarLoadError, setAvatarLoadError] = React.useState(false);
  const [avatarLoaded, setAvatarLoaded] = React.useState(false);

  React.useEffect(() => {
    setAvatarLoadError(false);
    setAvatarLoaded(false);
  }, [avatarUri]);

  const showAvatarImage = Boolean(avatarUri && !avatarLoadError && avatarLoaded);

  React.useEffect(() => {
    console.warn('[settings-avatar-debug] screen.mounted', {
      userId: user?.id || null,
    });
  }, [user?.id]);

  React.useEffect(() => {
    console.warn('[settings-avatar-debug] resolve', {
      userId: user?.id || null,
      rawAvatar,
      normalizedAvatar: avatarUri,
      isKnownPlaceholder: typeof rawAvatar === 'string' ? isKnownPlaceholderAvatar(rawAvatar) : false,
      avatarLoadError,
      avatarLoaded,
      branch: showAvatarImage ? 'image' : 'fallback',
    });
  }, [avatarLoadError, avatarLoaded, avatarUri, rawAvatar, showAvatarImage, user?.id]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.profileRow}>
        <View style={styles.avatarShell}>
          <View style={styles.avatarFallback} testID="settings-avatar-fallback">
            <Text style={styles.avatarInitial}>{avatarInitial}</Text>
          </View>

          {avatarUri && !avatarLoadError ? (
            <Image
              source={{ uri: avatarUri, cache: 'force-cache' }}
              style={[styles.avatar, styles.avatarOverlay, !avatarLoaded && styles.avatarHidden]}
              testID="settings-avatar-image"
              onLoadStart={() => {
                console.warn('[settings-avatar-debug] image.loadStart', {
                  userId: user?.id || null,
                  uri: avatarUri,
                });
              }}
              onLoad={() => {
                console.warn('[settings-avatar-debug] image.loadSuccess', {
                  userId: user?.id || null,
                  uri: avatarUri,
                });
                setAvatarLoaded(true);
              }}
              onError={(event) => {
                console.warn('[settings-avatar-debug] image.loadError', {
                  userId: user?.id || null,
                  uri: avatarUri,
                  nativeError: event.nativeEvent?.error || null,
                });
                setAvatarLoadError(true);
              }}
            />
          ) : null}
        </View>

        <View style={styles.profileMeta}>
          <Text style={styles.profileName}>{user?.name?.trim() || 'MapFriends user'}</Text>
          <Text style={styles.profileHandle}>@{user?.handle?.trim() || 'mapfriends'}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Share location</Text>
          <Text style={styles.caption}>Allow friends to see your latest map updates.</Text>
        </View>
        <Switch value={shareLocation} onValueChange={setShareLocation} />
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Weekly digest</Text>
          <Text style={styles.caption}>Get a recap of new spots in your area.</Text>
        </View>
        <Switch value={weeklyDigest} onValueChange={setWeeklyDigest} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f2ea',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2a2e',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2ddd2',
    padding: 12,
    marginBottom: 12,
  },
  avatarShell: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#135bec',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarHidden: {
    opacity: 0,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19,91,236,0.14)',
  },
  avatarInitial: {
    fontSize: 18,
    color: '#1f2a2e',
    fontWeight: '700',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2a2e',
  },
  profileHandle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6c7a7f',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2ddd2',
    marginBottom: 12,
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2a2e',
  },
  caption: {
    marginTop: 4,
    color: '#6c7a7f',
  },
});
