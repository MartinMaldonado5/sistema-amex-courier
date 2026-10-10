import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/guards';
import { BatchSyncScannerSchema } from '@/lib/validations/scanner.schema';
import { validateBody } from '@/lib/api/validate';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/security/rateLimit';
import { withErrorHandler } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
import { isValidWr, smartFormatWr } from '@/lib/validations/wr';

const scannerLogger = logger.child('scanner-batch-sync');

// Validador de formato UUID v4
function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * POST /api/scanner/batch-sync
 * Procesa masivamente un lote de paquetes escaneados (hasta 100 por petición)
 * de forma atómica y ultrarrápida en el servidor.
 */
async function handleBatchSync(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  // 1. Rate limiting: máx 60 lotes por minuto por IP
  const rateCheck = checkRateLimit(req, {
    prefix: 'scanner-batch-sync',
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!rateCheck.allowed) {
    return rateLimitExceededResponse(rateCheck.resetAt);
  }

  // 2. Validación de esquema con Zod
  const validation = await validateBody(BatchSyncScannerSchema, req);
  if (!validation.ok) {
    return validation.response;
  }

  const { items, operadorNombre, operadorEmail, operadorId } = validation.data;
  let user = await getAuthenticatedUser();

  // Soporte para Bearer token en headers
  if (!user) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const adminAuth = getSupabaseAdmin();
        const { data: tokenUserData } = await adminAuth.auth.getUser(token);
        if (tokenUserData?.user) {
          user = tokenUserData.user;
        }
      } catch (err) {
        scannerLogger.warn('Error verificando Bearer token en batch-sync', { error: String(err) }, err);
      }
    }
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const isServiceRole = Boolean(
    serviceKey &&
    (req.headers.get('x-amex-service-role') === serviceKey ||
     req.headers.get('apikey') === serviceKey)
  );

  // Si no está autenticado en producción, rechazar
  const isDev = process.env.NODE_ENV === 'development' || process.env.AMEX_ALLOW_DEV_LOGIN === 'true';
  if (!user && !isServiceRole && !isDev) {
    return NextResponse.json({ error: 'No autenticado. Inicie sesión para sincronizar.' }, { status: 401 });
  }

  // Determinar datos de usuario auditables
  const activeOperatorName = operadorNombre || user?.user_metadata?.nombre || user?.email || 'Operador Logístico AMEX';
  const activeOperatorEmail = operadorEmail || user?.email || null;
  const rawUserId = user?.id || operadorId;
  const activeOperatorId = isValidUuid(rawUserId) ? rawUserId : null;

  const admin = getSupabaseAdmin();

  // 3. Búsqueda masiva indexada en paralelo (Técnica Módulo 6.5)
  const uniqueCodes = Array.from(new Set(items.map((it) => it.code.trim().toUpperCase())));
  if (uniqueCodes.length === 0) {
    return NextResponse.json({ error: 'No se encontraron códigos válidos en el lote.' }, { status: 400 });
  }

  const [byWr, byTrk] = await Promise.all([
    admin
      .from('paquetes')
      .select('id, numero_recibo_bodega, tracking, nombre_consignatario, ubicacion_actual, posicion_estante, anaquel, piso, estado_amex')
      .in('numero_recibo_bodega', uniqueCodes),
    admin
      .from('paquetes')
      .select('id, numero_recibo_bodega, tracking, nombre_consignatario, ubicacion_actual, posicion_estante, anaquel, piso, estado_amex')
      .in('tracking', uniqueCodes),
  ]);

  if (byWr.error) {
    scannerLogger.error('Error buscando paquetes por numero_recibo_bodega en lote', byWr.error);
    return NextResponse.json(
      { error: 'Error consultando base de datos para el lote.', details: byWr.error.message },
      { status: 500 }
    );
  }
  if (byTrk.error) {
    scannerLogger.error('Error buscando paquetes por tracking en lote', byTrk.error);
    return NextResponse.json(
      { error: 'Error consultando base de datos para el lote.', details: byTrk.error.message },
      { status: 500 }
    );
  }

  // Diccionario rápido O(1) de búsqueda
  const packageMap = new Map<string, {
    id: string;
    numero_recibo_bodega: string;
    tracking?: string;
    nombre_consignatario?: string;
    ubicacion_actual?: string;
    posicion_estante?: string;
  }>();

  for (const pkg of [...(byWr.data || []), ...(byTrk.data || [])]) {
    if (pkg.numero_recibo_bodega) {
      packageMap.set(pkg.numero_recibo_bodega.trim().toUpperCase(), pkg);
    }
    const trk = (pkg as any).tracking || (pkg as any).tracking_usa;
    if (trk) {
      packageMap.set(String(trk).trim().toUpperCase(), pkg);
    }
  }

  // 4. Separar items a actualizar (agrupados para batch .in) vs items a insertar
  interface PkgResolve {
    logId: string;
    code: string;
    format: string;
    workflow: string;
    location: string;
    anaquel: string;
    piso: string;
    consignatario: string;
    pkgId?: string;
    isNew: boolean;
  }

  interface UpdateGroup {
    fields: {
      anaquel: string;
      piso: string | null;
      posicion_estante: string;
      ubicacion_actual: string;
      estado_amex: string;
      usuario_email?: string;
      eliminado_en: null;
      motivo_eliminacion: null;
      eliminado_por: null;
      actualizado_en: string;
    };
    ids: Set<string>;
  }

  const resolvedItems: PkgResolve[] = [];
  const toInsertList: Record<string, unknown>[] = [];
  const updateGroups = new Map<string, UpdateGroup>();

  const nowIso = new Date().toISOString();

  // Deduplicación en el mismo lote para evitar insertar dos veces el mismo código nuevo
  const insertedInThisBatch = new Set<string>();

  for (const log of items) {
    const upper = log.code.trim().toUpperCase();
    const loc = log.location || (log.anaquel && log.piso ? `${log.anaquel}-${log.piso}` : 'REC');
    const [ana, pis] = loc.includes('-') ? loc.split('-') : [loc, 'P1'];
    const consignatario = log.nombreConsignatario || '';

    const isLevelLess =
      ana === 'OFI' ||
      ana === 'DSP-Z1' ||
      ana === 'DSP-Z2' ||
      ana === 'TRANSITO' ||
      ana === 'REC' ||
      ana === 'DSP';

    const finalPiso = isLevelLess ? null : pis;
    const finalPosicion = isLevelLess ? ana : loc;
    const estadoAmex = (log as any).estadoAmex || 'en_almacen';

    const matchedPkg = packageMap.get(upper);

    if (matchedPkg) {
      resolvedItems.push({
        logId: log.id,
        code: upper,
        format: log.format || 'CODE_128',
        workflow: log.workflow || 'slotting',
        location: finalPosicion,
        anaquel: ana,
        piso: finalPiso || 'P1',
        consignatario: consignatario || matchedPkg.nombre_consignatario || '',
        pkgId: matchedPkg.id,
        isNew: false,
      });

      // Agrupación de actualización por misma ubicación y estado (Técnica .in('id', ids))
      const groupKey = `${ana}::${finalPiso ?? ''}::${finalPosicion}::${estadoAmex}`;
      if (!updateGroups.has(groupKey)) {
        updateGroups.set(groupKey, {
          fields: {
            anaquel: ana,
            piso: finalPiso,
            posicion_estante: finalPosicion,
            ubicacion_actual: 'AmexLince',
            estado_amex: estadoAmex,
            ...(activeOperatorEmail ? { usuario_email: activeOperatorEmail } : {}),
            eliminado_en: null,
            motivo_eliminacion: null,
            eliminado_por: null,
            actualizado_en: nowIso,
          },
          ids: new Set<string>(),
        });
      }
      updateGroups.get(groupKey)!.ids.add(matchedPkg.id);
    } else {
      // Es un paquete nuevo - Garantizar regla estricta de 11 caracteres WR
      let newWr = smartFormatWr(upper);
      if (!isValidWr(newWr)) {
        const digitsOnly = upper.replace(/\D/g, '');
        const paddedDigits = (digitsOnly.length >= 9 ? digitsOnly.slice(-9) : digitsOnly).padStart(9, '0');
        newWr = `WR${paddedDigits}`;
      }

      if (!insertedInThisBatch.has(newWr)) {
        insertedInThisBatch.add(newWr);
        toInsertList.push({
          numero_recibo_bodega: newWr,
          tracking: upper.startsWith('WR') ? '' : upper,
          tipo_empaque: 'Paquete',
          dni_consignatario: '',
          nombre_consignatario: consignatario,
          descripcion: 'Mercadería ingresada por Escáner',
          peso_kg: null,
          ubicacion_actual: 'AmexLince',
          anaquel: ana,
          piso: finalPiso,
          posicion_estante: finalPosicion,
          estado_amex: estadoAmex,
          usuario_email: activeOperatorEmail,
          creado_por: activeOperatorId,
          eliminado_en: null,
          creado_en: nowIso,
        });
      }

      resolvedItems.push({
        logId: log.id,
        code: newWr,
        format: log.format || 'CODE_128',
        workflow: log.workflow || 'slotting',
        location: finalPosicion,
        anaquel: ana,
        piso: finalPiso || 'P1',
        consignatario,
        isNew: true,
      });
    }
  }

  let updatedCount = 0;
  let insertedCount = 0;

  // 5. Inserción masiva de paquetes nuevos (si hay)
  if (toInsertList.length > 0) {
    const { data: createdPkgs, error: insertError } = await admin
      .from('paquetes')
      .insert(toInsertList)
      .select('id, numero_recibo_bodega, tracking');

    if (insertError) {
      scannerLogger.error('Error insertando nuevos paquetes en lote', insertError);
      return NextResponse.json(
        { error: 'Error al registrar nuevos paquetes.', details: insertError.message },
        { status: 500 }
      );
    }

    if (createdPkgs) {
      insertedCount = createdPkgs.length;
      for (const created of createdPkgs) {
        const wrUpper = (created.numero_recibo_bodega || '').toUpperCase();
        const trkUpper = ((created as any).tracking || (created as any).tracking_usa || '').toUpperCase();
        for (const item of resolvedItems) {
          if (item.isNew && (item.code === wrUpper || (trkUpper && item.code === trkUpper))) {
            item.pkgId = created.id;
          }
        }
      }
    }
  }

  // 6. Actualización masiva ultrarrápida vía .in('id', ids) (Técnica Módulo 6.5)
  if (updateGroups.size > 0) {
    const updatePromises = Array.from(updateGroups.values()).map(async (group) => {
      const idList = Array.from(group.ids);
      if (idList.length === 0) return 0;

      const { error: updErr } = await admin
        .from('paquetes')
        .update(group.fields)
        .in('id', idList);

      if (updErr) {
        scannerLogger.error('Error actualizando lote agrupado con .in(id, ids):', updErr);
        throw updErr;
      }
      return idList.length;
    });

    const updateResults = await Promise.all(updatePromises);
    updatedCount = updateResults.reduce((acc, count) => acc + count, 0);
  }

  // 8. Inserciones masivas en tablas de auditoría (1 sola llamada por tabla)
  const validResolved = resolvedItems.filter((it) => Boolean(it.pkgId));

  // Trazabilidad
  const trazabilidadBatch = validResolved.map((it) => ({
    paquete_id: it.pkgId,
    ubicacion: it.location,
    descripcion_evento: it.isNew
      ? `Ingreso por escáner a estante: ${it.location}`
      : `Escaneado confirmado y clasificado a estante: ${it.location}`,
    usuario_operador: activeOperatorName,
    fecha_hora: nowIso,
  }));

  // Kardex
  const kardexBatch = validResolved.map((it) => ({
    paquete_id: it.pkgId,
    codigo_paquete: it.code,
    consignatario: it.consignatario || 'Cliente AMEX',
    origen_descripcion: it.isNew ? 'Recepción Escáner' : 'Almacén Central',
    destino_descripcion: `AmexLince (${it.location})`,
    tipo_movimiento: 'SLOTTING',
    motivo: `Clasificación y Slotting Escáner a estante ${it.location}`,
    usuario_operador: activeOperatorName,
    usuario_email: activeOperatorEmail,
    usuario_id: activeOperatorId,
    creado_en: nowIso,
  }));

  // Escaneos Log
  const escaneosLogBatch = validResolved.map((it) => ({
    codigo: it.code,
    paquete_id: it.pkgId,
    formato: it.format,
    modo_workflow: it.workflow,
    ubicacion: it.location,
    operador: activeOperatorName,
    operador_email: activeOperatorEmail,
    usuario_id: activeOperatorId,
    creado_en: nowIso,
  }));

  // Helper para insertar auditoría en bloques seguros sin desbordar PostgREST
  async function insertAuditChunks(table: string, rows: Record<string, unknown>[], chunkSize = 100) {
    if (rows.length === 0) return { error: null };
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const res = await admin.from(table).insert(chunk);
      if (res.error) return res;
    }
    return { error: null };
  }

  // Ejecución en paralelo de las 3 tablas de auditoría
  const [trazRes, kardexRes, logRes] = await Promise.all([
    insertAuditChunks('historial_trazabilidad', trazabilidadBatch),
    insertAuditChunks('movimientos_kardex', kardexBatch),
    insertAuditChunks('escaneos_log', escaneosLogBatch),
  ]);

  if (trazRes.error) scannerLogger.warn('Error insertando historial de trazabilidad en lote', { details: (trazRes.error as any).message }, trazRes.error);
  if (kardexRes.error) scannerLogger.warn('Error insertando kardex en lote', { details: (kardexRes.error as any).message }, kardexRes.error);
  if (logRes.error) scannerLogger.warn('Error insertando escaneos_log en lote', { details: (logRes.error as any).message }, logRes.error);

  const elapsedMs = Date.now() - startTime;
  const syncedIds = validResolved.map((it) => it.logId);

  scannerLogger.info(`Lote de escáner procesado exitosamente en ${elapsedMs}ms`, {
    totalItems: items.length,
    syncedCount: syncedIds.length,
    updatedCount,
    insertedCount,
    elapsedMs,
  });

  return NextResponse.json({
    success: true,
    totalReceived: items.length,
    syncedCount: syncedIds.length,
    updatedCount,
    insertedCount,
    syncedIds,
    elapsedMs,
    message: `¡Éxito! ${syncedIds.length} lectura(s) sincronizadas (${updatedCount} actualizadas, ${insertedCount} nuevas) en ${elapsedMs}ms.`,
  });
}

export const POST = withErrorHandler(handleBatchSync, 'api-scanner-batch-sync');
