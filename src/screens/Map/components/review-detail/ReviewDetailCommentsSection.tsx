import React from 'react';
import {
  ActivityIndicator,
  Alert,
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

const MAX_COMMENT_LENGTH = 200;

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
    [labels.cancel, labels.delete, labels.deleteErrorMessage, labels.deleteErrorTitle, labels.deleteMessage, labels.deleteTitle, onDelete]
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{labels.title}</Text>

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
          >
            <Text style={styles.submitButtonText}>{isPosting ? labels.submitting : labels.submit}</Text>
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
          {comments.map((comment) => {
            const mine = Boolean(userId && comment.userId === userId);
            const deleting = Boolean(deletingById[comment.id]);

            return (
              <View key={comment.id} style={[styles.item, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.author, { color: theme.textPrimary }]}>
                    {comment.userName} @{comment.userHandle}
                  </Text>
                  {mine ? (
                    <Pressable
                      onPress={() => handleDelete(comment.id)}
                      disabled={deleting}
                      style={{ opacity: deleting ? 0.5 : 1 }}
                    >
                      <MaterialIcons name="delete-outline" size={16} color={theme.danger} />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={[styles.body, { color: theme.textPrimary }]}>{comment.text}</Text>
              </View>
            );
          })}
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
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
    marginBottom: 10,
  },
  composer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  input: {
    minHeight: 68,
    fontSize: 13,
    lineHeight: 18,
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  author: {
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'NotoSans-Regular',
  },
});
