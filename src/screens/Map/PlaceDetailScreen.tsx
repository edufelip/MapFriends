import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlaceById } from '../../services/map';
import { getReviewsForPlace } from '../../services/reviews';
import { Routes } from '../../app/routes';

type Props = NativeStackScreenProps<any>;

export default function PlaceDetailScreen({ route, navigation }: Props) {
  const { placeId } = route.params;
  const place = getPlaceById(placeId);
  const reviews = getReviewsForPlace(placeId);

  if (!place) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Place not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{place.name}</Text>
      <Text style={styles.meta}>{place.category} · {place.rating.toFixed(1)}</Text>
      <Text style={styles.summary}>{place.summary}</Text>
      <Text style={styles.address}>{place.address}</Text>

      <View style={styles.tagRow}>
        {place.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate(Routes.ShareReview, { placeId })}
      >
        <Text style={styles.primaryButtonText}>Share a review</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent reviews</Text>
      {reviews.length === 0 ? (
        <Text style={styles.emptyText}>No reviews yet. Be the first to share.</Text>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>{review.title}</Text>
            <Text style={styles.reviewMeta}>Rating {review.rating} · {new Date(review.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.reviewNotes}>{review.notes}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f2ea',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f2a2e',
  },
  meta: {
    marginTop: 6,
    color: '#6c7a7f',
  },
  summary: {
    marginTop: 12,
    fontSize: 16,
    color: '#46555a',
  },
  address: {
    marginTop: 8,
    color: '#2b5c5a',
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2ddd2',
  },
  tagText: {
    color: '#2b5c5a',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#1f2a2e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryButtonText: {
    color: '#f5f2ea',
    fontWeight: '600',
    fontSize: 16,
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2a2e',
  },
  emptyText: {
    marginTop: 8,
    color: '#6c7a7f',
  },
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
});
