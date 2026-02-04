import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useColorScheme } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { AuthProvider } from './src/services/auth';
import AppNavigator from './src/app/AppNavigator';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (mapboxToken) {
  Mapbox.setAccessToken(mapboxToken);
}

export default function App() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    'BeVietnamPro-Regular': require('./assets/fonts/BeVietnamPro-Regular.ttf'),
    'BeVietnamPro-Medium': require('./assets/fonts/BeVietnamPro-Medium.ttf'),
    'BeVietnamPro-Bold': require('./assets/fonts/BeVietnamPro-Bold.ttf'),
    'NotoSans-Regular': require('./assets/fonts/NotoSans-Regular.ttf'),
    'NotoSans-Medium': require('./assets/fonts/NotoSans-Medium.ttf'),
    'NotoSans-Bold': require('./assets/fonts/NotoSans-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </AuthProvider>
  );
}
