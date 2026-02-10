import React from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStrings } from '../../localization/strings';
import { pickAvatarFromLibrary } from '../../services/media/avatarPicker';
import { useAuth } from '../../services/auth';
import { palette } from '../../theme/palette';
import SettingsSection from './components/SettingsSection';
import ToggleRow from './components/ToggleRow';

type Props = NativeStackScreenProps<any>;

export default function EditProfileScreen({ navigation }: Props) {
  const { user, accountEmail, updateProfileDetails, deleteAccount, isAuthActionLoading } = useAuth();
  const strings = getStrings();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const insets = useSafeAreaInsets();

  const [name, setName] = React.useState(user?.name || '');
  const [bio, setBio] = React.useState(user?.bio || '');
  const [avatar, setAvatar] = React.useState<string | null>(user?.avatar || null);
  const [visibility, setVisibility] = React.useState<'open' | 'locked'>(user?.visibility || 'open');
  const [avatarFeedback, setAvatarFeedback] = React.useState<string | null>(null);
  const [deleteSheetVisible, setDeleteSheetVisible] = React.useState(false);
  const [deleteConfirmationEmail, setDeleteConfirmationEmail] = React.useState('');

  const canSave = name.trim().length > 0 && bio.trim().length > 0 && !isAuthActionLoading;
  const normalizedAccountEmail = (accountEmail || '').trim().toLowerCase();
  const canConfirmDeletion =
    normalizedAccountEmail.length > 0
    && deleteConfirmationEmail.trim().toLowerCase() === normalizedAccountEmail
    && !isAuthActionLoading;

  const handlePickAvatar = React.useCallback(async () => {
    const result = await pickAvatarFromLibrary();

    if (result.status === 'permission-denied') {
      setAvatarFeedback(strings.profile.editAvatarPermissionDenied);
      return;
    }

    if (result.status === 'error') {
      setAvatarFeedback(strings.profile.editAvatarPickerError);
      return;
    }

    if (result.status === 'success') {
      setAvatarFeedback(null);
      setAvatar(result.uri);
    }
  }, [strings.profile.editAvatarPermissionDenied, strings.profile.editAvatarPickerError]);

  const handleSave = React.useCallback(async () => {
    if (!canSave) {
      return;
    }

    try {
      await updateProfileDetails({
        name,
        bio,
        avatar,
        visibility,
      });
      navigation.goBack();
    } catch {
      Alert.alert(strings.profile.editScreenTitle, strings.auth.authErrorGeneric);
    }
  }, [
    avatar,
    bio,
    canSave,
    name,
    navigation,
    strings.auth.authErrorGeneric,
    strings.profile.editScreenTitle,
    updateProfileDetails,
    visibility,
  ]);

  const handleDeleteAccount = React.useCallback(async () => {
    if (!canConfirmDeletion) {
      return;
    }

    try {
      await deleteAccount(deleteConfirmationEmail);
    } catch {
      Alert.alert(strings.profile.deleteSheetTitle, strings.auth.authErrorGeneric);
    }
  }, [
    canConfirmDeletion,
    deleteAccount,
    deleteConfirmationEmail,
    strings.auth.authErrorGeneric,
    strings.profile.deleteSheetTitle,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.border,
            paddingTop: 12 + insets.top,
            backgroundColor: theme.background,
          },
        ]}
      >
        <Pressable
          onPress={navigation.goBack}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
        >
          <MaterialIcons name="arrow-back-ios-new" size={18} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{strings.profile.editScreenTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 24 + insets.bottom },
          ]}
        >
          <View style={styles.avatarSection}>
            <Pressable
              onPress={handlePickAvatar}
              style={[styles.avatarButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
              accessibilityLabel={strings.profile.editAvatarLabel}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.background }]}>
                  <MaterialIcons name="person" size={30} color={theme.textMuted} />
                </View>
              )}
              <View style={[styles.avatarEditBadge, { backgroundColor: theme.primary }]}>
                <MaterialIcons name="photo-camera" size={12} color="#ffffff" />
              </View>
            </Pressable>
            <Text style={[styles.avatarLabel, { color: theme.textMuted }]}>{strings.profile.editAvatarLabel}</Text>
            {avatarFeedback ? (
              <Text style={[styles.avatarFeedback, { color: theme.danger }]}>{avatarFeedback}</Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{strings.profile.editNameLabel}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  color: theme.textPrimary,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder={strings.profile.editNamePlaceholder}
              placeholderTextColor={theme.textMuted}
              accessibilityLabel={strings.profile.editNameLabel}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{strings.profile.editHandleLabel}</Text>
            <View style={[styles.readOnlyInput, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Text style={[styles.readOnlyText, { color: theme.textMuted }]}>
                {`${strings.profile.handlePrefix}${user?.handle || ''}`}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{strings.profile.editBioLabel}</Text>
            <TextInput
              style={[
                styles.input,
                styles.bioInput,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  color: theme.textPrimary,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder={strings.profile.editBioPlaceholder}
              placeholderTextColor={theme.textMuted}
              multiline
              textAlignVertical="top"
              accessibilityLabel={strings.profile.editBioLabel}
            />
          </View>

          <SettingsSection
            title={strings.profile.sectionPrivacy}
            theme={{ textMuted: theme.textMuted, surface: theme.surface, border: theme.border }}
          >
            <ToggleRow
              icon="lock-open"
              iconBg="rgba(37,99,235,0.15)"
              iconColor="#3b82f6"
              title={strings.profile.visibilityTitle}
              subtitle={strings.profile.visibilitySubtitle}
              value={visibility !== 'locked'}
              onToggle={(next) => setVisibility(next ? 'open' : 'locked')}
              toggleA11yLabel={strings.profile.visibilityTitle}
              theme={{
                textPrimary: theme.textPrimary,
                textMuted: theme.textMuted,
                border: theme.border,
                surface: theme.surface,
                primary: theme.primary,
              }}
            />
          </SettingsSection>

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={[
              styles.saveButton,
              { backgroundColor: canSave ? theme.primary : theme.border },
            ]}
          >
            <Text style={styles.saveText}>
              {isAuthActionLoading ? strings.profile.editSaving : strings.profile.editSave}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setDeleteSheetVisible(true)}
            style={styles.deleteButton}
            accessibilityLabel={strings.profile.deleteAccount}
          >
            <Text style={[styles.deleteButtonText, { color: theme.danger }]}>
              {strings.profile.deleteAccount}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        animationType="slide"
        visible={deleteSheetVisible}
        onRequestClose={() => setDeleteSheetVisible(false)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setDeleteSheetVisible(false)} />
          <View style={[styles.sheetCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>{strings.profile.deleteSheetTitle}</Text>
            <Text style={[styles.sheetMessage, { color: theme.textMuted }]}>{strings.profile.deleteSheetMessage}</Text>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{strings.profile.deleteSheetEmailLabel}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  color: theme.textPrimary,
                },
              ]}
              value={deleteConfirmationEmail}
              onChangeText={setDeleteConfirmationEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={strings.profile.deleteSheetEmailPlaceholder}
              placeholderTextColor={theme.textMuted}
            />
            <View style={styles.sheetActions}>
              <Pressable
                style={[styles.sheetButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setDeleteSheetVisible(false)}
              >
                <Text style={[styles.sheetCancelText, { color: theme.textPrimary }]}>
                  {strings.profile.deleteSheetCancel}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.sheetButton,
                  { backgroundColor: canConfirmDeletion ? theme.danger : theme.border, borderColor: theme.border },
                ]}
                disabled={!canConfirmDeletion}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.sheetConfirmText}>{strings.profile.deleteSheetConfirm}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 18,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 8,
  },
  avatarButton: {
    width: 102,
    height: 102,
    borderRadius: 51,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans-Medium',
  },
  avatarFeedback: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'NotoSans-Regular',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
  },
  readOnlyInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  readOnlyText: {
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
  },
  bioInput: {
    minHeight: 110,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'NotoSans-Bold',
  },
  deleteButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteButtonText: {
    fontSize: 13,
    fontFamily: 'NotoSans-Bold',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetCard: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    gap: 10,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: 'BeVietnamPro-Bold',
  },
  sheetMessage: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'NotoSans-Regular',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  sheetButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 13,
    fontFamily: 'NotoSans-Bold',
  },
  sheetConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'NotoSans-Bold',
  },
});
