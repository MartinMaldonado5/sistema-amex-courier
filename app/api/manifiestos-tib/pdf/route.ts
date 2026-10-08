import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser } from '@/lib/auth/guards';
import { getR2ViewUrl } from '@/lib/r2/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const download = searchParams.get('download') === 'true';
    const forceDigital = searchParams.get('forceDigital') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Falta el parámetro id del manifiesto.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // 1. Obtener manifiesto
    const { data: manifiesto, error: manErr } = await admin
      .from('manifiestos_tib')
      .select('*')
      .eq('id', id)
      .single();

    if (manErr || !manifiesto) {
      return NextResponse.json({ error: 'Manifiesto no encontrado.' }, { status: 404 });
    }

    // 2. Si existe archivo_url en R2, redirigir al archivo original escaneado
    if (manifiesto.archivo_url) {
      const resolvedR2Url = getR2ViewUrl(manifiesto.archivo_url);
      const finalUrl = download
        ? `${resolvedR2Url}${resolvedR2Url.includes('?') ? '&' : '?'}download=true`
        : resolvedR2Url;

      // Redirigir al proxy de streaming del PDF original escaneado
      return NextResponse.redirect(new URL(finalUrl, req.url));
    }

    // 3. Si no existe archivo físico en R2, informar que se debe adjuntar el escaneo original
    return NextResponse.json(
      {
        error: 'NO_ARCHIVO_ESCANEADO',
        mensaje: `El archivo PDF escaneado original "${manifiesto.archivo_nombre || 'PDF'}" aún no ha sido adjuntado a este registro. Por favor adjunta el escaneo físico original.`,
        manifiestoId: manifiesto.id,
        archivoNombre: manifiesto.archivo_nombre,
      },
      { status: 404 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar el archivo PDF';
    console.error('[API Manifiestos TIB PDF]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
