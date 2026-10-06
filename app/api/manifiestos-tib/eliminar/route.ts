import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser } from '@/lib/auth/guards';

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta el parámetro id del manifiesto.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Eliminar de manifiestos_tib (el ON DELETE CASCADE elimina automáticamente los detalles)
    const { error } = await admin.from('manifiestos_tib').delete().eq('id', id);

    if (error) {
      console.error('Error al eliminar manifiesto:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Manifiesto eliminado correctamente.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al eliminar manifiesto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
