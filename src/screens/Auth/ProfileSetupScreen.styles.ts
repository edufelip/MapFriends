import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
  avatarError: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
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
    fontSize: 12,
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
    fontSize: 12,
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
