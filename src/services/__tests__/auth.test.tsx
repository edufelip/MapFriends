import React from 'react';
import { act, render } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../auth';

const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockSignOut = jest.fn();
const mockSignInWithCredential = jest.fn();
const mockUpdateProfile = jest.fn();
let authStateListener: ((user: unknown) => void) | null = null;

const mockStorage = new Map<string, string>();

jest.mock('../firebase', () => ({
  isFirebaseConfigured: true,
  getFirebaseAuth: () => ({ app: 'mock-auth' }),
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

describe('AuthProvider', () => {
  beforeEach(() => {
    latest = null;
    mockStorage.clear();
    mockSignInWithEmailAndPassword.mockReset();
    mockCreateUserWithEmailAndPassword.mockReset();
    mockSendPasswordResetEmail.mockReset();
    mockSignOut.mockReset();
    mockSignInWithCredential.mockReset();
    mockUpdateProfile.mockReset();
  });

  it('marks onboarding complete after profile completion', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await setFirebaseUser(firebaseUser);

    act(() => {
      latest?.completeProfile({
        name: 'Alex',
        handle: 'alex',
        bio: 'Explorer',
        visibility: 'open',
      });
    });

    expect(latest?.hasCompletedProfile).toBe(true);
    expect(latest?.hasCompletedOnboarding).toBe(true);
  });

  it('fills handle and visibility when skipping profile setup', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await setFirebaseUser({
      ...firebaseUser,
      displayName: '',
    });

    act(() => {
      latest?.skipProfileSetup();
    });

    expect(latest?.user?.handle?.length || 0).toBeGreaterThanOrEqual(3);
    expect(latest?.user?.visibility).toBe('open');
    expect(latest?.hasSkippedProfileSetup).toBe(true);
  });

  it('calls Firebase email sign in', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      await latest?.signInWithEmail('alex@test.com', 'secret123');
    });

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalled();
  });
});
