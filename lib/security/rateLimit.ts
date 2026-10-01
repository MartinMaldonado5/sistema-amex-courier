import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitRecord>();

// Limpieza periódica de llaves expiradas cada 5 minutos
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of cache.entries()) {
    if (record.resetAt <= now) {
      cache.delete(key);
    }
  }
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  prefix?: string;
}

export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  purgeExpired();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const prefix = options.prefix || 'global';
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  const current = cache.get(key);

  if (!current || current.resetAt <= now) {
    const record: RateLimitRecord = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    cache.set(key, record);
    return { allowed: true, remaining: options.limit - 1, resetAt: record.resetAt };
  }

  if (current.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, remaining: options.limit - current.count, resetAt: current.resetAt };
}

export function rateLimitExceededResponse(resetAt: number): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    {
      error: 'Demasiadas solicitudes. Por favor intente más tarde.',
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}
