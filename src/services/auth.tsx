import React from 'react';
import authSeed from '../mocks/auth.json';
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
  signIn: () => void;
  signUp: () => void;
  signOut: () => void;
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

const seedUser = authSeed.user as User;

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [hasAcceptedTerms, setHasAcceptedTerms] = React.useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = React.useState(false);
  const [hasSkippedProfileSetup, setHasSkippedProfileSetup] = React.useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);

  const signIn = () => {
    setUser(seedUser);
    setHasCompletedProfile(isProfileComplete(seedUser));
    setHasSkippedProfileSetup(false);
  };

  const signUp = () => {
    setUser(seedUser);
    setHasCompletedProfile(isProfileComplete(seedUser));
    setHasSkippedProfileSetup(false);
  };

  const signOut = () => {
    setUser(null);
    setHasAcceptedTerms(false);
    setHasCompletedProfile(false);
    setHasSkippedProfileSetup(false);
    setHasCompletedOnboarding(false);
  };

  const acceptTerms = () => {
    setHasAcceptedTerms(true);
  };

  const completeProfile = (profile: {
    name: string;
    handle: string;
    bio: string;
    visibility: 'open' | 'locked';
  }) => {
    setUser((prev) =>
      prev
        ? { ...prev, ...profile }
        : {
            id: seedUser.id,
            avatar: null,
            ...profile,
          }
    );
    setHasCompletedProfile(true);
    setHasSkippedProfileSetup(false);
    setHasCompletedOnboarding(true);
  };

  const skipProfileSetup = () => {
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
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
  };

  const updateVisibility = (visibility: 'open' | 'locked') => {
    setUser((prev) => (prev ? { ...prev, visibility } : prev));
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    hasAcceptedTerms,
    hasCompletedProfile,
    hasSkippedProfileSetup,
    hasCompletedOnboarding,
    signIn,
    signUp,
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
