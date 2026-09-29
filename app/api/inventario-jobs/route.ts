import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser, getUserDisplayName, hasAdminRole } from '@/lib/auth/guards';
import { uploadFileToR2 } from '@/lib/r2/client';
import { generateInventoryExcelBufferFromDb, getDbInventoryCount } from '@/lib/inventory-jobs/exportDbInventory';

/**
 * POST /api/inventario-jobs — encola un trabajo para el worker Render.
 * Soporta dos modos:
 *   1. origen_inventario: 'db' (Predeterminado) -> Extrae paquetes de la BD y genera Inventario.xlsx automáticamente.
 *   2. origen_inventario: 'file' -> Requiere inventario_key pre-subido a R2.
 * Body: { origen_inventario?, filtro_estado?, inventario_key?, entregado_key?, enviado_key?, recibido_key?,
 *         fuentes: ('delivered'|'sent'|'received')[], sincronizar_db?, user_nombre? }
 * GET /api/inventario-jobs — historial (últimos 20) + estadísticas de paquetes en BD.
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

    const rawFuentes: unknown[] = Array.isArray(body.fuentes) ? body.fuentes : [];
    const fuentes: string[] = [...new Set(rawFuentes.map((f) => String(f).trim()))].filter(
      (f) => VALID_SOURCES.has(f)
    );

    if (fuentes.length === 0) {
      return NextResponse.json(
        { error: 'Selecciona al menos una fuente TIB (Entregado, Enviado o Recibido).' },
        { status: 400 }
      );
    }

    const origenInventario = body.origen_inventario === 'file' ? 'file' : 'db';
    let inventarioKey = String(body.inventario_key || '').trim();
    const jobId = crypto.randomUUID();
    let totalGuiasDb: number | null = null;

    if (origenInventario === 'db' || !inventarioKey) {
      // 1. Extraer paquetes activos de la base de datos oficial
      const filtroEstado = body.filtro_estado === 'todos' ? 'todos' : 'activos';
      const dbInventory = await generateInventoryExcelBufferFromDb({ filtroEstado });
      totalGuiasDb = dbInventory.count;

      // 2. Subir el inventario generado a Cloudflare R2
      const uploaded = await uploadFileToR2(
        dbInventory.buffer,
        `inventario-jobs/${jobId}/Inventario.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      inventarioKey = uploaded.key;
    } else {
      if (!isXlsxKey(inventarioKey)) {
        return NextResponse.json(
          { error: 'El archivo de inventario manual subido a R2 no es un .xlsx válido.' },
          { status: 400 }
        );
      }
    }

    const sincronizarDb = body.sincronizar_db !== undefined ? Boolean(body.sincronizar_db) : true;

    const row: Record<string, unknown> = {
      id: jobId,
      usuario_id: auth.user.id,
      inventario_key: inventarioKey,
      fuentes,
      sincronizar_db: sincronizarDb,
      user_nombre: getUserDisplayName(auth.user).slice(0, 120),
      estado: 'queued',
      etapa: 'queued',
      mensaje: origenInventario === 'db'
        ? `En cola (${totalGuiasDb} paquetes de base de datos), esperando al procesador.`
        : 'En cola, esperando al worker.',
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
        'id,estado,etapa,mensaje,progreso,fuentes,resultado_key,csv_key,total_guias,coincidencias,sin_coincidencia,segundos,creado_en,terminado_en,sincronizar_db,db_sincronizado,db_actualizados,db_sincronizado_en'
      );

    if (!(await hasAdminRole(auth.user))) {
      query = query.eq('usuario_id', auth.user.id);
    }

    const { data, error } = await query.order('creado_en', { ascending: false }).limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const [dbActivos, dbTodos] = await Promise.all([
      getDbInventoryCount({ filtroEstado: 'activos' }),
      getDbInventoryCount({ filtroEstado: 'todos' })
    ]);

    return NextResponse.json({
      jobs: data || [],
      dbStats: {
        activos: dbActivos.count,
        todos: dbTodos.count
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al leer el historial.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
