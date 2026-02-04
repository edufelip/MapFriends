import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../services/auth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No profile loaded</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.handle}>@{user.handle}</Text>
        <Text style={styles.bio}>{user.bio || 'Local explorer sharing weekend picks.'}</Text>
        <Text style={styles.visibility}>
          {user.visibility === 'locked' ? 'Locked profile' : 'Open profile'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Places saved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={signOut}>
        <Text style={styles.primaryButtonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f2ea',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2ddd2',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2a2e',
  },
  handle: {
    marginTop: 4,
    color: '#6c7a7f',
  },
  bio: {
    marginTop: 12,
    color: '#46555a',
  },
  visibility: {
    marginTop: 6,
    color: '#6c7a7f',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2ddd2',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2a2e',
  },
  statLabel: {
    marginTop: 4,
    color: '#6c7a7f',
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: '#1f2a2e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#f5f2ea',
    fontWeight: '600',
    fontSize: 16,
  },
});
