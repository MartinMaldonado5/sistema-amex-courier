import type { User } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const ADMIN_ROLES = new Set(['admin', 'administrador']);

function normalizeRole(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

/** Obtiene el usuario de la sesión SSR sin confiar en datos enviados por el cliente. */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Comprueba el rol administrativo usando app_metadata o el rol persistido.
 * user_metadata no se utiliza para decisiones de autorización porque es editable por el usuario.
 */
export async function hasAdminRole(user: User): Promise<boolean> {
  const appRole = normalizeRole(user.app_metadata?.rol);
  if (ADMIN_ROLES.has(appRole)) return true;

  try {
    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('perfiles_usuarios')
      .select('rol_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile?.rol_id) return false;

    const { data: role, error: roleError } = await admin
      .from('roles_sistema')
      .select('nombre')
      .eq('id', profile.rol_id)
      .maybeSingle();

    return !roleError && ADMIN_ROLES.has(normalizeRole(role?.nombre));
  } catch {
    return false;
  }
}

export async function authorizeUser(): Promise<
  | { ok: true; user: User }
  | { ok: false; status: 401; error: 'No autenticado.' }
> {
  const user = await getAuthenticatedUser();
  return user ? { ok: true, user } : { ok: false, status: 401, error: 'No autenticado.' };
}

export async function authorizeAdmin(): Promise<
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403; error: 'No autenticado.' | 'Se requiere rol administrador.' }
> {
  const auth = await authorizeUser();
  if (!auth.ok) return auth;
  return (await hasAdminRole(auth.user))
    ? auth
    : { ok: false, status: 403, error: 'Se requiere rol administrador.' };
}

export function getUserDisplayName(user: User): string {
  return (
    (user.user_metadata?.nombre_completo as string) ||
    (user.user_metadata?.usuario as string) ||
    user.email ||
    'Usuario AMEX'
  );
}
