import fs from 'node:fs';
import { getSupabaseAdmin } from '../lib/supabase/admin.ts';
import { generateInventoryExcelBufferFromDb } from '../lib/inventory-jobs/exportDbInventory.ts';
import { uploadFileToR2, getFileFromR2 } from '../lib/r2/client.ts';
import { syncCompletedExcelToDatabase } from '../lib/inventory-jobs/syncDb.ts';
import readXlsxFile from 'read-excel-file/node';

console.log('=== TEST AVANZADO DE CRUCE DE INVENTARIO Y EXCEL ===');

// 1. Generar inventario desde base de datos oficial
console.log('1. Generando Excel de inventario desde base de datos...');
const dbInv = await generateInventoryExcelBufferFromDb({ filtroEstado: 'activos' });
console.log(`   Total paquetes activos exportados de BD: ${dbInv.count}`);

// Inspeccionar lo que se generó en el inventario base
const baseRows = await readXlsxFile(dbInv.buffer);
console.log('   Headers base:', baseRows[0]);
console.log('   Fila 1 base:', baseRows[1]);

// 2. Subir a R2 para el job
const jobId = crypto.randomUUID();
console.log(`2. Subiendo inventario a R2 para Job ${jobId}...`);
const uploadedInv = await uploadFileToR2(
  dbInv.buffer,
  `inventario-jobs/${jobId}/Inventario.xlsx`,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
);

// 3. Crear registro de job en inventario_jobs
const admin = getSupabaseAdmin();
console.log('3. Creando job en inventario_jobs para que el VPS lo tome...');
const { data: job, error: jobErr } = await admin
  .from('inventario_jobs')
  .insert({
    id: jobId,
    usuario_id: '79dae518-fab9-42f9-99f2-5422b8086890',
    inventario_key: uploadedInv.key,
    entregado_key: 'FOLDER AMEX/inventario-tib/diario/2026-10-03/delivered.xlsx',
    enviado_key: 'FOLDER AMEX/inventario-tib/diario/2026-10-03/sent.xlsx',
    recibido_key: 'FOLDER AMEX/inventario-tib/diario/2026-10-03/received.xlsx',
    fuentes: ['delivered', 'sent', 'received'],
    sincronizar_db: true,
    user_nombre: 'Testing Avanzado Antigravity',
    estado: 'queued',
    etapa: 'queued',
    mensaje: 'En cola para prueba avanzada.',
    progreso: 0,
  })
  .select('*')
  .single();

if (jobErr) {
  console.error('Error creando job:', jobErr);
  process.exit(1);
}

console.log('4. Esperando a que el worker VPS procese el job...');
const t0 = Date.now();
let doneJob = null;
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  const { data: cur } = await admin.from('inventario_jobs').select('*').eq('id', jobId).single();
  if (cur.estado === 'done') {
    doneJob = cur;
    break;
  }
  if (cur.estado === 'error') {
    console.error('El job falló:', cur.mensaje);
    process.exit(1);
  }
  process.stdout.write(`   [${((Date.now() - t0) / 1000).toFixed(1)}s] Etapa: ${cur.etapa} (${cur.progreso}%)\r`);
}

if (!doneJob) {
  console.error('\nTimeout esperando al worker VPS.');
  process.exit(1);
}

console.log(`\n✓ Job COMPLETADO por VPS en ${((Date.now() - t0) / 1000).toFixed(2)}s!`);
console.log('   Resultado Key:', doneJob.resultado_key);

// 5. Descargar Inventario_COMPLETADO.xlsx y auditar fila por fila
console.log('\n5. Descargando y auditando Inventario_COMPLETADO.xlsx generado por VPS...');
const r2File = await getFileFromR2(doneJob.resultado_key);
const byteArray = await r2File.Body.transformToByteArray();
const bufferComp = Buffer.from(byteArray);
const compRows = await readXlsxFile(bufferComp);
const dataRows = Array.isArray(compRows) ? (compRows[0]?.data || compRows) : compRows.data;

console.log('   Headers:', dataRows[0]);
let countRuta = 0;
let countEnviado = 0;
let countRecibido = 0;
let countEntregado = 0;

for (let i = 1; i < dataRows.length; i++) {
  const row = dataRows[i];
  const rowStr = JSON.stringify(row);
  if (/ruta/i.test(rowStr)) {
    console.warn(`   ⚠️ ALERTA: Fila ${i} contiene "ruta":`, row);
    countRuta++;
  }
  const estEntrega = String(row[7] || '');
  if (estEntrega === 'ENVIADO' || estEntrega === 'Enviado') countEnviado++;
  if (estEntrega === 'RECIBIDO' || estEntrega === 'Recibido') countRecibido++;
  if (estEntrega === 'ENTREGADO' || estEntrega === 'Entregado') countEntregado++;
}

console.log(`\n=== RECUENTO DE ESTADOS EN EL EXCEL GENERADO ===`);
console.log(`   Filas con palabra "ruta": ${countRuta}`);
console.log(`   Filas con ENVIADO:        ${countEnviado}`);
console.log(`   Filas con RECIBIDO:       ${countRecibido}`);
console.log(`   Filas con ENTREGADO:      ${countEntregado}`);
console.log(`   Total filas de datos:     ${dataRows.length - 1}`);

// Muestra de las primeras 5 filas
console.log('\nPrimeras 5 filas del resultado:');
for (let i = 1; i <= Math.min(5, dataRows.length - 1); i++) {
  console.log(`Fila ${i}: WR=${dataRows[i][1]} | AMEX=${dataRows[i][6]} | TIB=${dataRows[i][7]} | WMS=${dataRows[i][8]} | Almacén=${dataRows[i][9]}`);
}

// 6. Sincronizar a BD y comprobar si syncDb introduce "ruta"
console.log('\n6. Ejecutando sincronización a Base de Datos (syncDb)...');
const syncResult = await syncCompletedExcelToDatabase(bufferComp, { jobId });
console.log('   Resultado syncDb:', syncResult);

// 7. Verificar en Supabase si algún paquete quedó con "ruta"
const { data: paquetesConRuta } = await admin
  .from('paquetes')
  .select('numero_recibo_bodega, estado_entrega')
  .or('estado_entrega.ilike.%ruta%,estado_amex.ilike.%ruta%');

console.log(`   Paquetes en BD con "ruta" después de syncDb: ${paquetesConRuta?.length || 0}`);
if (paquetesConRuta && paquetesConRuta.length > 0) {
  console.error('   ❌ ERROR: Se encontraron paquetes con ruta en BD:', paquetesConRuta);
} else {
  console.log('   ✅ CONFIRMADO: Cero paquetes tienen "ruta" en la base de datos.');
}
