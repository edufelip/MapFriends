import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ReviewRecord } from '../../../services/reviews';

type Props = {
  review: ReviewRecord;
  isOwner: boolean;
  onEdit: (reviewId: string) => void;
  onDelete: (review: ReviewRecord) => void;
};

export default function PlaceReviewCard({
  review,
  isOwner,
  onEdit,
  onDelete,
}: Props) {
  return (
    <View style={styles.reviewCard}>
      <Text style={styles.reviewTitle}>{review.title}</Text>
      <Text style={styles.reviewMeta}>
        {`Rating ${review.rating} · ${new Date(review.createdAt).toLocaleDateString()}`}
      </Text>
      <Text style={styles.reviewNotes}>{review.notes}</Text>
      {isOwner ? (
        <View style={styles.reviewActions}>
          <Pressable style={styles.reviewActionButton} onPress={() => onEdit(review.id)}>
            <Text style={styles.reviewActionText}>Edit</Text>
          </Pressable>
          <Pressable
            style={[styles.reviewActionButton, styles.reviewDeleteButton]}
            onPress={() => onDelete(review)}
          >
            <Text style={styles.reviewDeleteText}>Delete</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2ddd2',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2a2e',
  },
  reviewMeta: {
    marginTop: 6,
    color: '#6c7a7f',
  },
  reviewNotes: {
    marginTop: 8,
    color: '#46555a',
  },
  reviewActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  reviewActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2ddd2',
    backgroundColor: '#ffffff',
  },
  reviewActionText: {
    color: '#1f2a2e',
    fontWeight: '600',
  },
  reviewDeleteButton: {
    borderColor: '#fbcaca',
    backgroundColor: '#fff6f6',
  },
  reviewDeleteText: {
    color: '#cf3737',
    fontWeight: '600',
  },
});
