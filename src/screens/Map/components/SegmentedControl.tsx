import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  value: 'feed' | 'map';
  onChange: (value: 'feed' | 'map') => void;
  labels: { feed: string; map: string };
  textColor: string;
  activeTextColor: string;
  activeBackground: string;
  background: string;
};

export default function SegmentedControl({
  value,
  onChange,
  labels,
  textColor,
  activeTextColor,
  activeBackground,
  background,
}: Props) {
  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Pressable
        style={[styles.button, value === 'feed' && { backgroundColor: activeBackground }]}
        onPress={() => onChange('feed')}
      >
        <Text style={[styles.text, { color: value === 'feed' ? activeTextColor : textColor }]}>
          {labels.feed}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.button, value === 'map' && { backgroundColor: activeBackground }]}
        onPress={() => onChange('map')}
      >
        <Text style={[styles.text, { color: value === 'map' ? activeTextColor : textColor }]}>
          {labels.map}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
  },
  text: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
});
