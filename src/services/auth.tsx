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
  deleteUser,
  updateProfile,
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getStrings } from '../localization/strings';
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from './firebase';
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
  deleteStorage,
  readStorage,
  toOnboardingKey,
  toProfileKey,
  toStoredProfile,
  writeStorage,
} from './authStorage';
import { isProfileComplete, toAppUser } from './authUser';
import {
  checkHandleAvailability,
  claimProfileHandle,
  HandleAvailabilityStatus,
} from './handleRegistry';
import { isHandleValidFormat, normalizeHandle } from './handlePolicy';

type AuthState = {
  user: User | null;
  accountEmail: string | null;
  isAuthenticated: boolean;
  hasAcceptedTerms: boolean;
  hasCompletedProfile: boolean;
  hasCompletedOnboarding: boolean;
};

type AuthContextValue = AuthState & {
  isBootstrappingAuth: boolean;
  isAuthActionLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  checkHandleAvailability: (handle: string) => Promise<HandleAvailabilityStatus>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (emailConfirmation: string) => Promise<void>;
  acceptTerms: () => void;
  completeProfile: (profile: {
    name: string;
    handle: string;
    bio: string;
    visibility: 'open' | 'locked';
    avatar?: string | null;
  }) => Promise<void>;
  updateProfileDetails: (profile: {
    name: string;
    bio: string;
    avatar?: string | null;
    visibility: 'open' | 'locked';
  }) => Promise<void>;
  completeOnboarding: () => void;
  updateVisibility: (visibility: 'open' | 'locked') => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);
const ONBOARDING_VERSION = 1;

type RemoteUserMeta = {
  uid: string;
  hasAcceptedTerms: boolean;
  hasCompletedProfile: boolean;
  hasCompletedOnboarding: boolean;
  onboardingVersion: number;
};

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
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);
  const [accountEmail, setAccountEmail] = React.useState<string | null>(null);
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

  const readRemoteUserMeta = React.useCallback(async (uid: string): Promise<RemoteUserMeta | null> => {
    if (!isFirebaseConfigured) {
      return null;
    }
    try {
      const db = getFirestoreDb();
      const userMetaRef = doc(db, 'userMeta', uid);
      const snapshot = await getDoc(userMetaRef);
      if (!snapshot.exists()) {
        return null;
      }
      const data = snapshot.data() as Partial<RemoteUserMeta>;
      return {
        uid,
        hasAcceptedTerms: Boolean(data.hasAcceptedTerms),
        hasCompletedProfile: Boolean(data.hasCompletedProfile),
        hasCompletedOnboarding: Boolean(data.hasCompletedOnboarding),
        onboardingVersion:
          typeof data.onboardingVersion === 'number' ? data.onboardingVersion : ONBOARDING_VERSION,
      };
    } catch {
      return null;
    }
  }, []);

  const persistRemoteUserMeta = React.useCallback(async (meta: RemoteUserMeta) => {
    if (!isFirebaseConfigured) {
      return;
    }
    try {
      const db = getFirestoreDb();
      const userMetaRef = doc(db, 'userMeta', meta.uid);
      await setDoc(
        userMetaRef,
        {
          uid: meta.uid,
          hasAcceptedTerms: meta.hasAcceptedTerms,
          hasCompletedProfile: meta.hasCompletedProfile,
          hasCompletedOnboarding: meta.hasCompletedOnboarding,
          onboardingVersion: ONBOARDING_VERSION,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Keep local flow functional if remote sync fails.
    }
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
        setAccountEmail(null);
        setHasAcceptedTerms(false);
        setHasCompletedProfile(false);
        setHasCompletedOnboarding(false);
        setIsBootstrappingAuth(false);
        return;
      }
      setAccountEmail(firebaseUser.email || null);

      await seedUserStorage(firebaseUser.uid, {
        name: firebaseUser.displayName || '',
        avatar: firebaseUser.photoURL || null,
      });
      const [storedProfile, storedOnboarding] = await Promise.all([
        readStorage<StoredProfile>(toProfileKey(firebaseUser.uid)),
        readStorage<StoredOnboarding>(toOnboardingKey(firebaseUser.uid)),
      ]);
      const remoteMeta = await readRemoteUserMeta(firebaseUser.uid);

      if (!mounted) {
        return;
      }
      const nextUser = toAppUser(firebaseUser, storedProfile);
      const inferredProfileComplete = isProfileComplete(nextUser);
      const nextHasAcceptedTerms = Boolean(
        remoteMeta?.hasAcceptedTerms || storedOnboarding?.hasAcceptedTerms
      );
      const nextHasCompletedProfile = Boolean(
        remoteMeta?.hasCompletedProfile || inferredProfileComplete
      );
      const nextHasCompletedOnboarding = Boolean(
        remoteMeta?.hasCompletedOnboarding || storedOnboarding?.hasCompletedOnboarding
      );

      setUser(nextUser);
      setHasAcceptedTerms(nextHasAcceptedTerms);
      setHasCompletedOnboarding(nextHasCompletedOnboarding);
      setHasCompletedProfile(nextHasCompletedProfile);
      setIsBootstrappingAuth(false);

      const shouldBackfillRemoteMeta =
        !remoteMeta ||
        remoteMeta.hasAcceptedTerms !== nextHasAcceptedTerms ||
        remoteMeta.hasCompletedProfile !== nextHasCompletedProfile ||
        remoteMeta.hasCompletedOnboarding !== nextHasCompletedOnboarding;

      if (shouldBackfillRemoteMeta) {
        void persistRemoteUserMeta({
          uid: firebaseUser.uid,
          hasAcceptedTerms: nextHasAcceptedTerms,
          hasCompletedProfile: nextHasCompletedProfile,
          hasCompletedOnboarding: nextHasCompletedOnboarding,
          onboardingVersion: ONBOARDING_VERSION,
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [persistRemoteUserMeta, readRemoteUserMeta, seedUserStorage]);

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

  const checkProfileHandleAvailability = React.useCallback(
    async (handle: string) => checkHandleAvailability(handle, user?.id),
    [user?.id]
  );

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

  const deleteAccount = React.useCallback(
    async (emailConfirmation: string) => {
      const uid = user?.id;
      if (!uid) {
        return;
      }

      await runAuthAction(async () => {
        const auth = getFirebaseAuth();
        const currentUser = auth.currentUser;
        const currentEmail = (currentUser?.email || accountEmail || '').trim().toLowerCase();
        const providedEmail = emailConfirmation.trim().toLowerCase();

        if (!currentUser || !currentEmail) {
          throw Object.assign(new Error('auth/user-not-found'), { code: 'auth/user-not-found' });
        }

        if (providedEmail !== currentEmail) {
          throw Object.assign(new Error('auth/delete-email-mismatch'), { code: 'auth/delete-email-mismatch' });
        }

        if (isFirebaseConfigured) {
          const db = getFirestoreDb();
          const normalizedHandle = normalizeHandle(user?.handle || '');

          try {
            await Promise.all([
              deleteDoc(doc(db, 'userMeta', uid)),
              deleteDoc(doc(db, 'users', uid)),
              normalizedHandle ? deleteDoc(doc(db, 'handles', normalizedHandle)) : Promise.resolve(),
            ]);
          } catch {
            // Keep deletion flow resilient even if remote cleanup is partial.
          }
        }

        await deleteUser(currentUser);

        setUser(null);
        setAccountEmail(null);
        setHasAcceptedTerms(false);
        setHasCompletedProfile(false);
        setHasCompletedOnboarding(false);

        await Promise.all([
          deleteStorage(toProfileKey(uid)),
          deleteStorage(toOnboardingKey(uid)),
        ]);
      });
    },
    [accountEmail, runAuthAction, user]
  );

  const acceptTerms = () => {
    const uid = user?.id;
    if (!uid) {
      return;
    }
    setHasAcceptedTerms(true);
    void persistOnboarding(uid, { hasAcceptedTerms: true });
    void persistRemoteUserMeta({
      uid,
      hasAcceptedTerms: true,
      hasCompletedProfile,
      hasCompletedOnboarding,
      onboardingVersion: ONBOARDING_VERSION,
    });
  };

  const completeProfile = React.useCallback(
    async (profile: {
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

      await runAuthAction(async () => {
        const requestedHandle = normalizeHandle(profile.handle);
        const currentHandle = normalizeHandle(user?.handle || '');

        if (!isHandleValidFormat(requestedHandle)) {
          throw Object.assign(new Error('profile/handle-invalid'), { code: 'profile/handle-invalid' });
        }

        if (currentHandle && currentHandle !== requestedHandle) {
          throw Object.assign(new Error('profile/handle-immutable'), {
            code: 'profile/handle-immutable',
          });
        }

        const claimedHandle = await claimProfileHandle({
          uid,
          name: profile.name.trim(),
          handle: requestedHandle,
          bio: profile.bio.trim(),
          visibility: profile.visibility,
          avatar: profile.avatar ?? user?.avatar ?? null,
        });

        const nextUser: User = {
          id: uid,
          name: profile.name.trim(),
          handle: claimedHandle,
          bio: profile.bio.trim(),
          visibility: profile.visibility,
          avatar: profile.avatar ?? user?.avatar ?? null,
        };

        setUser(nextUser);
        setHasCompletedProfile(true);
        setHasCompletedOnboarding(true);
        await persistProfile(uid, toStoredProfile(nextUser));
        await persistOnboarding(uid, {
          hasCompletedOnboarding: true,
        });
        await persistRemoteUserMeta({
          uid,
          hasAcceptedTerms: true,
          hasCompletedProfile: true,
          hasCompletedOnboarding: true,
          onboardingVersion: ONBOARDING_VERSION,
        });
      });
    },
    [persistOnboarding, persistProfile, persistRemoteUserMeta, runAuthAction, user]
  );

  const completeOnboarding = () => {
    const uid = user?.id;
    if (!uid) {
      return;
    }
    setHasCompletedOnboarding(true);
    void persistOnboarding(uid, { hasCompletedOnboarding: true });
    void persistRemoteUserMeta({
      uid,
      hasAcceptedTerms,
      hasCompletedProfile,
      hasCompletedOnboarding: true,
      onboardingVersion: ONBOARDING_VERSION,
    });
  };

  const updateProfileDetails = React.useCallback(
    async (profile: {
      name: string;
      bio: string;
      avatar?: string | null;
      visibility: 'open' | 'locked';
    }) => {
      const uid = user?.id;
      if (!uid || !user) {
        return;
      }

      await runAuthAction(async () => {
        const nextUser: User = {
          ...user,
          name: profile.name.trim(),
          bio: profile.bio.trim(),
          avatar: profile.avatar ?? user.avatar ?? null,
          visibility: profile.visibility,
        };

        setUser(nextUser);
        await persistProfile(uid, toStoredProfile(nextUser));

        if (isFirebaseConfigured) {
          const auth = getFirebaseAuth();
          if (auth.currentUser && nextUser.name && auth.currentUser.displayName !== nextUser.name) {
            await updateProfile(auth.currentUser, { displayName: nextUser.name });
          }

          try {
            const db = getFirestoreDb();
            const userRef = doc(db, 'users', uid);
            await setDoc(
              userRef,
              {
                uid,
                name: nextUser.name,
                bio: nextUser.bio,
                avatar: nextUser.avatar,
                visibility: nextUser.visibility,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          } catch {
            // Keep local profile update working when remote sync fails.
          }
        }
      });
    },
    [persistProfile, runAuthAction, user]
  );

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
    accountEmail,
    isAuthenticated: Boolean(user),
    hasAcceptedTerms,
    hasCompletedProfile,
    hasCompletedOnboarding,
    isBootstrappingAuth,
    isAuthActionLoading,
    authError,
    clearAuthError,
    checkHandleAvailability: checkProfileHandleAvailability,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    sendPasswordReset,
    signOut,
    deleteAccount,
    acceptTerms,
    completeProfile,
    updateProfileDetails,
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
