import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LoginSchema } from '@/lib/validations/auth.schema';
import { validateBody } from '@/lib/api/validate';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: máx 10 intentos por minuto por IP
    const rateCheck = checkRateLimit(req, {
      prefix: 'auth-login',
      limit: 10,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse(rateCheck.resetAt);
    }

    // 2. Validación de esquema con Zod
    const validation = await validateBody(LoginSchema, req);
    if (!validation.ok) {
      return validation.response;
    }
    const { email, password } = validation.data;

    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const allowDevLogin = process.env.NODE_ENV === 'development' && process.env.AMEX_ALLOW_DEV_LOGIN === 'true';

    if (allowDevLogin && (!supabaseUrl || supabaseUrl.includes('placeholder'))) {
      // Modo desarrollo local explícito: no habilitar en producción ni por defecto.
      const user = {
        nombre: 'Operador Logístico AMEX',
        rol: 'Operador Logístico',
        email: email || 'admin@amexcourier.pe',
      };
      return NextResponse.json({ user });
    }

    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        { error: 'La autenticación no está configurada en el servidor.' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      console.error('[Auth Login]', error?.message || 'Sin sesión');
      return NextResponse.json({ error: 'Credenciales incorrectas. Verifique su correo y contraseña.' }, { status: 401 });
    }

    const user = {
      nombre: (data.user.user_metadata?.nombre_completo as string) || email,
      rol: (data.user.app_metadata?.rol as string) || 'Operador Logístico',
      email: data.user.email || email,
    };

    return NextResponse.json({ user });
  } catch (err) {
    console.error('[Auth Login Error]', err);
    return NextResponse.json({ error: 'Error interno al iniciar sesión.' }, { status: 500 });
  }
}
