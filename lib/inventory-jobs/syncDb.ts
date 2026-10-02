import readXlsxFile from 'read-excel-file/node';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getFileFromR2 } from '@/lib/r2/client';

export interface SyncDbResult {
  ok: boolean;
  totalRows: number;
  updatedCount: number;
  insertedCount: number;
  error?: string;
  detalles?: {
    wr: string;
    cliente?: string;
    tracking?: string;
    peso?: number;
    estado?: string;
  }[];
}

interface ParsedRow {
  wr: string;
  tracking: string;
  cliente: string;
  tipoEmpaque: string;
  pesoKg: number | null;
  estadoEntrega: string;
  estadoAmex?: string;
  posicionWms: string;
}

function normalizeKey(str: string): string {
  return str
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

function mapEstadoEntrega(rawEstado: string, currentUbicacion?: string): string {
  const norm = rawEstado.trim().toUpperCase();
  if (norm.includes('ENTREGADO') || norm.includes('RECOGIDO')) return 'Entregado';
  if (
    norm.includes('RUTA') ||
    norm.includes('REPARTO') ||
    norm.includes('ENVIADO') ||
    norm.includes('TRANSITO') ||
    norm.includes('DESPACHADO')
  ) {
    return 'EnRutaCarroAmex';
  }
  if (norm.includes('RECOJO') || norm.includes('LISTO') || norm.includes('OFICINA')) return 'ListoParaRecojo';
  if (norm.includes('ALMACEN') || norm.includes('RECIBIDO')) return 'EnAlmacen';
  if (currentUbicacion === 'Entregado') return 'Entregado';
  return 'EnAlmacen';
}

/**
 * Sincroniza un archivo Excel de resultado completado directamente en Supabase (tabla paquetes y kardex)
 */
export async function syncCompletedExcelToDatabase(
  bufferOrKey: Buffer | string,
  options?: {
    jobId?: string;
    userEmail?: string;
    userNombre?: string;
    userId?: string;
  }
): Promise<SyncDbResult> {
  try {
    let excelBuffer: Buffer;

    if (typeof bufferOrKey === 'string') {
      // Descargar desde R2
      const r2Response = await getFileFromR2(bufferOrKey);
      if (!r2Response.Body) {
        throw new Error('No se pudo descargar el archivo de resultado desde R2.');
      }
      const byteArray = await r2Response.Body.transformToByteArray();
      excelBuffer = Buffer.from(byteArray);
    } else {
      excelBuffer = bufferOrKey;
    }

    // Leer filas del Excel
    const rawParsed = (await readXlsxFile(excelBuffer)) as any;
    let rows: Array<Array<string | number | boolean | Date | null>> = [];

    if (Array.isArray(rawParsed)) {
      if (rawParsed.length > 0 && rawParsed[0]?.data && Array.isArray(rawParsed[0].data)) {
        rows = rawParsed[0].data;
      } else if (Array.isArray(rawParsed[0])) {
        rows = rawParsed;
      }
    }

    if (!rows || rows.length < 2) {
      return { ok: true, totalRows: 0, updatedCount: 0, insertedCount: 0 };
    }

    // Mapear encabezados
    const headerRow: string[] = (rows[0] || []).map((h) => normalizeKey(String(h || '')));

    // Priorizar columna de estado TIB / Entrega explícita (evitando capturar 'Estado AMEX')
    let estadoTibIdx = headerRow.findIndex((h) => h === 'ESTADOTIB' || h === 'ESTADOENTREGA' || h === 'ESTADODEENTREGA');
    if (estadoTibIdx === -1) {
      estadoTibIdx = headerRow.findIndex((h) => (h.includes('TIB') || h.includes('ENTREGA')) && !h.includes('AMEX'));
    }
    if (estadoTibIdx === -1) {
      estadoTibIdx = headerRow.findIndex((h) => h.includes('ESTADO') && !h.includes('AMEX'));
    }

    const estadoAmexIdx = headerRow.findIndex((h) => h.includes('AMEX'));

    const colIndex = {
      wr: headerRow.findIndex((h) => h === 'WR' || h === 'GUIAWR' || h === 'GUIA'),
      tracking: headerRow.findIndex((h) => h.includes('TRACKING')),
      cliente: headerRow.findIndex((h) => h.includes('CLIENTE') || h.includes('CONSIGNATARIO')),
      tipoEmpaque: headerRow.findIndex((h) => h.includes('TIPO') || h.includes('EMPAQUE') || h.includes('PAQUETE')),
      peso: headerRow.findIndex((h) => h.includes('PESO')),
      estado: estadoTibIdx,
      estadoAmex: estadoAmexIdx,
      posicion: headerRow.findIndex((h) => h.includes('POSICION') || h.includes('ESTANTE') || h.includes('WMS'))
    };

    if (colIndex.wr === -1) {
      throw new Error('El archivo no contiene la columna requerida de WR / Guía.');
    }

    const parsedRows: ParsedRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const rawWr = String(r[colIndex.wr] || '').trim().toUpperCase();
      if (!rawWr || !rawWr.startsWith('WR')) continue;

      const rawTracking = colIndex.tracking !== -1 ? String(r[colIndex.tracking] || '').trim() : '';
      const rawCliente = colIndex.cliente !== -1 ? String(r[colIndex.cliente] || '').trim() : '';
      const rawTipo = colIndex.tipoEmpaque !== -1 ? String(r[colIndex.tipoEmpaque] || '').trim() : 'CAJA';
      const rawPesoVal = colIndex.peso !== -1 ? r[colIndex.peso] : null;
      let pesoKg: number | null = null;
      if (rawPesoVal !== null && rawPesoVal !== undefined && rawPesoVal !== '') {
        const p = Number(rawPesoVal);
        if (!isNaN(p) && p > 0) pesoKg = Number(p.toFixed(2));
      }

      const rawEstado = colIndex.estado !== -1 ? String(r[colIndex.estado] || '').trim() : '';
      const rawEstadoAmex = colIndex.estadoAmex !== -1 ? String(r[colIndex.estadoAmex] || '').trim() : '';
      const rawPosicion = colIndex.posicion !== -1 ? String(r[colIndex.posicion] || '').trim() : 'REC-P1';

      parsedRows.push({
        wr: rawWr,
        tracking: rawTracking,
        cliente: rawCliente,
        tipoEmpaque: rawTipo,
        pesoKg,
        estadoEntrega: rawEstado,
        estadoAmex: rawEstadoAmex,
        posicionWms: rawPosicion
      });
    }

    if (parsedRows.length === 0) {
      return { ok: true, totalRows: 0, updatedCount: 0, insertedCount: 0 };
    }

    const admin = getSupabaseAdmin();

    // Obtener todos los WRs existentes en la base de datos
    const wrList = parsedRows.map(p => p.wr);
    const { data: existingPackages, error: selectErr } = await admin
      .from('paquetes')
      .select('id, numero_recibo_bodega, tracking_usa, nombre_consignatario, tipo_empaque, peso_kg, estado_entrega, ubicacion_actual, posicion_estante')
      .in('numero_recibo_bodega', wrList);

    if (selectErr) {
      throw new Error(`Error consultando paquetes existentes: ${selectErr.message}`);
    }

    const existingMap = new Map<string, any>();
    if (existingPackages) {
      for (const p of existingPackages) {
        existingMap.set(p.numero_recibo_bodega.toUpperCase(), p);
      }
    }

    let updatedCount = 0;
    let insertedCount = 0;
    const kardexEntries: any[] = [];
    const detalles: SyncDbResult['detalles'] = [];

    const activeUserEmail = options?.userEmail || '';
    const activeUserName = options?.userNombre || 'Operador AMEX';
    const activeUserId = options?.userId || null;

    // Procesar en bloques masivos (bulk upsert / bulk insert) para máxima velocidad
    const nowIso = new Date().toISOString();
    const updatesList: Array<{
      item: ParsedRow;
      existing: any;
      mappedEstado: string;
      payload: Record<string, any>;
    }> = [];
    const insertsList: Array<{
      item: ParsedRow;
      mappedEstado: string;
      payload: Record<string, any>;
    }> = [];

    for (const item of parsedRows) {
      const existing = existingMap.get(item.wr);
      const mappedEstado = mapEstadoEntrega(item.estadoEntrega, existing?.ubicacion_actual);

      if (existing) {
        updatesList.push({
          item,
          existing,
          mappedEstado,
          payload: {
            id: existing.id,
            numero_recibo_bodega: existing.numero_recibo_bodega,
            tracking_usa: item.tracking || existing.tracking_usa,
            nombre_consignatario: item.cliente || existing.nombre_consignatario,
            tipo_empaque: item.tipoEmpaque || existing.tipo_empaque || 'CAJA',
            peso_kg: item.pesoKg !== null ? item.pesoKg : existing.peso_kg,
            estado_entrega: mappedEstado || existing.estado_entrega,
            ubicacion_actual: mappedEstado === 'Entregado' ? 'Entregado' : (existing.ubicacion_actual || 'AmexLince'),
            actualizado_en: nowIso,
            eliminado_en: null,
          },
        });
      } else {
        const [ana, pis] = item.posicionWms.includes('-')
          ? item.posicionWms.split('-')
          : ['REC', 'P1'];

        insertsList.push({
          item,
          mappedEstado,
          payload: {
            numero_recibo_bodega: item.wr,
            tracking_usa: item.tracking,
            tipo_empaque: item.tipoEmpaque || 'CAJA',
            nombre_consignatario: item.cliente,
            peso_kg: item.pesoKg,
            estado_entrega: mappedEstado,
            estado_amex: mappedEstado === 'Entregado' ? 'entregado' : (item.estadoAmex?.toLowerCase() || 'recibido'),
            ubicacion_actual: mappedEstado === 'Entregado' ? 'Entregado' : 'AmexLince',
            anaquel: ana,
            piso: pis,
            posicion_estante: item.posicionWms || 'REC-P1',
            usuario_email: activeUserEmail || null,
            creado_por: activeUserId,
            eliminado_en: null,
          },
        });
      }
    }

    // 1. Ejecutar actualizaciones por lotes de 100 con upsert sobre la clave primaria id
    const BULK_CHUNK = 100;
    for (let i = 0; i < updatesList.length; i += BULK_CHUNK) {
      const chunk = updatesList.slice(i, i + BULK_CHUNK);
      const payloads = chunk.map((c) => c.payload);

      const { error: upsertErr } = await admin
        .from('paquetes')
        .upsert(payloads, { onConflict: 'id' });

      if (!upsertErr) {
        updatedCount += chunk.length;
        for (const c of chunk) {
          detalles.push({
            wr: c.item.wr,
            cliente: c.item.cliente,
            tracking: c.item.tracking,
            peso: c.item.pesoKg ?? undefined,
            estado: c.mappedEstado,
          });

          kardexEntries.push({
            paquete_id: c.existing.id,
            codigo_paquete: c.item.wr,
            consignatario: c.item.cliente || c.existing.nombre_consignatario || 'Cliente AMEX',
            origen_descripcion: 'Reportes TIB (Nube)',
            destino_descripcion: `Almacén Lince (${c.existing.posicion_estante || 'REC'})`,
            tipo_movimiento: 'ACTUALIZACION_TIB',
            motivo: `Cruce automático TIB: ${c.item.cliente ? 'Cliente actualizado' : ''} ${c.item.tracking ? 'Tracking asignado' : ''} ${c.item.pesoKg ? `(${c.item.pesoKg}kg)` : ''}`.trim(),
            usuario_operador: activeUserName,
            usuario_email: activeUserEmail || null,
            usuario_id: activeUserId,
          });
        }
      } else {
        console.error('Error en lote de actualización de paquetes, reintentando individualmente:', upsertErr);
        // Fallback resiliente si falla el lote
        for (const c of chunk) {
          const { error: singleErr } = await admin.from('paquetes').update(c.payload).eq('id', c.existing.id);
          if (!singleErr) updatedCount++;
        }
      }
    }

    // 2. Ejecutar inserciones por lotes de 100
    for (let i = 0; i < insertsList.length; i += BULK_CHUNK) {
      const chunk = insertsList.slice(i, i + BULK_CHUNK);
      const payloads = chunk.map((c) => c.payload);

      const { data: insertedData, error: insErr } = await admin
        .from('paquetes')
        .insert(payloads)
        .select('id, numero_recibo_bodega');

      if (!insErr && insertedData) {
        insertedCount += insertedData.length;
        const insertedMap = new Map<string, string>();
        for (const ins of insertedData) {
          insertedMap.set(ins.numero_recibo_bodega.toUpperCase(), ins.id);
        }

        for (const c of chunk) {
          const newId = insertedMap.get(c.item.wr) || '';
          detalles.push({
            wr: c.item.wr,
            cliente: c.item.cliente,
            tracking: c.item.tracking,
            peso: c.item.pesoKg ?? undefined,
            estado: c.mappedEstado,
          });

          kardexEntries.push({
            paquete_id: newId || undefined,
            codigo_paquete: c.item.wr,
            consignatario: c.item.cliente || 'Cliente AMEX',
            origen_descripcion: 'Ingreso Cruce TIB',
            destino_descripcion: `Almacén Lince (${c.item.posicionWms})`,
            tipo_movimiento: 'INGRESO_TIB',
            motivo: 'Paquete nuevo registrado automáticamente desde cruce TIB',
            usuario_operador: activeUserName,
            usuario_email: activeUserEmail || null,
            usuario_id: activeUserId,
          });
        }
      }
    }

    // 3. Registrar eventos en Kardex de forma agrupada
    if (kardexEntries.length > 0) {
      const KARDEX_CHUNK = 200;
      for (let i = 0; i < kardexEntries.length; i += KARDEX_CHUNK) {
        const kChunk = kardexEntries.slice(i, i + KARDEX_CHUNK);
        try {
          const { error: kardexErr } = await admin.from('movimientos_kardex').insert(kChunk);
          if (kardexErr) {
            const fallbackEntries = kChunk.map((e) => ({ ...e, usuario_id: null }));
            await admin.from('movimientos_kardex').insert(fallbackEntries);
          }
        } catch (e: unknown) {
          console.warn('Advertencia insertando kardex masivo TIB:', e);
        }
      }
    }

    // Actualizar metadata del job si se proporcionó jobId
    if (options?.jobId) {
      try {
        await admin
          .from('inventario_jobs')
          .update({
            db_sincronizado: true,
            db_actualizados: updatedCount + insertedCount,
            db_sincronizado_en: new Date().toISOString()
          })
          .eq('id', options.jobId);
      } catch (e: unknown) {
        console.warn('Advertencia actualizando inventario_jobs:', e);
      }
    }

    return {
      ok: true,
      totalRows: parsedRows.length,
      updatedCount,
      insertedCount,
      detalles: detalles.slice(0, 50)
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al sincronizar datos a la base de datos.';
    console.error('Error en syncCompletedExcelToDatabase:', err);
    return {
      ok: false,
      totalRows: 0,
      updatedCount: 0,
      insertedCount: 0,
      error: message
    };
  }
}
