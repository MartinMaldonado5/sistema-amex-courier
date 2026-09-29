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
  if (norm.includes('ENTREGADO')) return 'Entregado';
  if (norm.includes('RUTA') || norm.includes('REPARTO')) return 'EnRutaCarroAmex';
  if (norm.includes('RECOJO') || norm.includes('LISTO')) return 'ListoParaRecojo';
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
    const colIndex = {
      wr: headerRow.findIndex((h) => h === 'WR' || h === 'GUIAWR' || h === 'GUIA'),
      tracking: headerRow.findIndex((h) => h.includes('TRACKING')),
      cliente: headerRow.findIndex((h) => h.includes('CLIENTE') || h.includes('CONSIGNATARIO')),
      tipoEmpaque: headerRow.findIndex((h) => h.includes('TIPO') || h.includes('EMPAQUE') || h.includes('PAQUETE')),
      peso: headerRow.findIndex((h) => h.includes('PESO')),
      estado: headerRow.findIndex((h) => h.includes('ESTADO')),
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
      const rawPosicion = colIndex.posicion !== -1 ? String(r[colIndex.posicion] || '').trim() : 'REC-P1';

      parsedRows.push({
        wr: rawWr,
        tracking: rawTracking,
        cliente: rawCliente,
        tipoEmpaque: rawTipo,
        pesoKg,
        estadoEntrega: rawEstado,
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

    // Procesar actualizaciones e inserciones en lotes concurrentes para máxima velocidad
    const CHUNK_SIZE = 15;
    for (let i = 0; i < parsedRows.length; i += CHUNK_SIZE) {
      const chunk = parsedRows.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (item) => {
          const existing = existingMap.get(item.wr);
          const mappedEstado = mapEstadoEntrega(item.estadoEntrega, existing?.ubicacion_actual);

          if (existing) {
            // Actualizar paquete existente
            const updatePayload: Record<string, any> = {
              actualizado_en: new Date().toISOString(),
              eliminado_en: null
            };

            if (item.cliente) updatePayload.nombre_consignatario = item.cliente;
            if (item.tracking) updatePayload.tracking_usa = item.tracking;
            if (item.tipoEmpaque) updatePayload.tipo_empaque = item.tipoEmpaque;
            if (item.pesoKg !== null) updatePayload.peso_kg = item.pesoKg;
            if (mappedEstado) updatePayload.estado_entrega = mappedEstado;

            const { error: updErr } = await admin
              .from('paquetes')
              .update(updatePayload)
              .eq('id', existing.id);

            if (!updErr) {
              updatedCount++;
              detalles.push({
                wr: item.wr,
                cliente: item.cliente,
                tracking: item.tracking,
                peso: item.pesoKg ?? undefined,
                estado: mappedEstado
              });

              kardexEntries.push({
                paquete_id: existing.id,
                codigo_paquete: item.wr,
                consignatario: item.cliente || existing.nombre_consignatario || 'Cliente AMEX',
                origen_descripcion: 'Reportes TIB (Nube)',
                destino_descripcion: `Almacén Lince (${existing.posicion_estante || 'REC'})`,
                tipo_movimiento: 'ACTUALIZACION_TIB',
                motivo: `Cruce automático TIB: ${item.cliente ? 'Cliente actualizado' : ''} ${item.tracking ? 'Tracking asignado' : ''} ${item.pesoKg ? `(${item.pesoKg}kg)` : ''}`.trim(),
                usuario_operador: activeUserName,
                usuario_email: activeUserEmail || null,
                usuario_id: activeUserId
              });
            }
          } else {
            // Insertar nuevo paquete si no existía
            const [ana, pis] = item.posicionWms.includes('-')
              ? item.posicionWms.split('-')
              : ['REC', 'P1'];

            const insertPayload: Record<string, any> = {
              numero_recibo_bodega: item.wr,
              tracking_usa: item.tracking,
              tipo_empaque: item.tipoEmpaque || 'CAJA',
              nombre_consignatario: item.cliente,
              peso_kg: item.pesoKg,
              estado_entrega: mappedEstado,
              ubicacion_actual: 'AmexLince',
              anaquel: ana,
              piso: pis,
              posicion_estante: item.posicionWms || 'REC-P1',
              usuario_email: activeUserEmail || null,
              creado_por: activeUserId,
              eliminado_en: null
            };

            const { data: newPkg, error: insErr } = await admin
              .from('paquetes')
              .insert(insertPayload)
              .select('id')
              .single();

            if (!insErr && newPkg) {
              insertedCount++;
              detalles.push({
                wr: item.wr,
                cliente: item.cliente,
                tracking: item.tracking,
                peso: item.pesoKg ?? undefined,
                estado: mappedEstado
              });

              kardexEntries.push({
                paquete_id: newPkg.id,
                codigo_paquete: item.wr,
                consignatario: item.cliente || 'Cliente AMEX',
                origen_descripcion: 'Ingreso Cruce TIB',
                destino_descripcion: `Almacén Lince (${item.posicionWms})`,
                tipo_movimiento: 'INGRESO_TIB',
                motivo: 'Paquete nuevo registrado automáticamente desde cruce TIB',
                usuario_operador: activeUserName,
                usuario_email: activeUserEmail || null,
                usuario_id: activeUserId
              });
            }
          }
        })
      );
    }

    // Registrar eventos en Kardex de forma robusta
    if (kardexEntries.length > 0) {
      try {
        const { error: kardexErr } = await admin.from('movimientos_kardex').insert(kardexEntries);
        if (kardexErr) {
          // Reintentar sin usuario_id por si hay restricción de clave foránea
          const fallbackEntries = kardexEntries.map((e) => ({ ...e, usuario_id: null }));
          await admin.from('movimientos_kardex').insert(fallbackEntries);
        }
      } catch (e: unknown) {
        console.warn('Advertencia insertando kardex masivo TIB:', e);
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
