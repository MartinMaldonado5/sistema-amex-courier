import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = data.user;
  return NextResponse.json({
    user: {
      nombre: (user.user_metadata?.nombre_completo as string) || user.email || 'Usuario',
      rol: (user.app_metadata?.rol as string) || 'Operador Logístico',
      email: user.email || '',
    },
  });
}
