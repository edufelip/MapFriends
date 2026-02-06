import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    position: 'relative',
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
  feedbackText: {
    marginTop: -4,
    fontSize: 12,
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
