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
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Routes } from '../../app/routes';
import { useAuth } from '../../services/auth';
import { getStrings } from '../../localization/strings';

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

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailFocused, setEmailFocused] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);

  const gradientColors =
    colorScheme === 'dark'
      ? ['rgba(16,22,34,0)', palette.dark.background]
      : ['rgba(246,246,248,0)', palette.light.background];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrapper}>
            <ImageBackground
              source={heroImage}
              style={styles.heroImage}
              resizeMode="cover"
              imageStyle={[
                styles.heroImageStyle,
                { opacity: colorScheme === 'dark' ? 0.5 : 0.7 },
              ]}
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
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                {strings.auth.loginTitle}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                {strings.auth.loginSubtitle}
              </Text>
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
              <Text style={[styles.label, { color: theme.label }]}>
                {strings.auth.passwordLabel}
              </Text>
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

              <TouchableOpacity style={styles.forgotLink} onPress={() => {}} activeOpacity={0.7}>
                <Text style={[styles.linkText, { color: theme.primary }]}>
                  {strings.auth.forgotPassword}
                </Text>
              </TouchableOpacity>
            </View>

            <Pressable
              onPress={signIn}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: theme.primary,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                {strings.auth.loginButton}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
              <Text style={[styles.dividerText, { color: theme.textMuted }]}>
                {strings.auth.divider}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                onPress={() => {}}
                style={({ pressed }) => [
                  styles.socialButton,
                  {
                    backgroundColor: theme.socialSurface,
                    borderColor: theme.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <FontAwesome name="google" size={16} color="#4285F4" style={styles.socialIcon} />
                <Text style={[styles.socialLabel, { color: theme.textPrimary }]}>
                  {strings.auth.socialGoogle}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {}}
                style={({ pressed }) => [
                  styles.socialButton,
                  {
                    backgroundColor: theme.socialSurface,
                    borderColor: theme.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <FontAwesome name="apple" size={18} color={theme.textPrimary} style={styles.socialIcon} />
                <Text style={[styles.socialLabel, { color: theme.textPrimary }]}>
                  {strings.auth.socialApple}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              {strings.auth.noAccount}{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate(Routes.AuthSignup)} activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>
                {strings.auth.createAccount}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroWrapper: {
    position: 'relative',
    minHeight: 320,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  heroImageStyle: {},
  heroGradient: {
    flex: 1,
  },
  heroContent: {
    paddingTop: 84,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 30,
    fontFamily: 'BeVietnamPro-Bold',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'NotoSans-Medium',
    textAlign: 'center',
    maxWidth: 280,
  },
  formSection: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: 'NotoSans-Medium',
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'NotoSans-Regular',
    borderWidth: 1,
  },
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    height: 40,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  linkText: {
    fontSize: 13,
    fontFamily: 'NotoSans-Medium',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontFamily: 'NotoSans-Medium',
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  socialIcon: {
    marginRight: 8,
  },
  socialLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans-Medium',
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 13,
    fontFamily: 'NotoSans-Regular',
  },
  footerLink: {
    fontSize: 13,
    fontFamily: 'NotoSans-Bold',
  },
});
