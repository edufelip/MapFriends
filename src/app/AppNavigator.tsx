import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../services/auth';
import { Routes } from './routes';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import AcceptTermsScreen from '../screens/Auth/AcceptTermsScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import FindPeopleScreen from '../screens/Connect/FindPeopleScreen';
import MapHomeScreen from '../screens/Map/MapHomeScreen';
import ExploreScreen from '../screens/Explore/ExploreScreen';
import PlaceDetailScreen from '../screens/Map/PlaceDetailScreen';
import ReviewComposerScreen from '../screens/Share/ReviewComposerScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

type RootStackParamList = {
  [Routes.AuthLogin]: undefined;
  [Routes.AuthSignup]: undefined;
  [Routes.AcceptTerms]: undefined;
  [Routes.ProfileSetup]: undefined;
  [Routes.Onboarding]: undefined;
  [Routes.MapHome]: undefined;
  [Routes.Explore]: undefined;
  [Routes.PlaceDetail]: { placeId: string };
  [Routes.ShareReview]: { placeId?: string } | undefined;
  [Routes.Notifications]: undefined;
  [Routes.Profile]: undefined;
  [Routes.Settings]: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={Routes.AuthLogin}
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={Routes.AuthSignup}
        component={SignupScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function OnboardingStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name={Routes.Onboarding} component={FindPeopleScreen} options={{ title: 'Find people' }} />
    </Stack.Navigator>
  );
}

function TermsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={Routes.AcceptTerms}
        component={AcceptTermsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function ProfileSetupStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={Routes.ProfileSetup}
        component={ProfileSetupScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={Routes.MapHome}
        component={MapHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={Routes.Explore} component={ExploreScreen} options={{ title: 'Explore' }} />
      <Stack.Screen name={Routes.PlaceDetail} component={PlaceDetailScreen} options={{ title: 'Place' }} />
      <Stack.Screen name={Routes.ShareReview} component={ReviewComposerScreen} options={{ title: 'Share review' }} />
      <Stack.Screen name={Routes.Notifications} component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name={Routes.Profile} component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name={Routes.Settings} component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const {
    isAuthenticated,
    hasAcceptedTerms,
    hasCompletedProfile,
    hasCompletedOnboarding,
  } = useAuth();

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : !hasAcceptedTerms ? (
        <TermsStack />
      ) : !hasCompletedProfile ? (
        <ProfileSetupStack />
      ) : !hasCompletedOnboarding ? (
        <OnboardingStack />
      ) : (
        <MainStack />
      )}
    </NavigationContainer>
  );
}
