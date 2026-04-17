import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientIp, rateLimit } from '../../src/lib/rate-limit';

describe('rateLimit', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to limit then blocks', () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(false);
  });

  it('resets after window expires', () => {
    vi.useFakeTimers();
    const key = `test-reset:${Math.random()}`;
    expect(rateLimit(key, 1, 60_000)).toBe(true);
    expect(rateLimit(key, 1, 60_000)).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(rateLimit(key, 1, 60_000)).toBe(true);
  });
});

describe('clientIp', () => {
  it('picks first x-forwarded-for entry', () => {
    const h = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(clientIp(h)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const h = new Headers({ 'x-real-ip': '9.9.9.9' });
    expect(clientIp(h)).toBe('9.9.9.9');
  });

  it('returns unknown when no header', () => {
    expect(clientIp(new Headers())).toBe('unknown');
  });
});
