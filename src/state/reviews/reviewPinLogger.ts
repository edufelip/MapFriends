type Payload = Record<string, unknown>;

const isTest = process.env.NODE_ENV === 'test';
const isDevRuntime = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
const shouldLog =
  !isTest && (process.env.EXPO_PUBLIC_DEBUG_REVIEW_PINS === '1' || isDevRuntime);

const normalize = (payload: Payload) => {
  const clean: Payload = {};
  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    if (value !== undefined) {
      clean[key] = value;
    }
  });
  return clean;
};

const toErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }
  return {
    message: String(error),
  };
};

export function logReviewPinDebug(scope: string, payload: Payload = {}) {
  if (!shouldLog) {
    return;
  }

  console.log(`[review-pins] ${scope}`, {
    at: new Date().toISOString(),
    ...normalize(payload),
  });
}

export function logReviewPinError(scope: string, error: unknown, payload: Payload = {}) {
  if (!shouldLog) {
    return;
  }

  console.error(`[review-pins] ${scope}`, {
    at: new Date().toISOString(),
    ...normalize(payload),
    error: toErrorDetails(error),
  });
}
