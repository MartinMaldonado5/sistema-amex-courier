import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/guards';
import { BatchSyncScannerSchema } from '@/lib/validations/scanner.schema';
import { validateBody } from '@/lib/api/validate';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/security/rateLimit';
import { withErrorHandler } from '@/lib/api/handler';
import { logger } from '@/lib/logger';

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

  // 3. INTENTO PRIMARIO: Ejecución atómica ACID vía Stored Procedure PostgreSQL
  try {
    const { data: rpcResult, error: rpcError } = await admin.rpc('sync_scanner_batch_v2', {
      p_items: items,
      p_operador_nombre: activeOperatorName,
      p_operador_email: activeOperatorEmail,
      p_operador_id: activeOperatorId,
    });

    if (!rpcError && rpcResult && (rpcResult as { success?: boolean }).success) {
      const typedResult = rpcResult as {
        success: boolean;
        synced_ids?: string[];
        updated_count?: number;
        inserted_count?: number;
      };
      const elapsedMs = Date.now() - startTime;
      scannerLogger.info(`Lote de escáner procesado transaccionalmente por RPC en ${elapsedMs}ms`, {
        totalItems: items.length,
        syncedCount: typedResult.synced_ids?.length || 0,
        updatedCount: typedResult.updated_count || 0,
        insertedCount: typedResult.inserted_count || 0,
        elapsedMs,
      });

      return NextResponse.json({
        success: true,
        totalReceived: items.length,
        syncedCount: typedResult.synced_ids?.length || 0,
        updatedCount: typedResult.updated_count || 0,
        insertedCount: typedResult.inserted_count || 0,
        syncedIds: typedResult.synced_ids || [],
        elapsedMs,
        message: `¡Éxito! ${typedResult.synced_ids?.length || 0} lectura(s) sincronizadas transaccionalmente en ${elapsedMs}ms.`,
      });
    }

    if (rpcError) {
      scannerLogger.warn('RPC devolvió error o no disponible, usando fallback batch:', { details: rpcError.message }, rpcError);
    }
  } catch (rpcEx) {
    scannerLogger.warn('Excepción invocando RPC transaccional, usando fallback batch:', { error: String(rpcEx) }, rpcEx);
  }

  // 4. FALLBACK: Búsqueda masiva en Supabase (1 sola consulta SQL para todo el lote)
  const uniqueCodes = Array.from(new Set(items.map((it) => it.code.trim().toUpperCase())));
  if (uniqueCodes.length === 0) {
    return NextResponse.json({ error: 'No se encontraron códigos válidos en el lote.' }, { status: 400 });
  }

  // Construir condición OR segura con .in
  const escapedCodes = uniqueCodes.map((c) => `"${c.replace(/"/g, '')}"`).join(',');
  const { data: existingPackages, error: selectError } = await admin
    .from('paquetes')
    .select('id, numero_recibo_bodega, tracking, nombre_consignatario, ubicacion_actual, posicion_estante, anaquel, piso')
    .or(`numero_recibo_bodega.in.(${escapedCodes}),tracking.in.(${escapedCodes})`);

  if (selectError) {
    scannerLogger.error('Error buscando paquetes existentes para el lote de escáner', selectError);
    return NextResponse.json(
      { error: 'Error consultando base de datos para el lote.', details: selectError.message },
      { status: 500 }
    );
  }

  // Diccionario rápido de búsqueda
  const packageMap = new Map<string, {
    id: string;
    numero_recibo_bodega: string;
    tracking?: string;
    nombre_consignatario?: string;
    ubicacion_actual?: string;
    posicion_estante?: string;
  }>();

  for (const pkg of (existingPackages as any[]) || []) {
    if (pkg.numero_recibo_bodega) {
      packageMap.set(pkg.numero_recibo_bodega.trim().toUpperCase(), pkg);
    }
    const trk = pkg.tracking || pkg.tracking_usa;
    if (trk) {
      packageMap.set(String(trk).trim().toUpperCase(), pkg);
    }
  }

  // 5. Separar items a actualizar vs items a insertar
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

  const resolvedItems: PkgResolve[] = [];
  const toInsertList: Record<string, unknown>[] = [];
  const toUpdateList: { id: string; fields: Record<string, unknown> }[] = [];

  const nowIso = new Date().toISOString();

  // Deduplicación en el mismo lote para evitar insertar dos veces el mismo código nuevo
  const insertedInThisBatch = new Set<string>();

  for (const log of items) {
    const upper = log.code.trim().toUpperCase();
    const loc = log.location || (log.anaquel && log.piso ? `${log.anaquel}-${log.piso}` : 'REC');
    const [ana, pis] = loc.includes('-') ? loc.split('-') : [loc, 'P1'];
    const consignatario = log.nombreConsignatario || '';

    const matchedPkg = packageMap.get(upper);

    if (matchedPkg) {
      resolvedItems.push({
        logId: log.id,
        code: upper,
        format: log.format || 'CODE_128',
        workflow: log.workflow || 'slotting',
        location: loc,
        anaquel: ana,
        piso: pis,
        consignatario: consignatario || matchedPkg.nombre_consignatario || '',
        pkgId: matchedPkg.id,
        isNew: false,
      });

      toUpdateList.push({
        id: matchedPkg.id,
        fields: {
          anaquel: ana,
          piso: pis,
          posicion_estante: loc,
          ubicacion_actual: 'AmexLince',
          estado_amex: (log as any).estadoAmex || 'recibido',
          ...(activeOperatorEmail ? { usuario_email: activeOperatorEmail } : {}),
          eliminado_en: null,
          motivo_eliminacion: null,
          eliminado_por: null,
          actualizado_en: nowIso,
        },
      });
    } else {
      // Es un paquete nuevo
      const newWr = upper.startsWith('WR') ? upper : `WR${upper.slice(-6)}`;

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
          piso: pis,
          posicion_estante: loc,
          estado_amex: (log as any).estadoAmex || 'recibido',
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
        location: loc,
        anaquel: ana,
        piso: pis,
        consignatario,
        isNew: true,
      });
    }
  }

  let updatedCount = 0;
  let insertedCount = 0;

  // 6. Ejecutar inserción masiva de paquetes nuevos (si hay)
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

  // 7. Ejecutar actualizaciones concurrentes en el servidor
  if (toUpdateList.length > 0) {
    const updatePromises = toUpdateList.map(({ id, fields }) =>
      admin.from('paquetes').update(fields).eq('id', id)
    );

    const updateResults = await Promise.allSettled(updatePromises);
    for (const res of updateResults) {
      if (res.status === 'fulfilled' && !res.value.error) {
        updatedCount++;
      } else if (res.status === 'rejected' || (res.status === 'fulfilled' && res.value.error)) {
        scannerLogger.warn('Fallo actualizando un paquete individual en lote:', { status: res.status });
      }
    }
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

  // Ejecución en paralelo de las 3 tablas de auditoría
  const [trazRes, kardexRes, logRes] = await Promise.all([
    trazabilidadBatch.length > 0 ? admin.from('historial_trazabilidad').insert(trazabilidadBatch) : Promise.resolve({ error: null }),
    kardexBatch.length > 0 ? admin.from('movimientos_kardex').insert(kardexBatch) : Promise.resolve({ error: null }),
    escaneosLogBatch.length > 0 ? admin.from('escaneos_log').insert(escaneosLogBatch) : Promise.resolve({ error: null }),
  ]);

  if (trazRes.error) scannerLogger.warn('Error insertando historial de trazabilidad en lote', { details: trazRes.error.message }, trazRes.error);
  if (kardexRes.error) scannerLogger.warn('Error insertando kardex en lote', { details: kardexRes.error.message }, kardexRes.error);
  if (logRes.error) scannerLogger.warn('Error insertando escaneos_log en lote', { details: logRes.error.message }, logRes.error);

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
