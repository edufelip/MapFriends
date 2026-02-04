import React from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth';
import { getStrings } from '../../localization/strings';

const heroImage = require('../../../assets/auth/login-hero.jpg');
const avatarPlaceholder = require('../../../assets/auth/avatar-placeholder.jpg');

const palette = {
  light: {
    background: '#f6f6f8',
    surface: '#ffffff',
    textPrimary: '#0f172a',
    textMuted: '#64748b',
    label: '#475569',
    placeholder: '#94a3b8',
    primary: '#135bec',
    buttonText: '#ffffff',
    iconMuted: '#94a3b8',
    border: '#e2e8f0',
    inputRing: 'rgba(15, 23, 42, 0.08)',
    success: '#22c55e',
    danger: '#ef4444',
  },
  dark: {
    background: '#101622',
    surface: '#1c2333',
    textPrimary: '#ffffff',
    textMuted: '#94a3b8',
    label: '#cbd5f0',
    placeholder: '#6b7280',
    primary: '#135bec',
    buttonText: '#ffffff',
    iconMuted: '#8b99b2',
    border: '#2c384d',
    inputRing: 'rgba(255, 255, 255, 0.08)',
    success: '#22c55e',
    danger: '#f87171',
  },
};

const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

export default function ProfileSetupScreen() {
  const { user, completeProfile, skipProfileSetup } = useAuth();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();

  const [name, setName] = React.useState(user?.name ?? '');
  const [handle, setHandle] = React.useState(user?.handle ?? '');
  const [bio, setBio] = React.useState(user?.bio ?? '');
  const [visibility, setVisibility] = React.useState<'open' | 'locked'>(
    user?.visibility ?? 'open'
  );

  const handleValid = HANDLE_REGEX.test(handle);
  const nameValid = name.trim().length > 0;
  const bioValid = bio.trim().length > 0;
  const isComplete = nameValid && handleValid && bioValid && Boolean(visibility);

  const gradientColors =
    colorScheme === 'dark'
      ? ['rgba(16,22,34,0)', palette.dark.background]
      : ['rgba(246,246,248,0)', palette.light.background];

  const handleChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setHandle(sanitized);
  };

  const submitProfile = () => {
    if (!isComplete) {
      return;
    }
    completeProfile({
      name: name.trim(),
      handle: handle.trim(),
      bio: bio.trim(),
      visibility,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ImageBackground
        source={heroImage}
        style={styles.heroBackground}
        resizeMode="cover"
        imageStyle={{ opacity: colorScheme === 'dark' ? 0.2 : 0.25 }}
      >
        <LinearGradient colors={gradientColors} style={styles.heroGradient} />
      </ImageBackground>

      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {strings.profileSetup.title}
        </Text>
        <Pressable onPress={skipProfileSetup}>
          <Text style={[styles.skipText, { color: theme.textMuted }]}>
            {strings.profileSetup.skip}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <Pressable style={styles.avatarWrapper} onPress={() => {}}>
            <ImageBackground
              source={avatarPlaceholder}
              style={[
                styles.avatarImage,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}
              imageStyle={styles.avatarImageStyle}
            >
              <MaterialIcons name="add-a-photo" size={32} color="#ffffffcc" />
            </ImageBackground>
            <View
              style={[
                styles.avatarBadge,
                { backgroundColor: theme.primary, borderColor: theme.background },
              ]}
            >
              <MaterialIcons name="edit" size={12} color="#ffffff" />
            </View>
          </Pressable>
          <Text style={[styles.avatarLabel, { color: theme.textMuted }]}>
            {strings.profileSetup.avatarLabel}
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.label }]}>
            {strings.profileSetup.displayNameLabel}
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border },
            ]}
            placeholder={strings.profileSetup.displayNamePlaceholder}
            placeholderTextColor={theme.placeholder}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.label }]}>
            {strings.profileSetup.handleLabel}
          </Text>
          <View
            style={[
              styles.handleRow,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.handlePrefix, { color: theme.placeholder }]}>@</Text>
            <TextInput
              style={[styles.handleInput, { color: theme.textPrimary }]}
              placeholder={strings.profileSetup.handlePlaceholder}
              placeholderTextColor={theme.placeholder}
              value={handle}
              onChangeText={handleChange}
              autoCapitalize="none"
              maxLength={20}
            />
            {handle.length > 0 ? (
              <MaterialIcons
                name={handleValid ? 'check-circle' : 'error'}
                size={18}
                color={handleValid ? theme.success : theme.danger}
              />
            ) : null}
          </View>
          <Text
            style={[
              styles.helperText,
              { color: handle.length > 0 && !handleValid ? theme.danger : theme.textMuted },
            ]}
          >
            {handle.length > 0 && !handleValid
              ? strings.profileSetup.handleError
              : strings.profileSetup.handleHelper}
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.bioHeader}>
            <Text style={[styles.label, { color: theme.label }]}>
              {strings.profileSetup.bioLabel}
            </Text>
            <Text style={[styles.counterText, { color: theme.textMuted }]}>
              {bio.length}/{strings.profileSetup.bioMax}
            </Text>
          </View>
          <TextInput
            style={[
              styles.textarea,
              { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border },
            ]}
            placeholder={strings.profileSetup.bioPlaceholder}
            placeholderTextColor={theme.placeholder}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={strings.profileSetup.bioMax}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.label }]}>
            {strings.profileSetup.visibilityLabel}
          </Text>
          <View style={styles.visibilityGrid}>
            <Pressable onPress={() => setVisibility('open')} style={styles.visibilityCard}>
              <View
                style={[
                  styles.visibilityCardInner,
                  {
                    backgroundColor: theme.surface,
                    borderColor: visibility === 'open' ? theme.primary : 'transparent',
                  },
                ]}
              >
                <MaterialIcons
                  name="public"
                  size={24}
                  color={visibility === 'open' ? theme.primary : theme.iconMuted}
                />
                <Text
                  style={[
                    styles.visibilityTitle,
                    { color: visibility === 'open' ? theme.primary : theme.textPrimary },
                  ]}
                >
                  {strings.profileSetup.visibilityOpenTitle}
                </Text>
                <Text style={[styles.visibilityDesc, { color: theme.textMuted }]}>
                  {strings.profileSetup.visibilityOpenDesc}
                </Text>
              </View>
              {visibility === 'open' ? (
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color={theme.primary}
                  style={styles.visibilityCheck}
                />
              ) : null}
            </Pressable>

            <Pressable onPress={() => setVisibility('locked')} style={styles.visibilityCard}>
              <View
                style={[
                  styles.visibilityCardInner,
                  {
                    backgroundColor: theme.surface,
                    borderColor: visibility === 'locked' ? theme.primary : 'transparent',
                  },
                ]}
              >
                <MaterialIcons
                  name="lock"
                  size={24}
                  color={visibility === 'locked' ? theme.primary : theme.iconMuted}
                />
                <Text
                  style={[
                    styles.visibilityTitle,
                    { color: visibility === 'locked' ? theme.primary : theme.textPrimary },
                  ]}
                >
                  {strings.profileSetup.visibilityLockedTitle}
                </Text>
                <Text style={[styles.visibilityDesc, { color: theme.textMuted }]}>
                  {strings.profileSetup.visibilityLockedDesc}
                </Text>
              </View>
              {visibility === 'locked' ? (
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color={theme.primary}
                  style={styles.visibilityCheck}
                />
              ) : null}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: 20 + insets.bottom }]}>
        <LinearGradient
          colors={[
            `${theme.background}00`,
            `${theme.background}cc`,
            theme.background,
          ]}
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable
          onPress={submitProfile}
          disabled={!isComplete}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: theme.primary,
              opacity: isComplete ? 1 : 0.5,
              transform: [{ scale: pressed && isComplete ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
            {strings.profileSetup.continueButton}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  heroGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  skipText: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro-Bold',
  },
  content: {
    paddingHorizontal: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 112,
    height: 112,
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  avatarImageStyle: {
    opacity: 0.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'NotoSans-Medium',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontFamily: 'NotoSans-Medium',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 6,
  },
  handlePrefix: {
    fontSize: 16,
    fontFamily: 'NotoSans-Medium',
  },
  handleInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'NotoSans-Regular',
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  counterText: {
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
  textarea: {
    minHeight: 110,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderWidth: 1,
    fontSize: 15,
    fontFamily: 'NotoSans-Regular',
    textAlignVertical: 'top',
  },
  visibilityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityCard: {
    flex: 1,
  },
  visibilityCardInner: {
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  visibilityTitle: {
    fontSize: 13,
    fontFamily: 'BeVietnamPro-Bold',
    marginTop: 6,
  },
  visibilityDesc: {
    fontSize: 10,
    fontFamily: 'NotoSans-Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  visibilityCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  primaryButton: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
});
