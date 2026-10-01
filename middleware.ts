import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Obtener x-request-id existente o generar un identificador único
  const existingRequestId = request.headers.get('x-request-id');
  const requestId = existingRequestId || crypto.randomUUID();

  // Clonar los encabezados de la petición para inyectar el requestId
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // Crear la respuesta pasando los nuevos encabezados de request hacia los endpoints
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Exponer el x-request-id en la respuesta para el cliente/navegador
  response.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
