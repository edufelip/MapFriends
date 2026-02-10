import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { getPlaceById } from '../../services/map';
import { deleteReview, getReviewsForPlace, ReviewRecord } from '../../services/reviews';
import { Routes } from '../../app/routes';
import { useAuth } from '../../services/auth';
import PlaceReviewCard from './components/PlaceReviewCard';

type Props = NativeStackScreenProps<any>;

export default function PlaceDetailScreen({ route, navigation }: Props) {
  const placeId = route.params?.placeId as string | undefined;
  const place = placeId ? getPlaceById(placeId) : null;
  const { user } = useAuth();
  const [reviews, setReviews] = React.useState<ReviewRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadReviews = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (!placeId) {
        setReviews([]);
        return;
      }
      const next = await getReviewsForPlace(placeId);
      setReviews(next);
    } finally {
      setIsLoading(false);
    }
  }, [placeId]);

  useFocusEffect(
    React.useCallback(() => {
      void loadReviews();
    }, [loadReviews])
  );

  const handleEditReview = React.useCallback(
    (reviewId: string) => {
      navigation.navigate(Routes.ShareReview, { reviewId });
    },
    [navigation]
  );

  const handleDeleteReview = React.useCallback(
    (review: ReviewRecord) => {
      Alert.alert(
        'Delete review',
        'This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              if (!user?.id) {
                return;
              }
              try {
                await deleteReview({ reviewId: review.id, authorId: user.id });
                await loadReviews();
              } catch {
                Alert.alert('Delete review', 'Could not delete review right now.');
              }
            },
          },
        ]
      );
    },
    [loadReviews, user?.id]
  );

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
      {isLoading ? (
        <Text style={styles.emptyText}>Loading reviews...</Text>
      ) : reviews.length === 0 ? (
        <Text style={styles.emptyText}>No reviews yet. Be the first to share.</Text>
      ) : (
        reviews.map((review) => (
          <PlaceReviewCard
            key={review.id}
            review={review}
            isOwner={review.userId === user?.id}
            onEdit={handleEditReview}
            onDelete={handleDeleteReview}
          />
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
});
