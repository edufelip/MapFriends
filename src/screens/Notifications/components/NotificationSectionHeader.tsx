import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  background: string;
  textColor: string;
};

export default function NotificationSectionHeader({ title, background, textColor }: Props) {
  return (
    <View style={[styles.container, { backgroundColor: background }]}> 
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontSize: 10,
    fontFamily: 'BeVietnamPro-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
