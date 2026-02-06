import React from 'react';
import { Platform } from 'react-native';
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
import { getFirebaseAuth, isFirebaseConfigured } from './firebase';
import { User } from './types';
import { mapFirebaseAuthError } from './authErrors';
import {
  AUTH_SCHEME,
  GOOGLE_WEB_CLIENT_ID,
  RESOLVED_GOOGLE_ANDROID_CLIENT_ID,
  RESOLVED_GOOGLE_IOS_CLIENT_ID,
} from './authProviderConfig';
import {
  StoredOnboarding,
  StoredProfile,
  defaultOnboardingState,
  readStorage,
  toOnboardingKey,
  toProfileKey,
  toStoredProfile,
  writeStorage,
} from './authStorage';
import { fallbackHandle, isProfileComplete, toAppUser, toHandle } from './authUser';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  hasAcceptedTerms: boolean;
  hasCompletedProfile: boolean;
  hasSkippedProfileSetup: boolean;
  hasCompletedOnboarding: boolean;
};

type AuthContextValue = AuthState & {
  isBootstrappingAuth: boolean;
  isAuthActionLoading: boolean;
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
    avatar?: string | null;
  }) => void;
  skipProfileSetup: () => void;
  completeOnboarding: () => void;
  updateVisibility: (visibility: 'open' | 'locked') => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

WebBrowser.maybeCompleteAuthSession();

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
  const [isBootstrappingAuth, setIsBootstrappingAuth] = React.useState(true);
  const [isAuthActionLoading, setIsAuthActionLoading] = React.useState(false);
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
      setIsAuthActionLoading(true);
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
        setIsAuthActionLoading(false);
      }
    },
    [clearAuthError]
  );

  React.useEffect(() => {
    let mounted = true;
    if (!isFirebaseConfigured) {
      setIsBootstrappingAuth(false);
      return () => {
        mounted = false;
      };
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) {
        return;
      }
      setIsBootstrappingAuth(true);
      if (!firebaseUser) {
        setUser(null);
        setHasAcceptedTerms(false);
        setHasCompletedProfile(false);
        setHasSkippedProfileSetup(false);
        setHasCompletedOnboarding(false);
        setIsBootstrappingAuth(false);
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
      setIsBootstrappingAuth(false);
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
    avatar?: string | null;
  }) => {
    const uid = user?.id;
    if (!uid) {
      return;
    }
    const nextUser: User = {
      id: uid,
      ...profile,
      avatar: profile.avatar ?? user?.avatar ?? null,
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
    isBootstrappingAuth,
    isAuthActionLoading,
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
