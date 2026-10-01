import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser, getUserDisplayName } from '@/lib/auth/guards';
import { deleteFileFromR2 } from '@/lib/r2/client';

export type TibTipo = 'delivered' | 'sent' | 'received';

function getLimaDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const y = parts.find((p) => p.type === 'year')?.value || '2026';
  const m = parts.find((p) => p.type === 'month')?.value || '01';
  const d = parts.find((p) => p.type === 'day')?.value || '01';
  return `${y}-${m}-${d}`;
}

/**
 * GET /api/inventario-tib
 * Retorna los archivos TIB vigentes del día (o del último día disponible).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const admin = getSupabaseAdmin();
    const todayLima = getLimaDateString();

    const { searchParams } = new URL(req.url);
    const requestedDate = searchParams.get('fecha')?.trim() || todayLima;

    // 1. Buscar archivos de la fecha solicitada
    let { data: rows, error } = await admin
      .from('inventario_tib_diario')
      .select('id, fecha, tipo, r2_key, nombre_archivo, peso_bytes, subido_por_nombre, subido_en, es_activo')
      .eq('fecha', requestedDate)
      .eq('es_activo', true);

    let activeDate = requestedDate;

    // Si no hay archivos para la fecha solicitada y no se forzó una fecha específica, buscar la más reciente
    if ((!rows || rows.length === 0) && !searchParams.get('fecha')) {
      const { data: latestRow } = await admin
        .from('inventario_tib_diario')
        .select('fecha')
        .eq('es_activo', true)
        .order('fecha', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestRow?.fecha) {
        activeDate = latestRow.fecha;
        const resLatest = await admin
          .from('inventario_tib_diario')
          .select('id, fecha, tipo, r2_key, nombre_archivo, peso_bytes, subido_por_nombre, subido_en, es_activo')
          .eq('fecha', activeDate)
          .eq('es_activo', true);
        rows = resLatest.data || [];
      }
    }

    if (error) {
      console.error('Error consultando inventario_tib_diario:', error);
      return NextResponse.json({ error: 'Error al consultar archivos TIB' }, { status: 500 });
    }

    const files: Record<TibTipo, any> = {
      delivered: null,
      sent: null,
      received: null,
    };

    for (const r of rows || []) {
      if (r.tipo === 'delivered' || r.tipo === 'sent' || r.tipo === 'received') {
        files[r.tipo as TibTipo] = r;
      }
    }

    const isComplete = Boolean(files.delivered && files.sent && files.received);
    const isToday = activeDate === todayLima;

    return NextResponse.json({
      fecha: activeDate,
      fechaHoy: todayLima,
      isToday,
      isComplete,
      files,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/inventario-tib
 * Registra o actualiza la confirmación de subida de un archivo TIB diario.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await req.json().catch(() => ({}));
    const tipo = String(body.tipo || '').trim() as TibTipo;
    const r2_key = String(body.r2_key || '').trim();
    const nombre_archivo = String(body.nombre_archivo || '').trim();
    const peso_bytes = Number(body.peso_bytes) || 0;
    const fecha = String(body.fecha || '').trim() || getLimaDateString();

    if (!['delivered', 'sent', 'received'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo de archivo TIB inválido (delivered, sent, received).' }, { status: 400 });
    }
    if (!r2_key || !r2_key.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Clave R2 inválida o formato no es .xlsx.' }, { status: 400 });
    }
    if (!nombre_archivo) {
      return NextResponse.json({ error: 'Falta el nombre original del archivo.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const userNombre = getUserDisplayName(auth.user).slice(0, 120);

    // 1. Purgar archivos previos obsoletos de este tipo en Cloudflare R2
    const { data: previousRows } = await admin
      .from('inventario_tib_diario')
      .select('id, r2_key, fecha')
      .eq('tipo', tipo)
      .eq('es_activo', true);

    if (previousRows && previousRows.length > 0) {
      for (const prev of previousRows) {
        if (prev.r2_key && prev.r2_key !== r2_key) {
          console.log(`[inventario-tib] Eliminando archivo R2 previo reemplazado: ${prev.r2_key}`);
          await deleteFileFromR2(prev.r2_key);
        }
      }
      // Desactivar registros anteriores que difieran en fecha o clave
      await admin
        .from('inventario_tib_diario')
        .update({ es_activo: false })
        .eq('tipo', tipo)
        .neq('r2_key', r2_key);
    }

    // 2. Registrar el nuevo archivo como el único activo en la base de datos
    const { data, error } = await admin
      .from('inventario_tib_diario')
      .upsert(
        {
          fecha,
          tipo,
          r2_key,
          nombre_archivo,
          peso_bytes,
          subido_por_nombre: userNombre,
          subido_en: new Date().toISOString(),
          es_activo: true,
        },
        { onConflict: 'fecha,tipo' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error guardando en inventario_tib_diario:', error);
      return NextResponse.json({ error: `Error en BD: ${error.message}` }, { status: 500 });
    }

    // 3. Notificar inmediatamente al Worker VPS de Hostinger para que descargue y almacene
    // permanentemente el archivo en su disco local (/app/cache/tib-active).
    const vpsHost = process.env.VPS_HOST || '2.25.89.222';
    const workerPort = process.env.WORKER_PORT || '10000';
    const workerUrl = process.env.WORKER_URL || `http://${vpsHost}:${workerPort}`;

    void fetch(`${workerUrl}/sync-tib`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, r2_key, nombre_archivo }),
      signal: AbortSignal.timeout(15000),
    })
      .then((res) => {
        if (!res.ok) console.warn(`[inventario-tib] Worker VPS sync respondió con HTTP ${res.status}`);
        else console.log(`[inventario-tib] Worker VPS sincronizó exitosamente en caché local ${tipo}`);
      })
      .catch((err) => {
        console.warn(`[inventario-tib] Aviso al Worker VPS: ${err.message}. Se sincronizará automáticamente al procesar el job.`);
      });

    return NextResponse.json({ ok: true, file: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al registrar archivo TIB.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
