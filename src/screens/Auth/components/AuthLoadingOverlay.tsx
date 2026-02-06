import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

type AuthLoadingOverlayProps = {
  visible: boolean;
  accessibilityLabel?: string;
};

export function AuthLoadingOverlay({ visible, accessibilityLabel = 'Loading' }: AuthLoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View
      style={styles.container}
      pointerEvents="auto"
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
    >
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 55}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.fallbackTint} />
      <View style={styles.spinnerShell}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  fallbackTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 18, 31, 0.26)',
  },
  spinnerShell: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(10, 18, 34, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
