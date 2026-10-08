import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser, getUserDisplayName } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { encabezado, cuadre, filas, archivoNombre, archivoUrl } = body;

    if (!encabezado || !filas || !Array.isArray(filas)) {
      return NextResponse.json({ error: 'Datos de manifiesto incompletos o inválidos.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const userNombre = getUserDisplayName(auth.user);

    // 1. Guardar cabecera del manifiesto
    const { data: manifiesto, error: manErr } = await admin
      .from('manifiestos_tib')
      .insert({
        fecha_vuelo: encabezado.fecha_vuelo || 'S/F',
        cliente: encabezado.cliente || 'AMEX',
        modalidad: encabezado.modalidad || 'OFICINA',
        guias_declaradas: Number(encabezado.guias_declaradas || 0),
        paquetes_declarados: Number(encabezado.paquetes_declarados || 0),
        guias_extraidas: Number(cuadre?.totales?.guias_extraidas || filas.length),
        paquetes_extraidos: Number(cuadre?.totales?.paquetes_extraidos || 0),
        es_cuadre_perfecto: Boolean(cuadre?.cuadre_perfecto),
        archivo_nombre: archivoNombre || 'manifiesto.pdf',
        archivo_url: archivoUrl || null,
        creado_por: userNombre
      })
      .select()
      .single();

    if (manErr || !manifiesto) {
      console.error('Error insertando manifiestos_tib:', manErr);
      return NextResponse.json({ error: `Error al guardar manifiesto: ${manErr?.message}` }, { status: 500 });
    }

    // 2. Preparar filas de detalle
    const detallesInserts: any[] = [];

    filas.forEach((f, idx) => {
      const guia = String(f.guia || '').trim();
      const obs = String(f.observacion || '').trim();
      const wrs = Array.isArray(f.wrs) ? f.wrs : [];

      if (wrs.length === 0) {
        detallesInserts.push({
          manifiesto_id: manifiesto.id,
          numero_guia_amx: guia,
          numero_wr: 'SIN_WR',
          observacion: obs,
          fila_index: idx + 1
        });
      } else {
        wrs.forEach((wrItem: string) => {
          const wrClean = String(wrItem).trim().toUpperCase();
          detallesInserts.push({
            manifiesto_id: manifiesto.id,
            numero_guia_amx: guia,
            numero_wr: wrClean,
            observacion: obs,
            fila_index: idx + 1
          });
        });
      }
    });

    if (detallesInserts.length > 0) {
      const { error: detErr } = await admin.from('manifiestos_tib_detalles').insert(detallesInserts);
      if (detErr) {
        console.warn('Aviso insertando detalles:', detErr);
      }
    }

    return NextResponse.json({
      success: true,
      manifiestoId: manifiesto.id,
      totalDetalles: detallesInserts.length,
      mensaje: `Manifiesto guardado con éxito. Se registraron ${detallesInserts.length} items de entrega.`
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al guardar el manifiesto en base de datos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
