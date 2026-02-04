import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  theme: {
    primary: string;
  };
  labels: {
    title: string;
    subtitle: string;
    cta: string;
  };
};

export default function NotificationPremiumCard({ theme, labels }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="lock" size={20} color="#94a3b8" />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{labels.title}</Text>
        <Text style={styles.subtitle}>{labels.subtitle}</Text>
      </View>
      <Pressable style={[styles.button, { backgroundColor: theme.primary }]}> 
        <Text style={styles.buttonText}>{labels.cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
    color: '#f59e0b',
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'NotoSans-Regular',
    color: '#d97706',
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'BeVietnamPro-Bold',
  },
});
