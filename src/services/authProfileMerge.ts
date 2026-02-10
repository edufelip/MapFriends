import { StoredProfile } from './authStorage';
import { normalizeHandle } from './handlePolicy';

export const toRemoteStoredProfile = (data: Record<string, unknown>): StoredProfile => {
  const visibility = data.visibility === 'locked' ? 'locked' : 'open';
  return {
    name: typeof data.name === 'string' ? data.name : '',
    handle: normalizeHandle(typeof data.handle === 'string' ? data.handle : ''),
    bio: typeof data.bio === 'string' ? data.bio : '',
    avatar: typeof data.avatar === 'string' ? data.avatar : null,
    visibility,
  };
};

export const mergeStoredProfiles = (
  local: StoredProfile | null,
  remote: StoredProfile | null,
  fallback: { name: string; avatar: string | null }
): StoredProfile | null => {
  if (!local && !remote) {
    return null;
  }
  const base = remote || local || {
    name: fallback.name,
    handle: '',
    bio: '',
    avatar: fallback.avatar,
    visibility: 'open' as const,
  };
  return {
    name: base.name || local?.name || fallback.name,
    handle: base.handle || local?.handle || '',
    bio: base.bio || local?.bio || '',
    avatar: base.avatar ?? local?.avatar ?? fallback.avatar ?? null,
    visibility: base.visibility,
  };
};

export const hasProfileDiff = (left: StoredProfile | null, right: StoredProfile | null) => {
  if (!left || !right) {
    return left !== right;
  }
  return (
    left.name !== right.name
    || left.handle !== right.handle
    || left.bio !== right.bio
    || left.avatar !== right.avatar
    || left.visibility !== right.visibility
  );
};
