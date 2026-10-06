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
    const [byWr, byTrk] = await Promise.all([
      admin
        .from('paquetes')
        .select('id, numero_recibo_bodega, tracking, nombre_consignatario, dni_consignatario, ubicacion_actual, anaquel, piso, posicion_estante, estado_amex, estado_tib')
        .in('numero_recibo_bodega', rawCodes),
      admin
        .from('paquetes')
        .select('id, numero_recibo_bodega, tracking, nombre_consignatario, dni_consignatario, ubicacion_actual, anaquel, piso, posicion_estante, estado_amex, estado_tib')
        .in('tracking', rawCodes)
    ]);

    const existingMap = new Map<string, any>();
    (byWr.data || []).forEach((p) => existingMap.set(p.id, p));
    (byTrk.data || []).forEach((p) => existingMap.set(p.id, p));
    const matchedPackages = Array.from(existingMap.values());

    const foundList = matchedPackages.map((p) => ({
      id: p.id,
      numeroReciboBodega: p.numero_recibo_bodega || '',
      tracking: p.tracking || '',
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
 * Ejecuta la actualización o creación (ingreso masivo) de ubicación y estado en bloque
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
      targetEstadoAmex = 'recibido',
      motivo = 'Ingreso y Asignación Masiva WMS desde Excel',
      operador,
      autoCreateMissing = true
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
    const [byWr, byTrk] = await Promise.all([
      admin
        .from('paquetes')
        .select('id, numero_recibo_bodega, tracking, nombre_consignatario, ubicacion_actual, anaquel, piso, posicion_estante, estado_amex')
        .in('numero_recibo_bodega', cleanCodes),
      admin
        .from('paquetes')
        .select('id, numero_recibo_bodega, tracking, nombre_consignatario, ubicacion_actual, anaquel, piso, posicion_estante, estado_amex')
        .in('tracking', cleanCodes)
    ]);

    const existingMap = new Map<string, any>();
    (byWr.data || []).forEach((p) => existingMap.set(p.id, p));
    (byTrk.data || []).forEach((p) => existingMap.set(p.id, p));
    const paquetesToUpdate = Array.from(existingMap.values());

    const foundCodesSet = new Set<string>();
    paquetesToUpdate.forEach((p) => {
      if (p.numero_recibo_bodega) foundCodesSet.add(p.numero_recibo_bodega.toUpperCase());
      if (p.tracking) foundCodesSet.add(p.tracking.toUpperCase());
    });
    const missingCodes = cleanCodes.filter((c) => !foundCodesSet.has(c));

    // Si no hay existentes y no se permite auto-crear los no encontrados
    if (paquetesToUpdate.length === 0 && (!autoCreateMissing || missingCodes.length === 0)) {
      return NextResponse.json({
        success: false,
        totalEnviados: cleanCodes.length,
        totalActualizados: 0,
        mensaje: 'Ninguno de los códigos existe en el sistema y la opción de auto-creación está inactiva.',
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

    const nowIso = new Date().toISOString();
    let totalActualizados = 0;
    let totalCreados = 0;

    // 2. Actualizar paquetes existentes
    if (paquetesToUpdate.length > 0) {
      const ids = paquetesToUpdate.map((p) => p.id);
      const updateData: Record<string, any> = {
        ubicacion_actual: targetUbicacion,
        anaquel: targetAnaquel,
        piso: isLevelLess ? null : targetPiso,
        posicion_estante: finalPosicion,
        actualizado_en: nowIso
      };

      if (targetEstadoAmex && targetEstadoAmex !== 'mantener') {
        updateData.estado_amex = targetEstadoAmex;
      }

      const { error: updErr } = await admin
        .from('paquetes')
        .update(updateData)
        .in('id', ids);

      if (updErr) {
        console.error('Error actualizando paquetes existentes en lote:', updErr);
        return NextResponse.json({ error: `Error al actualizar existentes: ${updErr.message}` }, { status: 500 });
      }

      totalActualizados = ids.length;

      // Registrar kardex para actualizados
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

      const chunkSize = 50;
      for (let i = 0; i < kardexRows.length; i += chunkSize) {
        await admin.from('movimientos_kardex').insert(kardexRows.slice(i, i + chunkSize));
      }
    }

    // 3. Crear / Ingresar códigos que no existan previamente
    if (autoCreateMissing && missingCodes.length > 0) {
      const newRows = missingCodes.map((code) => ({
        numero_recibo_bodega: code,
        tracking: code,
        tipo_empaque: 'CAJA',
        descripcion: 'Mercadería General',
        peso_kg: 1.0,
        ubicacion_actual: targetUbicacion || 'AmexLince',
        anaquel: targetAnaquel,
        piso: isLevelLess ? null : targetPiso,
        posicion_estante: finalPosicion,
        estado_amex: targetEstadoAmex && targetEstadoAmex !== 'mantener' ? targetEstadoAmex : 'recibido',
        usuario_email: userEmail,
        creado_por: userId,
        creado_en: nowIso,
        actualizado_en: nowIso
      }));

      const chunkSize = 50;
      const insertedPkgs: Array<{ id: string; numero_recibo_bodega: string }> = [];

      for (let i = 0; i < newRows.length; i += chunkSize) {
        const chunk = newRows.slice(i, i + chunkSize);
        const { data: insertedChunk, error: insErr } = await admin
          .from('paquetes')
          .insert(chunk)
          .select('id, numero_recibo_bodega');

        if (insErr) {
          console.error('Error insertando paquetes nuevos:', insErr);
          return NextResponse.json({ error: `Error creando paquetes: ${insErr.message}` }, { status: 500 });
        }

        if (insertedChunk) {
          insertedPkgs.push(...insertedChunk);
        }
      }

      totalCreados = insertedPkgs.length;

      // Registrar kardex para nuevos ingresos
      const newKardexRows = insertedPkgs.map((p) => ({
        paquete_id: p.id,
        codigo_paquete: p.numero_recibo_bodega,
        consignatario: 'Pendiente de datos',
        origen_descripcion: 'INGRESO BODEGA / EXCEL',
        destino_descripcion: `${targetUbicacion} (${finalPosicion})`,
        tipo_movimiento: 'INGRESO_MASIVO_EXCEL',
        motivo: `${motivo} [Nuevo Ingreso Masivo]`,
        usuario_operador: userDisplayName,
        usuario_email: userEmail,
        usuario_id: userId,
        creado_en: nowIso
      }));

      for (let i = 0; i < newKardexRows.length; i += chunkSize) {
        await admin.from('movimientos_kardex').insert(newKardexRows.slice(i, i + chunkSize));
      }
    }

    const totalProcesados = totalActualizados + totalCreados;

    return NextResponse.json({
      success: true,
      totalEnviados: cleanCodes.length,
      totalActualizados,
      totalCreados,
      totalProcesados,
      ubicacionAsignada: finalPosicion,
      mensaje: `✓ Proceso exitoso: Se asignó la ubicación ${finalPosicion} a ${totalProcesados} paquete(s) (${totalActualizados} actualizados, ${totalCreados} nuevos ingresados).`
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno al procesar asignación masiva';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
