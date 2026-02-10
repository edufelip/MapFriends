import React from 'react';
import { act, render } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../auth';
import { getStrings } from '../../localization/strings';

const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockSignOut = jest.fn();
const mockSignInWithCredential = jest.fn();
const mockUpdateProfile = jest.fn();
const mockDeleteUser = jest.fn();
const mockClaimProfileHandle = jest.fn();
const mockCheckHandleAvailability = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => 'server-timestamp');
let authStateListener: ((user: unknown) => void) | null = null;

const mockStorage = new Map<string, string>();
const mockFirestoreDocs = new Map<string, Record<string, unknown>>();
const mockAuthInstance: { app: string; currentUser: { uid: string; email: string } | null } = {
  app: 'mock-auth',
  currentUser: null,
};

jest.mock('../firebase', () => ({
  isFirebaseConfigured: true,
  getFirebaseAuth: () => mockAuthInstance,
  getFirestoreDb: () => ({ app: 'mock-firestore' }),
}));

jest.mock('../handleRegistry', () => ({
  checkHandleAvailability: (...args: unknown[]) => mockCheckHandleAvailability(...args),
  claimProfileHandle: (...args: unknown[]) => mockClaimProfileHandle(...args),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStorage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      mockStorage.delete(key);
    }),
  },
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useIdTokenAuthRequest: () => [
    {},
    null,
    jest.fn(async () => ({ type: 'success', params: { id_token: 'google-id-token' } })),
  ],
}));

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(async () => true),
  AppleAuthenticationScope: {
    FULL_NAME: 'FULL_NAME',
    EMAIL: 'EMAIL',
  },
  signInAsync: jest.fn(async () => ({
    identityToken: 'apple-id-token',
    fullName: { givenName: 'Apple', familyName: 'User' },
  })),
}));

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  digestStringAsync: jest.fn(async () => 'hashed-nonce'),
}));

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: {
    credential: jest.fn(() => ({ provider: 'google' })),
  },
  OAuthProvider: jest.fn().mockImplementation(() => ({
    credential: jest.fn(() => ({ provider: 'apple' })),
  })),
  onAuthStateChanged: jest.fn((_auth: unknown, cb: (user: unknown) => void) => {
    authStateListener = cb;
    cb(null);
    return jest.fn();
  }),
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUserWithEmailAndPassword(...args),
  sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordResetEmail(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  signInWithCredential: (...args: unknown[]) => mockSignInWithCredential(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
}));

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

let latest: ReturnType<typeof useAuth> | null = null;

function TestConsumer() {
  latest = useAuth();
  return null;
}

const renderProvider = async () => {
  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

  await act(async () => {
    await Promise.resolve();
  });
};

const firebaseUser = {
  uid: 'user-001',
  displayName: 'Alex',
  photoURL: null,
};

const setFirebaseUser = async (user: typeof firebaseUser | null) => {
  await act(async () => {
    await authStateListener?.(user);
  });
};

const createDeferred = () => {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

describe('AuthProvider', () => {
  const strings = getStrings();

  beforeEach(() => {
    latest = null;
    mockStorage.clear();
    mockSignInWithEmailAndPassword.mockReset();
    mockCreateUserWithEmailAndPassword.mockReset();
    mockSendPasswordResetEmail.mockReset();
    mockSignOut.mockReset();
    mockSignInWithCredential.mockReset();
    mockUpdateProfile.mockReset();
    mockDeleteUser.mockReset();
    mockClaimProfileHandle.mockReset();
    mockClaimProfileHandle.mockResolvedValue('alex');
    mockCheckHandleAvailability.mockReset();
    mockCheckHandleAvailability.mockResolvedValue('available');
    mockDeleteDoc.mockReset();
    mockFirestoreDocs.clear();
    mockAuthInstance.currentUser = null;
    mockDoc.mockReset();
    mockDoc.mockImplementation((_db: unknown, collection: string, uid: string) => ({
      path: `${collection}/${uid}`,
    }));
    mockGetDoc.mockReset();
    mockGetDoc.mockImplementation(async (ref: { path: string }) => {
      const stored = mockFirestoreDocs.get(ref.path);
      return {
        exists: () => Boolean(stored),
        data: () => stored || {},
      };
    });
    mockSetDoc.mockReset();
    mockSetDoc.mockImplementation(
      async (
        ref: { path: string },
        value: Record<string, unknown>,
        options?: { merge?: boolean }
      ) => {
        const current = mockFirestoreDocs.get(ref.path) || {};
        mockFirestoreDocs.set(ref.path, options?.merge ? { ...current, ...value } : value);
      }
    );
    mockDeleteDoc.mockImplementation(async (ref: { path: string }) => {
      mockFirestoreDocs.delete(ref.path);
    });
  });

  it('hydrates onboarding and profile flags from remote user meta on bootstrap', async () => {
    mockFirestoreDocs.set('userMeta/user-001', {
      uid: 'user-001',
      hasAcceptedTerms: true,
      hasCompletedProfile: true,
      hasCompletedOnboarding: true,
      onboardingVersion: 1,
    });

    await renderProvider();
    await setFirebaseUser(firebaseUser);

    expect(mockGetDoc).toHaveBeenCalled();
    expect(latest?.hasAcceptedTerms).toBe(true);
    expect(latest?.hasCompletedProfile).toBe(true);
    expect(latest?.hasCompletedOnboarding).toBe(true);
  });

  it('marks onboarding complete after profile completion', async () => {
    await renderProvider();

    await setFirebaseUser(firebaseUser);

    await act(async () => {
      await latest?.completeProfile({
        name: 'Alex',
        handle: 'alex',
        bio: 'Explorer',
        visibility: 'open',
        avatar: 'file://avatar-1.jpg',
      });
    });

    expect(mockClaimProfileHandle).toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalled();
    expect(latest?.hasCompletedProfile).toBe(true);
    expect(latest?.hasCompletedOnboarding).toBe(true);
    expect(latest?.user?.avatar).toBe('file://avatar-1.jpg');
    const writtenPayloads = mockSetDoc.mock.calls.map(
      ([, payload]: [unknown, Record<string, unknown>]) => payload
    );
    expect(writtenPayloads.some((payload) => payload.hasCompletedProfile === true)).toBe(true);
  });

  it('exposes a handle-taken error when handle claim fails', async () => {
    mockClaimProfileHandle.mockRejectedValueOnce(
      Object.assign(new Error('profile/handle-taken'), { code: 'profile/handle-taken' })
    );

    await renderProvider();
    await setFirebaseUser(firebaseUser);

    await act(async () => {
      await expect(
        latest?.completeProfile({
          name: 'Alex',
          handle: 'alex',
          bio: 'Explorer',
          visibility: 'open',
          avatar: null,
        })
      ).rejects.toBeTruthy();
    });

    expect(latest?.hasCompletedProfile).toBe(false);
    expect(latest?.authError).toBe(strings.profileSetup.handleTaken);
  });

  it('exposes a reserved-handle error when handle is blocked', async () => {
    mockClaimProfileHandle.mockRejectedValueOnce(
      Object.assign(new Error('profile/handle-reserved'), { code: 'profile/handle-reserved' })
    );

    await renderProvider();
    await setFirebaseUser(firebaseUser);

    await act(async () => {
      await expect(
        latest?.completeProfile({
          name: 'Alex',
          handle: 'admin',
          bio: 'Explorer',
          visibility: 'open',
          avatar: null,
        })
      ).rejects.toBeTruthy();
    });

    expect(latest?.hasCompletedProfile).toBe(false);
    expect(latest?.authError).toBe(strings.profileSetup.handleReserved);
  });

  it('checks handle availability through auth boundary', async () => {
    await renderProvider();
    await setFirebaseUser(firebaseUser);

    const availability = await latest?.checkHandleAvailability('alex');

    expect(availability).toBe('available');
    expect(mockCheckHandleAvailability).toHaveBeenCalledWith('alex', firebaseUser.uid);
  });

  it('syncs terms acceptance and onboarding completion to remote user meta', async () => {
    await renderProvider();
    await setFirebaseUser(firebaseUser);
    mockSetDoc.mockClear();

    await act(async () => {
      latest?.acceptTerms();
      latest?.completeOnboarding();
      await Promise.resolve();
    });

    expect(mockSetDoc).toHaveBeenCalled();
    const writtenPayloads = mockSetDoc.mock.calls.map(
      ([, payload]: [unknown, Record<string, unknown>]) => payload
    );
    expect(writtenPayloads.some((payload) => payload.hasAcceptedTerms === true)).toBe(true);
    expect(writtenPayloads.some((payload) => payload.hasCompletedOnboarding === true)).toBe(true);
  });

  it('calls Firebase email sign in', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValue({});

    await renderProvider();

    await act(async () => {
      await latest?.signInWithEmail('alex@test.com', 'secret123');
    });

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalled();
  });

  it('turns off bootstrap loading after auth listener resolves', async () => {
    await renderProvider();

    expect(latest?.isBootstrappingAuth).toBe(false);
  });

  it('toggles action loading without changing bootstrap loading state', async () => {
    const deferred = createDeferred();
    mockSignInWithEmailAndPassword.mockImplementation(() => deferred.promise);

    await renderProvider();

    const bootstrapBefore = latest?.isBootstrappingAuth;

    act(() => {
      void latest?.signInWithEmail('alex@test.com', 'secret123');
    });

    expect(latest?.isAuthActionLoading).toBe(true);
    expect(latest?.isBootstrappingAuth).toBe(bootstrapBefore);

    await act(async () => {
      deferred.resolve();
      await deferred.promise;
    });

    expect(latest?.isAuthActionLoading).toBe(false);
    expect(latest?.isBootstrappingAuth).toBe(bootstrapBefore);
  });

  it('cleans remote user documents before deleting firebase auth account', async () => {
    await renderProvider();
    await setFirebaseUser(firebaseUser);
    mockAuthInstance.currentUser = {
      uid: firebaseUser.uid,
      email: 'alex@test.com',
    };

    await act(async () => {
      await latest?.deleteAccount('alex@test.com');
    });

    expect(mockDeleteDoc).toHaveBeenCalled();
    expect(mockDeleteUser).toHaveBeenCalledWith(mockAuthInstance.currentUser);
    const lastDeleteDocOrder = Math.max(...mockDeleteDoc.mock.invocationCallOrder);
    expect(lastDeleteDocOrder).toBeLessThan(mockDeleteUser.mock.invocationCallOrder[0]);
  });

  it('blocks account deletion when confirmation email does not match', async () => {
    await renderProvider();
    await setFirebaseUser(firebaseUser);
    mockAuthInstance.currentUser = {
      uid: firebaseUser.uid,
      email: 'alex@test.com',
    };

    await act(async () => {
      await expect(latest?.deleteAccount('other@test.com')).rejects.toBeTruthy();
    });

    expect(mockDeleteDoc).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});
