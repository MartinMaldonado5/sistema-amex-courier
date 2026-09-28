import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
      return NextResponse.json({ error: 'Autenticación no configurada.' }, { status: 503 });
    }
    return NextResponse.redirect(new URL('/login?error=auth-config', request.url));
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refrescar sesión de Supabase si existe cookie
  const { data: { user } } = await supabase.auth.getUser();

  // Si está en login y ya está autenticado, redirigir al panel
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && !isLoginPage && !isPublicAuthRoute) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
