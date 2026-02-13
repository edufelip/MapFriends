import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ReviewCommentRecord } from '../../../../services/engagement';

type Props = {
  userId: string | null | undefined;
  comments: ReviewCommentRecord[];
  isHydrating: boolean;
  isPosting: boolean;
  deletingById: Record<string, boolean>;
  onSubmit: (text: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  labels: {
    title: string;
    empty: string;
    placeholder: string;
    submit: string;
    submitting: string;
    delete: string;
    deleteTitle: string;
    deleteMessage: string;
    deleteErrorTitle: string;
    deleteErrorMessage: string;
    cancel: string;
  };
  theme: {
    textPrimary: string;
    textMuted: string;
    border: string;
    surface: string;
    primary: string;
    danger: string;
    background: string;
  };
};

type CommentItemProps = {
  comment: ReviewCommentRecord;
  mine: boolean;
  deleting: boolean;
  onDelete: (commentId: string) => void;
  theme: Props['theme'];
};

const MAX_COMMENT_LENGTH = 200;
const INVALID_AVATAR_VALUES = new Set(['null', 'undefined', 'none', 'n/a']);
const KNOWN_PLACEHOLDER_AVATAR_PATTERNS = ['default-user', 'default_profile', '/avatar/00000000000000000000000000000000'];

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

  const lower = normalized.toLowerCase();
  if (KNOWN_PLACEHOLDER_AVATAR_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return null;
  }

  return normalized;
};

const toRelativeTimeLabel = (dateIso: string) => {
  const timestamp = Date.parse(dateIso);
  if (Number.isNaN(timestamp)) {
    return 'now';
  }

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (elapsedMinutes < 1) {
    return 'now';
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d`;
};

const CommentItem = React.memo(function CommentItem({
  comment,
  mine,
  deleting,
  onDelete,
  theme,
}: CommentItemProps) {
  const avatarUri = React.useMemo(() => normalizeAvatarUri(comment.userAvatar), [comment.userAvatar]);
  const [avatarLoadError, setAvatarLoadError] = React.useState(false);
  const [avatarLoaded, setAvatarLoaded] = React.useState(false);

  React.useEffect(() => {
    setAvatarLoadError(false);
    setAvatarLoaded(false);
  }, [avatarUri]);

  return (
    <View style={[styles.item, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
      <View style={styles.itemRow}>
        <View style={[styles.avatarShell, { borderColor: theme.primary }]}> 
          <View
            testID={`comment-avatar-fallback-${comment.id}`}
            style={[styles.avatarFallback, { backgroundColor: `${theme.primary}18` }]}
          >
            <MaterialIcons name="person" size={22} color={theme.textMuted} />
          </View>

          {avatarUri && !avatarLoadError ? (
            <Image
              testID={`comment-avatar-image-${comment.id}`}
              source={{ uri: avatarUri, cache: 'force-cache' }}
              style={[styles.avatar, styles.avatarOverlay, !avatarLoaded && styles.avatarHidden]}
              onLoad={() => setAvatarLoaded(true)}
              onError={() => setAvatarLoadError(true)}
            />
          ) : null}
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.metaRow}>
            <View style={styles.nameRow}>
              <Text style={[styles.author, { color: theme.textPrimary }]} numberOfLines={1}>
                {comment.userName}
              </Text>
              <Text style={[styles.handle, { color: theme.textMuted }]} numberOfLines={1}>
                @{comment.userHandle}
              </Text>
            </View>

            <View style={styles.rightMetaRow}>
              <View style={[styles.timeChip, { borderColor: theme.border, backgroundColor: theme.background }]}> 
                <MaterialIcons name="schedule" size={11} color={theme.textMuted} />
                <Text style={[styles.timeText, { color: theme.textMuted }]}>{toRelativeTimeLabel(comment.createdAt)}</Text>
              </View>

              {mine ? (
                <Pressable
                  onPress={() => onDelete(comment.id)}
                  disabled={deleting}
                  style={[styles.deleteButton, { opacity: deleting ? 0.5 : 1 }]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Delete comment"
                >
                  <MaterialIcons name="delete-outline" size={17} color={theme.danger} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <Text style={[styles.body, { color: theme.textPrimary }]}>{comment.text}</Text>
        </View>
      </View>
    </View>
  );
});

export default function ReviewDetailCommentsSection({
  userId,
  comments,
  isHydrating,
  isPosting,
  deletingById,
  onSubmit,
  onDelete,
  labels,
  theme,
}: Props) {
  const [draft, setDraft] = React.useState('');
  const trimmed = draft.trim();
  const remaining = MAX_COMMENT_LENGTH - draft.length;

  const handleSubmit = React.useCallback(async () => {
    if (!trimmed || isPosting || draft.length > MAX_COMMENT_LENGTH) {
      return;
    }

    await onSubmit(trimmed);
    setDraft('');
  }, [draft.length, isPosting, onSubmit, trimmed]);

  const handleDelete = React.useCallback(
    (commentId: string) => {
      Alert.alert(labels.deleteTitle, labels.deleteMessage, [
        { text: labels.cancel, style: 'cancel' },
        {
          text: labels.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(commentId);
            } catch {
              Alert.alert(labels.deleteErrorTitle, labels.deleteErrorMessage);
            }
          },
        },
      ]);
    },
    [
      labels.cancel,
      labels.delete,
      labels.deleteErrorMessage,
      labels.deleteErrorTitle,
      labels.deleteMessage,
      labels.deleteTitle,
      onDelete,
    ]
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textMuted }]}>{labels.title}</Text>

      <View style={[styles.composer, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={labels.placeholder}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.textPrimary }]}
          maxLength={MAX_COMMENT_LENGTH}
          multiline
        />

        <View style={styles.composerFooter}>
          <Text style={[styles.remaining, { color: remaining < 20 ? theme.danger : theme.textMuted }]}> 
            {remaining}
          </Text>

          <Pressable
            onPress={() => {
              void handleSubmit();
            }}
            style={[
              styles.submitButton,
              {
                backgroundColor: theme.primary,
                opacity: !trimmed || isPosting ? 0.6 : 1,
              },
            ]}
            disabled={!trimmed || isPosting || draft.length > MAX_COMMENT_LENGTH}
            accessibilityRole="button"
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>{labels.submit}</Text>
            )}
          </Pressable>
        </View>
      </View>

      {isHydrating ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      ) : comments.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>{labels.empty}</Text>
      ) : (
        <View style={styles.list}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              mine={Boolean(userId && comment.userId === userId)}
              deleting={Boolean(deletingById[comment.id])}
              onDelete={handleDelete}
              theme={theme}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    marginBottom: 16,
  },
  title: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'NotoSans-Bold',
    marginBottom: 10,
  },
  composer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  input: {
    minHeight: 48,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'NotoSans-Regular',
    textAlignVertical: 'top',
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remaining: {
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
  submitButton: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 74,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
  loadingRow: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'NotoSans-Regular',
  },
  list: {
    marginTop: 12,
    gap: 10,
  },
  item: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarShell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flex: 1,
  },
  author: {
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
  handle: {
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
    flexShrink: 1,
  },
  rightMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeChip: {
    height: 22,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    fontFamily: 'NotoSans-Bold',
  },
  deleteButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'NotoSans-Regular',
  },
});
