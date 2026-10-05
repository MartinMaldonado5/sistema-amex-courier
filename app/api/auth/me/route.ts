import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const authUser = data.user;
    const admin = getSupabaseAdmin();

    // 1. Consultar perfil persistido del usuario
    const { data: profile } = await admin
      .from('perfiles_usuarios')
      .select('id, nombre_completo, email, rol_id, activo')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profile && profile.activo === false) {
      return NextResponse.json(
        { user: null, error: 'Cuenta de usuario desactivada por el administrador.' },
        { status: 403 }
      );
    }

    let rolNombre =
      (authUser.app_metadata?.rol as string) ||
      (authUser.user_metadata?.rol as string) ||
      'Operador Logístico';
    let permisos: Record<string, unknown> = {};

    // 2. Consultar rol y matriz de permisos
    if (profile?.rol_id) {
      const { data: roleData } = await admin
        .from('roles_sistema')
        .select('id, nombre, permisos')
        .eq('id', profile.rol_id)
        .maybeSingle();

      if (roleData) {
        if (roleData.nombre) rolNombre = roleData.nombre;
        if (roleData.permisos) permisos = roleData.permisos as Record<string, unknown>;
      }
    }

    const normRole = rolNombre.trim().toLowerCase();
    const isAdmin =
      ['admin', 'administrador'].includes(normRole) ||
      ['admin', 'administrador'].includes(
        String(authUser.app_metadata?.rol || '').trim().toLowerCase()
      );

    return NextResponse.json({
      user: {
        id: authUser.id,
        nombre:
          profile?.nombre_completo ||
          (authUser.user_metadata?.nombre_completo as string) ||
          authUser.email?.split('@')[0] ||
          'Usuario AMEX',
        email: authUser.email || '',
        rol: rolNombre,
        rol_id: profile?.rol_id || null,
        permisos,
        isAdmin,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/auth/me Error]:', err);
    return NextResponse.json({ error: 'Error obteniendo perfil de sesión' }, { status: 500 });
  }
}
