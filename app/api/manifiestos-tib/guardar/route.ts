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
    const { encabezado, cuadre, filas, archivoNombre, sincronizarInventario } = body;

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
    const allWrsToSync: Array<{ wr: string; guia: string }> = [];

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
          allWrsToSync.push({ wr: wrClean, guia });
        });
      }
    });

    if (detallesInserts.length > 0) {
      const { error: detErr } = await admin.from('manifiestos_tib_detalles').insert(detallesInserts);
      if (detErr) {
        console.warn('Aviso insertando detalles:', detErr);
      }
    }

    // 3. Sincronización opcional con la tabla de inventario paquetes
    let paquetesActualizados = 0;
    if (sincronizarInventario && allWrsToSync.length > 0) {
      const wrList = allWrsToSync.map(item => item.wr);
      const { data: paquetesExistentes } = await admin
        .from('paquetes')
        .select('id, numero_recibo_bodega')
        .in('numero_recibo_bodega', wrList);

      if (paquetesExistentes && paquetesExistentes.length > 0) {
        const ids = paquetesExistentes.map(p => p.id);
        const { error: updErr } = await admin
          .from('paquetes')
          .update({
            estado_amex: 'recibido',
            estado_tib: 'Recibido',
            ubicacion_actual: 'AmexLince',
            actualizado_en: new Date().toISOString()
          })
          .in('id', ids);

        if (!updErr) {
          paquetesActualizados = ids.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      manifiestoId: manifiesto.id,
      totalDetalles: detallesInserts.length,
      paquetesActualizados,
      mensaje: `Manifiesto guardado con éxito. Se registraron ${detallesInserts.length} items de entrega.${paquetesActualizados > 0 ? ` Se actualizaron ${paquetesActualizados} paquetes en el inventario.` : ''}`
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al guardar el manifiesto en base de datos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
