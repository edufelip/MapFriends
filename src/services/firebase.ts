import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, Persistence, getAuth, initializeAuth } from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { normalizeStorageBucket } from './firebaseStorageBucket';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const rawStorageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
const normalizedStorageBucket = normalizeStorageBucket(rawStorageBucket);

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: normalizedStorageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firestoreInstance = getFirestore(appInstance);
  storageInstance = normalizedStorageBucket
    ? getStorage(appInstance, `gs://${normalizedStorageBucket}`)
    : getStorage(appInstance);

  try {
    const persistenceFactory = (FirebaseAuth as unknown as {
      getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
    }).getReactNativePersistence;

    if (typeof persistenceFactory === 'function') {
      authInstance = initializeAuth(appInstance, {
        persistence: persistenceFactory(AsyncStorage),
      });
    } else {
      authInstance = getAuth(appInstance);
    }
  } catch {
    authInstance = getAuth(appInstance);
  }
}

export function getFirebaseAuth() {
  if (!authInstance) {
    throw new Error('Firebase Auth is not configured.');
  }
  return authInstance;
}

export function getFirestoreDb() {
  if (!firestoreInstance) {
    throw new Error('Firebase Firestore is not configured.');
  }
  return firestoreInstance;
}

export function getFirebaseStorage() {
  if (!storageInstance) {
    throw new Error('Firebase Storage is not configured.');
  }
  return storageInstance;
}
