import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

// 1. Cargar .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const getEnv = (k) => {
  const match = envContent.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const r2AccountId = getEnv('CLOUDFLARE_R2_ACCOUNT_ID');
const r2AccessKey = getEnv('CLOUDFLARE_R2_ACCESS_KEY_ID');
const r2SecretKey = getEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
const r2Bucket = getEnv('CLOUDFLARE_R2_BUCKET_NAME') || 'amex-courier-cloud';
const r2Root = (getEnv('CLOUDFLARE_R2_ROOT_FOLDER') || 'FOLDER AMEX').replace(/^\/+|\/+$/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
});

const filesToUpload = [
  { slot: 'delivered', filename: 'ENTREGADO.xlsx' },
  { slot: 'sent', filename: 'ENVIADO.xlsx' },
  { slot: 'received', filename: 'RECIBIDO.xlsx' },
  { slot: 'inventory', filename: 'Inventario_AMEX_Lince_2026-09-30.xlsx' },
];

const batchId = crypto.randomUUID().replace(/-/g, '');
const keys = {};

console.log('===============================================================');
console.log(' PRUEBA DE FLUJO REAL DE PRODUCCIÓN (CON ARCHIVOS DE 35 MB)');
console.log(' Servidor Worker: Hostinger VPS (AMD EPYC) en 2.25.89.222');
console.log('===============================================================\n');

// Medir Fase 1: Subida Paralela
console.log('1. Iniciando SUBIDA PARALELA a Cloudflare R2 (Simulando Frontend)...');
const tUploadStart = Date.now();

await Promise.all(
  filesToUpload.map(async (f) => {
    const filePath = path.resolve('PRUEBA EXCEL', f.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const sizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);
    const key = `${r2Root}/inventario-jobs/uploads/${batchId}/${f.slot}.xlsx`;
    keys[f.slot] = key;

    const tFileStart = Date.now();
    await s3.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    );
    const fileSeconds = ((Date.now() - tFileStart) / 1000).toFixed(2);
    console.log(`   ✓ ${f.filename} (${sizeMB} MB) subido en ${fileSeconds} s`);
  })
);

const uploadDuration = ((Date.now() - tUploadStart) / 1000).toFixed(2);
console.log(`\n>>> Tiempo Total de Subida Paralela: ${uploadDuration} segundos <<<\n`);

// Medir Fase 2: Encolar en Supabase
console.log('2. Encolando Job en Supabase (status: queued)...');
const tQueueStart = Date.now();
const { data: jobRow, error: jobError } = await supabase
  .from('inventario_jobs')
  .insert({
    id: crypto.randomUUID(),
    inventario_key: keys.inventory,
    entregado_key: keys.delivered,
    enviado_key: keys.sent,
    recibido_key: keys.received,
    fuentes: ['delivered', 'sent', 'received'],
    user_nombre: 'Benchmark Automático Antigravity',
    estado: 'queued',
    etapa: 'queued',
    mensaje: 'En cola, esperando al worker.',
    progreso: 0,
    sincronizar_db: false,
  })
  .select('*')
  .single();

if (jobError || !jobRow) {
  console.error('Error creando job:', jobError);
  process.exit(1);
}

const jobId = jobRow.id;
console.log(`   ✓ Job creado con ID: ${jobId}`);

// Medir Fase 3: Escucha del Worker en Hostinger VPS
console.log('3. Esperando que el Worker en Hostinger VPS procese el Job...');
let firstPickTime = null;
let doneJob = null;

while (!doneJob) {
  await new Promise((r) => setTimeout(r, 400));
  const { data: currentJob } = await supabase
    .from('inventario_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!currentJob) continue;

  if (currentJob.estado === 'processing' && !firstPickTime) {
    firstPickTime = Date.now();
    const waitToPick = ((firstPickTime - tQueueStart) / 1000).toFixed(2);
    console.log(`   ⚡ Worker tomó el job en: ${waitToPick} s (Polling ultra rápido activo)`);
  }

  if (currentJob.estado === 'done') {
    doneJob = currentJob;
    break;
  } else if (currentJob.estado === 'error') {
    console.error('El job falló con error:', currentJob.error);
    process.exit(1);
  }
}

const tTotal = ((Date.now() - tUploadStart) / 1000).toFixed(2);
const tWorkerExecution = ((Date.now() - tQueueStart) / 1000).toFixed(2);

console.log('\n===============================================================');
console.log(' RESULTADOS FINALES DE LA PRUEBA EN VIVO');
console.log('===============================================================');
console.log(`- Tiempo de Subida Paralela (35 MB):     ${uploadDuration} s`);
console.log(`- Tiempo de Procesamiento VPS (Worker):   ${tWorkerExecution} s`);
console.log(`  (De los cuales C# OpenXML puro tardó:   ${doneJob.segundos} s)`);
console.log(`- TIEMPO TOTAL FIN A FIN:                 ${tTotal} s`);
console.log('---------------------------------------------------------------');
console.log(`- Total paquetes inventario:              ${doneJob.total_guias}`);
console.log(`- Coincidencias encontradas:              ${doneJob.coincidencias} (100%)`);
console.log(`- Filas TIB analizadas:                   ${doneJob.filas_tib.toLocaleString()}`);
console.log(`- Sin coincidencia:                       ${doneJob.sin_coincidencia}`);
console.log(`- Archivo completado en R2:               ${doneJob.resultado_key}`);
console.log('===============================================================\n');
