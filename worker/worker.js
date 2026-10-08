'use strict';

/*
 * Worker del Automatizador de Inventario AMEX (Render Background Worker).
 *
 * Loop: toma jobs con estado 'queued' de la tabla Supabase `inventario_jobs`,
 * descarga los .xlsx de entrada desde Cloudflare R2, ejecuta el procesador
 * C# (OpenXML), sube el Excel completado + CSV a R2 y marca el job como
 * 'done'/'error' reportando progreso en vivo a la misma tabla.
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID,
 *   CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME,
 *   CLOUDFLARE_R2_ROOT_FOLDER (opcional, default 'FOLDER AMEX')
 * Opcionales:
 *   PROCESSOR (ruta del binario C#), EMPTY_TEMPLATE (plantilla fuente vacía),
 *   WORK_DIR (default os.tmpdir()/amex-jobs), POLL_INTERVAL_MS (default 5000),
 *   HOST (default 0.0.0.0), PORT (default 10000, Render lo inyecta),
 *   PROCESS_TIMEOUT_MS (default 20 min)
 */

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const XLSX = require('xlsx');

// ---------------------------------------------------------------- config

// Cargar .env.local de la raíz si existe (desarrollo local)
const candidateEnvPaths = [
  path.resolve(__dirname, '..', '.env.local'),
  path.resolve(__dirname, '..', '..', '.env.local'),
];
for (const rootEnvPath of candidateEnvPaths) {
  if (fs.existsSync(rootEnvPath)) {
    const envContent = fs.readFileSync(rootEnvPath, 'utf8');
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx > 0) {
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    }
    break;
  }
}

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const R2_ACCOUNT_ID = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || '')
  .replace(/^https?:\/\//i, '')
  .replace(/\.r2\.cloudflarestorage\.com.*$/i, '')
  .trim();
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'amex-courier-cloud';
const R2_ROOT = (process.env.CLOUDFLARE_R2_ROOT_FOLDER || 'FOLDER AMEX').replace(/^\/+|\/+$/g, '');

const defaultProcessor = process.platform === 'win32'
  ? (fs.existsSync(path.resolve(__dirname, 'processor', 'AmexInventoryProcessor', 'publish', 'win-x64', 'AmexInventoryProcessor.exe'))
      ? path.resolve(__dirname, 'processor', 'AmexInventoryProcessor', 'publish', 'win-x64', 'AmexInventoryProcessor.exe')
      : path.resolve(__dirname, '..', 'processor', 'AmexInventoryProcessor', 'publish', 'win-x64', 'AmexInventoryProcessor.exe'))
  : '/app/processor/AmexInventoryProcessor';
const defaultEmptyTemplate = process.platform === 'win32'
  ? (fs.existsSync(path.resolve(__dirname, 'assets', 'FUENTE_VACIA.xlsx'))
      ? path.resolve(__dirname, 'assets', 'FUENTE_VACIA.xlsx')
      : path.resolve(__dirname, '..', 'assets', 'FUENTE_VACIA.xlsx'))
  : '/app/assets/FUENTE_VACIA.xlsx';


const PROCESSOR = process.env.AMEX_PROCESSOR_BIN || process.env.PROCESSOR || defaultProcessor;
const EMPTY_TEMPLATE = process.env.EMPTY_TEMPLATE || defaultEmptyTemplate;
const WORK_DIR = process.env.WORK_DIR || path.join(os.tmpdir(), 'amex-jobs');
const TIB_CACHE_DIR = process.env.TIB_CACHE_DIR || path.resolve(__dirname, '..', 'cache', 'tib-active');
// Polling adaptativo para minimizar consumo de cuota de logs en Supabase (reduce logs >93%)
// Si el contenedor tiene configurado el antiguo valor legado (1500ms o <=5000ms), usar 25000ms (25s) por defecto en reposo.
const rawPollEnv = Number(process.env.POLL_INTERVAL_MS);
const POLL_INTERVAL_IDLE_MS = (!rawPollEnv || rawPollEnv <= 5000) ? 25000 : rawPollEnv;
const POLL_INTERVAL_BUSY_MS = 2000; // 2s tras procesar un trabajo para drenar cola
const PROCESS_TIMEOUT_MS = Math.max(60_000, Number(process.env.PROCESS_TIMEOUT_MS || 20 * 60 * 1000));
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 10000);

const SOURCE_KEYS = ['delivered', 'sent', 'received'];
// Las columnas en inventario_jobs están en español (las claves R2 del job).
const SOURCE_COLUMN = {
  delivered: 'entregado_key',
  sent: 'enviado_key',
  received: 'recibido_key',
};
const SOURCE_FILE_NAMES = {
  delivered: 'ENTREGADO TIB.xlsx',
  sent: 'ENVIADO TIB.xlsx',
  received: 'RECIBIDO TIB.xlsx',
};
const INVENTORY_FILE_NAME = 'Inventario.xlsx';
const OUTPUT_FILE_NAME = 'Inventario_COMPLETADO.xlsx';
const UNMATCHED_FILE_NAME = 'GUIAS_SIN_COINCIDENCIA.csv';

// stage del procesador C# -> % aproximado para la barra de progreso
const STAGE_PERCENT = {
  validating: 5,
  'reading-delivered': 15,
  'reading-sent': 35,
  'reading-received': 50,
  'validating-inventory': 60,
  matching: 75,
  verifying: 92,
};

function assertConfig() {
  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!R2_ACCOUNT_ID) missing.push('CLOUDFLARE_R2_ACCOUNT_ID');
  if (!R2_ACCESS_KEY) missing.push('CLOUDFLARE_R2_ACCESS_KEY_ID');
  if (!R2_SECRET_KEY) missing.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
  if (missing.length > 0) {
    console.error(`[worker] Faltan variables de entorno: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (!fs.existsSync(PROCESSOR)) {
    console.error(`[worker] No se encontró el procesador C# en ${PROCESSOR}`);
    process.exit(1);
  }
  if (!fs.existsSync(EMPTY_TEMPLATE)) {
    console.error(`[worker] No se encontró la plantilla vacía en ${EMPTY_TEMPLATE}`);
    process.exit(1);
  }
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
});

function workerLog(level, message, meta = {}) {
  const isDev = process.env.NODE_ENV === 'development';
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'amex-worker',
    message,
    ...meta,
  };
  if (isDev) {
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${entry.timestamp}] [${level.toUpperCase()}] ${message}`);
  } else {
    console.log(JSON.stringify(entry));
  }
}

async function withRetry(fn, options = {}) {
  const { maxRetries = 3, initialDelayMs = 1000, factor = 2, operationName = 'Operación' } = options;
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        workerLog('error', `${operationName} falló definitivamente tras ${maxRetries} intentos: ${err.message}`, {
          error: err.stack,
        });
        throw err;
      }
      workerLog('warn', `${operationName} falló (intento ${attempt}/${maxRetries}), reintentando en ${delay}ms...`, {
        error: err.message,
      });
      await new Promise((r) => setTimeout(r, delay));
      delay *= factor;
    }
  }
}

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function sbFetch(pathQuery, options = {}) {
  return withRetry(
    async () => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1${pathQuery}`, {
        ...options,
        headers: sbHeaders(options.headers),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Supabase ${res.status}: ${text.slice(0, 300)}`);
      }
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    },
    { maxRetries: 3, initialDelayMs: 1000, operationName: `Supabase REST (${pathQuery.slice(0, 35)})` }
  );
}

// ------------------------------------------------------------ job queue

async function takeNextJob() {
  const rows = await sbFetch(
    `/inventario_jobs?estado=eq.queued&order=creado_en.asc&limit=1&select=id`,
  );
  if (!rows || rows.length === 0) return null;
  const id = rows[0].id;
  // Claim atómico: solo lo toma si sigue en queued.
  const claimed = await sbFetch(`/inventario_jobs?id=eq.${id}&estado=eq.queued`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      estado: 'processing',
      etapa: 'starting',
      mensaje: 'Trabajo tomado por el worker.',
      progreso: 1,
      iniciado_en: new Date().toISOString(),
    }),
  });
  if (!claimed || claimed.length === 0) return null; // otro worker lo tomó
  const full = await sbFetch(`/inventario_jobs?id=eq.${id}&select=*`);
  return full[0];
}

async function updateJob(id, patch) {
  try {
    await sbFetch(`/inventario_jobs?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  } catch (err) {
    workerLog('error', `No se pudo actualizar el job ${id}: ${err.message}`, { error: err.stack });
  }
}

// ------------------------------------------------------------------ R2

async function downloadFromR2(key, destPath) {
  return withRetry(
    async () => {
      const res = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
      const bytes = await res.Body.transformToByteArray();
      if (bytes.length > 100 * 1024 * 1024) {
        throw new Error(`El archivo ${key} supera el límite de 100 MB.`);
      }
      await fsp.writeFile(destPath, Buffer.from(bytes));
    },
    { maxRetries: 3, initialDelayMs: 1500, operationName: `Descarga R2 (${key})` }
  );
}

async function uploadToR2(localPath, key, contentType) {
  return withRetry(
    async () => {
      const body = await fsp.readFile(localPath);
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }));
      return key;
    },
    { maxRetries: 3, initialDelayMs: 1500, operationName: `Subida R2 (${key})` }
  );
}

// -------------------------------------------------------- TIB local disk cache

function getTibCacheMetaPath(tipo) {
  return path.join(TIB_CACHE_DIR, `${tipo}.meta.json`);
}

function getTibCacheFilePath(tipo) {
  return path.join(TIB_CACHE_DIR, `${tipo}.xlsx`);
}

async function readTibMeta(tipo) {
  try {
    const metaPath = getTibCacheMetaPath(tipo);
    if (!fs.existsSync(metaPath)) return null;
    const data = await fsp.readFile(metaPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function writeTibMeta(tipo, meta) {
  const metaPath = getTibCacheMetaPath(tipo);
  await fsp.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
}

const tibLookupCache = new Map(); // tipo -> { mtime, map, totalRows, durationMs, updatedAt }

/**
 * Obtiene el archivo TIB directamente desde el disco local del VPS.
 * Si no existe o la versión cambió (clave R2 distinta), lo descarga de Cloudflare R2
 * y lo almacena localmente de forma permanente, reemplazando la versión previa.
 */
async function getOrSyncCachedTibFile(tipo, r2Key, originalName) {
  await fsp.mkdir(TIB_CACHE_DIR, { recursive: true });
  const filePath = getTibCacheFilePath(tipo);
  const meta = await readTibMeta(tipo);

  // CACHE HIT: archivo existe en disco y coincide la clave R2
  if (fs.existsSync(filePath) && meta && meta.r2_key === r2Key) {
    console.log(`[worker] [CACHE HIT ⚡] Usando ${tipo} directamente de disco local VPS (${filePath}) - 0ms red`);
    return { filePath, hit: true };
  }

  // CACHE MISS O ACTUALIZACIÓN: descargar de R2 a disco local
  console.log(`[worker] [CACHE SYNC 💾] Descargando ${tipo} desde R2 (${r2Key}) para almacenamiento local en VPS...`);
  const tempPath = `${filePath}.download.${Date.now()}`;
  await downloadFromR2(r2Key, tempPath);
  await fsp.rename(tempPath, filePath);
  tibLookupCache.delete(tipo);
  await writeTibMeta(tipo, {
    tipo,
    r2_key: r2Key,
    nombre_archivo: originalName || path.basename(r2Key),
    updated_at: new Date().toISOString(),
  });
  console.log(`[worker] [CACHE GUARDADO ✅] ${tipo} guardado con éxito en disco VPS: ${filePath}`);

  // Precalentamiento inmediato en RAM (eager warm-up):
  // Construye el índice de WRs en segundo plano para que el primer cruce tome 2ms en lugar de 24s.
  setTimeout(() => {
    try {
      console.log(`[worker] [AUTO-WARMUP 🚀] Sincronización completada. Precalentando índice en RAM para ${tipo}...`);
      getOrBuildTibLookup(tipo);
      notifyProcessorDaemonWarmup();
    } catch (warmErr) {
      console.warn(`[worker] [AUTO-WARMUP ⚠️] Error en precalentamiento para ${tipo}:`, warmErr.message);
    }
  }, 50);

  return { filePath, hit: false };
}

// ---------------------------------------------------- motor cobros (cruce TIB)

function extractWrsFromCell(rawWr) {
  if (!rawWr) return [];
  const s = String(rawWr).trim();
  const matches = s.match(/WR\d{5,12}/gi);
  if (matches && matches.length > 0) {
    return Array.from(new Set(matches.map((w) => w.toUpperCase())));
  }
  return s
    .split(/[\s,;/|-]+/)
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length >= 3);
}

function getOrBuildTibLookup(tipo = 'sent') {
  const filePath = getTibCacheFilePath(tipo);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const stat = fs.statSync(filePath);
  const mtime = stat.mtimeMs;
  const cached = tibLookupCache.get(tipo);
  if (cached && cached.mtime === mtime) {
    return cached;
  }

  console.log(`[worker] [INDEXANDO TIB ⚡] Cargando y construyendo índice en memoria para ${tipo}...`);
  const t0 = Date.now();
  const wb = XLSX.readFile(filePath, { dense: true, cellFormula: false, cellHTML: false, cellText: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const headerRow = rows[0] || [];
  const colWr = headerRow.findIndex((h) => /WR/i.test(String(h)));
  const colTrack = headerRow.findIndex((h) => /TRACK/i.test(String(h)));
  const colCli = headerRow.findIndex((h) => /CLIENTE/i.test(String(h)));
  const colTipo = headerRow.findIndex((h) => /TIPO/i.test(String(h)));
  const colPeso = headerRow.findIndex((h) => /PESO/i.test(String(h)));
  const colEstado = headerRow.findIndex((h) => /ESTADO/i.test(String(h)));
  const colFecha = headerRow.findIndex((h) => /MODIFICADO|REGISTRADO|FECHA/i.test(String(h)));

  const map = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const wrVal = r[colWr >= 0 ? colWr : 0];
    if (!wrVal) continue;
    const wrKey = String(wrVal).toUpperCase().trim();
    if (!wrKey) continue;

    const rawPeso = colPeso >= 0 ? r[colPeso] : null;
    let numPeso = null;
    if (typeof rawPeso === 'number') {
      numPeso = Math.round(rawPeso * 100) / 100;
    } else if (rawPeso) {
      const p = parseFloat(String(rawPeso).replace(',', '.'));
      if (!isNaN(p)) numPeso = Math.round(p * 100) / 100;
    }

    map.set(wrKey, {
      wr: wrKey,
      tracking: colTrack >= 0 && r[colTrack] ? String(r[colTrack]).trim() : '',
      cliente: colCli >= 0 && r[colCli] ? String(r[colCli]).trim() : '',
      tipo: colTipo >= 0 && r[colTipo] ? String(r[colTipo]).trim() : 'CAJA',
      peso: numPeso,
      estado: colEstado >= 0 && r[colEstado] ? String(r[colEstado]).trim() : '',
      fecha: colFecha >= 0 && r[colFecha] ? String(r[colFecha]).trim() : '',
      fuente: tipo,
    });
  }

  const durationMs = Date.now() - t0;
  console.log(`[worker] [INDEXADO COMPLETADO ✅] ${tipo}: ${map.size} WRs indexados de ${rows.length} filas en ${durationMs}ms`);
  const record = { mtime, map, totalRows: rows.length, durationMs, updatedAt: new Date().toISOString() };
  tibLookupCache.set(tipo, record);
  return record;
}

/**
 * Precalienta en memoria RAM los archivos TIB que ya residen en el disco local del VPS.
 * Se invoca al iniciar o reiniciar el contenedor amex-worker para garantizar CERO COLD-START.
 */
async function bootWarmUpTibIndices() {
  // Asegurar que el daemon residente en RAM de C# esté activo
  startProcessorDaemon();

  console.log('[worker] [BOOT-WARMUP 🚀] Verificando archivos TIB en disco para precalentamiento de RAM...');
  for (const tipo of ['sent', 'delivered', 'received']) {
    try {
      const filePath = getTibCacheFilePath(tipo);
      if (fs.existsSync(filePath)) {
        console.log(`[worker] [BOOT-WARMUP ⚡] Precalentando índice en RAM para ${tipo} (${filePath})...`);
        getOrBuildTibLookup(tipo);
      }
    } catch (err) {
      console.warn(`[worker] [BOOT-WARMUP ⚠️] No se pudo precalentar ${tipo}:`, err.message);
    }
  }

  // Notificar al daemon C# para que cargue los 3 archivos en su RAM
  setTimeout(() => {
    notifyProcessorDaemonWarmup();
  }, 1000);
}

function cruzarFilasCobros(filas = [], options = {}) {
  const fuente = options.fuente || 'sent';
  const includeFallbacks = options.includeFallbacks !== false;

  const primaryRecord = getOrBuildTibLookup(fuente);
  const primaryMap = primaryRecord ? primaryRecord.map : new Map();

  let fallbackDelivered = null;
  let fallbackReceived = null;

  let countFull = 0;
  let countPartial = 0;
  let countNone = 0;

  const filasCruzadas = filas.map((fila, index) => {
    const rawWr = fila.rawWr || fila.wr || '';
    const wrs = Array.isArray(fila.wrs) && fila.wrs.length > 0
      ? fila.wrs.map((w) => String(w).toUpperCase().trim())
      : extractWrsFromCell(rawWr);

    const delimiter = fila.delimiter || ' - ';
    const detalles = [];

    for (const w of wrs) {
      let hit = primaryMap.get(w);
      if (!hit && includeFallbacks && fuente === 'sent') {
        if (!fallbackDelivered) {
          const rec = getOrBuildTibLookup('delivered');
          fallbackDelivered = rec ? rec.map : new Map();
        }
        hit = fallbackDelivered.get(w);
        if (!hit) {
          if (!fallbackReceived) {
            const rec = getOrBuildTibLookup('received');
            fallbackReceived = rec ? rec.map : new Map();
          }
          hit = fallbackReceived.get(w);
        }
      }

      if (hit) {
        detalles.push({
          wr: w,
          tracking: hit.tracking || '',
          cliente: hit.cliente || '',
          tipo: hit.tipo || 'CAJA',
          peso: hit.peso,
          estado: hit.estado || '',
          encontrado: true,
          fuente: hit.fuente,
        });
      } else {
        detalles.push({
          wr: w,
          tracking: '',
          cliente: '',
          tipo: 'CAJA',
          peso: null,
          estado: 'NO ENCONTRADO',
          encontrado: false,
          fuente: null,
        });
      }
    }

    const wrsEncontrados = detalles.filter((d) => d.encontrado).length;
    const totalWrsFila = wrs.length;
    const encontrado = totalWrsFila > 0 && wrsEncontrados === totalWrsFila;
    const matchParcial = wrsEncontrados > 0 && wrsEncontrados < totalWrsFila;

    if (encontrado) countFull++;
    else if (matchParcial) countPartial++;
    else countNone++;

    // Formatear pesos con el delimitador: ej "3.98 - 2.22"
    const pesoFormateado = detalles.length > 0
      ? detalles.map((d) => (d.peso != null ? d.peso.toFixed(2) : '?')).join(delimiter)
      : '';

    // Suma numérica acumulada
    const pesoTotal = detalles.length > 0
      ? Math.round(detalles.reduce((acc, d) => acc + (d.peso || 0), 0) * 100) / 100
      : null;

    // Trackings combinados con el delimitador: ej "YCE78A3 - YCE78A6"
    const tracking = detalles.length > 0
      ? detalles.map((d) => d.tracking || '-').join(delimiter)
      : '';

    // Nombres de cliente por cada WR (concatenados con el delimitador para multi-WR: ej "CLIENTE 1 - CLIENTE 2")
    const nombresClientes = detalles.map(
      (d) => d.cliente || fila.cliente || fila.consignatario || fila.consignado || 'SIN NOMBRE'
    );
    const clienteFinal = wrs.length > 1
      ? nombresClientes.join(delimiter)
      : (nombresClientes[0] || fila.cliente || fila.consignatario || '');

    return {
      ...fila,
      filaOriginal: fila.filaOriginal ?? (index + 2),
      // REGLA CRUCIAL: El WR de la fila conserva exactamente la cadena original (agrupada)
      wr: rawWr,
      rawWr: rawWr,
      wrs,
      esMultiWr: wrs.length > 1,
      delimiter,
      cliente: clienteFinal,
      pesoFormateado,
      pesoTotal,
      tracking,
      tipo: detalles.find((d) => d.tipo)?.tipo || fila.tipo || 'CAJA',
      encontrado,
      matchParcial,
      wrsEncontrados,
      totalWrsFila,
      detalles,
    };
  });

  return {
    filasCruzadas,
    countFull,
    countPartial,
    countNone,
    totalFilas: filas.length,
    fuenteUsada: fuente,
    primaryRows: primaryRecord?.totalRows || 0,
    primaryWrs: primaryRecord?.map?.size || 0,
  };
}

// ------------------------------------------------------------- processor daemon & cli

const PROCESSOR_PORT = process.env.PROCESSOR_PORT || 10001;
const DAEMON_URL = `http://127.0.0.1:${PROCESSOR_PORT}`;
let daemonProcess = null;
let daemonReady = false;

function startProcessorDaemon() {
  if (daemonProcess && !daemonProcess.killed) return;
  console.log(`[worker] [DAEMON 🚀] Iniciando AmexInventoryProcessor en modo daemon (puerto ${PROCESSOR_PORT})...`);
  try {
    daemonProcess = spawn(PROCESSOR, ['--daemon', String(PROCESSOR_PORT)], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    daemonProcess.stdout.setEncoding('utf8');
    daemonProcess.stderr.setEncoding('utf8');

    daemonProcess.stdout.on('data', (data) => {
      for (const line of data.split('\n')) {
        const trimmed = line.trim();
        if (trimmed) console.log(`[daemon] ${trimmed}`);
      }
    });

    daemonProcess.stderr.on('data', (data) => {
      for (const line of data.split('\n')) {
        const trimmed = line.trim();
        if (trimmed) console.warn(`[daemon] ${trimmed}`);
      }
    });

    daemonProcess.on('error', (err) => {
      console.warn(`[daemon] Error al iniciar daemon C#: ${err.message}`);
      daemonProcess = null;
      daemonReady = false;
    });

    daemonProcess.on('exit', (code, signal) => {
      console.warn(`[daemon] Proceso daemon C# finalizó (code=${code}, signal=${signal}).`);
      daemonProcess = null;
      daemonReady = false;
    });
  } catch (err) {
    console.warn(`[daemon] No se pudo lanzar el daemon C#: ${err.message}`);
  }
}

async function checkProcessorDaemonReady(retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${DAEMON_URL}/health`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        daemonReady = true;
        return true;
      }
    } catch {
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 200));
    }
  }
  return false;
}

function notifyProcessorDaemonWarmup() {
  fetch(`${DAEMON_URL}/warmup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourcePaths: [
        getTibCacheFilePath('delivered'),
        getTibCacheFilePath('sent'),
        getTibCacheFilePath('received'),
      ],
    }),
    signal: AbortSignal.timeout(60000),
  }).catch((err) => {
    console.warn('[worker] Aviso warmup daemon C#:', err.message);
  });
}

async function runProcessor(args, onProgress) {
  // 1. Intentar ejecución ultra-rápida en memoria RAM vía Daemon C# (Zero Cold-Start)
  try {
    const isReady = await checkProcessorDaemonReady(2);
    if (isReady) {
      console.log('[worker] [DAEMON ⚡] Procesando inventario directamente en RAM (Zero Cold-Start)...');
      if (typeof onProgress === 'function') {
        onProgress({ stage: 'matching', message: 'Cruzando inventario directamente en memoria RAM...' });
      }
      const t0 = Date.now();
      const res = await fetch(`${DAEMON_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryPath: args[0],
          sourcePaths: args.slice(1, 4),
          outputPath: args[4],
          unmatchedCsvPath: args[5],
        }),
        signal: AbortSignal.timeout(PROCESS_TIMEOUT_MS),
      });

      if (res.ok) {
        const result = await res.json();
        if (result && result.ok) {
          const duration = Date.now() - t0;
          console.log(`[worker] [DAEMON COMPLETADO ⚡] Inventario procesado en RAM en ${duration}ms! (coincidencias: ${result.matched}/${result.totalInventory})`);
          return result;
        }
      }
    }
  } catch (daemonErr) {
    console.warn(`[worker] [DAEMON FALLBACK ⚠️] Falló llamada a daemon C# (${daemonErr.message}). Usando CLI tradicional...`);
  }

  // 2. Fallback garantizado: ejecución CLI spawn tradicional
  return runProcessorCli(args, onProgress);
}

function runProcessorCli(args, onProgress) {
  return new Promise((resolve, reject) => {
    const child = spawn(PROCESSOR, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderrTail = '';
    let stderrPending = '';
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, PROCESS_TIMEOUT_MS);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout = (stdout + chunk).slice(-2_000_000); });
    child.stderr.on('data', (chunk) => {
      const lines = (stderrPending + chunk).split(/\r?\n/);
      stderrPending = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('PROGRESS:')) {
          try {
            const progress = JSON.parse(line.slice('PROGRESS:'.length));
            if (typeof progress.stage === 'string' && typeof progress.message === 'string') {
              onProgress(progress);
            }
          } catch {
            stderrTail = (stderrTail + `${line}\n`).slice(-50_000);
          }
        } else if (line.trim()) {
          stderrTail = (stderrTail + `${line}\n`).slice(-50_000);
        }
      }
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(
        `No se pudo iniciar el procesador (spawn error: ${error.message}; code=${error.code || 'n/a'}). ` +
        `stderr: ${(stderrTail.trim() || '(vacío)').slice(0, 500)}`
      ));
    });
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      if (timedOut) {
        reject(new Error('El procesamiento excedió el tiempo máximo y se detuvo.'));
        return;
      }
      if (code !== 0) {
        let message = stderrTail.trim() || stdout.trim() || `El procesador terminó con código ${code} y señal ${signal || 'n/a'}.`;
        try {
          const details = JSON.parse(message.split(/\r?\n/).at(-1));
          if (details.error) message = details.error;
        } catch { /* usa el mensaje tal cual */ }
        reject(new Error(
          `${message.split('\n')[0]} [exit=${code} signal=${signal || 'n/a'}] ` +
          `stdout: ${(stdout.trim() || '(vacío)').slice(-300)}`
        ));
        return;
      }
      try {
        const result = JSON.parse(stdout.trim());
        if (!result || result.ok !== true) throw new Error((result && result.error) || 'Resultado inválido del procesador.');
        resolve(result);
      } catch (error) {
        reject(new Error(`No se pudo leer el resultado: ${error.message}`));
      }
    });
  });
}

// --------------------------------------------------------------- process

async function processJob(job) {
  const jobId = job.id;
  const jobDir = path.join(WORK_DIR, String(jobId).replace(/[^a-zA-Z0-9-]/g, ''));
  console.log(`[worker] Procesando job ${jobId}`);
  let lastPush = 0;
  let lastStage = '';

  const pushProgress = async (stage, message) => {
    const now = Date.now();
    const stageChanged = stage !== lastStage;
    if (!stageChanged && now - lastPush < 2000) return;
    lastStage = stage;
    lastPush = now;
    await updateJob(jobId, {
      etapa: stage,
      mensaje: String(message).slice(0, 500),
      progreso: STAGE_PERCENT[stage] ?? 50,
    });
  };

  try {
    const fuentes = Array.isArray(job.fuentes) && job.fuentes.length > 0
      ? job.fuentes.filter((f) => SOURCE_KEYS.includes(f))
      : [...SOURCE_KEYS];
    if (!job.inventario_key) throw new Error('El job no tiene archivo de inventario.');

    await fsp.mkdir(jobDir, { recursive: true });
    await updateJob(jobId, { etapa: 'downloading', mensaje: 'Descargando archivos desde R2.', progreso: 2 });

    const inventoryPath = path.join(jobDir, INVENTORY_FILE_NAME);
    await downloadFromR2(job.inventario_key, inventoryPath);

    const sourcePaths = [];
    const emptyTemplate = await fsp.readFile(EMPTY_TEMPLATE);
    for (const key of SOURCE_KEYS) {
      const r2Key = job[SOURCE_COLUMN[key]];
      if (fuentes.includes(key) && r2Key) {
        // Usar archivo directamente de la caché local persistente en disco VPS (0ms si ya está presente)
        const { filePath } = await getOrSyncCachedTibFile(key, r2Key, SOURCE_FILE_NAMES[key]);
        sourcePaths.push(filePath);
      } else {
        const dest = path.join(jobDir, SOURCE_FILE_NAMES[key]);
        await fsp.writeFile(dest, emptyTemplate);
        sourcePaths.push(dest);
      }
    }

    const outputPath = path.join(jobDir, OUTPUT_FILE_NAME);
    const unmatchedPath = path.join(jobDir, UNMATCHED_FILE_NAME);
    const result = await runProcessor(
      [inventoryPath, ...sourcePaths, outputPath, unmatchedPath],
      (p) => { void pushProgress(p.stage, p.message); },
    );

    await updateJob(jobId, { etapa: 'uploading', mensaje: 'Subiendo resultado a R2.', progreso: 95 });
    const prefix = `${R2_ROOT}/inventario-jobs/${jobId}`;
    const resultadoKey = await uploadToR2(
      outputPath, `${prefix}/${OUTPUT_FILE_NAME}`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    let csvKey = null;
    if ((result.unmatchedCount || 0) > 0 && fs.existsSync(unmatchedPath)) {
      csvKey = await uploadToR2(unmatchedPath, `${prefix}/${UNMATCHED_FILE_NAME}`, 'text/csv; charset=utf-8');
    }

    await updateJob(jobId, {
      estado: 'done',
      etapa: 'complete',
      mensaje: 'Excel listo para descargar.',
      progreso: 100,
      resultado_key: resultadoKey,
      csv_key: csvKey,
      total_guias: result.totalInventory ?? null,
      coincidencias: result.matched ?? null,
      sin_coincidencia: result.unmatchedCount ?? null,
      duplicados: result.duplicateRows ?? null,
      filas_tib: result.sourceRows ?? null,
      segundos: result.processingSeconds ?? null,
      terminado_en: new Date().toISOString(),
    });
    console.log(`[worker] Job ${jobId} OK: ${result.matched}/${result.totalInventory} en ${result.processingSeconds}s`);
  } catch (err) {
    console.error(`[worker] Job ${jobId} ERROR: ${err.message}`);
    telemetry.lastError = { jobId, message: String(err.message).slice(0, 900), at: new Date().toISOString() };
    await updateJob(jobId, {
      estado: 'error',
      etapa: 'error',
      mensaje: String(err.message).slice(0, 900),
      error: String(err.stack || err.message).slice(0, 4000),
      terminado_en: new Date().toISOString(),
    });
  } finally {
    await fsp.rm(jobDir, { recursive: true, force: true }).catch(() => {});
  }
}

let wakeUpResolver = null;

function triggerImmediatePoll() {
  if (wakeUpResolver) {
    wakeUpResolver();
    wakeUpResolver = null;
  }
}

function waitForNextPoll(ms) {
  return new Promise((resolve) => {
    wakeUpResolver = resolve;
    setTimeout(() => {
      wakeUpResolver = null;
      resolve();
    }, ms);
  });
}

async function loop() {
  workerLog(
    'info',
    `Bucle del worker iniciado (polling adaptativo: reposo ${POLL_INTERVAL_IDLE_MS}ms, activo ${POLL_INTERVAL_BUSY_MS}ms)`
  );
  let consecutiveEmptyPolls = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const job = await takeNextJob();
      if (job) {
        consecutiveEmptyPolls = 0;
        telemetry.jobsProcessed = (telemetry.jobsProcessed || 0) + 1;
        telemetry.lastJobTime = new Date().toISOString();
        await processJob(job);
        // Continuar rápidamente con el siguiente trabajo si la cola tiene más ítems
        await waitForNextPoll(POLL_INTERVAL_BUSY_MS);
        continue;
      } else {
        consecutiveEmptyPolls++;
      }
    } catch (err) {
      workerLog('error', `Error en el loop principal: ${err.message}`, { error: err.stack });
    }

    // Escalado adaptativo cuando la cola está vacía:
    // 1er sondeo vacío: 5s
    // 2do sondeo vacío: 12s
    // 3ro en adelante (reposo): POLL_INTERVAL_IDLE_MS (25s)
    // Nota: Ante nuevos jobs, el backend notifica vía POST /trigger-job despertando el bucle al instante (<1ms).
    let sleepMs;
    if (consecutiveEmptyPolls <= 1) {
      sleepMs = 5000;
    } else if (consecutiveEmptyPolls <= 2) {
      sleepMs = 12000;
    } else {
      sleepMs = POLL_INTERVAL_IDLE_MS;
    }

    await waitForNextPoll(sleepMs);
  }
}

// ---------------------------------------------------------------- health

const workerStartTime = Date.now();
const telemetry = { preflight: null, lastError: null, jobsProcessed: 0, lastJobTime: null };

function readCgroup() {
  const info = {};
  const readNum = (p) => {
    try {
      const v = fs.readFileSync(p, 'utf8').trim();
      return v === 'max' ? -1 : Number(v);
    } catch { return null; }
  };
  // cgroup v2
  info.limit = readNum('/sys/fs/cgroup/memory.max');
  info.usage = readNum('/sys/fs/cgroup/memory.current');
  // cgroup v1
  if (info.limit == null) info.limit = readNum('/sys/fs/cgroup/memory/memory.limit_in_bytes');
  if (info.usage == null) info.usage = readNum('/sys/fs/cgroup/memory/memory.usage_in_bytes');
  return info;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Endpoint de sincronización anticipada: POST /sync-tib
  if (req.method === 'POST' && parsedUrl.pathname === '/sync-tib') {
    let bodyText = '';
    req.on('data', (chunk) => { bodyText += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyText || '{}');
        const { tipo, r2_key, nombre_archivo } = payload;
        if (!tipo || !SOURCE_KEYS.includes(tipo) || !r2_key) {
          const errBody = Buffer.from(JSON.stringify({ error: 'Parámetros inválidos (tipo y r2_key requeridos).' }));
          res.writeHead(400, { 'Content-Type': 'application/json', 'Content-Length': errBody.length });
          res.end(errBody);
          return;
        }

        console.log(`[worker] Petición /sync-tib recibida para ${tipo}: ${r2_key}`);
        const result = await getOrSyncCachedTibFile(tipo, r2_key, nombre_archivo);
        const stats = await fsp.stat(result.filePath).catch(() => null);

        const resp = Buffer.from(JSON.stringify({
          ok: true,
          tipo,
          r2_key,
          cachedPath: result.filePath,
          cacheHit: result.hit,
          sizeBytes: stats ? stats.size : 0,
          time: new Date().toISOString(),
        }));

        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': resp.length });
        res.end(resp);
      } catch (err) {
        console.error(`[worker] Error en /sync-tib: ${err.message}`);
        const errResp = Buffer.from(JSON.stringify({ error: err.message }));
        res.writeHead(500, { 'Content-Type': 'application/json', 'Content-Length': errResp.length });
        res.end(errResp);
      }
    });
    return;
  }

  // Endpoint de precalentamiento continuo: GET/POST /prewarm-cobros
  if (parsedUrl.pathname === '/prewarm-cobros') {
    const fuente = parsedUrl.searchParams.get('fuente') || 'sent';
    try {
      const filePath = getTibCacheFilePath(fuente);
      if (!fs.existsSync(filePath)) {
        const body = Buffer.from(JSON.stringify({ ok: false, status: 'file_not_found', fuente }));
        res.writeHead(404, { 'Content-Type': 'application/json', 'Content-Length': body.length });
        res.end(body);
        return;
      }

      const stat = fs.statSync(filePath);
      const cached = tibLookupCache.get(fuente);
      if (cached && cached.mtime === stat.mtimeMs) {
        const body = Buffer.from(JSON.stringify({
          ok: true,
          status: 'already_warm',
          fuente,
          totalWrs: cached.map ? cached.map.size : 0,
          totalRows: cached.totalRows,
          durationMs: cached.durationMs,
          updatedAt: cached.updatedAt,
        }));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': body.length });
        res.end(body);
        return;
      }

      console.log(`[worker] [PREWARM ⚡] Petición de precalentamiento para ${fuente}...`);
      const record = getOrBuildTibLookup(fuente);
      const body = Buffer.from(JSON.stringify({
        ok: true,
        status: 'warmed_now',
        fuente,
        totalWrs: record && record.map ? record.map.size : 0,
        totalRows: record ? record.totalRows : 0,
        durationMs: record ? record.durationMs : 0,
        updatedAt: record ? record.updatedAt : null,
      }));
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': body.length });
      res.end(body);
    } catch (err) {
      console.error(`[worker] Error en /prewarm-cobros: ${err.message}`);
      const errBody = Buffer.from(JSON.stringify({ ok: false, error: err.message }));
      res.writeHead(500, { 'Content-Type': 'application/json', 'Content-Length': errBody.length });
      res.end(errBody);
    }
    return;
  }

  // Endpoint de precalentamiento para Inventario (C# Daemon): GET/POST /prewarm-inventario
  if (parsedUrl.pathname === '/prewarm-inventario') {
    try {
      const isReady = await checkProcessorDaemonReady(1);
      if (!isReady) {
        startProcessorDaemon();
      }
      const warmRes = await fetch(`${DAEMON_URL}/warmup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePaths: [
            getTibCacheFilePath('delivered'),
            getTibCacheFilePath('sent'),
            getTibCacheFilePath('received'),
          ],
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (warmRes.ok) {
        const warmData = await warmRes.json();
        const respBody = Buffer.from(JSON.stringify(warmData));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': respBody.length });
        res.end(respBody);
        return;
      }
    } catch (err) {
      console.warn('[worker] Error en /prewarm-inventario:', err.message);
    }

    const fallbackResp = Buffer.from(JSON.stringify({ ok: false, message: 'Daemon no respondió a tiempo.' }));
    res.writeHead(500, { 'Content-Type': 'application/json', 'Content-Length': fallbackResp.length });
    res.end(fallbackResp);
    return;
  }

  // Endpoint para despertar al worker inmediatamente: POST /trigger-job
  if (req.method === 'POST' && parsedUrl.pathname === '/trigger-job') {
    triggerImmediatePoll();
    const resp = Buffer.from(JSON.stringify({
      ok: true,
      message: 'Worker notificado: ciclo de polling despertado inmediatamente.',
      time: new Date().toISOString(),
    }));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': resp.length });
    res.end(resp);
    return;
  }

  // Endpoint de cruce de cobros (Planilla de Cobros): POST /cruzar-cobros
  if (req.method === 'POST' && (parsedUrl.pathname === '/cruzar-cobros' || parsedUrl.pathname === '/api/cruzar-cobros')) {
    let bodyText = '';
    req.on('data', (chunk) => { bodyText += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyText || '{}');
        const filas = payload.filas || [];
        const fuente = payload.fuente || 'sent';

        if (!Array.isArray(filas) || filas.length === 0) {
          const errResp = Buffer.from(JSON.stringify({ error: 'Se requiere un arreglo de "filas" no vacío.' }));
          res.writeHead(400, { 'Content-Type': 'application/json', 'Content-Length': errResp.length });
          res.end(errResp);
          return;
        }

        const tStart = Date.now();
        console.log(`[worker] Petición /cruzar-cobros recibida con ${filas.length} filas (fuente: ${fuente})`);

        const resultado = cruzarFilasCobros(filas, { fuente, includeFallbacks: payload.includeFallbacks !== false });
        const duracionMs = Date.now() - tStart;

        console.log(`[worker] Cruce completado en ${duracionMs}ms. Coincidencias: ${resultado.countFull}/${filas.length}`);

        const resp = Buffer.from(JSON.stringify({
          ok: true,
          totalFilas: resultado.totalFilas,
          coincidenciasCompletas: resultado.countFull,
          coincidenciasParciales: resultado.countPartial,
          sinCoincidencia: resultado.countNone,
          duracionMs,
          fuenteUsada: resultado.fuenteUsada,
          tibRows: resultado.primaryRows,
          tibWrs: resultado.primaryWrs,
          filasCruzadas: resultado.filasCruzadas,
          time: new Date().toISOString(),
        }));

        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': resp.length });
        res.end(resp);
      } catch (err) {
        console.error(`[worker] Error en /cruzar-cobros: ${err.message}`);
        const errResp = Buffer.from(JSON.stringify({ error: err.message }));
        res.writeHead(500, { 'Content-Type': 'application/json', 'Content-Length': errResp.length });
        res.end(errResp);
      }
    });
    return;
  }

  // Health y estado del cache (GET /)
  const mem = process.memoryUsage();
  const tibCache = {};
  const tibMemoryCache = {};
  for (const k of SOURCE_KEYS) {
    try {
      const metaPath = getTibCacheMetaPath(k);
      const filePath = getTibCacheFilePath(k);
      const exists = fs.existsSync(filePath);
      const meta = exists && fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : null;
      let sizeBytes = 0;
      if (exists) {
        sizeBytes = fs.statSync(filePath).size;
      }
      tibCache[k] = { exists, sizeBytes, meta };
    } catch {
      tibCache[k] = { exists: false, error: 'read_fail' };
    }

    const cachedMem = tibLookupCache.get(k);
    tibMemoryCache[k] = cachedMem ? {
      isWarm: true,
      totalWrs: cachedMem.map ? cachedMem.map.size : 0,
      totalRows: cachedMem.totalRows,
      buildDurationMs: cachedMem.durationMs,
      updatedAt: cachedMem.updatedAt,
    } : { isWarm: false };
  }

  const daemonAlive = await checkProcessorDaemonReady(1);
  const uptimeSeconds = Math.round((Date.now() - workerStartTime) / 1000);

  const body = Buffer.from(JSON.stringify({
    status: 'ok',
    mode: 'worker',
    node: process.versions.node,
    uptimeSeconds,
    jobsProcessed: telemetry.jobsProcessed,
    lastJobTime: telemetry.lastJobTime,
    processor: fs.existsSync(PROCESSOR) ? 'openxml' : 'missing',
    processorDaemon: daemonAlive ? 'online' : 'offline',
    processorDaemonPid: daemonProcess ? daemonProcess.pid : null,
    nodeRssMB: Math.round(mem.rss / 1024 / 1024),
    nodeHeapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    tibCacheDir: TIB_CACHE_DIR,
    tibCache,
    tibMemoryCache,
    cgroup: readCgroup(),
    telemetry,
    time: new Date().toISOString(),
  }));
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': body.length });
  res.end(body);
});

// ------------------------------------------------------------------ main

// Preflight: el binario sin argumentos debe responder uso + exit 2.
// Solo diagnostica (no bloquea el arranque) para depurar el contenedor.
function preflight() {
  try {
    const child = spawn(PROCESSOR, [], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (c) => { err += c; });
    child.on('error', (e) => {
      telemetry.preflight = { exit: null, signal: null, spawnError: `${e.message} (code=${e.code || 'n/a'})`, out: '' };
      console.error(`[worker] preflight spawn error: ${e.message} (code=${e.code || 'n/a'})`);
    });
    child.on('close', (code, signal) => {
      telemetry.preflight = { exit: code, signal: signal || null, spawnError: null, out: err.trim().slice(0, 200) || '(vacío)' };
      console.log(`[worker] preflight: exit=${code} signal=${signal || 'n/a'} out=${err.trim().slice(0, 200) || '(vacío)'}`);
    });
  } catch (e) {
    console.error(`[worker] preflight exception: ${e.message}`);
  }
}

assertConfig();
preflight();
Promise.all([
  fsp.mkdir(WORK_DIR, { recursive: true }),
  fsp.mkdir(TIB_CACHE_DIR, { recursive: true }),
])
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`[worker] Health en http://${HOST}:${PORT} | poll reposo ${POLL_INTERVAL_IDLE_MS}ms / activo ${POLL_INTERVAL_BUSY_MS}ms | workDir ${WORK_DIR} | cacheDir ${TIB_CACHE_DIR}`);
      void bootWarmUpTibIndices();
    });
    void loop();
  })
  .catch((err) => {
    console.error(`[worker] No se pudo iniciar: ${err.message}`);
    process.exitCode = 1;
  });
