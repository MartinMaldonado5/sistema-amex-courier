import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import readXlsxFile from 'read-excel-file/node';
import { getR2Client, R2_BUCKET_NAME, R2_ROOT_FOLDER } from '@/lib/r2/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MAX_FILAS = 5000;

interface TibItem {
  tracking: string;
  cliente: string;
  tipo: string;
  peso: number | null;
}

export interface FilaCruzarInput {
  filaOriginal?: number;
  rawWr: string;
  wrs: string[];
  delimiter?: string;
  esMultiWr?: boolean;
  consignatario?: string;
  observaciones?: string;
  descripcion?: string;
  valorDeclarado?: number | null;
  dni?: string;
}

export interface FilaResultadoCobro {
  filaOriginal: number;
  /** El código WR original o combinado (ej: "WR000468049-WR000467966") */
  wr: string;
  /** Los WRs individuales */
  wrs: string[];
  esMultiWr: boolean;
  delimiter: string;
  /** Nombre del cliente oficial (del TIB o consignatario del instructivo) */
  cliente: string;
  /** Peso en texto formateado para la celda de Excel (ej: "3.98 - 2.22" o "2.50") */
  pesoFormateado: string;
  /** Suma numérica total de los pesos (para totales y estadísticas) */
  pesoTotal: number | null;
  /** Tracking o trackings combinados con el delimitador (ej: "YCE78A3 - YCE78A6") */
  tracking: string;
  /** Tipo de paquete (ej: "CAJA") */
  tipo: string;
  /** Casillero / código cliente u observaciones */
  observaciones: string;
  /** Descripción del instructivo */
  descripcion: string;
  /** Documento de identidad */
  dni: string;
  /** True si todos los WRs de la fila fueron encontrados */
  encontrado: boolean;
  /** True si solo algunos WRs de la fila se encontraron */
  matchParcial: boolean;
  wrsEncontrados: number;
  totalWrsFila: number;
  /** Detalle individual por cada WR dentro de la celda */
  detalles: Array<TibItem & { wr: string; encontrado: boolean }>;
}

function limpiar(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = String(v).trim();
  if (s.startsWith("'")) s = s.slice(1).trim();
  return s;
}

function aNumero(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v * 100) / 100;
  const n = parseFloat(limpiar(v).replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function esKeyValida(key: string): boolean {
  return (
    key.length > 0 &&
    key.toLowerCase().endsWith('.xlsx') &&
    !key.includes('\0') &&
    !key.split('/').some((s) => s === '..')
  );
}

function indiceKeyPara(enviadoKey: string): string {
  const hash = createHash('sha1').update(enviadoKey).digest('hex').slice(0, 16);
  return `${R2_ROOT_FOLDER}/inventario-jobs/cobros-indices/${hash}.json`;
}

/**
 * Busca la clave del ENVIADO TIB más reciente:
 * 1. Primero en inventario_tib_diario (si se subió como archivo del día)
 * 2. Segundo en inventario_jobs (del módulo 13)
 */
async function resolverUltimoEnviadoKey(): Promise<string | null> {
  const admin = getSupabaseAdmin();

  // 1. Buscar en inventario_tib_diario
  const { data: tibDiario } = await admin
    .from('inventario_tib_diario')
    .select('r2_key,fecha,subido_en')
    .eq('tipo', 'sent')
    .eq('es_activo', true)
    .order('fecha', { ascending: false })
    .order('subido_en', { ascending: false })
    .limit(1);

  if (tibDiario && tibDiario.length > 0 && tibDiario[0].r2_key) {
    return tibDiario[0].r2_key;
  }

  // 2. Buscar en inventario_jobs
  const { data: jobs } = await admin
    .from('inventario_jobs')
    .select('enviado_key,fuentes,creado_en')
    .not('enviado_key', 'is', null)
    .order('creado_en', { ascending: false })
    .limit(20);

  const hit = (jobs || []).find(
    (j) => Array.isArray((j as { fuentes?: unknown }).fuentes) && ((j as { fuentes: string[] }).fuentes.includes('sent'))
  ) as { enviado_key: string } | undefined;

  return hit?.enviado_key || null;
}

async function leerIndice(client: ReturnType<typeof getR2Client>, key: string): Promise<Record<string, TibItem> | null> {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return JSON.parse(Buffer.from(bytes).toString('utf-8')) as Record<string, TibItem>;
  } catch {
    return null;
  }
}

async function construirIndiceDesdeEnviado(
  client: ReturnType<typeof getR2Client>,
  enviadoKey: string
): Promise<Record<string, TibItem>> {
  const res = await client.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: enviadoKey }));
  if (!res.Body) throw new Error('No se pudo descargar el archivo ENVIADO TIB desde R2.');
  const bytes = await res.Body.transformToByteArray();
  const buffer = Buffer.from(bytes);

  // Columnas ENVIADO TIB: A=WR B=Tracking C=Cliente D=Tipo Paquete E=Peso
  const sheetResult = await readXlsxFile(buffer);
  const rows = (sheetResult[0]?.data || sheetResult) as unknown as unknown[][];
  const indice: Record<string, TibItem> = {};

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const wr = limpiar(r[0]).toUpperCase();
    if (!wr) continue;
    if (!indice[wr]) {
      indice[wr] = {
        tracking: limpiar(r[1]),
        cliente: limpiar(r[2]),
        tipo: limpiar(r[3]),
        peso: aNumero(r[4]),
      };
    }
  }
  return indice;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await req.json().catch(() => ({}));
    const rawFilas: FilaCruzarInput[] = Array.isArray(body.filas) ? body.filas : [];
    const rawWrs: string[] = Array.isArray(body.wrs) ? body.wrs : [];

    if (rawFilas.length === 0 && rawWrs.length === 0) {
      return NextResponse.json(
        { error: 'Envía las filas del instructivo (filas) o la lista de WRs (wrs).' },
        { status: 400 }
      );
    }

    if (rawFilas.length > MAX_FILAS || rawWrs.length > MAX_FILAS) {
      return NextResponse.json({ error: `Máximo ${MAX_FILAS} registros por cruce.` }, { status: 400 });
    }

    // Normalizar a lista de filas si enviaron formato plano legacy (wrs: string[])
    const filasInput: FilaCruzarInput[] = rawFilas.length > 0
      ? rawFilas
      : rawWrs.map((w, idx) => ({
          filaOriginal: idx + 1,
          rawWr: w,
          wrs: [w],
          delimiter: ' - ',
          esMultiWr: false,
        }));

    // 1. PRIORIDAD: Delegar procesamiento al VPS de Hostinger (donde viven los TIBs en SSD local permanente)
    const vpsHost = process.env.VPS_HOST || '2.25.89.222';
    const workerPort = process.env.WORKER_PORT || '10000';
    const workerUrl = process.env.WORKER_URL || process.env.INVENTORY_WORKER_URL || process.env.RENDER_WORKER_URL || `http://${vpsHost}:${workerPort}`;

    if (workerUrl && !body.forzar_local) {
      try {
        const vpsRes = await fetch(`${workerUrl.replace(/\/+$/, '')}/cruzar-cobros`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filas: filasInput,
            fuente: body.fuente || 'sent',
            includeFallbacks: true,
          }),
          signal: AbortSignal.timeout(45000),
        });

        if (vpsRes.ok) {
          const vpsData = await vpsRes.json();
          if (vpsData && vpsData.ok && Array.isArray(vpsData.filasCruzadas)) {
            console.log(`[Cruzar Planilla] Cruce completado en VPS Hostinger en ${vpsData.duracionMs}ms (${vpsData.coincidenciasCompletas}/${vpsData.totalFilas} filas)`);
            return NextResponse.json({
              vps_procesado: true,
              duracion_ms: vpsData.duracionMs,
              fuente_usada: vpsData.fuenteUsada,
              total_filas: vpsData.totalFilas,
              total_wrs: vpsData.filasCruzadas.reduce((acc: number, f: any) => acc + (f.totalWrsFila || 1), 0),
              wrs_encontrados: vpsData.filasCruzadas.reduce((acc: number, f: any) => acc + (f.wrsEncontrados || 0), 0),
              sin_match: vpsData.filasCruzadas.filter((f: any) => !f.encontrado).map((f: any) => f.wr),
              filas: vpsData.filasCruzadas,
            });
          }
        } else {
          console.warn(`[Cruzar Planilla] VPS respondió status ${vpsRes.status}. Usando fallback R2...`);
        }
      } catch (vpsErr: any) {
        console.warn(`[Cruzar Planilla] VPS no disponible (${vpsErr.message}). Usando fallback R2...`);
      }
    }

    let enviadoKey = String(body.enviado_key || '').trim();
    if (!enviadoKey) {
      const ultimo = await resolverUltimoEnviadoKey();
      if (!ultimo) {
        return NextResponse.json(
          { error: 'No se encontró ningún archivo ENVIADO TIB en el sistema. Por favor cárgalo primero en el módulo de Inventario.' },
          { status: 404 }
        );
      }
      enviadoKey = ultimo;
    }

    if (!esKeyValida(enviadoKey)) {
      return NextResponse.json({ error: 'Clave de archivo ENVIADO inválida.' }, { status: 400 });
    }

    const client = getR2Client();
    const indiceKey = indiceKeyPara(enviadoKey);

    let indice = await leerIndice(client, indiceKey);
    let indiceCacheado = true;

    if (!indice) {
      indiceCacheado = false;
      indice = await construirIndiceDesdeEnviado(client, enviadoKey);
      // Guardar caché en R2 para que los siguientes cruces sean instantáneos (< 200 ms)
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: indiceKey,
            Body: Buffer.from(JSON.stringify(indice)),
            ContentType: 'application/json',
          })
        );
      } catch (cacheErr) {
        console.warn('[Cruzar Planilla] No se pudo guardar el índice en caché:', cacheErr);
      }
    }

    // Cruce fila por fila manteniendo celdas multi-WR agrupadas
    const filasResultado: FilaResultadoCobro[] = [];
    const sinMatch: string[] = [];
    let totalWrsEncontrados = 0;
    let totalWrsBuscados = 0;

    for (let i = 0; i < filasInput.length; i++) {
      const f = filasInput[i];
      const delimiter = f.delimiter || (f.rawWr.includes('/') ? ' / ' : ' - ');
      const wrsTokens = (f.wrs && f.wrs.length > 0)
        ? f.wrs.map(w => limpiar(w).toUpperCase()).filter(Boolean)
        : (f.rawWr.toUpperCase().match(/WR\d+/gi) || []);

      totalWrsBuscados += wrsTokens.length;

      const detalles: Array<TibItem & { wr: string; encontrado: boolean }> = [];
      const pesosValidos: number[] = [];
      const pesosTextos: string[] = [];
      const trackingsTextos: string[] = [];
      const tiposSet = new Set<string>();
      let clienteNombre = '';

      for (const wr of wrsTokens) {
        const hit = indice[wr];
        if (hit) {
          totalWrsEncontrados++;
          detalles.push({ wr, tracking: hit.tracking, cliente: hit.cliente, tipo: hit.tipo, peso: hit.peso, encontrado: true });
          if (hit.peso !== null) {
            pesosValidos.push(hit.peso);
            pesosTextos.push(hit.peso.toFixed(2));
          } else {
            pesosTextos.push('—');
          }
          if (hit.tracking) trackingsTextos.push(hit.tracking);
          if (hit.tipo) tiposSet.add(hit.tipo);
          if (!clienteNombre && hit.cliente) clienteNombre = hit.cliente;
        } else {
          sinMatch.push(wr);
          detalles.push({ wr, tracking: '', cliente: '', tipo: '', peso: null, encontrado: false });
          pesosTextos.push('?');
        }
      }

      const wrsEncontrados = detalles.filter(d => d.encontrado).length;
      const encontrado = wrsEncontrados === wrsTokens.length && wrsTokens.length > 0;
      const matchParcial = wrsEncontrados > 0 && wrsEncontrados < wrsTokens.length;

      // Si es multi-WR, combinar los nombres individuales con el delimitador
      const nombresClientes = detalles.map((d) => d.cliente || f.consignatario || 'SIN CLIENTE');
      clienteNombre = wrsTokens.length > 1
        ? nombresClientes.join(delimiter)
        : (nombresClientes[0] || f.consignatario || 'SIN CLIENTE');

      // Formatear pesos con el delimitador original (ej: "3.98 - 2.22")
      const pesoFormateado = pesosTextos.join(delimiter);
      const pesoTotal = pesosValidos.length > 0
        ? Math.round(pesosValidos.reduce((a, b) => a + b, 0) * 100) / 100
        : null;

      // Formatear trackings con el delimitador original (ej: "YCE78A3 - YCE78A6")
      const tracking = trackingsTextos.join(delimiter);

      // Tipo de paquete consolidado
      const tipo = tiposSet.size > 0 ? Array.from(tiposSet).join(' / ') : 'CAJA';

      filasResultado.push({
        filaOriginal: f.filaOriginal || i + 1,
        wr: f.rawWr,
        wrs: wrsTokens,
        esMultiWr: wrsTokens.length > 1,
        delimiter,
        cliente: clienteNombre.toUpperCase(),
        pesoFormateado,
        pesoTotal,
        tracking,
        tipo,
        observaciones: f.observaciones || '',
        descripcion: f.descripcion || '',
        dni: f.dni || '',
        encontrado,
        matchParcial,
        wrsEncontrados,
        totalWrsFila: wrsTokens.length,
        detalles,
      });
    }

    return NextResponse.json({
      enviado_key: enviadoKey,
      indice_cacheado: indiceCacheado,
      total_filas: filasResultado.length,
      total_wrs: totalWrsBuscados,
      wrs_encontrados: totalWrsEncontrados,
      sin_match: sinMatch,
      filas: filasResultado,
    });
  } catch (err: unknown) {
    console.error('[Cruzar Planilla]', err);
    const message = err instanceof Error ? err.message : 'Error al cruzar la planilla.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
