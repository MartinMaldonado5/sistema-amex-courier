import { createClient } from '@/lib/supabase/server';

export interface SessionUser {
  nombre: string;
  rol: string;
  email: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const user = data.user;
  return {
    nombre: (user.user_metadata?.nombre_completo as string) || (user.user_metadata?.usuario as string) || user.email || 'Usuario',
    rol: (user.app_metadata?.rol as string) || 'Operador Logístico',
    email: user.email || '',
  };
}
