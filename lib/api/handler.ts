import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export type ApiHandler = (
  req: NextRequest,
  context?: { params?: Promise<Record<string, string | string[]>> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: ApiHandler, serviceName = 'api-route'): ApiHandler {
  const routeLogger = logger.child(serviceName);

  return async (req: NextRequest, context?: { params?: Promise<Record<string, string | string[]>> }) => {
    const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

    try {
      const response = await handler(req, context);
      if (!response.headers.has('x-request-id')) {
        response.headers.set('x-request-id', requestId);
      }
      return response;
    } catch (error: unknown) {
      routeLogger.error(
        `Error no controlado en ${req.method} ${req.nextUrl.pathname}`,
        error,
        {
          requestId,
          url: req.nextUrl.toString(),
          method: req.method,
        }
      );

      const isDev = process.env.NODE_ENV === 'development';
      const errorMessage =
        isDev && error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado en el servidor.';

      return NextResponse.json(
        {
          error: errorMessage,
          requestId,
        },
        {
          status: 500,
          headers: {
            'x-request-id': requestId,
          },
        }
      );
    }
  };
}
