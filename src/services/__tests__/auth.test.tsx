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
const mockClaimProfileHandle = jest.fn();
const mockCheckHandleAvailability = jest.fn();
let authStateListener: ((user: unknown) => void) | null = null;

const mockStorage = new Map<string, string>();

jest.mock('../firebase', () => ({
  isFirebaseConfigured: true,
  getFirebaseAuth: () => ({ app: 'mock-auth' }),
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
    authStateListener?.(user);
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
    mockClaimProfileHandle.mockReset();
    mockClaimProfileHandle.mockResolvedValue('alex');
    mockCheckHandleAvailability.mockReset();
    mockCheckHandleAvailability.mockResolvedValue('available');
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
    expect(latest?.hasCompletedProfile).toBe(true);
    expect(latest?.hasCompletedOnboarding).toBe(true);
    expect(latest?.user?.avatar).toBe('file://avatar-1.jpg');
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
});
