'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, execFile } = require('node:child_process');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const RUNS = path.join(ROOT, 'runs');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 8765);
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const PROCESSOR = process.env.AMEX_PROCESSOR_EXE || path.join(
  ROOT,
  'processor',
  'AmexInventoryProcessor',
  'publish',
  'win-x64',
  'AmexInventoryProcessor.exe',
);
const RUN_RETENTION_DAYS = Math.max(1, Number(process.env.RUN_RETENTION_DAYS || 30));
const RUN_RETENTION_MS = RUN_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const nodeMajorVersion = Number(process.versions.node.split('.')[0]);
if (nodeMajorVersion < 18) {
  console.error(`Se requiere Node.js 18 o superior. Versión detectada: ${process.versions.node}`);
  process.exit(1);
}

const expectedUploads = {
  inventory: 'Inventario.xlsx',
  delivered: 'ENTREGADO TIB.xlsx',
  sent: 'ENVIADO TIB.xlsx',
  received: 'RECIBIDO TIB.xlsx',
};

const SOURCE_KEYS = ['delivered', 'sent', 'received'];
const SOURCE_LABELS = {
  delivered: 'ENTREGADO TIB',
  sent: 'ENVIADO TIB',
  received: 'RECIBIDO TIB',
};

let processing = false;
let activeRunId = null;
let processingProgress = { stage: 'idle', message: 'Esperando archivos.', validations: [] };

function makeHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (error, body) => {
    if (error) {
      sendJson(res, 404, { error: 'No se encontró el recurso solicitado.' });
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(body);
  });
}

function readRequest(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (chunk) => {
      if (tooLarge) return;
      size += chunk.length;
      if (size > maxBytes) {
        tooLarge = true;
        chunks.length = 0;
        reject(new Error('Los archivos superan el límite de 100 MB por carga.'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(body, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const headerSeparator = Buffer.from('\r\n\r\n');
  const nextPartMarker = Buffer.from(`\r\n--${boundary}`);
  const files = new Map();
  const fields = new Map();
  let cursor = body.indexOf(delimiter);

  while (cursor >= 0) {
    cursor += delimiter.length;
    if (body[cursor] === 45 && body[cursor + 1] === 45) break;
    if (body[cursor] === 13 && body[cursor + 1] === 10) cursor += 2;

    const headerEnd = body.indexOf(headerSeparator, cursor);
    if (headerEnd < 0) throw new Error('La carga de archivos está incompleta.');
    const headerText = body.subarray(cursor, headerEnd).toString('utf8');
    const contentStart = headerEnd + headerSeparator.length;
    const nextPart = body.indexOf(nextPartMarker, contentStart);
    if (nextPart < 0) throw new Error('La carga de archivos está incompleta.');

    const disposition = headerText.match(/content-disposition:\s*form-data;([^\r\n]+)/i);
    if (disposition) {
      const nameMatch = disposition[1].match(/(?:^|;)\s*name="([^"]+)"/i);
      const fileMatch = disposition[1].match(/(?:^|;)\s*filename="([^"]*)"/i);
      if (nameMatch) {
        const data = body.subarray(contentStart, nextPart);
        if (fileMatch && fileMatch[1]) {
          files.set(nameMatch[1], {
            filename: path.basename(fileMatch[1].replace(/\\/g, '/')),
            data: Buffer.from(data),
          });
        } else if (!files.has(nameMatch[1])) {
          fields.set(nameMatch[1], Buffer.from(data).toString('utf8'));
        }
      }
    }

    cursor = nextPart + 2;
    cursor = body.indexOf(delimiter, cursor);
  }

  return { files, fields };
}

function parseSelectedSources(fields, files) {
  const raw = (fields.get('sources') || '').trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const selected = [...new Set(parsed
          .map((value) => String(value).trim().toLowerCase())
          .filter((value) => SOURCE_KEYS.includes(value)))];
        if (selected.length > 0) return selected;
      }
    } catch {
      // Fall through to CSV parsing.
    }
    const csv = [...new Set(raw.split(/[,;\s]+/)
      .map((value) => value.trim().toLowerCase())
      .filter((value) => SOURCE_KEYS.includes(value)))];
    if (csv.length > 0) return csv;
  }
  // Compatibilidad: formularios antiguos sin campo "sources".
  const inferred = SOURCE_KEYS.filter((key) => files.has(key));
  return inferred.length > 0 ? inferred : [...SOURCE_KEYS];
}

// Plantilla .xlsx válida (solo encabezados TIB, sin filas de datos) para las
// fuentes NO seleccionadas. El procesador C# existente la lee como 0 registros.
const EMPTY_SOURCE_PATH = path.join(ROOT, 'assets', 'FUENTE_VACIA.xlsx');
let emptySourceXlsxCache = null;

function getEmptySourceXlsx() {
  if (emptySourceXlsxCache) return emptySourceXlsxCache;
  try {
    emptySourceXlsxCache = fs.readFileSync(EMPTY_SOURCE_PATH);
  } catch {
    throw makeHttpError(`Falta la plantilla interna ${path.relative(ROOT, EMPTY_SOURCE_PATH)}. Vuelve a extraer el paquete completo.`, 500);
  }
  return emptySourceXlsxCache;
}

function runProcessor(args, onProgress) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(PROCESSOR)) {
      reject(makeHttpError(`No se encontró el procesador C# en ${PROCESSOR}.`, 500));
      return;
    }

    const child = spawn(PROCESSOR, [
      path.join(args.inputDir, expectedUploads.inventory),
      path.join(args.inputDir, expectedUploads.delivered),
      path.join(args.inputDir, expectedUploads.sent),
      path.join(args.inputDir, expectedUploads.received),
      args.outputPath,
      args.unmatchedCsvPath,
    ], { cwd: ROOT, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let stderrPending = '';
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 20 * 60 * 1000);

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
            if (typeof progress.stage === 'string' && typeof progress.message === 'string')
              onProgress(progress);
          } catch {
            stderr = (stderr + `${line}\n`).slice(-2_000_000);
          }
        } else {
          stderr = (stderr + `${line}\n`).slice(-2_000_000);
        }
      }
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(makeHttpError(`No se pudo iniciar el procesador C# (${PROCESSOR}): ${error.message}`, 500));
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (stderrPending) {
        if (!stderrPending.startsWith('PROGRESS:'))
          stderr = (stderr + stderrPending).slice(-2_000_000);
        else {
          try {
            const progress = JSON.parse(stderrPending.slice('PROGRESS:'.length));
            if (typeof progress.stage === 'string' && typeof progress.message === 'string')
              onProgress(progress);
          } catch {
            stderr = (stderr + stderrPending).slice(-2_000_000);
          }
        }
      }
      if (timedOut) {
        reject(makeHttpError('El procesamiento excedió 20 minutos y se detuvo.', 504));
        return;
      }
      if (code !== 0) {
        let message = stderr.trim() || stdout.trim() || `El procesador C# terminó con código ${code}.`;
        try {
          const details = JSON.parse(message.split(/\r?\n/).at(-1));
          if (details.error) message = details.error;
        } catch {}
        reject(makeHttpError(message, 422));
        return;
      }
      try {
        const result = JSON.parse(stdout.trim());
        if (!result.ok) throw new Error(result.error || 'No se pudo completar el inventario.');
        resolve(result);
      } catch (error) {
        reject(makeHttpError(`No se pudo leer el resultado del procesamiento. ${error.message}\n${stderr.trim()}`, 500));
      }
    });
  });
}

async function handleProcess(req, res) {
  if (processing) {
    sendJson(res, 409, { error: 'Ya hay un inventario procesándose. Espera a que termine.' });
    return;
  }

  let runDir;
  processing = true;
  activeRunId = null;
  processingProgress = { stage: 'receiving', message: 'Recibiendo y guardando los archivos seleccionados.', validations: [] };
  try {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!contentType.toLowerCase().startsWith('multipart/form-data') || !boundaryMatch) {
      sendJson(res, 400, { error: 'Envía el inventario y al menos un archivo TIB usando el formulario.' });
      return;
    }

    const body = await readRequest(req, MAX_UPLOAD_BYTES);
    const { files, fields } = parseMultipart(body, (boundaryMatch[1] || boundaryMatch[2]).trim());
    const selectedSources = parseSelectedSources(fields, files);
    if (selectedSources.length === 0) {
      throw new Error('Selecciona al menos un archivo TIB para el cruce (entregado, enviado o recibido).');
    }

    const requiredFields = ['inventory', ...selectedSources];
    const inventoryFile = files.get('inventory');
    if (!inventoryFile) throw new Error(`Falta seleccionar: ${expectedUploads.inventory}.`);
    for (const key of selectedSources) {
      if (!files.get(key)) throw new Error(`Falta seleccionar: ${expectedUploads[key]} (fuente activada para el cruce).`);
    }    for (const field of requiredFields) {
      const file = files.get(field);
      const canonicalName = expectedUploads[field];
      if (path.extname(file.filename).toLowerCase() !== '.xlsx') {
        throw new Error(`${file.filename} no es un archivo .xlsx.`);
      }
      if (file.data.length < 4 || file.data[0] !== 0x50 || file.data[1] !== 0x4b) {
        throw new Error(`${file.filename} no parece ser un Excel .xlsx válido.`);
      }
    }

    const selectedLabels = selectedSources.map((key) => SOURCE_LABELS[key]).join(', ');
    processingProgress = {
      stage: 'receiving',
      message: `Recibiendo inventario + ${selectedSources.length} TIB (${selectedLabels}).`,
      validations: [],
    };

    const runId = crypto.randomUUID().replace(/-/g, '');
    activeRunId = runId;
    runDir = path.join(RUNS, runId);
    await fs.promises.mkdir(runDir, { recursive: true });
    await fs.promises.writeFile(path.join(runDir, expectedUploads.inventory), files.get('inventory').data, { flag: 'wx' });
    const emptySourceXlsx = getEmptySourceXlsx();
    for (const key of SOURCE_KEYS) {
      const targetPath = path.join(runDir, expectedUploads[key]);
      if (selectedSources.includes(key)) {
        await fs.promises.writeFile(targetPath, files.get(key).data, { flag: 'wx' });
      } else {
        // Placeholder válido sin filas: el procesador lo lee como 0 registros.
        await fs.promises.writeFile(targetPath, emptySourceXlsx, { flag: 'wx' });
      }
    }
    await fs.promises.writeFile(path.join(runDir, 'fuentes-seleccionadas.json'), JSON.stringify({ selectedSources }), { flag: 'wx' });

    const outputName = 'Inventario_COMPLETADO.xlsx';
    const outputPath = path.join(runDir, outputName);
    const unmatchedCsvPath = path.join(runDir, 'GUIAS_SIN_COINCIDENCIA.csv');
    const result = await runProcessor(
      { inputDir: runDir, outputPath, unmatchedCsvPath },
      (progress) => {
        const validations = processingProgress.validations || [];
        if (progress.validation) {
          const existingIndex = validations.findIndex((item) => item.fileName === progress.validation.fileName);
          if (existingIndex >= 0) validations[existingIndex] = progress.validation;
          else validations.push(progress.validation);
        }
        processingProgress = { ...progress, validations };
      },
    );
    result.downloadUrl = `/api/download/${runId}`;
    result.outputName = outputName;
    result.selectedSources = selectedSources;
    result.selectedSourceLabels = selectedSources.map((key) => SOURCE_LABELS[key]);
    if (result.unmatchedCount > 0)
      result.unmatchedReportUrl = `/api/unmatched/${runId}`;
    processingProgress = { stage: 'complete', message: 'Excel listo para descargar.', validations: result.inputValidations || [] };
    sendJson(res, 200, result);
  } catch (error) {
    console.error(`[inventario] ${error.stack || error.message}`);
    processingProgress = {
      stage: 'error',
      message: error.message.split('\n')[0],
      validations: processingProgress.validations || [],
    };
    const status = error.statusCode || (error.message.includes('100 MB') ? 413 : 400);
    sendJson(res, status, { error: error.message.split('\n')[0] });
  } finally {
    processing = false;
    activeRunId = null;
  }
}

async function getRunStorage() {
  const entries = await fs.promises.readdir(RUNS, { withFileTypes: true });
  const runs = [];
  let totalBytes = 0;

  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-f0-9]{32}$/.test(entry.name)) continue;
    const runPath = path.join(RUNS, entry.name);
    const stats = await fs.promises.stat(runPath);
    const files = await fs.promises.readdir(runPath, { withFileTypes: true });
    let sizeBytes = 0;
    let fileCount = 0;
    let outputReady = false;

    for (const file of files) {
      if (!file.isFile()) continue;
      const fileStats = await fs.promises.stat(path.join(runPath, file.name));
      sizeBytes += fileStats.size;
      fileCount++;
      if (file.name === 'Inventario_COMPLETADO.xlsx') outputReady = true;
    }

    totalBytes += sizeBytes;
    runs.push({
      id: entry.name,
      createdAt: new Date(stats.birthtimeMs || stats.mtimeMs).toISOString(),
      sizeBytes,
      fileCount,
      outputReady,
      active: entry.name === activeRunId,
    });
  }

  runs.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  return { totalBytes, runCount: runs.length, runs };
}

async function deleteRun(res, runId) {
  if (runId === activeRunId) {
    sendJson(res, 409, { error: 'No se puede eliminar la ejecución que está procesándose.' });
    return;
  }

  const runPath = path.join(RUNS, runId);
  try {
    const stats = await fs.promises.lstat(runPath);
    if (!stats.isDirectory()) {
      sendJson(res, 404, { error: 'No se encontró esa ejecución.' });
      return;
    }
    await fs.promises.rm(runPath, { recursive: true, force: false });
    sendJson(res, 200, { ok: true, deleted: runId });
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(res, 404, { error: 'La ejecución ya no está disponible.' });
      return;
    }
    console.error(`[runs] No se pudo eliminar ${runId}: ${error.message}`);
    sendJson(res, 500, { error: 'No se pudo eliminar la ejecución.' });
  }
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);
  if (req.method === 'GET' && requestUrl.pathname === '/') {
    serveFile(res, path.join(PUBLIC, 'index.html'), 'text/html; charset=utf-8');
    return;
  }
  if (req.method === 'GET' && requestUrl.pathname === '/app.js') {
    serveFile(res, path.join(PUBLIC, 'app.js'), 'text/javascript; charset=utf-8');
    return;
  }
  if (req.method === 'GET' && requestUrl.pathname === '/styles.css') {
    serveFile(res, path.join(PUBLIC, 'styles.css'), 'text/css; charset=utf-8');
    return;
  }
  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    sendJson(res, 200, {
      status: 'ok',
      localOnly: true,
      processing,
      node: process.versions.node,
      processor: fs.existsSync(PROCESSOR) ? 'openxml' : 'missing',
    });
    return;
  }
  if (req.method === 'GET' && requestUrl.pathname === '/api/progress') {
    sendJson(res, 200, { processing, ...processingProgress });
    return;
  }
  if (req.method === 'GET' && requestUrl.pathname === '/api/runs') {
    void getRunStorage()
      .then((summary) => sendJson(res, 200, summary))
      .catch((error) => {
        console.error(`[runs] No se pudo calcular el almacenamiento: ${error.message}`);
        sendJson(res, 500, { error: 'No se pudo leer el almacenamiento de ejecuciones.' });
      });
    return;
  }
  const deleteRunMatch = req.method === 'DELETE' && requestUrl.pathname.match(/^\/api\/runs\/([a-f0-9]{32})$/);
  if (deleteRunMatch) {
    void deleteRun(res, deleteRunMatch[1]);
    return;
  }
  if (req.method === 'POST' && requestUrl.pathname === '/api/process') {
    void handleProcess(req, res);
    return;
  }
  const downloadMatch = req.method === 'GET' && requestUrl.pathname.match(/^\/api\/download\/([a-f0-9]{32})$/);
  if (downloadMatch) {
    const filePath = path.join(RUNS, downloadMatch[1], 'Inventario_COMPLETADO.xlsx');
    fs.stat(filePath, (error) => {
      if (error) {
        sendJson(res, 404, { error: 'El archivo ya no está disponible. Vuelve a procesar los Excel.' });
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Inventario_COMPLETADO.xlsx"',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      fs.createReadStream(filePath).pipe(res);
    });
    return;
  }
  const unmatchedMatch = req.method === 'GET' && requestUrl.pathname.match(/^\/api\/unmatched\/([a-f0-9]{32})$/);
  if (unmatchedMatch) {
    const filePath = path.join(RUNS, unmatchedMatch[1], 'GUIAS_SIN_COINCIDENCIA.csv');
    fs.stat(filePath, (error) => {
      if (error) {
        sendJson(res, 404, { error: 'El detalle CSV ya no está disponible.' });
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="GUIAS_SIN_COINCIDENCIA.csv"',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      fs.createReadStream(filePath).pipe(res);
    });
    return;
  }
  sendJson(res, 404, { error: 'No se encontró la página solicitada.' });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya está ocupado. Cierra otra instancia o cambia PORT en el entorno.`);
  } else {
    console.error(`No se pudo iniciar el servidor: ${error.message}`);
  }
  process.exitCode = 1;
});

server.requestTimeout = 20 * 60 * 1000;
server.headersTimeout = 21 * 60 * 1000;
server.timeout = 0;

async function cleanupOldRuns() {
  const cutoff = Date.now() - RUN_RETENTION_MS;
  try {
    const entries = await fs.promises.readdir(RUNS, { withFileTypes: true });
    await Promise.all(entries
      .filter((entry) => entry.isDirectory() && /^[a-f0-9]{32}$/.test(entry.name))
      .map(async (entry) => {
        const runPath = path.join(RUNS, entry.name);
        const stats = await fs.promises.stat(runPath);
        if (stats.mtimeMs < cutoff)
          await fs.promises.rm(runPath, { recursive: true, force: true });
      }));
  } catch (error) {
    console.error(`[runs] No se pudieron limpiar ejecuciones antiguas: ${error.message}`);
  }
}

fs.promises.mkdir(RUNS, { recursive: true }).then(async () => {
  await cleanupOldRuns();
  const cleanupTimer = setInterval(() => { void cleanupOldRuns(); }, 24 * 60 * 60 * 1000);
  cleanupTimer.unref();
  server.listen(PORT, HOST, () => {
    const url = `http://${HOST}:${PORT}`;
    console.log(`Automatizador Inventario AMEX disponible en ${url}`);
    console.log('Deja esta ventana abierta mientras usas la aplicación. Para salir, ciérrala.');
    if (process.env.AUTO_OPEN !== '0' && process.platform === 'win32') {
      execFile('cmd.exe', ['/d', '/c', 'start', '', url], { windowsHide: true }, () => {});
    }
  });
}).catch((error) => {
  console.error(`No se pudo preparar la carpeta de resultados: ${error.message}`);
  process.exitCode = 1;
});
