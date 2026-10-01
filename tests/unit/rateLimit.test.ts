import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/security/rateLimit';

describe('Rate Limiter — Ventana Deslizante', () => {
  it('debe permitir peticiones dentro del límite', () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      headers: { 'x-forwarded-for': '192.168.1.50' },
    });

    const res1 = checkRateLimit(req, { prefix: 'test-limit', limit: 3, windowMs: 5000 });
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(req, { prefix: 'test-limit', limit: 3, windowMs: 5000 });
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(req, { prefix: 'test-limit', limit: 3, windowMs: 5000 });
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    // 4ta petición: debe bloquear
    const res4 = checkRateLimit(req, { prefix: 'test-limit', limit: 3, windowMs: 5000 });
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
  });
});
