import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ReviewMapPin } from '../../../state/reviews';

type Props = {
  theme: {
    glass: string;
    textPrimary: string;
    textMuted: string;
  };
  review: ReviewMapPin;
  onClose: () => void;
};

const toVisibilityLabel = (visibility?: string) =>
  visibility === 'subscribers' ? 'Subscribers' : 'Followers';

export default function MapReviewContextCard({ theme, review, onClose }: Props) {
  const metadata = React.useMemo(() => {
    const parts: string[] = [];
    if (review.userName) {
      parts.push(review.userName);
    }
    if (review.userHandle) {
      parts.push(`@${review.userHandle}`);
    }
    parts.push(toVisibilityLabel(review.visibility));
    return parts.join(' · ');
  }, [review.userHandle, review.userName, review.visibility]);

  return (
    <View
      testID="map-review-context-card"
      style={[styles.contextCard, { backgroundColor: theme.glass }]}
    >
      <Pressable
        testID="map-review-context-card-close"
        accessibilityRole="button"
        style={styles.closeAction}
        onPress={onClose}
      >
        <MaterialIcons name="close" size={18} color={theme.textPrimary} />
      </Pressable>
      <View style={styles.contextContent}>
        <View style={styles.contextRow}>
          <Text style={[styles.contextTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {review.title}
          </Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={[styles.contextMeta, { color: theme.textMuted }]} numberOfLines={1}>
          {metadata}
        </Text>
        {review.notes ? (
          <Text style={[styles.contextQuote, { color: theme.textMuted }]} numberOfLines={2}>
            {review.notes}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contextCard: {
    borderRadius: 16,
    padding: 14,
    paddingRight: 44,
    minHeight: 98,
  },
  closeAction: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextContent: {
    flex: 1,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  contextTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  ratingBadge: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    color: '#22c55e',
    fontSize: 11,
    fontFamily: 'BeVietnamPro-Bold',
  },
  contextMeta: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'NotoSans-Regular',
  },
  contextQuote: {
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'NotoSans-Regular',
  },
});
