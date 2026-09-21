import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('boletas_shalom')
      .select('*')
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
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado.' }, { status: 400 });
    }

    const body = await req.json();

    const allowedFields = [
      'nro_orden',
      'codigo',
      'fecha_emision',
      'hora_emision',
      'fecha_traslado',
      'remitente_nombre',
      'remitente_dni',
      'remitente_telefono',
      'destinatario_nombre',
      'destinatario_dni',
      'destinatario_telefono',
      'origen',
      'destino',
      'tipo_entrega',
      'forma_pago',
      'descripcion',
      'cantidad',
      'unidad_medida',
      'peso',
      'observaciones',
      'monto_total',
      'moneda',
      'metadatos_ocr'
    ];

    const updates: Record<string, any> = {
      actualizado_en: new Date().toISOString()
    };

    for (const field of allowedFields) {
      if (field in body) {
        let val = body[field];
        if (typeof val === 'string' && ['destinatario_nombre', 'remitente_nombre', 'origen', 'destino', 'tipo_entrega'].includes(field)) {
          val = val.trim().toUpperCase();
        }
        if (field === 'monto_total' || field === 'peso') {
          val = Number(val) || 0;
        }
        updates[field] = val;
      }
    }

    const { data, error } = await supabase
      .from('boletas_shalom')
      .update(updates)
      .eq('id', id)
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
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('boletas_shalom')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/shalom-boletas/[id] error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Boleta eliminada correctamente.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al eliminar la boleta';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
