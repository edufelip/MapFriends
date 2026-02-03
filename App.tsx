import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/services/auth';
import AppNavigator from './src/app/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </AuthProvider>
  );
}
