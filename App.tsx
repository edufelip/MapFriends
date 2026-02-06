import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Mapbox from '@rnmapbox/maps';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/services/auth';
import AppNavigator from './src/app/AppNavigator';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (mapboxToken) {
  Mapbox.setAccessToken(mapboxToken);
}

void SplashScreen.preventAutoHideAsync();

function AppContent({ fontsReady }: { fontsReady: boolean }) {
  const colorScheme = useColorScheme();
  const { isBootstrappingAuth } = useAuth();

  React.useEffect(() => {
    if (fontsReady && !isBootstrappingAuth) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady, isBootstrappingAuth]);

  if (!fontsReady || isBootstrappingAuth) {
    return null;
  }

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
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

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent fontsReady={fontsReady} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
