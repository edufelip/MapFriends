import { User } from './types';
import { StoredProfile } from './authStorage';

const HANDLE_REGEX = /[^a-z0-9_]/g;

export const isProfileComplete = (user: User | null) => {
  if (!user) {
    return false;
  }

  return Boolean(user.name?.trim() && user.handle?.trim() && user.bio?.trim() && user.visibility);
};

export const toHandle = (value: string) => value.toLowerCase().replace(HANDLE_REGEX, '').slice(0, 20);

export const fallbackHandle = (id: string) => {
  const suffix = id.replace(/[^a-z0-9]/gi, '').slice(-4).toLowerCase();
  return `user_${suffix || '0001'}`.slice(0, 20);
};

export const toAppUser = (
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
