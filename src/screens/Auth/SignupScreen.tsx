import React from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Routes } from '../../app/routes';
import { useAuth } from '../../services/auth';
import { getStrings } from '../../localization/strings';
import { AuthLoadingOverlay } from './components/AuthLoadingOverlay';
import { styles } from './SignupScreen.styles';

type Props = NativeStackScreenProps<any>;

const heroImage = require('../../../assets/auth/login-hero.jpg');

const palette = {
  light: {
    background: '#f6f6f8',
    surface: '#f1f5f9',
    textPrimary: '#0f172a',
    textMuted: '#64748b',
    label: '#475569',
    placeholder: '#94a3b8',
    divider: '#e2e8f0',
    primary: '#135bec',
    buttonText: '#ffffff',
    iconMuted: '#94a3b8',
    border: '#e2e8f0',
    socialSurface: '#ffffff',
  },
  dark: {
    background: '#101622',
    surface: '#1c2333',
    textPrimary: '#ffffff',
    textMuted: '#94a3b8',
    label: '#cbd5f0',
    placeholder: '#6b7280',
    divider: '#273449',
    primary: '#135bec',
    buttonText: '#ffffff',
    iconMuted: '#8b99b2',
    border: '#2c384d',
    socialSurface: '#1c2333',
  },
};

export default function SignupScreen({ navigation }: Props) {
  const {
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    isAuthActionLoading,
    authError,
    clearAuthError,
  } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailFocused, setEmailFocused] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);
  const [confirmFocused, setConfirmFocused] = React.useState(false);

  const gradientColors =
    colorScheme === 'dark'
      ? ['rgba(16,22,34,0)', palette.dark.background]
      : ['rgba(246,246,248,0)', palette.light.background];

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = Boolean(email.trim() && password.trim() && passwordsMatch);

  const handleEmailSignUp = async () => {
    clearAuthError();
    try {
      await signUpWithEmail('', email, password);
    } catch {
      // AuthProvider exposes translated error via authError.
    }
  };

  const handleGoogleSignUp = async () => {
    clearAuthError();
    try {
      await signInWithGoogle();
    } catch {
      // AuthProvider exposes translated error via authError.
    }
  };

  const handleAppleSignUp = async () => {
    clearAuthError();
    try {
      await signInWithApple();
    } catch {
      // AuthProvider exposes translated error via authError.
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, styles.screenContainer, { backgroundColor: theme.background }]}
      edges={['left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrapper}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { top: 12 + insets.top, backgroundColor: theme.surface }]}
            >
              <MaterialIcons name="arrow-back-ios-new" size={18} color={theme.textPrimary} />
            </Pressable>
            <ImageBackground
              source={heroImage}
              style={styles.heroImage}
              resizeMode="cover"
              imageStyle={[styles.heroImageStyle, { opacity: colorScheme === 'dark' ? 0.5 : 0.7 }]}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.heroGradient}
              />
            </ImageBackground>

            <View style={styles.heroContent}>
              <View style={[styles.logoBadge, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
                <MaterialIcons name="map" size={34} color="#ffffff" />
              </View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{strings.auth.signupTitle}</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>{strings.auth.signupSubtitle}</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.label }]}>{strings.auth.emailLabel}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.textPrimary,
                    borderColor: emailFocused ? theme.primary : theme.border,
                  },
                ]}
                placeholder={strings.auth.emailPlaceholder}
                placeholderTextColor={theme.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.label }]}>{strings.auth.passwordLabel}</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: theme.surface,
                      color: theme.textPrimary,
                      borderColor: passwordFocused ? theme.primary : theme.border,
                    },
                  ]}
                  placeholder={strings.auth.passwordPlaceholder}
                  placeholderTextColor={theme.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <Pressable
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword((prev) => !prev)}
                  accessibilityLabel={strings.auth.togglePasswordVisibility}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={theme.iconMuted}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.label }]}>{strings.auth.confirmPasswordLabel}</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: theme.surface,
                      color: theme.textPrimary,
                      borderColor: confirmFocused ? theme.primary : theme.border,
                    },
                  ]}
                  placeholder={strings.auth.confirmPasswordPlaceholder}
                  placeholderTextColor={theme.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
                />
                <Pressable
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword((prev) => !prev)}
                  accessibilityLabel={strings.auth.togglePasswordVisibility}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={theme.iconMuted}
                  />
                </Pressable>
              </View>
              {!passwordsMatch && confirmPassword.length > 0 ? (
                <Text style={[styles.hintText, { color: theme.primary }]}>
                  {strings.auth.confirmPasswordMismatch}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={handleEmailSignUp}
              disabled={!canSubmit || isAuthActionLoading}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: theme.primary,
                  opacity: canSubmit && !isAuthActionLoading ? 1 : 0.6,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                {strings.auth.signupButton}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
              <Text style={[styles.dividerText, { color: theme.textMuted }]}>{strings.auth.divider}</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                onPress={handleGoogleSignUp}
                disabled={isAuthActionLoading}
                style={({ pressed }) => [
                  styles.socialButton,
                  {
                    backgroundColor: theme.socialSurface,
                    borderColor: theme.border,
                    opacity: isAuthActionLoading ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <FontAwesome name="google" size={16} color="#4285F4" style={styles.socialIcon} />
                <Text style={[styles.socialLabel, { color: theme.textPrimary }]}>
                  {strings.auth.socialGoogle}
                </Text>
              </Pressable>
              {Platform.OS === 'ios' ? (
                <Pressable
                  onPress={handleAppleSignUp}
                  disabled={isAuthActionLoading}
                  style={({ pressed }) => [
                    styles.socialButton,
                    {
                      backgroundColor: theme.socialSurface,
                      borderColor: theme.border,
                      opacity: isAuthActionLoading ? 0.6 : pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <FontAwesome
                    name="apple"
                    size={18}
                    color={theme.textPrimary}
                    style={styles.socialIcon}
                  />
                  <Text style={[styles.socialLabel, { color: theme.textPrimary }]}>
                    {strings.auth.socialApple}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {authError ? (
              <Text style={[styles.feedbackText, { color: '#ef4444' }]}>{authError}</Text>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              {strings.auth.haveAccount}{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate(Routes.AuthLogin)} activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>{strings.auth.backToLogin}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AuthLoadingOverlay visible={isAuthActionLoading} accessibilityLabel={strings.auth.loadingA11y} />
    </SafeAreaView>
  );
}
