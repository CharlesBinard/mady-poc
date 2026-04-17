interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();
const MAX_ENTRIES = 10_000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    if (store.size > MAX_ENTRIES) {
      const oldest = store.keys().next().value;
      if (oldest) store.delete(oldest);
    }
    return true;
  }

  if (existing.count >= limit) return false;

  existing.count += 1;
  return true;
}

export function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headers.get('x-real-ip') ?? 'unknown'
  );
}
