import { Image } from 'react-native';

const prefetchedReviewImageUrls = new Set<string>();
const inFlightReviewImageUrls = new Set<string>();

const isValidRemoteImageUrl = (url: string) => /^https?:\/\//i.test(url);

const normalizeUrls = (urls: string[]) => {
  const unique = new Set<string>();

  urls.forEach((url) => {
    if (typeof url !== 'string') {
      return;
    }

    const trimmed = url.trim();
    if (!trimmed || !isValidRemoteImageUrl(trimmed)) {
      return;
    }

    unique.add(trimmed);
  });

  return Array.from(unique);
};

export async function prefetchReviewImages(
  urls: string[],
  prefetcher: ((uri: string) => Promise<boolean>) | undefined = Image.prefetch
): Promise<void> {
  if (!Array.isArray(urls) || urls.length === 0) {
    return;
  }

  if (typeof prefetcher !== 'function') {
    return;
  }

  const candidates = normalizeUrls(urls).filter(
    (url) => !prefetchedReviewImageUrls.has(url) && !inFlightReviewImageUrls.has(url)
  );

  if (candidates.length === 0) {
    return;
  }

  candidates.forEach((url) => {
    inFlightReviewImageUrls.add(url);
  });

  const results = await Promise.allSettled(candidates.map((url) => prefetcher(url)));

  results.forEach((result, index) => {
    const url = candidates[index];
    inFlightReviewImageUrls.delete(url);

    if (result.status === 'fulfilled' && result.value) {
      prefetchedReviewImageUrls.add(url);
    }
  });
}

export function __resetReviewMediaCacheForTests() {
  prefetchedReviewImageUrls.clear();
  inFlightReviewImageUrls.clear();
}
