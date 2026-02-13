import Constants from 'expo-constants';

const FALLBACK_SCHEME = 'com.eduardo880.mapfriends';

const resolveAppScheme = () => {
  const scheme = Constants.expoConfig?.scheme;

  if (typeof scheme === 'string' && scheme.trim().length > 0) {
    return scheme.trim();
  }

  if (Array.isArray(scheme) && typeof scheme[0] === 'string' && scheme[0].trim().length > 0) {
    return scheme[0].trim();
  }

  return FALLBACK_SCHEME;
};

export const buildReviewDeepLink = (reviewId: string) => {
  const normalizedReviewId = encodeURIComponent(reviewId.trim());
  const scheme = resolveAppScheme();

  return `${scheme}://review/${normalizedReviewId}`;
};
