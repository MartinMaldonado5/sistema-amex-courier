import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

export function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

export async function validateBody<T>(
  schema: ZodSchema<T>,
  req: NextRequest
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  try {
    const raw = await req.json().catch(() => ({}));
    const result = schema.safeParse(raw);
    if (!result.success) {
      const details = formatZodError(result.error);
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'Datos de entrada inválidos.',
            details,
          },
          { status: 400 }
        ),
      };
    }
    return { ok: true, data: result.data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'El cuerpo de la solicitud no es un JSON válido.' },
        { status: 400 }
      ),
    };
  }
}

export function validateQuery<T>(
  schema: ZodSchema<T>,
  searchParams: URLSearchParams
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  const result = schema.safeParse(raw);
  if (!result.success) {
    const details = formatZodError(result.error);
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Parámetros de consulta inválidos.',
          details,
        },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}
