import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  // Obtener x-request-id existente o generar un identificador único para trazabilidad distribuida
  const existingRequestId = request.headers.get('x-request-id');
  const requestId = existingRequestId || crypto.randomUUID();

  // Inyectar x-request-id en los encabezados de la petición para endpoints internos
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const setRequestIdHeader = (res: NextResponse) => {
    res.headers.set('x-request-id', requestId);
    return res;
  };

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  setRequestIdHeader(response);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname.startsWith('/login');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicAuthRoute =
    pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/logout');

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isLoginPage || isPublicAuthRoute) return response;
    if (isApiRoute) {
      return setRequestIdHeader(
        NextResponse.json({ error: 'Autenticación no configurada.' }, { status: 503 })
      );
    }
    return setRequestIdHeader(
      NextResponse.redirect(new URL('/login?error=auth-config', request.url))
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        setRequestIdHeader(response);
      },
    },
  });

  // Refrescar sesión de Supabase si existe cookie
  const { data: { user } } = await supabase.auth.getUser();

  // Si está en login y ya está autenticado, redirigir al panel
  if (isLoginPage && user) {
    return setRequestIdHeader(NextResponse.redirect(new URL('/dashboard', request.url)));
  }

  if (!user && !isLoginPage && !isPublicAuthRoute) {
    if (isApiRoute) {
      return setRequestIdHeader(
        NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
      );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return setRequestIdHeader(NextResponse.redirect(loginUrl));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
