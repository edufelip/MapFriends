import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { resolveGoogleClientIds } from './authConfig';

export const AUTH_SCHEME = process.env.EXPO_PUBLIC_AUTH_SCHEME || 'com.eduardo880.mapfriends';
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID || '';

const GOOGLE_IOS_CLIENT_ID_DEV = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID_DEV || '';
const GOOGLE_IOS_CLIENT_ID_PROD = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID_PROD || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID || '';

const GOOGLE_ANDROID_CLIENT_ID_DEV = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID_DEV || '';
const GOOGLE_ANDROID_CLIENT_ID_PROD = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID_PROD || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID || '';

const runtimeApplicationId =
  Application.applicationId ||
  Constants.expoConfig?.ios?.bundleIdentifier ||
  Constants.expoConfig?.android?.package ||
  '';

export const {
  iosClientId: RESOLVED_GOOGLE_IOS_CLIENT_ID,
  androidClientId: RESOLVED_GOOGLE_ANDROID_CLIENT_ID,
} = resolveGoogleClientIds(runtimeApplicationId, {
  iosDev: GOOGLE_IOS_CLIENT_ID_DEV,
  iosProd: GOOGLE_IOS_CLIENT_ID_PROD,
  iosLegacy: GOOGLE_IOS_CLIENT_ID,
  androidDev: GOOGLE_ANDROID_CLIENT_ID_DEV,
  androidProd: GOOGLE_ANDROID_CLIENT_ID_PROD,
  androidLegacy: GOOGLE_ANDROID_CLIENT_ID,
});
