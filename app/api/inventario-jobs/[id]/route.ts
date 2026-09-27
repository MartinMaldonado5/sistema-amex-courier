import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/** GET /api/inventario-jobs/[id] — estado de un trabajo (fallback si Realtime falla). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !/^[a-f0-9-]{10,60}$/i.test(id)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('inventario_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Trabajo no encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ job: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al leer el trabajo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
