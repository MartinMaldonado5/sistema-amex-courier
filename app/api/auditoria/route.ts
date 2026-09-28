import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin, getUserDisplayName } from '@/lib/auth/guards';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const RESTORABLE_MODULES = new Set(['INVENTARIO', 'COBROS']);

async function requireAdmin() {
  const auth = await authorizeAdmin();
  return auth.ok ? auth : NextResponse.json({ error: auth.error }, { status: auth.status });
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const params = req.nextUrl.searchParams;
    const modulo = params.get('modulo')?.trim();
    const accion = params.get('accion')?.trim();
    const limit = Math.min(Math.max(Number(params.get('limit') || 100), 1), 200);

    const admin = getSupabaseAdmin();
    let query = admin
      .from('auditoria_sistema')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(limit);

    if (modulo && modulo !== 'TODOS') query = query.eq('modulo', modulo);
    if (accion && accion !== 'TODOS') query = query.eq('accion', accion);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ logs: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al consultar la auditoría.';
    console.error('[GET /api/auditoria]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => ({}));
    const modulo = String(body.modulo || '').trim().toUpperCase();
    const registroId = String(body.registro_id || '').trim();
    const auditLogId = String(body.audit_log_id || '').trim();

    if (!RESTORABLE_MODULES.has(modulo) || !registroId || registroId.length > 120 || !auditLogId) {
      return NextResponse.json({ error: 'Solicitud de restauración inválida.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const table = modulo === 'INVENTARIO' ? 'paquetes' : 'cobros_vouchers';
    const { data, error } = await admin
      .from(table)
      .update({ eliminado_en: null, eliminado_por: null, motivo_eliminacion: null })
      .eq('id', registroId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Registro no encontrado.' }, { status: 404 });

    const { error: auditError } = await admin.from('auditoria_sistema').insert({
      usuario_id: auth.user.id,
      usuario_nombre: getUserDisplayName(auth.user),
      usuario_email: auth.user.email || '',
      modulo,
      accion: 'RESTAURAR',
      registro_id: registroId,
      detalles: `Restauración ejecutada desde el evento de auditoría ${auditLogId}`,
      valores_anteriores: { audit_log_origen: auditLogId, eliminado: true },
      valores_nuevos: { restaurado: true, restaurado_en: new Date().toISOString() }
    });

    if (auditError) throw auditError;
    return NextResponse.json({ success: true, registro_id: registroId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al restaurar el registro.';
    console.error('[POST /api/auditoria]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
