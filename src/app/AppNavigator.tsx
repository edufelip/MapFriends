import React from 'react';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as ExpoLinking from 'expo-linking';
import { useAuth } from '../services/auth';
import { Routes } from './routes';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import AcceptTermsScreen from '../screens/Auth/AcceptTermsScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import FindPeopleScreen from '../screens/Connect/FindPeopleScreen';
import MainShellScreen from '../screens/Main/MainShellScreen';
import MapHomeScreen from '../screens/Map/MapHomeScreen';
import ExploreScreen from '../screens/Explore/ExploreScreen';
import PlaceDetailScreen from '../screens/Map/PlaceDetailScreen';
import ReviewDetailScreen from '../screens/Map/ReviewDetailScreen';
import ReviewComposerScreen from '../screens/Share/ReviewComposerScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import BlockedUsersScreen from '../screens/Profile/BlockedUsersScreen';
import ManageSubscriptionsScreen from '../screens/Profile/ManageSubscriptionsScreen';

type RootStackParamList = {
  [Routes.MainShell]: undefined;
  [Routes.AuthLogin]: undefined;
  [Routes.AuthSignup]: undefined;
  [Routes.AcceptTerms]: undefined;
  [Routes.ProfileSetup]: undefined;
  [Routes.Onboarding]: undefined;
  [Routes.MapHome]: undefined;
  [Routes.Explore]: undefined;
  [Routes.PlaceDetail]: { placeId: string };
  [Routes.ReviewDetail]: { reviewId: string };
  [Routes.ShareReview]: { placeId?: string; reviewId?: string } | undefined;
  [Routes.Notifications]: undefined;
  [Routes.Profile]: undefined;
  [Routes.EditProfile]: undefined;
  [Routes.Settings]: undefined;
  [Routes.ManageSubscriptions]: undefined;
  [Routes.BlockedUsers]: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [ExpoLinking.createURL('/'), 'com.eduardo880.mapfriends://'],
  config: {
    screens: {
      [Routes.ReviewDetail]: 'review/:reviewId',
    },
  },
};

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
        name={Routes.MainShell}
        component={MainShellScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={Routes.AuthLogin}
        component={LoginScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={Routes.MapHome}
        component={MapHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={Routes.Explore} component={ExploreScreen} options={{ title: 'Explore' }} />
      <Stack.Screen name={Routes.PlaceDetail} component={PlaceDetailScreen} options={{ title: 'Place' }} />
      <Stack.Screen
        name={Routes.ReviewDetail}
        component={ReviewDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={Routes.ShareReview}
        component={ReviewComposerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={Routes.Notifications} component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name={Routes.Profile} component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen
        name={Routes.EditProfile}
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={Routes.Settings} component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen
        name={Routes.ManageSubscriptions}
        component={ManageSubscriptionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={Routes.BlockedUsers}
        component={BlockedUsersScreen}
        options={{ headerShown: false }}
      />
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
    <NavigationContainer linking={linking}>
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
