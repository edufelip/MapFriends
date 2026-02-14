const stripDiacritics = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeBase = (value: string) =>
  normalizeWhitespace(stripDiacritics(value.toLowerCase())).replace(/[^a-z0-9_\s]/g, '');

export const normalizeSearchQuery = (rawQuery: string) => {
  const trimmed = normalizeBase(rawQuery || '').replace(/^@+/, '');
  return trimmed.replace(/\s+/g, '');
};

const buildPrefixesForToken = (token: string, minLen = 1, maxLen = 20) => {
  if (!token) {
    return [] as string[];
  }

  const prefixes: string[] = [];
  const boundedMax = Math.min(maxLen, token.length);
  for (let length = Math.max(minLen, 1); length <= boundedMax; length += 1) {
    prefixes.push(token.slice(0, length));
  }
  return prefixes;
};

export const buildSearchPrefixes = (input: { name: string; handle: string }) => {
  const normalizedHandle = normalizeSearchQuery(input.handle || '');
  const normalizedName = normalizeBase(input.name || '');
  const nameTokens = normalizedName.split(' ').filter(Boolean);
  const collapsedName = normalizedName.replace(/\s+/g, '');

  const prefixSet = new Set<string>();

  buildPrefixesForToken(normalizedHandle, 1, 20).forEach((prefix) => prefixSet.add(prefix));
  nameTokens.forEach((token) => {
    buildPrefixesForToken(token, 1, 20).forEach((prefix) => prefixSet.add(prefix));
  });
  buildPrefixesForToken(collapsedName, 2, 24).forEach((prefix) => prefixSet.add(prefix));

  return Array.from(prefixSet).slice(0, 200);
};
