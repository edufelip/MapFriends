export function normalizeStorageBucket(value: string) {
  return value.replace(/^gs:\/\//i, '').replace(/\/+$/, '').trim();
}
