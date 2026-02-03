import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

export default function SettingsScreen() {
  const [shareLocation, setShareLocation] = React.useState(true);
  const [weeklyDigest, setWeeklyDigest] = React.useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Share location</Text>
          <Text style={styles.caption}>Allow friends to see your latest map updates.</Text>
        </View>
        <Switch value={shareLocation} onValueChange={setShareLocation} />
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Weekly digest</Text>
          <Text style={styles.caption}>Get a recap of new spots in your area.</Text>
        </View>
        <Switch value={weeklyDigest} onValueChange={setWeeklyDigest} />
      </View>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2a2e',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2ddd2',
    marginBottom: 12,
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2a2e',
  },
  caption: {
    marginTop: 4,
    color: '#6c7a7f',
  },
});
