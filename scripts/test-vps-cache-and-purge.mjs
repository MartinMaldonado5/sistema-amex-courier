import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uploadFileToR2, getFileFromR2, deleteFileFromR2 } from '../lib/r2/client.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

const vpsHost = process.env.VPS_HOST || '2.25.89.222';
const workerUrl = process.env.WORKER_URL || `http://${vpsHost}:10000`;

async function main() {
  console.log('--- TEST: Almacenamiento Local en VPS + Depuración en R2 ---');

  // 1. Crear buffer de prueba simulando archivo Excel TIB
  const dummyBufferV1 = Buffer.from('FAKE_EXCEL_TIB_CONTENT_VERSION_1_FOR_TESTING');
  const dummyBufferV2 = Buffer.from('FAKE_EXCEL_TIB_CONTENT_VERSION_2_REPLACEMENT');

  console.log('\n[1/5] Subiendo versión 1 a Cloudflare R2...');
  const uploadV1 = await uploadFileToR2(
    dummyBufferV1,
    `inventario-tib-test/test-v1-${Date.now()}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  console.log(`✓ Archivo V1 subido a R2 con clave: ${uploadV1.key}`);

  // 2. Sincronizar versión 1 con el VPS Worker (debe dar CACHE MISS y guardarlo)
  console.log('\n[2/5] Notificando al Worker VPS (/sync-tib) para almacenar V1 en disco...');
  const syncRes1 = await fetch(`${workerUrl}/sync-tib`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo: 'delivered',
      r2_key: uploadV1.key,
      nombre_archivo: 'ENTREGADO_V1.xlsx',
    }),
  }).then((r) => r.json());

  console.log('Respuesta del Worker VPS V1:', syncRes1);
  if (!syncRes1.ok || syncRes1.cacheHit !== false) {
    throw new Error('Falla en sincronización inicial en disco VPS.');
  }
  console.log(`✓ V1 guardado en disco del VPS: ${syncRes1.cachedPath} (${syncRes1.sizeBytes} bytes)`);

  // 3. Probar CACHE HIT inmediato (misma clave R2)
  console.log('\n[3/5] Probando CACHE HIT (segunda llamada con misma clave)...');
  const syncResRepeat = await fetch(`${workerUrl}/sync-tib`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo: 'delivered',
      r2_key: uploadV1.key,
      nombre_archivo: 'ENTREGADO_V1.xlsx',
    }),
  }).then((r) => r.json());

  console.log('Respuesta del Worker VPS (Repetida):', syncResRepeat);
  if (!syncResRepeat.ok || syncResRepeat.cacheHit !== true) {
    throw new Error('Se esperaba CACHE HIT en la segunda llamada.');
  }
  console.log('✓ CACHE HIT verificado: el archivo se lee directamente de disco local sin descargar de R2.');

  // 4. Subir versión 2 (reemplazo) y purgar versión 1 de R2
  console.log('\n[4/5] Subiendo versión 2 y purgando versión 1 de Cloudflare R2...');
  const uploadV2 = await uploadFileToR2(
    dummyBufferV2,
    `inventario-tib-test/test-v2-${Date.now()}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  console.log(`✓ Archivo V2 subido a R2 con clave: ${uploadV2.key}`);

  // Eliminar V1 de R2
  await deleteFileFromR2(uploadV1.key);
  console.log(`✓ deleteFileFromR2 invocado para V1 (${uploadV1.key})`);

  // Verificar que V1 ya no existe en R2
  let v1ExistsInR2 = true;
  try {
    await getFileFromR2(uploadV1.key);
  } catch (err) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      v1ExistsInR2 = false;
    }
  }
  if (v1ExistsInR2) {
    throw new Error('Error: La versión 1 aún existe en Cloudflare R2 tras la eliminación.');
  }
  console.log('✓ Verificado: La versión 1 fue eliminada físicamente de Cloudflare R2.');

  // 5. Actualizar el disco del VPS con versión 2 (reemplaza a V1)
  console.log('\n[5/5] Actualizando disco local del VPS con la nueva versión 2...');
  const syncRes2 = await fetch(`${workerUrl}/sync-tib`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo: 'delivered',
      r2_key: uploadV2.key,
      nombre_archivo: 'ENTREGADO_V2.xlsx',
    }),
  }).then((r) => r.json());

  console.log('Respuesta del Worker VPS V2:', syncRes2);
  if (!syncRes2.ok || syncRes2.cacheHit !== false || syncRes2.r2_key !== uploadV2.key) {
    throw new Error('Falla en la sustitución de la versión en disco VPS.');
  }
  console.log('✓ Verificado: El disco del VPS reemplazó la versión previa con la nueva.');

  // Limpieza final de prueba
  await deleteFileFromR2(uploadV2.key);
  console.log('\n=========================================');
  console.log('🎉 TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO');
  console.log('=========================================');
}

main().catch((err) => {
  console.error('\n❌ ERROR EN EL TEST:', err);
  process.exit(1);
});
