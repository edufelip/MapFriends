type JsonLike = Record<string, unknown>;

type FirestorePhase = 'start' | 'success' | 'error';

const LOG_PREFIX = '[firebase-db]';
const isLoggingEnabled = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
const PHASE_PREFIX: Record<FirestorePhase, string> = {
  start: '>>',
  success: 'OK',
  error: 'XX',
};

const sanitizeDetails = (details: JsonLike) => {
  const clean: JsonLike = {};
  Object.keys(details).forEach((key) => {
    const value = details[key];
    if (value !== undefined) {
      clean[key] = value;
    }
  });
  return clean;
};

const toErrorMetadata = (error: unknown) => {
  if (error instanceof Error) {
    const metadata: JsonLike = {
      name: error.name,
      message: error.message,
    };
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') {
      metadata.code = code;
    }
    return metadata;
  }
  return {
    message: String(error),
  };
};

const logFirestore = (phase: FirestorePhase, operation: string, details: JsonLike = {}) => {
  if (!isLoggingEnabled) {
    return;
  }

  const payload = sanitizeDetails({
    at: new Date().toISOString(),
    operation,
    ...details,
  });
  const line = `${LOG_PREFIX} ${PHASE_PREFIX[phase]} ${operation}`;
  if (phase === 'error') {
    console.error(line, payload);
    return;
  }
  console.log(line, payload);
};

export async function runFirestoreOperation<T>(
  operation: string,
  details: JsonLike,
  callback: () => Promise<T>
): Promise<T> {
  const startedAt = Date.now();
  logFirestore('start', operation, details);
  try {
    const result = await callback();
    logFirestore('success', operation, {
      ...details,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    logFirestore('error', operation, {
      ...details,
      durationMs: Date.now() - startedAt,
      error: toErrorMetadata(error),
    });
    throw error;
  }
}
