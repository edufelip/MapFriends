import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getPeople } from '../../services/connect';
import { useAuth } from '../../services/auth';

export default function FindPeopleScreen() {
  const { completeOnboarding } = useAuth();
  const people = getPeople();
  const [connectedIds, setConnectedIds] = React.useState<string[]>([]);

  const toggleConnect = (id: string) => {
    setConnectedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find your people</Text>
      <Text style={styles.subtitle}>Connect with locals who share your interests.</Text>

      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const connected = connectedIds.includes(item.id);
          return (
            <View style={styles.card}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.handle}>@{item.handle}</Text>
                <Text style={styles.bio}>{item.bio}</Text>
                <Text style={styles.tags}>{item.commonTags.join(' · ')}</Text>
              </View>
              <TouchableOpacity
                style={[styles.connectButton, connected && styles.connectedButton]}
                onPress={() => toggleConnect(item.id)}
              >
                <Text style={[styles.connectText, connected && styles.connectedText]}>
                  {connected ? 'Connected' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={completeOnboarding}>
        <Text style={styles.primaryButtonText}>Continue to map</Text>
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
    fontSize: 26,
    fontWeight: '700',
    color: '#1f2a2e',
  },
  subtitle: {
    fontSize: 15,
    color: '#46555a',
    marginTop: 6,
    marginBottom: 16,
  },
  list: {
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
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2a2e',
  },
  handle: {
    color: '#6c7a7f',
    marginTop: 2,
  },
  bio: {
    marginTop: 8,
    color: '#46555a',
  },
  tags: {
    marginTop: 8,
    color: '#2b5c5a',
    fontWeight: '600',
  },
  connectButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2a2e',
    alignItems: 'center',
  },
  connectedButton: {
    backgroundColor: '#1f2a2e',
  },
  connectText: {
    color: '#1f2a2e',
    fontWeight: '600',
  },
  connectedText: {
    color: '#f5f2ea',
  },
  primaryButton: {
    backgroundColor: '#1f2a2e',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#f5f2ea',
    fontWeight: '600',
    fontSize: 16,
  },
});
