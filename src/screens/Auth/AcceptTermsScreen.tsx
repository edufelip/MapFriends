import React from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth';
import { getStrings } from '../../localization/strings';

const heroImage = require('../../../assets/auth/login-hero.jpg');

const palette = {
  light: {
    background: '#f6f6f8',
    surface: '#ffffff',
    cardSurface: '#ffffff',
    textPrimary: '#0f172a',
    textMuted: '#64748b',
    label: '#475569',
    divider: '#e2e8f0',
    primary: '#135bec',
    buttonText: '#ffffff',
    iconMuted: '#94a3b8',
    border: '#e2e8f0',
  },
  dark: {
    background: '#101622',
    surface: '#1c2333',
    cardSurface: '#1c2333',
    textPrimary: '#ffffff',
    textMuted: '#94a3b8',
    label: '#cbd5f0',
    divider: '#273449',
    primary: '#135bec',
    buttonText: '#ffffff',
    iconMuted: '#8b99b2',
    border: '#2c384d',
  },
};

export default function AcceptTermsScreen() {
  const { acceptTerms, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const strings = getStrings();

  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = React.useState(false);

  const allAccepted = acceptedTerms && acceptedPrivacy;

  const gradientColors =
    colorScheme === 'dark'
      ? ['rgba(16,22,34,0)', palette.dark.background]
      : ['rgba(246,246,248,0)', palette.light.background];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.heroBackground}>
        <ImageBackground
          source={heroImage}
          style={styles.heroImage}
          resizeMode="cover"
          imageStyle={{ opacity: colorScheme === 'dark' ? 0.35 : 0.5 }}
        >
          <LinearGradient colors={gradientColors} style={styles.heroGradient} />
        </ImageBackground>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={[styles.logoBadge, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
              <MaterialIcons name="map" size={30} color="#ffffff" />
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {strings.terms.title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              {strings.terms.subtitle}
            </Text>
          </View>

          <View
            style={[
              styles.termsCard,
              { backgroundColor: theme.cardSurface, borderColor: theme.border },
            ]}
          >
            <ScrollView
              style={styles.termsScroll}
              contentContainerStyle={styles.termsContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {strings.terms.section1Title}
              </Text>
              <Text style={[styles.bodyText, { color: theme.textMuted }]}>
                {strings.terms.section1Paragraph1}
              </Text>
              <Text style={[styles.bodyText, { color: theme.textMuted }]}>
                {strings.terms.section1Paragraph2}
              </Text>

              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {strings.terms.section2Title}
              </Text>
              <Text style={[styles.bodyText, { color: theme.textMuted }]}>
                {strings.terms.section2Paragraph1}
              </Text>
              <Text style={[styles.bodyText, { color: theme.textMuted }]}>
                {strings.terms.section2Paragraph2}
              </Text>

              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {strings.terms.section3Title}
              </Text>
              <Text style={[styles.bodyText, { color: theme.textMuted }]}>
                {strings.terms.section3Paragraph1}
              </Text>
            </ScrollView>
          </View>

          <View style={styles.checkboxGroup}>
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setAcceptedTerms((prev) => !prev)}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    borderColor: acceptedTerms ? theme.primary : theme.border,
                    backgroundColor: acceptedTerms ? theme.primary : theme.surface,
                  },
                ]}
              >
                {acceptedTerms ? (
                  <MaterialIcons name="check" size={16} color="#ffffff" />
                ) : null}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.label }]}>
                {strings.terms.acceptTermsPrefix}
                <Text style={{ color: theme.primary }}>{strings.terms.acceptTermsLink}</Text>
              </Text>
            </Pressable>

            <Pressable
              style={styles.checkboxRow}
              onPress={() => setAcceptedPrivacy((prev) => !prev)}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    borderColor: acceptedPrivacy ? theme.primary : theme.border,
                    backgroundColor: acceptedPrivacy ? theme.primary : theme.surface,
                  },
                ]}
              >
                {acceptedPrivacy ? (
                  <MaterialIcons name="check" size={16} color="#ffffff" />
                ) : null}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.label }]}>
                {strings.terms.acceptPrivacyPrefix}
                <Text style={{ color: theme.primary }}>{strings.terms.acceptPrivacyLink}</Text>
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={acceptTerms}
            disabled={!allAccepted}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
                opacity: allAccepted ? 1 : 0.5,
                transform: [{ scale: pressed && allAccepted ? 0.98 : 1 }],
              },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
              {strings.terms.acceptButton}
            </Text>
          </Pressable>

          <Pressable onPress={signOut} style={styles.declineButton}>
            <Text style={[styles.declineText, { color: theme.textMuted }]}>
              {strings.terms.declineButton}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
    height: 300,
  },
  heroImage: {
    flex: 1,
  },
  heroGradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 32,
  },
  container: {
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: 'BeVietnamPro-Bold',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
    textAlign: 'center',
  },
  termsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    maxHeight: 320,
  },
  termsScroll: {
    flexGrow: 0,
  },
  termsContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: 'NotoSans-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  checkboxGroup: {
    gap: 14,
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'NotoSans-Medium',
    lineHeight: 18,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  declineButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  declineText: {
    fontSize: 13,
    fontFamily: 'NotoSans-Medium',
  },
});
