import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Routes } from '../../app/routes';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function MapHeaderActions({ navigation }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => navigation.navigate(Routes.Notifications)}>
        <Text style={styles.link}>Notifications</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate(Routes.Profile)}>
        <Text style={styles.link}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate(Routes.Settings)}>
        <Text style={styles.link}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  link: {
    color: '#2b5c5a',
    fontWeight: '600',
  },
});
