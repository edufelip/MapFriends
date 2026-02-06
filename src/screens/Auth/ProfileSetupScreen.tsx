import React from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
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
import { pickAvatarFromLibrary } from '../../services/media/avatarPicker';
import { styles } from './ProfileSetupScreen.styles';
import { ProfileSetupAvatarSection } from './components/ProfileSetupAvatarSection';
import { ProfileSetupVisibilitySelector } from './components/ProfileSetupVisibilitySelector';

const heroImage = require('../../../assets/auth/login-hero.jpg');

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

  const [avatarUri, setAvatarUri] = React.useState<string | null>(user?.avatar ?? null);
  const [avatarFeedback, setAvatarFeedback] = React.useState<string | null>(null);
  const [name, setName] = React.useState(user?.name ?? '');
  const [handle, setHandle] = React.useState(user?.handle ?? '');
  const [bio, setBio] = React.useState(user?.bio ?? '');
  const [visibility, setVisibility] = React.useState<'open' | 'locked'>(
    user?.visibility ?? 'open'
  );
  const [nameFocused, setNameFocused] = React.useState(false);
  const [handleFocused, setHandleFocused] = React.useState(false);
  const [bioFocused, setBioFocused] = React.useState(false);
  const [handleSanitized, setHandleSanitized] = React.useState(false);

  const handleValid = HANDLE_REGEX.test(handle);
  const nameValid = name.trim().length > 0;
  const bioValid = bio.trim().length > 0;
  const isComplete = nameValid && handleValid && bioValid && Boolean(visibility);
  const showHandleError = handle.length > 0 && !handleValid;

  const gradientColors =
    colorScheme === 'dark'
      ? ['rgba(16,22,34,0)', palette.dark.background]
      : ['rgba(246,246,248,0)', palette.light.background];

  const handleChange = (value: string) => {
    const normalized = value.toLowerCase();
    const sanitized = normalized.replace(/[^a-z0-9_]/g, '');
    setHandle(sanitized);
    setHandleSanitized(sanitized.length !== normalized.length);
  };

  const handleAvatarPick = async () => {
    setAvatarFeedback(null);

    const result = await pickAvatarFromLibrary();

    switch (result.status) {
      case 'success':
        setAvatarUri(result.uri);
        break;
      case 'permission-denied':
        setAvatarFeedback(strings.profileSetup.avatarPermissionDenied);
        break;
      case 'error':
        setAvatarFeedback(strings.profileSetup.avatarPickerError);
        break;
      case 'cancelled':
      default:
        break;
    }
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
      avatar: avatarUri,
    });
  };

  const handleHelper = showHandleError
    ? strings.profileSetup.handleError
    : handleSanitized
      ? strings.profileSetup.handleSanitizedHelper
      : strings.profileSetup.handleHelper;

  const inputFocusStyle = (focused: boolean) =>
    focused
      ? {
          borderColor: theme.primary,
          shadowColor: theme.inputRing,
          shadowOpacity: 1,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 2,
        }
      : { borderColor: theme.border };

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
        <Pressable
          onPress={skipProfileSetup}
          accessibilityRole="button"
          accessibilityLabel={strings.profileSetup.skipA11yLabel}
          accessibilityHint={strings.profileSetup.skipA11yHint}
        >
          <Text style={[styles.skipText, { color: theme.textMuted }]}>
            {strings.profileSetup.skip}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ProfileSetupAvatarSection
            avatarUri={avatarUri}
            onPress={handleAvatarPick}
            avatarLabel={strings.profileSetup.avatarLabel}
            addA11yLabel={strings.profileSetup.avatarAddA11yLabel}
            changeA11yLabel={strings.profileSetup.avatarChangeA11yLabel}
            a11yHint={strings.profileSetup.avatarA11yHint}
            errorMessage={avatarFeedback}
            theme={theme}
          />

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.label }]}>
              {strings.profileSetup.displayNameLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, color: theme.textPrimary },
                inputFocusStyle(nameFocused),
              ]}
              placeholder={strings.profileSetup.displayNamePlaceholder}
              placeholderTextColor={theme.placeholder}
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              returnKeyType="next"
              accessibilityLabel={strings.profileSetup.displayNameLabel}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.label }]}>
              {strings.profileSetup.handleLabel}
            </Text>
            <View
              style={[
                styles.handleRow,
                { backgroundColor: theme.surface },
                inputFocusStyle(handleFocused),
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
                onFocus={() => setHandleFocused(true)}
                onBlur={() => setHandleFocused(false)}
                maxLength={20}
                returnKeyType="next"
                accessibilityLabel={strings.profileSetup.handleLabel}
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
                { color: showHandleError ? theme.danger : theme.textMuted },
              ]}
            >
              {handleHelper}
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
                { backgroundColor: theme.surface, color: theme.textPrimary },
                inputFocusStyle(bioFocused),
              ]}
              placeholder={strings.profileSetup.bioPlaceholder}
              placeholderTextColor={theme.placeholder}
              value={bio}
              onChangeText={setBio}
              onFocus={() => setBioFocused(true)}
              onBlur={() => setBioFocused(false)}
              multiline
              maxLength={strings.profileSetup.bioMax}
              accessibilityLabel={strings.profileSetup.bioLabel}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.label }]}>{strings.profileSetup.visibilityLabel}</Text>
            <ProfileSetupVisibilitySelector
              visibility={visibility}
              onChange={setVisibility}
              theme={theme}
              openTitle={strings.profileSetup.visibilityOpenTitle}
              openDescription={strings.profileSetup.visibilityOpenDesc}
              openA11yLabel={strings.profileSetup.visibilityOpenA11yLabel}
              lockedTitle={strings.profileSetup.visibilityLockedTitle}
              lockedDescription={strings.profileSetup.visibilityLockedDesc}
              lockedA11yLabel={strings.profileSetup.visibilityLockedA11yLabel}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: 20 + insets.bottom }]}>
        <LinearGradient
          colors={[`${theme.background}00`, `${theme.background}cc`, theme.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable
          onPress={submitProfile}
          disabled={!isComplete}
          accessibilityRole="button"
          accessibilityLabel={strings.profileSetup.continueA11yLabel}
          accessibilityHint={strings.profileSetup.continueA11yHint}
          accessibilityState={{ disabled: !isComplete }}
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
