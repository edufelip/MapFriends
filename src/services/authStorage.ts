import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from './types';

const STORAGE_PREFIX = 'auth';

export type StoredOnboarding = {
  hasAcceptedTerms: boolean;
  hasSkippedProfileSetup: boolean;
  hasCompletedOnboarding: boolean;
};

export type StoredProfile = Pick<User, 'name' | 'handle' | 'bio' | 'avatar' | 'visibility'>;

export const defaultOnboardingState: StoredOnboarding = {
  hasAcceptedTerms: false,
  hasSkippedProfileSetup: false,
  hasCompletedOnboarding: false,
};

export const toOnboardingKey = (uid: string) => `${STORAGE_PREFIX}:onboarding:${uid}`;

export const toProfileKey = (uid: string) => `${STORAGE_PREFIX}:profile:${uid}`;

export const readStorage = async <T,>(key: string): Promise<T | null> => {
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

export const writeStorage = async (key: string, value: unknown) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const toStoredProfile = (user: User): StoredProfile => ({
  name: user.name,
  handle: user.handle,
  bio: user.bio,
  avatar: user.avatar,
  visibility: user.visibility,
});
