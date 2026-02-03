import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlaces } from '../../services/map';
import { Routes } from '../../app/routes';
import MapHeaderActions from './MapHeaderActions';

export default function MapHomeScreen({ navigation }: NativeStackScreenProps<any>) {
  const places = getPlaces();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Today in your city</Text>
        <Text style={styles.heroSubtitle}>Local favorites recommended by your people.</Text>
        <MapHeaderActions navigation={navigation} />
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Map preview (local placeholder)</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Places to explore</Text>
        <TouchableOpacity onPress={() => navigation.navigate(Routes.ShareReview)}>
          <Text style={styles.sectionLink}>Share a place</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate(Routes.PlaceDetail, { placeId: item.id })}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>{item.category} · {item.rating.toFixed(1)}</Text>
            <Text style={styles.cardSummary}>{item.summary}</Text>
            <Text style={styles.cardTags}>{item.tags.join(' · ')}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f2ea',
  },
  hero: {
    padding: 20,
    backgroundColor: '#f0e8dd',
    borderBottomWidth: 1,
    borderBottomColor: '#e2ddd2',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2a2e',
  },
  heroSubtitle: {
    marginTop: 6,
    color: '#46555a',
  },
  mapPlaceholder: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d7d2c6',
  },
  mapText: {
    color: '#7a8a8f',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2a2e',
  },
  sectionLink: {
    color: '#2b5c5a',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2ddd2',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2a2e',
  },
  cardMeta: {
    marginTop: 4,
    color: '#6c7a7f',
  },
  cardSummary: {
    marginTop: 8,
    color: '#46555a',
  },
  cardTags: {
    marginTop: 8,
    color: '#2b5c5a',
    fontWeight: '600',
  },
});
