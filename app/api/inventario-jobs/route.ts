import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser, getUserDisplayName, hasAdminRole } from '@/lib/auth/guards';

/**
 * POST /api/inventario-jobs — encola un trabajo para el worker Render.
 * Body: { inventario_key, entregado_key?, enviado_key?, recibido_key?,
 *         fuentes: ('delivered'|'sent'|'received')[], user_nombre? }
 * GET /api/inventario-jobs — historial (últimos 20).
 */
const VALID_SOURCES = new Set(['delivered', 'sent', 'received']);
const SOURCE_KEY_FIELD: Record<string, string> = {
  delivered: 'entregado_key',
  sent: 'enviado_key',
  received: 'recibido_key',
};

function isXlsxKey(key: string): boolean {
  return key.toLowerCase().endsWith('.xlsx') && !key.includes('..');
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await req.json().catch(() => ({}));

    const inventarioKey = String(body.inventario_key || '').trim();
    const rawFuentes: unknown[] = Array.isArray(body.fuentes) ? body.fuentes : [];
    const fuentes: string[] = [...new Set(rawFuentes.map((f) => String(f).trim()))].filter(
      (f) => VALID_SOURCES.has(f)
    );

    if (!inventarioKey || !isXlsxKey(inventarioKey)) {
      return NextResponse.json(
        { error: 'Falta el archivo de inventario (.xlsx) subido a R2.' },
        { status: 400 }
      );
    }
    if (fuentes.length === 0) {
      return NextResponse.json(
        { error: 'Selecciona al menos una fuente TIB.' },
        { status: 400 }
      );
    }

    const sincronizarDb = Boolean(body.sincronizar_db);

    const row: Record<string, unknown> = {
      usuario_id: auth.user.id,
      inventario_key: inventarioKey,
      fuentes,
      sincronizar_db: sincronizarDb,
      user_nombre: getUserDisplayName(auth.user).slice(0, 120),
      estado: 'queued',
      etapa: 'queued',
      mensaje: 'En cola, esperando al worker.',
      progreso: 0,
    };

    for (const fuente of fuentes) {
      const field = SOURCE_KEY_FIELD[fuente];
      const key = String(body[field] || '').trim();
      if (!key || !isXlsxKey(key)) {
        return NextResponse.json(
          { error: `Falta el archivo TIB de la fuente activada: ${fuente}.` },
          { status: 400 }
        );
      }
      row[field] = key;
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('inventario_jobs')
      .insert(row)
      .select('id')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: `No se pudo encolar el trabajo: ${error?.message || 'error desconocido'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: (data as { id: string }).id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al encolar el trabajo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const admin = getSupabaseAdmin();
    let query = admin
      .from('inventario_jobs')
      .select(
        'id,estado,etapa,mensaje,progreso,fuentes,resultado_key,csv_key,total_guias,coincidencias,sin_coincidencia,segundos,creado_en,terminado_en'
      );

    if (!(await hasAdminRole(auth.user))) {
      query = query.eq('usuario_id', auth.user.id);
    }

    const { data, error } = await query.order('creado_en', { ascending: false }).limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ jobs: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al leer el historial.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
