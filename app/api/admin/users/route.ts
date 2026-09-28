import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeAdmin } from '@/lib/auth/guards';

async function requireAdmin() {
  const auth = await authorizeAdmin();
  return auth.ok ? null : NextResponse.json({ error: auth.error }, { status: auth.status });
}

// GET: Listar usuarios, perfiles y roles del sistema
export async function GET() {
  try {
    const authorization = await requireAdmin();
    if (authorization) return authorization;

    const supabase = getSupabaseAdmin();

    const [usersRes, rolesRes, perfilesRes] = await Promise.all([
      supabase.auth.admin.listUsers(),
      supabase.from('roles_sistema').select('*').order('nombre'),
      supabase.from('perfiles_usuarios').select('*').order('creado_en', { ascending: false })
    ]);

    if (usersRes.error) throw usersRes.error;
    if (rolesRes.error) throw rolesRes.error;

    const authUsers = usersRes.data.users || [];
    const roles = rolesRes.data || [];
    const perfiles = perfilesRes.data || [];

    // Cruzar información de usuario con perfil y rol
    const usersWithRoles = authUsers.map(u => {
      const perfil = perfiles.find(p => p.id === u.id || p.email === u.email);
      const rol = roles.find(r => r.id === perfil?.rol_id);
      return {
        id: u.id,
        email: u.email,
        nombre_completo:
          perfil?.nombre_completo ||
          (u.user_metadata?.nombre_completo as string) ||
          u.email?.split('@')[0] ||
          'Usuario',
        rol_id: perfil?.rol_id || rol?.id || null,
        rol_nombre: rol?.nombre || (u.user_metadata?.rol as string) || 'Sin Rol',
        permisos: rol?.permisos || {},
        activo: perfil?.activo !== false,
        creado_en: u.created_at,
        ultimo_ingreso: u.last_sign_in_at
      };
    });

    return NextResponse.json({
      users: usersWithRoles,
      roles
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al listar usuarios';
    console.error('API /api/admin/users GET Error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Crear nuevo usuario con rol o crear nuevo rol
export async function POST(request: Request) {
  try {
    const authorization = await requireAdmin();
    if (authorization) return authorization;

    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { action } = body;

    // Acción 1: Crear nuevo rol con matriz de permisos
    if (action === 'create_role') {
      const { nombre, descripcion, permisos } = body;
      if (!nombre || !nombre.trim()) {
        return NextResponse.json({ error: 'El nombre del rol es obligatorio' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('roles_sistema')
        .insert({
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
          permisos: permisos || {}
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ role: data });
    }

    // Acción 2: Actualizar permisos de un rol existente
    if (action === 'update_role') {
      const { id, permisos, descripcion } = body;
      const { data, error } = await supabase
        .from('roles_sistema')
        .update({
          permisos,
          ...(descripcion !== undefined && { descripcion })
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ role: data });
    }

    // Acción 3: Crear nuevo usuario
    if (action === 'create_user') {
      const { email, password, nombre_completo, rol_id } = body;

      if (!email || !password || !nombre_completo) {
        return NextResponse.json({ error: 'Correo, contraseña y nombre son requeridos' }, { status: 400 });
      }

      // Obtener nombre del rol
      let rolNombre = 'Operador Logístico';
      if (rol_id) {
        const { data: rData } = await supabase.from('roles_sistema').select('nombre').eq('id', rol_id).single();
        if (rData?.nombre) rolNombre = rData.nombre;
      }

      const { data: uData, error: uError } = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          nombre_completo: nombre_completo.trim(),
          rol: rolNombre
        },
        app_metadata: { rol: rolNombre }
      });

      if (uError) throw uError;
      const newUser = uData.user;

      // Crear o actualizar en perfiles_usuarios
      await supabase.from('perfiles_usuarios').upsert({
        id: newUser.id,
        nombre_completo: nombre_completo.trim(),
        email: email.trim().toLowerCase(),
        rol_id: rol_id || null,
        activo: true
      });

      return NextResponse.json({ success: true, user: newUser });
    }

    // Acción 4: Actualizar rol o estado de usuario
    if (action === 'update_user') {
      const { user_id, rol_id, activo, password } = body;

      let rolNombre = 'Operador Logístico';
      if (rol_id) {
        const { data: rData } = await supabase.from('roles_sistema').select('nombre').eq('id', rol_id).single();
        if (rData?.nombre) rolNombre = rData.nombre;
      }

      // Actualizar metadata de Auth
      const updateData: {
        user_metadata?: Record<string, unknown>;
        app_metadata?: Record<string, unknown>;
        password?: string;
      } = {
        user_metadata: { rol: rolNombre },
        app_metadata: { rol: rolNombre }
      };
      if (password && password.trim()) {
        updateData.password = password.trim();
      }

      await supabase.auth.admin.updateUserById(user_id, updateData);

      // Actualizar perfiles_usuarios
      await supabase
        .from('perfiles_usuarios')
        .update({
          ...(rol_id !== undefined && { rol_id }),
          ...(activo !== undefined && { activo })
        })
        .eq('id', user_id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error procesando solicitud de usuarios';
    console.error('API /api/admin/users POST Error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
