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

// ---------------------------------------------------------------- config

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const R2_ACCOUNT_ID = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || '')
  .replace(/^https?:\/\//i, '')
  .replace(/\.r2\.cloudflarestorage\.com.*$/i, '')
  .trim();
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'amex-courier-cloud';
const R2_ROOT = (process.env.CLOUDFLARE_R2_ROOT_FOLDER || 'FOLDER AMEX').replace(/^\/+|\/+$/g, '');

const PROCESSOR = process.env.AMEX_PROCESSOR_BIN || process.env.PROCESSOR || '/app/processor/AmexInventoryProcessor';
const EMPTY_TEMPLATE = process.env.EMPTY_TEMPLATE || '/app/assets/FUENTE_VACIA.xlsx';
const WORK_DIR = process.env.WORK_DIR || path.join(os.tmpdir(), 'amex-jobs');
const POLL_INTERVAL_MS = Math.max(2000, Number(process.env.POLL_INTERVAL_MS || 5000));
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

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function sbFetch(pathQuery, options = {}) {
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
    console.error(`[worker] No se pudo actualizar el job ${id}: ${err.message}`);
  }
}

// ------------------------------------------------------------------ R2

async function downloadFromR2(key, destPath) {
  const res = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  const bytes = await res.Body.transformToByteArray();
  if (bytes.length > 100 * 1024 * 1024) {
    throw new Error(`El archivo ${key} supera el límite de 100 MB.`);
  }
  await fsp.writeFile(destPath, Buffer.from(bytes));
}

async function uploadToR2(localPath, key, contentType) {
  const body = await fsp.readFile(localPath);
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return key;
}

// ------------------------------------------------------------- processor

function runProcessor(args, onProgress) {
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
      const dest = path.join(jobDir, SOURCE_FILE_NAMES[key]);
      const r2Key = job[SOURCE_COLUMN[key]];
      if (fuentes.includes(key) && r2Key) {
        await downloadFromR2(r2Key, dest);
      } else {
        await fsp.writeFile(dest, emptyTemplate);
      }
      sourcePaths.push(dest);
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

async function loop() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const job = await takeNextJob();
      if (job) {
        await processJob(job);
        continue;
      }
    } catch (err) {
      console.error(`[worker] Error en el loop: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// ---------------------------------------------------------------- health

const telemetry = { preflight: null, lastError: null };

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

const server = http.createServer((req, res) => {
  const mem = process.memoryUsage();
  const body = Buffer.from(JSON.stringify({
    status: 'ok',
    mode: 'worker',
    node: process.versions.node,
    processor: fs.existsSync(PROCESSOR) ? 'openxml' : 'missing',
    nodeRssMB: Math.round(mem.rss / 1024 / 1024),
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
fsp.mkdir(WORK_DIR, { recursive: true })
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`[worker] Health en http://${HOST}:${PORT} | poll cada ${POLL_INTERVAL_MS}ms | dir ${WORK_DIR}`);
    });
    void loop();
  })
  .catch((err) => {
    console.error(`[worker] No se pudo iniciar: ${err.message}`);
    process.exitCode = 1;
  });
