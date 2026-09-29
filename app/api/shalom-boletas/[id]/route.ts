import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth/guards';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const supabase = await createServerClient();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('boletas_shalom')
      .select('*')
      .is('eliminado_en', null)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Boleta no encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener la boleta';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const supabase = await createServerClient();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado.' }, { status: 400 });
    }

    const body = await req.json();

    const allowedFields = [
      'nro_orden',
      'codigo',
      'fecha_emision',
      'destinatario_nombre',
      'destinatario_dni',
      'destinatario_telefono',
      'destino',
      'tipo_entrega',
      'forma_pago',
      'descripcion',
      'cantidad',
      'peso',
      'monto_total'
    ];

    const updates: Record<string, any> = {
      actualizado_en: new Date().toISOString()
    };

    for (const field of allowedFields) {
      if (field in body) {
        let val = body[field];
        if (typeof val === 'string' && ['destinatario_nombre', 'destino', 'tipo_entrega', 'nro_orden', 'codigo', 'descripcion'].includes(field)) {
          val = val.trim().toUpperCase();
        }
        if (field === 'monto_total' || field === 'peso') {
          val = Number(val) || 0;
        }
        if (field === 'cantidad') {
          val = parseInt(val, 10) || 1;
        }
        updates[field] = val;
      }
    }

    const { data, error } = await supabase
      .from('boletas_shalom')
      .update(updates)
      .eq('id', id)
      .is('eliminado_en', null)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/shalom-boletas/[id] error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al actualizar la boleta';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const supabase = await createServerClient();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado.' }, { status: 400 });
    }

    const motivo = 'Eliminación manual desde Boletas Shalom';
    const eliminadoEn = new Date().toISOString();
    const { data, error } = await supabase
      .from('boletas_shalom')
      .update({
        eliminado_en: eliminadoEn,
        eliminado_por: auth.user.id,
        motivo_eliminacion: motivo
      })
      .eq('id', id)
      .is('eliminado_en', null)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[DELETE /api/shalom-boletas/[id] soft-delete error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) return NextResponse.json({ error: 'Boleta no encontrada.' }, { status: 404 });

    const { error: auditError } = await supabase.from('auditoria_sistema').insert({
      usuario_id: auth.user.id,
      usuario_nombre: auth.user.user_metadata?.nombre_completo || auth.user.email || 'Operador AMEX',
      usuario_email: auth.user.email || '',
      modulo: 'SHALOM',
      accion: 'ELIMINAR_SOFT',
      registro_id: id,
      detalles: motivo,
      valores_anteriores: { id, eliminado: false },
      valores_nuevos: { id, eliminado_en: eliminadoEn, motivo_eliminacion: motivo }
    });

    if (auditError) {
      console.error('[DELETE /api/shalom-boletas/[id] audit error]:', auditError);
    }

    return NextResponse.json({ success: true, message: 'Boleta archivada correctamente.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al eliminar la boleta';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
