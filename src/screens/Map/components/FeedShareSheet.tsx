import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSystemShare: () => void;
  onCopyLink: () => void;
  isSystemSharing: boolean;
  isCopying: boolean;
  reviewTitle: string;
  reviewAuthor: string;
  labels: {
    title: string;
    subtitlePrefix: string;
    share: string;
    copyLink: string;
    cancel: string;
  };
  theme: {
    background: string;
    surface: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
  };
};

export default function FeedShareSheet({
  visible,
  onClose,
  onSystemShare,
  onCopyLink,
  isSystemSharing,
  isCopying,
  reviewTitle,
  reviewAuthor,
  labels,
  theme,
}: Props) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: theme.textPrimary }]}>{labels.title}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={2}>
            {labels.subtitlePrefix} {reviewTitle} • {reviewAuthor}
          </Text>

          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={onSystemShare}
            disabled={isSystemSharing || isCopying}
            testID="feed-share-sheet-system-share"
          >
            <MaterialIcons name="ios-share" size={18} color={theme.textPrimary} />
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>{labels.share}</Text>
            {isSystemSharing ? <ActivityIndicator size="small" color={theme.primary} /> : null}
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={onCopyLink}
            disabled={isSystemSharing || isCopying}
            testID="feed-share-sheet-copy-link"
          >
            <MaterialIcons name="link" size={18} color={theme.textPrimary} />
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>{labels.copyLink}</Text>
            {isCopying ? <ActivityIndicator size="small" color={theme.primary} /> : null}
          </Pressable>

          <Pressable
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={onClose}
            testID="feed-share-sheet-cancel"
          >
            <Text style={[styles.cancelLabel, { color: theme.textMuted }]}>{labels.cancel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
    gap: 10,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.6)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'NotoSans-Regular',
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: 'NotoSans-Bold',
    flex: 1,
  },
  cancelButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cancelLabel: {
    fontSize: 13,
    fontFamily: 'NotoSans-Bold',
  },
});
