import React from 'react';
import authSeed from '../mocks/auth.json';
import { User } from './types';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
};

type AuthContextValue = AuthState & {
  signIn: () => void;
  signUp: () => void;
  signOut: () => void;
  completeOnboarding: () => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const seedUser = authSeed.user as User;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);

  const signIn = () => {
    setUser(seedUser);
  };

  const signUp = () => {
    setUser(seedUser);
  };

  const signOut = () => {
    setUser(null);
    setHasCompletedOnboarding(false);
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    hasCompletedOnboarding,
    signIn,
    signUp,
    signOut,
    completeOnboarding,
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
