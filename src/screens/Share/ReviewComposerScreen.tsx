import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createReview } from '../../services/reviews';
import { getPlaceById, getPlaces } from '../../services/map';

export default function ReviewComposerScreen({ route, navigation }: NativeStackScreenProps<any>) {
  const initialPlaceId = route.params?.placeId ?? getPlaces()[0]?.id;
  const [placeId] = React.useState(initialPlaceId);
  const place = placeId ? getPlaceById(placeId) : null;
  const [title, setTitle] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [rating, setRating] = React.useState('5');

  const handleSubmit = () => {
    if (!placeId) return;
    createReview({
      placeId,
      title: title.trim() || 'Great spot',
      notes: notes.trim() || 'Sharing a quick recommendation.',
      rating: Number(rating) || 5,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share a review</Text>
      <Text style={styles.subtitle}>
        {place ? `For ${place.name}` : 'Pick a place to share.'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Rating (1-5)"
        value={rating}
        onChangeText={setRating}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
        <Text style={styles.primaryButtonText}>Share review</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f2ea',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2a2e',
  },
  subtitle: {
    marginTop: 6,
    color: '#46555a',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d7d2c6',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#1f2a2e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#f5f2ea',
    fontWeight: '600',
    fontSize: 16,
  },
});
