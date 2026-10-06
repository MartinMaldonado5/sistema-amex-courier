import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    // 1. Obtener cabecera
    const { data: manifiesto, error: manErr } = await admin
      .from('manifiestos_tib')
      .select('*')
      .eq('id', id)
      .single();

    if (manErr || !manifiesto) {
      return NextResponse.json({ error: 'Manifiesto no encontrado.' }, { status: 404 });
    }

    // 2. Obtener detalles
    const { data: rawDetalles, error: detErr } = await admin
      .from('manifiestos_tib_detalles')
      .select('*')
      .eq('manifiesto_id', id)
      .order('fila_index', { ascending: true })
      .order('creado_en', { ascending: true });

    if (detErr) {
      console.error('Error al obtener detalles del manifiesto:', detErr);
      return NextResponse.json({ error: detErr.message }, { status: 500 });
    }

    // 3. Agrupar por guía AMX para reproducir la vista original del documento
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

    return NextResponse.json({
      success: true,
      manifiesto,
      filas,
      totalDetalles: (rawDetalles || []).length,
      rawDetalles: rawDetalles || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener detalle del manifiesto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
