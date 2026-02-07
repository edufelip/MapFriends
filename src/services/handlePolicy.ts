const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

const RESERVED_HANDLES = new Set([
  'admin',
  'support',
  'root',
  'mapfriends',
  'official',
  'api',
  'help',
  'security',
  'billing',
  'about',
  'terms',
  'privacy',
]);

const RESERVED_PREFIXES = ['admin', 'support'];

export const normalizeHandle = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);

export const sanitizeHandleInput = (value: string) => {
  const normalized = value.toLowerCase();
  const stripped = normalized.replace(/[^a-z0-9_]/g, '');
  return {
    handle: stripped.slice(0, 20),
    removedUnsupported: stripped !== normalized,
  };
};

export const isHandleValidFormat = (handle: string) => HANDLE_REGEX.test(handle);

export const isHandleReserved = (rawHandle: string) => {
  const handle = normalizeHandle(rawHandle);
  if (!handle) {
    return false;
  }
  if (RESERVED_HANDLES.has(handle)) {
    return true;
  }
  return RESERVED_PREFIXES.some((prefix) => handle === `${prefix}_` || handle.startsWith(prefix));
};
