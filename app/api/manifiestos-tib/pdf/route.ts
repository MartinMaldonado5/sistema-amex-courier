import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser } from '@/lib/auth/guards';
import { generateManifestDigitalPdf } from '@/features/manifiestos-tib/services/manifestPdfGenerator';
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

    // 2. Si existe archivo_url en R2 y no se fuerza versión digital, redirigir al archivo original
    if (manifiesto.archivo_url && !forceDigital) {
      const resolvedR2Url = getR2ViewUrl(manifiesto.archivo_url);
      const finalUrl = download
        ? `${resolvedR2Url}${resolvedR2Url.includes('?') ? '&' : '?'}download=true`
        : resolvedR2Url;

      // Redirigir al proxy de streaming de R2
      return NextResponse.redirect(new URL(finalUrl, req.url));
    }

    // 3. Si no hay archivo físico o se solicita versión digital, generar PDF oficial en tiempo real
    const { data: rawDetalles, error: detErr } = await admin
      .from('manifiestos_tib_detalles')
      .select('*')
      .eq('manifiesto_id', id)
      .order('fila_index', { ascending: true })
      .order('creado_en', { ascending: true });

    if (detErr) {
      return NextResponse.json({ error: detErr.message }, { status: 500 });
    }

    // Agrupar por guía AMX
    const agrupadoMap = new Map<string, {
      guia: string;
      wrs: string[];
      observacion: string;
      fila_index: number;
    }>();

    (rawDetalles || []).forEach((row) => {
      const guia = row.numero_guia_amx;
      if (!agrupadoMap.has(guia)) {
        agrupadoMap.set(guia, {
          guia,
          wrs: row.numero_wr && row.numero_wr !== 'SIN_WR' ? [row.numero_wr] : [],
          observacion: row.observacion || '',
          fila_index: row.fila_index,
        });
      } else {
        const existing = agrupadoMap.get(guia)!;
        if (row.numero_wr && row.numero_wr !== 'SIN_WR' && !existing.wrs.includes(row.numero_wr)) {
          existing.wrs.push(row.numero_wr);
        }
        if (!existing.observacion && row.observacion) {
          existing.observacion = row.observacion;
        }
      }
    });

    const filas = Array.from(agrupadoMap.values()).sort((a, b) => a.fila_index - b.fila_index);

    const pdfBuffer = generateManifestDigitalPdf(manifiesto, filas);

    const baseName = (manifiesto.archivo_nombre || `manifiesto_vuelo_${manifiesto.fecha_vuelo}`)
      .replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}.pdf`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Length', String(pdfBuffer.length));
    headers.set('Cache-Control', 'private, max-age=180');
    headers.set(
      'Content-Disposition',
      download
        ? `attachment; filename="${encodeURIComponent(fileName)}"`
        : `inline; filename="${encodeURIComponent(fileName)}"`
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar el archivo PDF';
    console.error('[API Manifiestos TIB PDF]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
