import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Text, useColorScheme, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
  const [fontsReady, setFontsReady] = React.useState(false);

  React.useEffect(() => {
    if (fontsLoaded) {
      setFontsReady(true);
      return;
    }
    const timer = setTimeout(() => setFontsReady(true), 2000);
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Text style={{ fontSize: 14, color: colorScheme === 'dark' ? '#94a3b8' : '#64748b' }}>
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
