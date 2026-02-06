import React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { getStrings } from '../localization/strings';
import { resolveGoogleClientIds } from './authConfig';
import { getFirebaseAuth, isFirebaseConfigured } from './firebase';
import { User } from './types';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  hasAcceptedTerms: boolean;
  hasCompletedProfile: boolean;
  hasSkippedProfileSetup: boolean;
  hasCompletedOnboarding: boolean;
};

type AuthContextValue = AuthState & {
  isLoadingAuth: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  acceptTerms: () => void;
  completeProfile: (profile: {
    name: string;
    handle: string;
    bio: string;
    visibility: 'open' | 'locked';
  }) => void;
  skipProfileSetup: () => void;
  completeOnboarding: () => void;
  updateVisibility: (visibility: 'open' | 'locked') => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

WebBrowser.maybeCompleteAuthSession();

const AUTH_SCHEME = process.env.EXPO_PUBLIC_AUTH_SCHEME || 'com.eduardo880.mapfriends';
const STORAGE_PREFIX = 'auth';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID_DEV = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID_DEV || '';
const GOOGLE_IOS_CLIENT_ID_PROD = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID_PROD || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID_DEV =
  process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID_DEV || '';
const GOOGLE_ANDROID_CLIENT_ID_PROD =
  process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID_PROD || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID || '';

const runtimeApplicationId =
  Application.applicationId ||
  Constants.expoConfig?.ios?.bundleIdentifier ||
  Constants.expoConfig?.android?.package ||
  '';

const {
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

type StoredOnboarding = {
  hasAcceptedTerms: boolean;
  hasSkippedProfileSetup: boolean;
  hasCompletedOnboarding: boolean;
};

type StoredProfile = Pick<User, 'name' | 'handle' | 'bio' | 'avatar' | 'visibility'>;

const defaultOnboardingState: StoredOnboarding = {
  hasAcceptedTerms: false,
  hasSkippedProfileSetup: false,
  hasCompletedOnboarding: false,
};

const toOnboardingKey = (uid: string) => `${STORAGE_PREFIX}:onboarding:${uid}`;
const toProfileKey = (uid: string) => `${STORAGE_PREFIX}:profile:${uid}`;

const isProfileComplete = (user: User | null) => {
  if (!user) {
    return false;
  }
  return Boolean(
    user.name?.trim() &&
      user.handle?.trim() &&
      user.bio?.trim() &&
      user.visibility
  );
};

const toHandle = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);

const fallbackHandle = (id: string) => {
  const suffix = id.replace(/[^a-z0-9]/gi, '').slice(-4).toLowerCase();
  return `user_${suffix || '0001'}`.slice(0, 20);
};

const mapFirebaseAuthError = (error: unknown) => {
  const strings = getStrings();
  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return strings.auth.authErrorInvalidCredentials;
      case 'auth/email-already-in-use':
        return strings.auth.authErrorEmailInUse;
      case 'auth/invalid-email':
        return strings.auth.authErrorInvalidEmail;
      case 'auth/weak-password':
        return strings.auth.authErrorWeakPassword;
      case 'auth/user-disabled':
        return strings.auth.authErrorUserDisabled;
      case 'auth/too-many-requests':
        return strings.auth.authErrorTooManyRequests;
      case 'auth/network-request-failed':
        return strings.auth.authErrorNetwork;
      case 'ERR_REQUEST_CANCELED':
        return strings.auth.authErrorProviderCanceled;
      case 'auth/google-not-configured':
      case 'auth/provider-unavailable':
        return strings.auth.authErrorProviderUnavailable;
      default:
        break;
    }
  }
  return strings.auth.authErrorGeneric;
};

const readStorage = async <T,>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeStorage = async (key: string, value: unknown) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

const toStoredProfile = (user: User): StoredProfile => ({
  name: user.name,
  handle: user.handle,
  bio: user.bio,
  avatar: user.avatar,
  visibility: user.visibility,
});

const toAppUser = (
  firebaseUser: {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
  },
  profile: StoredProfile | null
): User => ({
  id: firebaseUser.uid,
  name: profile?.name ?? firebaseUser.displayName ?? '',
  handle: profile?.handle ?? '',
  avatar: profile?.avatar ?? firebaseUser.photoURL ?? null,
  bio: profile?.bio ?? '',
  visibility: profile?.visibility ?? 'open',
});

const randomNonce = (length = 32) => {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [hasAcceptedTerms, setHasAcceptedTerms] = React.useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = React.useState(false);
  const [hasSkippedProfileSetup, setHasSkippedProfileSetup] = React.useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = React.useState(false);

  const [googleRequest, , promptGoogleAuth] = Google.useIdTokenAuthRequest(
    {
      webClientId: GOOGLE_WEB_CLIENT_ID || 'missing-web-client-id',
      iosClientId: RESOLVED_GOOGLE_IOS_CLIENT_ID || 'missing-ios-client-id',
      androidClientId: RESOLVED_GOOGLE_ANDROID_CLIENT_ID || 'missing-android-client-id',
      scopes: ['profile', 'email'],
    },
    {
      scheme: AUTH_SCHEME,
      path: 'oauthredirect',
    }
  );

  const clearAuthError = React.useCallback(() => {
    setAuthError(null);
  }, []);

  const persistOnboarding = React.useCallback(
    async (uid: string, next: Partial<StoredOnboarding>) => {
      const existing = await readStorage<StoredOnboarding>(toOnboardingKey(uid));
      await writeStorage(toOnboardingKey(uid), {
        ...defaultOnboardingState,
        ...(existing || {}),
        ...next,
      });
    },
    []
  );

  const persistProfile = React.useCallback(async (uid: string, next: StoredProfile) => {
    await writeStorage(toProfileKey(uid), next);
  }, []);

  const seedUserStorage = React.useCallback(
    async (
      uid: string,
      fallback: {
        name: string;
        avatar: string | null;
      }
    ) => {
      const existingProfile = await readStorage<StoredProfile>(toProfileKey(uid));
      if (!existingProfile) {
        await persistProfile(uid, {
          name: fallback.name,
          handle: '',
          bio: '',
          avatar: fallback.avatar,
          visibility: 'open',
        });
      }
      const onboarding = await readStorage<StoredOnboarding>(toOnboardingKey(uid));
      if (!onboarding) {
        await persistOnboarding(uid, defaultOnboardingState);
      }
    },
    [persistOnboarding, persistProfile]
  );

  const runAuthAction = React.useCallback(
    async (operation: () => Promise<void>) => {
      clearAuthError();
      setIsLoadingAuth(true);
      try {
        if (!isFirebaseConfigured) {
          throw new Error('auth/firebase-not-configured');
        }
        await operation();
      } catch (error) {
        if (error instanceof Error && error.message === 'auth/firebase-not-configured') {
          setAuthError(getStrings().auth.firebaseNotConfigured);
        } else {
          setAuthError(mapFirebaseAuthError(error));
        }
        throw error;
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [clearAuthError]
  );

  React.useEffect(() => {
    let mounted = true;
    if (!isFirebaseConfigured) {
      setIsLoadingAuth(false);
      return () => {
        mounted = false;
      };
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) {
        return;
      }
      setIsLoadingAuth(true);
      if (!firebaseUser) {
        setUser(null);
        setHasAcceptedTerms(false);
        setHasCompletedProfile(false);
        setHasSkippedProfileSetup(false);
        setHasCompletedOnboarding(false);
        setIsLoadingAuth(false);
        return;
      }

      await seedUserStorage(firebaseUser.uid, {
        name: firebaseUser.displayName || '',
        avatar: firebaseUser.photoURL || null,
      });
      const [storedProfile, storedOnboarding] = await Promise.all([
        readStorage<StoredProfile>(toProfileKey(firebaseUser.uid)),
        readStorage<StoredOnboarding>(toOnboardingKey(firebaseUser.uid)),
      ]);

      if (!mounted) {
        return;
      }
      const nextUser = toAppUser(firebaseUser, storedProfile);
      setUser(nextUser);
      setHasAcceptedTerms(storedOnboarding?.hasAcceptedTerms ?? false);
      setHasSkippedProfileSetup(storedOnboarding?.hasSkippedProfileSetup ?? false);
      setHasCompletedOnboarding(storedOnboarding?.hasCompletedOnboarding ?? false);
      setHasCompletedProfile(isProfileComplete(nextUser));
      setIsLoadingAuth(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [seedUserStorage]);

  React.useEffect(() => {
    let mounted = true;
    if (Platform.OS !== 'ios') {
      return () => {
        mounted = false;
      };
    }
    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (mounted) {
          setAppleAvailable(available);
        }
      })
      .catch(() => {
        if (mounted) {
          setAppleAvailable(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const signInWithEmail = React.useCallback(
    async (email: string, password: string) => {
      await runAuthAction(async () => {
        const auth = getFirebaseAuth();
        await signInWithEmailAndPassword(auth, email.trim(), password);
      });
    },
    [runAuthAction]
  );

  const signUpWithEmail = React.useCallback(
    async (name: string, email: string, password: string) => {
      await runAuthAction(async () => {
        const auth = getFirebaseAuth();
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const displayName = name.trim();
        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }
        await seedUserStorage(credential.user.uid, {
          name: displayName || credential.user.displayName || '',
          avatar: credential.user.photoURL || null,
        });
      });
    },
    [runAuthAction, seedUserStorage]
  );

  const signInWithGoogle = React.useCallback(async () => {
    await runAuthAction(async () => {
      if (!googleRequest) {
        throw new Error('auth/google-not-ready');
      }
      if (Platform.OS === 'ios' && !RESOLVED_GOOGLE_IOS_CLIENT_ID) {
        throw Object.assign(new Error('auth/google-not-configured'), {
          code: 'auth/google-not-configured',
        });
      }
      if (Platform.OS === 'android' && !RESOLVED_GOOGLE_ANDROID_CLIENT_ID) {
        throw Object.assign(new Error('auth/google-not-configured'), {
          code: 'auth/google-not-configured',
        });
      }
      const result = await promptGoogleAuth();
      if (result.type !== 'success') {
        throw Object.assign(new Error('auth/cancelled'), { code: 'ERR_REQUEST_CANCELED' });
      }
      const idToken = result.params.id_token;
      if (!idToken) {
        throw new Error('auth/google-missing-id-token');
      }
      const auth = getFirebaseAuth();
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      await seedUserStorage(userCredential.user.uid, {
        name: userCredential.user.displayName || '',
        avatar: userCredential.user.photoURL || null,
      });
    });
  }, [googleRequest, promptGoogleAuth, runAuthAction, seedUserStorage]);

  const signInWithApple = React.useCallback(async () => {
    await runAuthAction(async () => {
      if (Platform.OS !== 'ios' || !appleAvailable) {
        throw new Error('auth/apple-not-available');
      }
      const rawNonce = randomNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!appleCredential.identityToken) {
        throw new Error('auth/apple-missing-token');
      }
      const auth = getFirebaseAuth();
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce,
      });
      const userCredential = await signInWithCredential(auth, credential);
      const fullName = [appleCredential.fullName?.givenName, appleCredential.fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (fullName && !userCredential.user.displayName) {
        await updateProfile(userCredential.user, { displayName: fullName });
      }
      await seedUserStorage(userCredential.user.uid, {
        name: fullName || userCredential.user.displayName || '',
        avatar: userCredential.user.photoURL || null,
      });
    });
  }, [appleAvailable, runAuthAction, seedUserStorage]);

  const sendPasswordReset = React.useCallback(
    async (email: string) => {
      await runAuthAction(async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
          throw Object.assign(new Error('auth/invalid-email'), { code: 'auth/invalid-email' });
        }
        const auth = getFirebaseAuth();
        await sendPasswordResetEmail(auth, trimmedEmail);
      });
    },
    [runAuthAction]
  );

  const signOut = React.useCallback(async () => {
    await runAuthAction(async () => {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
    });
  }, [runAuthAction]);

  const acceptTerms = () => {
    const uid = user?.id;
    if (!uid) {
      return;
    }
    setHasAcceptedTerms(true);
    void persistOnboarding(uid, { hasAcceptedTerms: true });
  };

  const completeProfile = (profile: {
    name: string;
    handle: string;
    bio: string;
    visibility: 'open' | 'locked';
  }) => {
    const uid = user?.id;
    if (!uid) {
      return;
    }
    const nextUser: User = {
      id: uid,
      avatar: user?.avatar || null,
      ...profile,
    };
    setUser(nextUser);
    setHasCompletedProfile(true);
    setHasSkippedProfileSetup(false);
    setHasCompletedOnboarding(true);
    void persistProfile(uid, toStoredProfile(nextUser));
    void persistOnboarding(uid, {
      hasSkippedProfileSetup: false,
      hasCompletedOnboarding: true,
    });
  };

  const skipProfileSetup = () => {
    const uid = user?.id;
    if (!uid) {
      return;
    }
    setUser((prev) => {
      if (!prev) {
        return prev;
      }
      const nextHandle =
        prev.handle?.trim() ||
        toHandle(prev.name || '') ||
        fallbackHandle(prev.id);
      return {
        ...prev,
        handle: nextHandle.length >= 3 ? nextHandle : fallbackHandle(prev.id),
        visibility: prev.visibility || 'open',
      };
    });
    setHasSkippedProfileSetup(true);
    const next = {
      ...(user || {
        id: uid,
        name: '',
        avatar: null,
        bio: '',
        handle: '',
        visibility: 'open' as const,
      }),
    };
    const handle = next.handle?.trim() || toHandle(next.name || '') || fallbackHandle(uid);
    const stored: User = {
      ...next,
      handle: handle.length >= 3 ? handle : fallbackHandle(uid),
      visibility: next.visibility || 'open',
    };
    void persistProfile(uid, toStoredProfile(stored));
    void persistOnboarding(uid, { hasSkippedProfileSetup: true });
  };

  const completeOnboarding = () => {
    const uid = user?.id;
    if (!uid) {
      return;
    }
    setHasCompletedOnboarding(true);
    void persistOnboarding(uid, { hasCompletedOnboarding: true });
  };

  const updateVisibility = (visibility: 'open' | 'locked') => {
    setUser((prev) => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev, visibility };
      void persistProfile(prev.id, toStoredProfile(next));
      return next;
    });
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    hasAcceptedTerms,
    hasCompletedProfile,
    hasSkippedProfileSetup,
    hasCompletedOnboarding,
    isLoadingAuth,
    authError,
    clearAuthError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    sendPasswordReset,
    signOut,
    acceptTerms,
    completeProfile,
    skipProfileSetup,
    completeOnboarding,
    updateVisibility,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
