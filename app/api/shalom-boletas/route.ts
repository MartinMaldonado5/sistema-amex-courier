import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { uploadShalomBoletaPdf } from '@/lib/r2/shalomUpload';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const year = (searchParams.get('year') || '').trim();
    const month = (searchParams.get('month') || '').trim();
    const day = (searchParams.get('day') || '').trim();
    const destino = (searchParams.get('destino') || '').trim();
    const modalidad = (searchParams.get('modalidad') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('boletas_shalom')
      .select('*', { count: 'exact' })
      .order('fecha_emision', { ascending: false })
      .order('creado_en', { ascending: false });

    // Filtro por texto general (fuzzy / ilike en columnas clave)
    if (q) {
      // Búsqueda en número de orden, código, guía, destinatario, DNI, remitente, destino o descripción
      const escapedQ = q.replace(/[%_]/g, '\\$&');
      query = query.or(
        `nro_orden.ilike.%${escapedQ}%,codigo.ilike.%${escapedQ}%,numero_guia.ilike.%${escapedQ}%,codigo_seguimiento.ilike.%${escapedQ}%,destinatario_nombre.ilike.%${escapedQ}%,destinatario_dni.ilike.%${escapedQ}%,destinatario_telefono.ilike.%${escapedQ}%,remitente_nombre.ilike.%${escapedQ}%,remitente_dni.ilike.%${escapedQ}%,destino.ilike.%${escapedQ}%,descripcion.ilike.%${escapedQ}%`
      );
    }

    // Filtro de fecha
    if (year && month && day) {
      const formattedMonth = month.padStart(2, '0');
      const formattedDay = day.padStart(2, '0');
      query = query.eq('fecha_emision', `${year}-${formattedMonth}-${formattedDay}`);
    } else if (year && month) {
      const formattedMonth = month.padStart(2, '0');
      const startOfMonth = `${year}-${formattedMonth}-01`;
      // Calcular último día del mes
      const nextMonth = parseInt(month, 10) === 12 ? 1 : parseInt(month, 10) + 1;
      const nextYear = parseInt(month, 10) === 12 ? parseInt(year, 10) + 1 : parseInt(year, 10);
      const startOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
      query = query.gte('fecha_emision', startOfMonth).lt('fecha_emision', startOfNextMonth);
    } else if (year) {
      query = query.gte('fecha_emision', `${year}-01-01`).lte('fecha_emision', `${year}-12-31`);
    }

    // Filtro por destino
    if (destino && destino !== 'TODOS') {
      query = query.ilike('destino', `%${destino}%`);
    }

    // Filtro por modalidad de pago
    if (modalidad && modalidad !== 'TODAS') {
      query = query.eq('modalidad_pago', modalidad);
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('[GET /api/shalom-boletas error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Obtener estadísticas rápidas del día de hoy y del mes actual
    const todayStr = new Date().toISOString().split('T')[0];
    const currentYear = todayStr.split('-')[0];
    const currentMonth = todayStr.split('-')[1];
    const startOfCurrentMonth = `${currentYear}-${currentMonth}-01`;

    const [todayRes, monthRes] = await Promise.all([
      supabase
        .from('boletas_shalom')
        .select('id, monto_total', { count: 'exact' })
        .eq('fecha_emision', todayStr),
      supabase
        .from('boletas_shalom')
        .select('id, monto_total, destino')
        .gte('fecha_emision', startOfCurrentMonth)
    ]);

    const totalHoy = todayRes.count || 0;
    const boletasMes = monthRes.data || [];
    const totalMes = boletasMes.length;
    const montoTotalMes = boletasMes.reduce((acc, b) => acc + (Number(b.monto_total) || 0), 0);

    // Contar destinos más frecuentes del mes
    const destinosCount: Record<string, number> = {};
    for (const b of boletasMes) {
      if (b.destino) {
        destinosCount[b.destino] = (destinosCount[b.destino] || 0) + 1;
      }
    }
    const destinosPopulares = Object.entries(destinosCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    return NextResponse.json({
      boletas: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      stats: {
        totalHoy,
        totalMes,
        montoTotalMes,
        destinosPopulares
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al consultar boletas de Shalom';
    console.error('[GET /api/shalom-boletas exception]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let payload: Record<string, any> = {};
    let fileBuffer: Buffer | null = null;
    let fileName = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (file) {
        fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }

      payload = {
        nro_orden: formData.get('nro_orden') as string,
        codigo: formData.get('codigo') as string,
        numero_guia: (formData.get('nro_orden') || formData.get('numero_guia')) as string,
        codigo_seguimiento: (formData.get('codigo') || formData.get('codigo_seguimiento')) as string,
        fecha_emision: formData.get('fecha_emision') as string,
        hora_emision: formData.get('hora_emision') as string,
        fecha_traslado: formData.get('fecha_traslado') as string,
        remitente_nombre: formData.get('remitente_nombre') as string,
        remitente_dni: (formData.get('remitente_dni') || formData.get('remitente_documento')) as string,
        remitente_telefono: formData.get('remitente_telefono') as string,
        destinatario_nombre: formData.get('destinatario_nombre') as string,
        destinatario_dni: (formData.get('destinatario_dni') || formData.get('destinatario_documento')) as string,
        destinatario_telefono: formData.get('destinatario_telefono') as string,
        origen: formData.get('origen') as string,
        destino: formData.get('destino') as string,
        tipo_entrega: formData.get('tipo_entrega') as string,
        agencia_destino: (formData.get('tipo_entrega') || formData.get('agencia_destino')) as string,
        forma_pago: formData.get('forma_pago') as string,
        modalidad_pago: (formData.get('forma_pago') || formData.get('modalidad_pago') || 'PAGO_DESTINO') as string,
        descripcion: (formData.get('descripcion') || formData.get('contenido_bultos')) as string,
        cantidad: parseInt((formData.get('cantidad') as string) || '1', 10),
        unidad_medida: (formData.get('unidad_medida') as string) || 'Volumen',
        peso: parseFloat(((formData.get('peso') || formData.get('peso_total')) as string) || '0'),
        observaciones: formData.get('observaciones') as string,
        monto_total: parseFloat((formData.get('monto_total') as string) || '0'),
        moneda: formData.get('moneda') as string || 'PEN',
        pdf_url: formData.get('pdf_url') as string,
        storage_path: formData.get('storage_path') as string,
      };

      const rawMetadatos = formData.get('metadatos_ocr') as string;
      if (rawMetadatos) {
        try {
          payload.metadatos_ocr = JSON.parse(rawMetadatos);
        } catch {
          payload.metadatos_ocr = {};
        }
      }
    } else {
      payload = await req.json();
    }

    const guiaOrOrden = payload.nro_orden || payload.numero_guia || payload.codigo;

    // Validaciones mínimas
    if (!guiaOrOrden || !payload.destinatario_nombre || !payload.destino) {
      return NextResponse.json(
        { error: 'Los campos Nro. Orden / Guía, Destinatario y Destino son obligatorios.' },
        { status: 400 }
      );
    }

    // Si se adjuntó el archivo PDF directamente, subirlo a R2
    if (fileBuffer) {
      const fecha = payload.fecha_emision || new Date().toISOString().split('T')[0];
      const r2Result = await uploadShalomBoletaPdf(
        fileBuffer,
        fecha,
        String(guiaOrOrden),
        payload.destinatario_nombre
      );
      payload.pdf_url = r2Result.url;
      payload.storage_path = r2Result.key;
    }

    if (!payload.pdf_url) {
      return NextResponse.json(
        { error: 'Se requiere el archivo PDF del comprobante de Shalom.' },
        { status: 400 }
      );
    }

    const nroFinal = String(guiaOrOrden).trim().toUpperCase();
    const codFinal = payload.codigo ? String(payload.codigo).trim().toUpperCase() : null;
    const destDniFinal = payload.destinatario_dni || payload.destinatario_documento ? String(payload.destinatario_dni || payload.destinatario_documento).trim() : null;
    const remDniFinal = payload.remitente_dni || payload.remitente_documento ? String(payload.remitente_dni || payload.remitente_documento).trim() : null;
    const descFinal = payload.descripcion || payload.contenido_bultos ? String(payload.descripcion || payload.contenido_bultos).trim() : 'BULTO';
    const pesoFinal = Number(payload.peso || payload.peso_total) || 0;
    const formaPagoFinal = payload.forma_pago || payload.modalidad_pago || 'Pendiente de Pago';

    const rowToInsert = {
      nro_orden: nroFinal,
      codigo: codFinal,
      numero_guia: nroFinal,
      codigo_seguimiento: codFinal,
      fecha_emision: payload.fecha_emision || new Date().toISOString().split('T')[0],
      hora_emision: payload.hora_emision ? String(payload.hora_emision).trim() : null,
      fecha_traslado: payload.fecha_traslado || null,
      remitente_nombre: String(payload.remitente_nombre || 'AMEX COURIER').trim().toUpperCase(),
      remitente_dni: remDniFinal,
      remitente_documento: remDniFinal,
      remitente_telefono: payload.remitente_telefono ? String(payload.remitente_telefono).trim() : null,
      destinatario_nombre: String(payload.destinatario_nombre).trim().toUpperCase(),
      destinatario_dni: destDniFinal,
      destinatario_documento: destDniFinal,
      destinatario_telefono: payload.destinatario_telefono ? String(payload.destinatario_telefono).trim() : null,
      origen: String(payload.origen || 'LIMA').trim().toUpperCase(),
      destino: String(payload.destino).trim().toUpperCase(),
      tipo_entrega: payload.tipo_entrega ? String(payload.tipo_entrega).trim().toUpperCase() : 'ENTREGAR EN AGENCIA',
      agencia_destino: payload.tipo_entrega ? String(payload.tipo_entrega).trim().toUpperCase() : (payload.agencia_destino || null),
      forma_pago: formaPagoFinal,
      modalidad_pago: formaPagoFinal.toUpperCase().includes('PENDIENTE') ? 'PAGO_DESTINO' : formaPagoFinal.toUpperCase(),
      descripcion: descFinal,
      contenido_bultos: descFinal,
      cantidad: parseInt(payload.cantidad, 10) || 1,
      unidad_medida: String(payload.unidad_medida || 'Volumen').trim(),
      peso: pesoFinal,
      peso_total: pesoFinal,
      observaciones: payload.observaciones ? String(payload.observaciones).trim() : null,
      monto_total: Number(payload.monto_total) || 0,
      moneda: String(payload.moneda || 'PEN').trim().toUpperCase(),
      pdf_url: payload.pdf_url,
      storage_path: payload.storage_path || '',
      r2_key: payload.storage_path || payload.r2_key || '',
      metadatos_ocr: payload.metadatos_ocr || {}
    };

    const { data, error } = await supabase
      .from('boletas_shalom')
      .insert(rowToInsert)
      .select()
      .single();

    if (error) {
      console.error('[POST /api/shalom-boletas insert error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al registrar boleta de Shalom';
    console.error('[POST /api/shalom-boletas exception]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
