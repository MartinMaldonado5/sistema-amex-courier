import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser, getUserDisplayName } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

/**
 * GET /api/paquetes/asignacion-masiva?codes=WR1,WR2...
 * Verifica qué códigos existen en la base de datos y cuáles faltan
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const codesParam = searchParams.get('codes') || '';
    if (!codesParam.trim()) {
      return NextResponse.json({ found: [], notFound: [] });
    }

    const rawCodes = Array.from(
      new Set(
        codesParam
          .split(/[\n,;\t]+/)
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean)
      )
    );

    if (rawCodes.length === 0) {
      return NextResponse.json({ found: [], notFound: [] });
    }

    const admin = getSupabaseAdmin();

    // Buscar por numero_recibo_bodega o por tracking
    const { data: matchedPackages, error } = await admin
      .from('paquetes')
      .select('id, numero_recibo_bodega, tracking, tracking_usa, nombre_consignatario, dni_consignatario, ubicacion_actual, anaquel, piso, posicion_estante, estado_amex, estado_tib')
      .or(`numero_recibo_bodega.in.(${rawCodes.map(c => `"${c}"`).join(',')}),tracking.in.(${rawCodes.map(c => `"${c}"`).join(',')})`);

    if (error) {
      console.error('Error verificando códigos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const foundList = (matchedPackages || []).map((p) => ({
      id: p.id,
      numeroReciboBodega: p.numero_recibo_bodega || '',
      tracking: p.tracking || p.tracking_usa || '',
      nombreConsignatario: p.nombre_consignatario || '',
      dniConsignatario: p.dni_consignatario || '',
      ubicacionActual: p.ubicacion_actual || 'AmexLince',
      anaquel: p.anaquel || 'A1',
      piso: p.piso || 'P1',
      posicionEstante: p.posicion_estante || `${p.anaquel || 'A1'}-${p.piso || 'P1'}`,
      estadoAmex: p.estado_amex || 'recibido',
      estadoTib: p.estado_tib || 'EnAlmacen'
    }));

    const foundCodesSet = new Set<string>();
    foundList.forEach((p) => {
      if (p.numeroReciboBodega) foundCodesSet.add(p.numeroReciboBodega.toUpperCase());
      if (p.tracking) foundCodesSet.add(p.tracking.toUpperCase());
    });

    const notFound = rawCodes.filter((c) => !foundCodesSet.has(c));

    return NextResponse.json({
      success: true,
      totalEnviados: rawCodes.length,
      totalEncontrados: foundList.length,
      totalNoEncontrados: notFound.length,
      found: foundList,
      notFound,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno al consultar códigos';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/paquetes/asignacion-masiva
 * Ejecuta la actualización de ubicación y estado en bloque
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const {
      codes,
      targetUbicacion = 'AmexLince',
      targetAnaquel = 'A1',
      targetPiso = 'P1',
      targetPosicion,
      targetEstadoAmex,
      motivo = 'Ingreso y Asignación Masiva WMS desde Excel',
      operador
    } = body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({ error: 'Debes proporcionar al menos un código WR.' }, { status: 400 });
    }

    const cleanCodes = Array.from(
      new Set(
        codes
          .map((c: unknown) => String(c || '').trim().toUpperCase())
          .filter(Boolean)
      )
    );

    if (cleanCodes.length === 0) {
      return NextResponse.json({ error: 'No se detectaron códigos válidos.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const userDisplayName = operador?.trim() || getUserDisplayName(auth.user);
    const userEmail = auth.user.email || 'operador@amexcourier.com';
    const userId = auth.user.id;

    // 1. Localizar los paquetes existentes
    const { data: paquetesToUpdate, error: fetchErr } = await admin
      .from('paquetes')
      .select('id, numero_recibo_bodega, tracking, tracking_usa, nombre_consignatario, ubicacion_actual, anaquel, piso, posicion_estante, estado_amex')
      .or(`numero_recibo_bodega.in.(${cleanCodes.map(c => `"${c}"`).join(',')}),tracking.in.(${cleanCodes.map(c => `"${c}"`).join(',')})`);

    if (fetchErr) {
      console.error('Error buscando paquetes para asignación:', fetchErr);
      return NextResponse.json({ error: `Error buscando paquetes: ${fetchErr.message}` }, { status: 500 });
    }

    if (!paquetesToUpdate || paquetesToUpdate.length === 0) {
      return NextResponse.json({
        success: false,
        totalEnviados: cleanCodes.length,
        totalActualizados: 0,
        mensaje: 'Ninguno de los códigos proporcionados existe en la base de datos.',
        noEncontrados: cleanCodes
      }, { status: 404 });
    }

    const isLevelLess =
      targetAnaquel === 'OFI' ||
      targetAnaquel === 'DSP-Z1' ||
      targetAnaquel === 'DSP-Z2' ||
      targetAnaquel === 'TRANSITO' ||
      targetAnaquel === 'REC' ||
      targetAnaquel === 'DSP';

    const finalPosicion =
      targetPosicion ||
      (isLevelLess ? targetAnaquel : `${targetAnaquel}-${targetPiso}`);

    const ids = paquetesToUpdate.map((p) => p.id);

    // 2. Preparar campos a actualizar
    const updateData: Record<string, any> = {
      ubicacion_actual: targetUbicacion,
      anaquel: targetAnaquel,
      piso: isLevelLess ? null : targetPiso,
      posicion_estante: finalPosicion,
      actualizado_en: new Date().toISOString()
    };

    if (targetEstadoAmex && targetEstadoAmex !== 'mantener') {
      updateData.estado_amex = targetEstadoAmex;
    }

    // 3. Ejecutar UPDATE en lote
    const { error: updErr } = await admin
      .from('paquetes')
      .update(updateData)
      .in('id', ids);

    if (updErr) {
      console.error('Error actualizando paquetes en lote:', updErr);
      return NextResponse.json({ error: `Error al actualizar: ${updErr.message}` }, { status: 500 });
    }

    // 4. Registrar movimientos en kardex
    const nowIso = new Date().toISOString();
    const kardexRows = paquetesToUpdate.map((p) => {
      const origen = `${p.ubicacion_actual || 'AmexLince'} (${p.posicion_estante || 'S/U'})`;
      const destino = `${targetUbicacion} (${finalPosicion})`;
      return {
        paquete_id: p.id,
        codigo_paquete: p.numero_recibo_bodega || p.tracking || 'S/N',
        consignatario: p.nombre_consignatario || 'Cliente AMEX',
        origen_descripcion: origen,
        destino_descripcion: destino,
        tipo_movimiento: 'REUBICACION_MASIVA_EXCEL',
        motivo: `${motivo}${targetEstadoAmex && targetEstadoAmex !== 'mantener' ? ` [Estado: ${targetEstadoAmex}]` : ''}`,
        usuario_operador: userDisplayName,
        usuario_email: userEmail,
        usuario_id: userId,
        creado_en: nowIso
      };
    });

    if (kardexRows.length > 0) {
      const { error: kardexErr } = await admin.from('movimientos_kardex').insert(kardexRows);
      if (kardexErr) {
        console.warn('Aviso insertando kardex masivo:', kardexErr.message);
      }
    }

    // Identificar códigos no encontrados
    const foundCodes = new Set<string>();
    paquetesToUpdate.forEach((p) => {
      if (p.numero_recibo_bodega) foundCodes.add(p.numero_recibo_bodega.toUpperCase());
      if (p.tracking) foundCodes.add(p.tracking.toUpperCase());
    });
    const notFound = cleanCodes.filter((c) => !foundCodes.has(c));

    return NextResponse.json({
      success: true,
      totalEnviados: cleanCodes.length,
      totalActualizados: ids.length,
      totalNoEncontrados: notFound.length,
      noEncontrados: notFound,
      ubicacionAsignada: finalPosicion,
      mensaje: `✓ Se asignó exitosamente la ubicación ${finalPosicion} a ${ids.length} paquete(s).${notFound.length > 0 ? ` (${notFound.length} códigos no encontrados en el sistema)` : ''}`
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno al procesar asignación masiva';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
